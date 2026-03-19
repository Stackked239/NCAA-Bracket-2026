import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { fetchScoreboard, teamsMatch } from "@/lib/ncaa-api";
import { LiveGameInfo } from "@/lib/types";

/**
 * GET /api/live
 *
 * Returns real-time game data (clock, period, network, scores) by
 * fetching the current NCAA scoreboard and mapping to our game IDs.
 *
 * This is a read-only endpoint — it never writes to the database.
 * Designed to be polled frequently (every 15–30s) for live UI updates.
 */
export async function GET() {
  try {
    const ncaaGames = await fetchScoreboard();

    // Get all games that have teams assigned (for matching)
    const { data: games } = await supabase
      .from("games")
      .select("id, team_a_name, team_b_name, espn_game_id");

    if (!games) return NextResponse.json({});

    const result: Record<string, LiveGameInfo> = {};

    for (const ncaaGame of ncaaGames) {
      if (!ncaaGame.bracketRound) continue;

      const awayName = ncaaGame.away.names.short;
      const homeName = ncaaGame.home.names.short;

      for (const game of games) {
        if (!game.team_a_name || !game.team_b_name) continue;

        // Match by stored NCAA ID or by team names
        const matchById = game.espn_game_id === ncaaGame.gameID;
        const matchByTeams =
          (teamsMatch(awayName, game.team_a_name) ||
            teamsMatch(homeName, game.team_a_name)) &&
          (teamsMatch(awayName, game.team_b_name) ||
            teamsMatch(homeName, game.team_b_name));

        if (matchById || matchByTeams) {
          const awayScore = ncaaGame.away.score
            ? parseInt(ncaaGame.away.score)
            : null;
          const homeScore = ncaaGame.home.score
            ? parseInt(ncaaGame.home.score)
            : null;

          let teamAScore: number | null = null;
          let teamBScore: number | null = null;

          if (awayScore !== null && homeScore !== null) {
            if (teamsMatch(homeName, game.team_a_name)) {
              teamAScore = homeScore;
              teamBScore = awayScore;
            } else {
              teamAScore = awayScore;
              teamBScore = homeScore;
            }
          }

          result[game.id] = {
            gameId: game.id,
            ncaaGameId: ncaaGame.gameID,
            gameState: ncaaGame.gameState,
            clock: ncaaGame.contestClock,
            period: ncaaGame.currentPeriod,
            network: ncaaGame.network,
            startTime: ncaaGame.startTime,
            startTimeEpoch: ncaaGame.startTimeEpoch,
            teamAScore,
            teamBScore,
          };
          break;
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Live data error:", error);
    return NextResponse.json({});
  }
}
