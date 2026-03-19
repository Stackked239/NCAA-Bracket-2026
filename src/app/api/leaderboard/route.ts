import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { POINTS_BY_ROUND } from "@/lib/types";

export async function GET() {
  const [usersRes, gamesRes, picksRes] = await Promise.all([
    supabase.from("users").select("*").order("created_at"),
    supabase.from("games").select("*"),
    supabase.from("picks").select("*"),
  ]);

  if (usersRes.error || gamesRes.error || picksRes.error) {
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }

  const users = usersRes.data;
  const games = gamesRes.data;
  const allPicks = picksRes.data;

  // Build eliminated teams set
  const eliminatedTeams = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  games.forEach((g: any) => {
    if (g.status === "final" && g.winner) {
      const loser = g.winner === g.team_a_name ? g.team_b_name : g.team_a_name;
      if (loser) eliminatedTeams.add(loser);
    }
  });

  // Count total final games for accuracy calc
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalGames = games.filter((g: any) => g.status === "final");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries = users.map((user: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const picks = allPicks.filter((p: any) => p.user_id === user.id);
    let totalPoints = 0;
    let correctPicks = 0;
    let incorrectPicks = 0;
    let pendingPicks = 0;
    let maxPossible = 0;
    let upsetPicksCorrect = 0;
    let upsetPicksTotal = 0;
    const picksByRound: Record<number, { correct: number; total: number; possible: number }> = {};

    // Init rounds
    for (let r = 0; r <= 6; r++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const roundGames = games.filter((g: any) => g.round === r);
      picksByRound[r] = { correct: 0, total: roundGames.length, possible: 0 };
    }

    // Find championship pick
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chipPick = picks.find((p: any) => p.game_id === "FF_CHIP");
    const championshipPick = chipPick?.picked_team || null;
    const championshipAlive = championshipPick
      ? !eliminatedTeams.has(championshipPick)
      : false;

    // Find Final Four picks (semifinal picks)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ff1Pick = picks.find((p: any) => p.game_id === "FF_SF1");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ff2Pick = picks.find((p: any) => p.game_id === "FF_SF2");
    const finalFourPicks = [ff1Pick?.picked_team, ff2Pick?.picked_team].filter(Boolean);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    picks.forEach((p: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const game = games.find((g: any) => g.id === p.game_id);
      if (!game) return;

      // Check if this was an upset pick (picked the higher seed / underdog)
      if (game.team_a_seed && game.team_b_seed && game.team_a_seed !== game.team_b_seed) {
        const underdogName =
          game.team_a_seed > game.team_b_seed ? game.team_a_name : game.team_b_name;
        if (p.picked_team === underdogName) {
          upsetPicksTotal++;
          if (p.is_correct === true) upsetPicksCorrect++;
        }
      }

      if (p.is_correct === true) {
        totalPoints += p.points_earned;
        correctPicks++;
        maxPossible += p.points_earned;
        picksByRound[game.round].correct++;
      } else if (p.is_correct === false) {
        incorrectPicks++;
      } else if (p.is_correct === null) {
        pendingPicks++;
        if (!eliminatedTeams.has(p.picked_team)) {
          maxPossible += POINTS_BY_ROUND[game.round] || 0;
        }
        picksByRound[game.round].possible++;
      }
    });

    // Accuracy: correct / (correct + incorrect), ignoring pending
    const decided = correctPicks + incorrectPicks;
    const accuracy = decided > 0 ? Math.round((correctPicks / decided) * 100) : 0;

    return {
      user,
      total_points: totalPoints,
      correct_picks: correctPicks,
      incorrect_picks: incorrectPicks,
      pending_picks: pendingPicks,
      total_picks: picks.length,
      max_possible: maxPossible,
      accuracy,
      championship_pick: championshipPick,
      championship_alive: championshipAlive,
      final_four_picks: finalFourPicks,
      upset_picks_correct: upsetPicksCorrect,
      upset_picks_total: upsetPicksTotal,
      picks_by_round: picksByRound,
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entries.sort((a: any, b: any) => b.total_points - a.total_points || b.max_possible - a.max_possible);
  return NextResponse.json(entries);
}
