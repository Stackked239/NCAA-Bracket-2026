import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/picks/distribution
 *
 * Returns pick counts per game per team across all users.
 * Response: Record<gameId, { [teamName]: count, _total: totalPickers }>
 */
export async function GET() {
  const { data: picks, error } = await supabase
    .from("picks")
    .select("game_id, picked_team, user_id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Count distinct users who have made at least one pick
  const allUsers = new Set((picks || []).map((p: { user_id: string }) => p.user_id));
  const totalPickers = allUsers.size;

  // Group by game_id → { teamName: count }
  const dist: Record<string, Record<string, number>> = {};

  for (const p of picks || []) {
    const pick = p as { game_id: string; picked_team: string };
    if (!dist[pick.game_id]) dist[pick.game_id] = { _total: totalPickers };
    dist[pick.game_id][pick.picked_team] = (dist[pick.game_id][pick.picked_team] || 0) + 1;
  }

  return NextResponse.json(dist);
}
