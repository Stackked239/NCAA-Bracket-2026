import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { fetchRecentScoreboards, teamsMatch, NcaaGame } from "@/lib/ncaa-api";

/**
 * POST /api/scores
 *
 * Fetches live scores from the NCAA API (today + recent days),
 * matches them to our DB games, and updates scores/status/winners.
 * When a game goes final it propagates the winner forward and scores picks.
 *
 * SAFETY: Only updates scores/status/winner on existing games.
 *         Never creates, deletes, or modifies picks beyond scoring.
 */
export async function POST() {
  try {
    // Fetch scoreboards for today + past 2 days to catch recent finishes
    const ncaaGames = await fetchRecentScoreboards(2);

    // Get non-final games from our DB (only these need updating)
    const { data: games } = await supabase
      .from("games")
      .select("*")
      .neq("status", "final");

    if (!games || games.length === 0) {
      return NextResponse.json({ success: true, updated_games: 0, ncaa_games: ncaaGames.length });
    }

    let updatedCount = 0;

    for (const ncaaGame of ncaaGames) {
      // Only process tournament bracket games
      if (!ncaaGame.bracketRound) continue;

      const match = findMatchingGame(ncaaGame, games);
      if (!match) continue;

      const game = match.game;
      const { teamAScore, teamBScore } = match;

      // Map NCAA game state to our status
      let gameStatus: string = game.status;
      if (ncaaGame.gameState === "live") {
        gameStatus = "in_progress";
      } else if (ncaaGame.gameState === "final") {
        gameStatus = "final";
      }

      // Only update if something changed
      const scoreChanged =
        game.team_a_score !== teamAScore || game.team_b_score !== teamBScore;
      const statusChanged = game.status !== gameStatus;
      if (!scoreChanged && !statusChanged && game.espn_game_id === ncaaGame.gameID) {
        continue;
      }

      const updates: Record<string, unknown> = {
        team_a_score: ncaaGame.gameState === "pre" ? null : teamAScore,
        team_b_score: ncaaGame.gameState === "pre" ? null : teamBScore,
        status: gameStatus,
        espn_game_id: ncaaGame.gameID, // Store NCAA game ID for fast future lookups
        updated_at: new Date().toISOString(),
      };

      // Determine winner for final games
      if (gameStatus === "final") {
        if (ncaaGame.away.winner) {
          updates.winner = teamsMatch(ncaaGame.away.names.short, game.team_a_name)
            ? game.team_a_name
            : game.team_b_name;
        } else if (ncaaGame.home.winner) {
          updates.winner = teamsMatch(ncaaGame.home.names.short, game.team_a_name)
            ? game.team_a_name
            : game.team_b_name;
        } else {
          // Fallback to score comparison
          updates.winner =
            teamAScore !== null && teamBScore !== null && teamAScore > teamBScore
              ? game.team_a_name
              : game.team_b_name;
        }
      }

      await supabase.from("games").update(updates).eq("id", game.id);

      // If final, propagate winner and score picks
      if (gameStatus === "final" && updates.winner) {
        await propagateWinner(game, updates.winner as string);
        await scorePicks(game.id, updates.winner as string, game.round);
      }

      updatedCount++;
    }

    return NextResponse.json({
      success: true,
      ncaa_games: ncaaGames.length,
      updated_games: updatedCount,
    });
  } catch (error) {
    console.error("Score fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch scores" }, { status: 500 });
  }
}

// ---- Helpers ----

/* eslint-disable @typescript-eslint/no-explicit-any */
interface GameMatch {
  game: any;
  teamAScore: number | null;
  teamBScore: number | null;
}

function findMatchingGame(
  ncaaGame: NcaaGame,
  games: any[]
): GameMatch | null {
  const awayName = ncaaGame.away.names.short;
  const homeName = ncaaGame.home.names.short;
  const awayScore = ncaaGame.away.score ? parseInt(ncaaGame.away.score) : null;
  const homeScore = ncaaGame.home.score ? parseInt(ncaaGame.home.score) : null;

  for (const game of games) {
    if (!game.team_a_name || !game.team_b_name) continue;

    const teamA = game.team_a_name as string;
    const teamB = game.team_b_name as string;

    // Match by stored NCAA game ID first (fastest)
    const matchById = game.espn_game_id === ncaaGame.gameID;

    // Fall back to team name matching (both teams must match)
    const matchByTeams =
      (teamsMatch(awayName, teamA) || teamsMatch(homeName, teamA)) &&
      (teamsMatch(awayName, teamB) || teamsMatch(homeName, teamB));

    if (matchById || matchByTeams) {
      // Map scores to our team A/B slots
      let teamAScore: number | null = null;
      let teamBScore: number | null = null;

      if (awayScore !== null && homeScore !== null) {
        if (teamsMatch(homeName, teamA)) {
          teamAScore = homeScore;
          teamBScore = awayScore;
        } else {
          teamAScore = awayScore;
          teamBScore = homeScore;
        }
      }

      return { game, teamAScore, teamBScore };
    }
  }

  return null;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function propagateWinner(game: any, winner: string) {
  if (!game.next_game_id) return;

  const winnerSeed =
    winner === game.team_a_name ? game.team_a_seed : game.team_b_seed;
  const winnerRecord =
    winner === game.team_a_name ? game.team_a_record : game.team_b_record;

  const nextUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (game.next_game_slot === "a") {
    nextUpdates.team_a_name = winner;
    nextUpdates.team_a_seed = winnerSeed;
    nextUpdates.team_a_record = winnerRecord;
  } else {
    nextUpdates.team_b_name = winner;
    nextUpdates.team_b_seed = winnerSeed;
    nextUpdates.team_b_record = winnerRecord;
  }

  await supabase
    .from("games")
    .update(nextUpdates)
    .eq("id", game.next_game_id);
}

async function scorePicks(gameId: string, winner: string, round: number) {
  const roundPoints: Record<number, number> = {
    0: 1, 1: 1, 2: 2, 3: 4, 4: 8, 5: 16, 6: 32,
  };
  const points = roundPoints[round] || 0;

  // Mark correct picks
  await supabase
    .from("picks")
    .update({
      is_correct: true,
      points_earned: points,
      updated_at: new Date().toISOString(),
    })
    .eq("game_id", gameId)
    .eq("picked_team", winner)
    .is("is_correct", null);

  // Mark incorrect picks
  await supabase
    .from("picks")
    .update({
      is_correct: false,
      points_earned: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("game_id", gameId)
    .neq("picked_team", winner)
    .is("is_correct", null);
}
