import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const before = searchParams.get("before"); // cursor for pagination

  let query = supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return in chronological order for display
  return NextResponse.json(data?.reverse() || []);
}

export async function POST(req: NextRequest) {
  const { userId, userName, body, gameId } = await req.json();

  if (!userId || !userName || !body?.trim()) {
    return NextResponse.json({ error: "userId, userName, and body required" }, { status: 400 });
  }

  if (body.trim().length > 500) {
    return NextResponse.json({ error: "Message too long (max 500 chars)" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      user_id: userId,
      user_name: userName,
      body: body.trim(),
      game_id: gameId || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
