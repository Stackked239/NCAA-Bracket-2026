import { NextRequest, NextResponse } from "next/server";

const NCAA_API_BASE = "https://ncaa-api.henrygd.me";

/**
 * GET /api/game-detail?ncaaGameId=6534597
 *
 * Fetches boxscore from the NCAA API for a specific game.
 * Also accepts an optional gameId param to look up the NCAA ID from live data.
 * Read-only — never writes to the database.
 */
export async function GET(req: NextRequest) {
  let ncaaGameId = req.nextUrl.searchParams.get("ncaaGameId");
  const ourGameId = req.nextUrl.searchParams.get("gameId");

  // If we don't have a valid NCAA game ID, try looking it up from today's scoreboard
  if (!ncaaGameId && ourGameId) {
    try {
      // Fetch live data to find the NCAA game ID mapping
      const liveRes = await fetch(`${req.nextUrl.origin}/api/live`);
      if (liveRes.ok) {
        const liveData = await liveRes.json();
        if (liveData[ourGameId]?.ncaaGameId) {
          ncaaGameId = liveData[ourGameId].ncaaGameId;
        }
      }
    } catch {
      // Continue without NCAA ID
    }
  }

  if (!ncaaGameId) {
    return NextResponse.json({ boxscore: null, teamStats: null });
  }

  try {
    const boxscoreRes = await fetch(`${NCAA_API_BASE}/game/${ncaaGameId}/boxscore`, {
      cache: "no-store",
    });

    const boxscore = boxscoreRes.ok ? await boxscoreRes.json() : null;

    return NextResponse.json({ boxscore });
  } catch (error) {
    console.error("Game detail fetch error:", error);
    return NextResponse.json({ boxscore: null });
  }
}
