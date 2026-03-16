import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase.from("users").select("*").order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { name, is_admin } = await req.json();
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Check if already exists
  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .ilike("name", name.trim())
    .single();

  if (existing) return NextResponse.json(existing);

  const { data, error } = await supabase
    .from("users")
    .insert({ name: name.trim(), is_admin: is_admin || false })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

  // Delete picks first (cascade should handle this, but be safe)
  await supabase.from("picks").delete().eq("user_id", id);
  const { error } = await supabase.from("users").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
