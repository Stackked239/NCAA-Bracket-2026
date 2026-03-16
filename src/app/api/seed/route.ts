import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAllGames } from "@/data/tournament";

export async function POST() {
  try {
    // Check if games already exist
    const { count } = await supabase.from("games").select("*", { count: "exact", head: true });
    if (count && count > 0) {
      return NextResponse.json({ message: `Games already seeded (${count} games exist)` });
    }

    // Insert all games
    const games = getAllGames().map((g) => ({
      ...g,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("games").insert(games);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Ensure admin user exists
    await supabase
      .from("users")
      .upsert({ name: "Austin", is_admin: true }, { onConflict: "name" });

    return NextResponse.json({ success: true, games_inserted: games.length });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
