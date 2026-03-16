import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region");
  const round = searchParams.get("round");
  const id = searchParams.get("id");

  let query = supabase.from("games").select("*");

  if (id) {
    const { data, error } = await query.eq("id", id).single();
    if (error) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(data);
  }

  if (region) query = query.eq("region", region);
  if (round) query = query.eq("round", parseInt(round));

  const { data, error } = await query.order("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "Game ID required" }, { status: 400 });

  updates.updated_at = new Date().toISOString();

  const { data: game, error } = await supabase
    .from("games")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If game has a winner and a next_game, propagate the team forward
  if (game.winner && game.next_game_id) {
    const winnerSeed = game.winner === game.team_a_name ? game.team_a_seed : game.team_b_seed;
    const winnerRecord = game.winner === game.team_a_name ? game.team_a_record : game.team_b_record;

    const nextUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (game.next_game_slot === "a") {
      nextUpdates.team_a_name = game.winner;
      nextUpdates.team_a_seed = winnerSeed;
      nextUpdates.team_a_record = winnerRecord;
    } else {
      nextUpdates.team_b_name = game.winner;
      nextUpdates.team_b_seed = winnerSeed;
      nextUpdates.team_b_record = winnerRecord;
    }

    await supabase.from("games").update(nextUpdates).eq("id", game.next_game_id);
  }

  // Score picks when a game is final
  if (updates.winner && updates.status === "final") {
    await scorePicks(id, updates.winner, game.round);
  }

  return NextResponse.json(game);
}

async function scorePicks(gameId: string, winner: string, round: number) {
  const roundPoints: Record<number, number> = { 0: 1, 1: 1, 2: 2, 3: 4, 4: 8, 5: 16, 6: 32 };
  const points = roundPoints[round] || 0;

  // Mark correct picks
  await supabase
    .from("picks")
    .update({ is_correct: true, points_earned: points, updated_at: new Date().toISOString() })
    .eq("game_id", gameId)
    .eq("picked_team", winner)
    .is("is_correct", null);

  // Mark incorrect picks
  await supabase
    .from("picks")
    .update({ is_correct: false, points_earned: 0, updated_at: new Date().toISOString() })
    .eq("game_id", gameId)
    .neq("picked_team", winner)
    .is("is_correct", null);
}
