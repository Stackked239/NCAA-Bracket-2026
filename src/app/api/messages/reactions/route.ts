import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get("messageId");

  if (!messageId) {
    return NextResponse.json({ error: "messageId required" }, { status: 400 });
  }

  // Support comma-separated message IDs for batch fetching
  const ids = messageId.split(",").map((id) => id.trim()).filter(Boolean);

  const { data, error } = await supabase
    .from("message_reactions")
    .select("*")
    .in("message_id", ids)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const { messageId, userId, emoji } = await req.json();

  if (!messageId || !userId || !emoji) {
    return NextResponse.json({ error: "messageId, userId, and emoji required" }, { status: 400 });
  }

  // Check if reaction already exists — toggle behavior
  const { data: existing } = await supabase
    .from("message_reactions")
    .select("id")
    .eq("message_id", messageId)
    .eq("user_id", userId)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    // Remove existing reaction
    await supabase
      .from("message_reactions")
      .delete()
      .eq("id", existing.id);
  } else {
    // Insert new reaction
    const { error } = await supabase
      .from("message_reactions")
      .insert({ message_id: messageId, user_id: userId, emoji });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return updated reactions for this message
  const { data: updated, error: fetchError } = await supabase
    .from("message_reactions")
    .select("*")
    .eq("message_id", messageId)
    .order("created_at", { ascending: true });

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json(updated || []);
}
