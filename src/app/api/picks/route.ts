import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { BRACKET_LOCK_TIME } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const { data, error } = await supabase
    .from("picks")
    .select("*")
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { userId, gameId, pickedTeam } = await req.json();

  if (!userId || !gameId || !pickedTeam) {
    return NextResponse.json(
      { error: "userId, gameId, and pickedTeam required" },
      { status: 400 }
    );
  }

  // Check bracket lock
  if (new Date() >= BRACKET_LOCK_TIME) {
    return NextResponse.json(
      { error: "Brackets are locked! Tournament has started." },
      { status: 403 }
    );
  }

  // Check if changing pick — if so, clear downstream
  const { data: existing } = await supabase
    .from("picks")
    .select("*")
    .eq("user_id", userId)
    .eq("game_id", gameId)
    .single();

  if (existing && existing.picked_team !== pickedTeam) {
    await clearDownstreamPicks(userId, gameId, existing.picked_team);
  }

  // Upsert the pick
  const { data, error } = await supabase
    .from("picks")
    .upsert(
      {
        user_id: userId,
        game_id: gameId,
        picked_team: pickedTeam,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,game_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// Admin: reset incorrectly scored picks for a game
export async function PATCH(req: NextRequest) {
  const { gameId } = await req.json();
  if (!gameId) return NextResponse.json({ error: "gameId required" }, { status: 400 });

  const { data, error } = await supabase
    .from("picks")
    .update({ is_correct: null, points_earned: 0, updated_at: new Date().toISOString() })
    .eq("game_id", gameId)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reset: data?.length || 0 });
}

async function clearDownstreamPicks(userId: string, gameId: string, oldTeam: string) {
  // Get the game to find where it feeds into
  const { data: game } = await supabase.from("games").select("*").eq("id", gameId).single();
  if (!game || !game.next_game_id) return;

  // Delete the downstream pick if it was the old team
  const { data: deleted } = await supabase
    .from("picks")
    .delete()
    .eq("user_id", userId)
    .eq("game_id", game.next_game_id)
    .eq("picked_team", oldTeam)
    .select();

  // If we deleted something, continue clearing downstream
  if (deleted && deleted.length > 0) {
    await clearDownstreamPicks(userId, game.next_game_id, oldTeam);
  }
}
