import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard";

function normalizeTeamName(name: string): string {
  return name.replace(/\./g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function teamsMatch(espnName: string, bracketName: string): boolean {
  const a = normalizeTeamName(espnName);
  const b = normalizeTeamName(bracketName);
  return a === b || a.includes(b) || b.includes(a);
}

export async function POST() {
  try {
    const res = await fetch(ESPN_SCOREBOARD_URL, {
      cache: "no-store",
      headers: { "User-Agent": "NCAA-Bracket-App/1.0" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch ESPN scores", status: res.status },
        { status: 502 }
      );
    }

    const data = await res.json();
    const events = data.events || [];

    // Get non-final games from our DB
    const { data: games } = await supabase
      .from("games")
      .select("*")
      .neq("status", "final");

    if (!games) return NextResponse.json({ success: true, updated_games: 0 });

    let updatedCount = 0;

    for (const event of events) {
      const comp = event.competitions?.[0];
      if (!comp) continue;

      const [away, home] = comp.competitors;
      const awayName = away.team.displayName;
      const homeName = home.team.displayName;
      const awayScore = parseInt(away.score) || 0;
      const homeScore = parseInt(home.score) || 0;

      for (const game of games) {
        if (!game.team_a_name || !game.team_b_name) continue;

        const matchA = teamsMatch(awayName, game.team_a_name) || teamsMatch(homeName, game.team_a_name);
        const matchB = teamsMatch(awayName, game.team_b_name) || teamsMatch(homeName, game.team_b_name);

        if (matchA && matchB) {
          const statusType = comp.status.type.name;
          let gameStatus = "pregame";
          if (statusType === "STATUS_IN_PROGRESS" || statusType === "STATUS_HALFTIME") {
            gameStatus = "in_progress";
          } else if (statusType === "STATUS_FINAL" || comp.status.type.completed) {
            gameStatus = "final";
          }

          let teamAScore: number, teamBScore: number;
          if (teamsMatch(homeName, game.team_a_name)) {
            teamAScore = homeScore;
            teamBScore = awayScore;
          } else {
            teamAScore = awayScore;
            teamBScore = homeScore;
          }

          const updates: Record<string, unknown> = {
            team_a_score: teamAScore,
            team_b_score: teamBScore,
            status: gameStatus,
            espn_game_id: event.id,
            updated_at: new Date().toISOString(),
          };

          if (gameStatus === "final") {
            updates.winner = teamAScore > teamBScore ? game.team_a_name : game.team_b_name;
          }

          // Use the PATCH endpoint logic by updating directly
          await supabase.from("games").update(updates).eq("id", game.id);

          // If final, propagate winner to next game and score picks
          if (gameStatus === "final" && updates.winner) {
            // Propagate to next game
            if (game.next_game_id) {
              const winner = updates.winner as string;
              const winnerSeed = winner === game.team_a_name ? game.team_a_seed : game.team_b_seed;
              const winnerRecord = winner === game.team_a_name ? game.team_a_record : game.team_b_record;
              const nextUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
              if (game.next_game_slot === "a") {
                nextUpdates.team_a_name = winner;
                nextUpdates.team_a_seed = winnerSeed;
                nextUpdates.team_a_record = winnerRecord;
              } else {
                nextUpdates.team_b_name = winner;
                nextUpdates.team_b_seed = winnerSeed;
                nextUpdates.team_b_record = winnerRecord;
              }
              await supabase.from("games").update(nextUpdates).eq("id", game.next_game_id);
            }

            // Score picks
            const roundPoints: Record<number, number> = { 0: 1, 1: 1, 2: 2, 3: 4, 4: 8, 5: 16, 6: 32 };
            const points = roundPoints[game.round] || 0;
            await supabase
              .from("picks")
              .update({ is_correct: true, points_earned: points, updated_at: new Date().toISOString() })
              .eq("game_id", game.id)
              .eq("picked_team", updates.winner)
              .is("is_correct", null);
            await supabase
              .from("picks")
              .update({ is_correct: false, points_earned: 0, updated_at: new Date().toISOString() })
              .eq("game_id", game.id)
              .neq("picked_team", updates.winner)
              .is("is_correct", null);
          }

          updatedCount++;
          break;
        }
      }
    }

    return NextResponse.json({
      success: true,
      espn_events: events.length,
      updated_games: updatedCount,
    });
  } catch (error) {
    console.error("Score fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch scores" }, { status: 500 });
  }
}
