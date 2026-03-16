import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { LeaderboardEntry, POINTS_BY_ROUND } from "@/lib/types";

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
  games.forEach((g: { status: string; winner: string | null; team_a_name: string | null; team_b_name: string | null }) => {
    if (g.status === "final" && g.winner) {
      const loser = g.winner === g.team_a_name ? g.team_b_name : g.team_a_name;
      if (loser) eliminatedTeams.add(loser);
    }
  });

  const entries: LeaderboardEntry[] = users.map((user: { id: string; name: string; is_admin: boolean; avatar_url: string | null; created_at: string }) => {
    const picks = allPicks.filter((p: { user_id: string }) => p.user_id === user.id);
    let totalPoints = 0;
    let correctPicks = 0;
    let maxPossible = 0;
    const picksByRound: Record<number, { correct: number; total: number; possible: number }> = {};

    // Init rounds
    for (let r = 0; r <= 6; r++) {
      const roundGames = games.filter((g: { round: number }) => g.round === r);
      picksByRound[r] = { correct: 0, total: roundGames.length, possible: 0 };
    }

    picks.forEach((p: { is_correct: boolean | null; points_earned: number; picked_team: string; game_id: string }) => {
      const game = games.find((g: { id: string }) => g.id === p.game_id);
      if (!game) return;

      if (p.is_correct === true) {
        totalPoints += p.points_earned;
        correctPicks++;
        maxPossible += p.points_earned;
        picksByRound[game.round].correct++;
      } else if (p.is_correct === null) {
        // Pending — add to max if team not eliminated
        if (!eliminatedTeams.has(p.picked_team)) {
          maxPossible += POINTS_BY_ROUND[game.round] || 0;
        }
        picksByRound[game.round].possible++;
      }
    });

    return {
      user,
      total_points: totalPoints,
      correct_picks: correctPicks,
      total_picks: picks.length,
      max_possible: maxPossible,
      picks_by_round: picksByRound,
    };
  });

  entries.sort((a, b) => b.total_points - a.total_points || b.max_possible - a.max_possible);
  return NextResponse.json(entries);
}
