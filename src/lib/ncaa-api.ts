/**
 * NCAA API client — https://ncaa-api.henrygd.me
 *
 * Used for live scores, game clocks, TV networks, box scores, and more.
 * Rate limit: 5 requests/second per IP.
 */

const NCAA_API_BASE = "https://ncaa-api.henrygd.me";

// ---- Types ----

export interface NcaaTeam {
  score: string;
  winner: boolean;
  seed: string;
  names: {
    char6: string;
    short: string;
    seo: string;
    full: string;
  };
  rank: string;
  description: string;
  conferences: { conferenceName: string; conferenceSeo: string }[];
}

export interface NcaaGame {
  gameID: string;
  gameState: "pre" | "live" | "final";
  startTime: string;
  startTimeEpoch: string;
  startDate: string;
  currentPeriod: string;
  contestClock: string;
  network: string;
  bracketId: number;
  bracketRound: number;
  title: string;
  url: string;
  finalMessage: string;
  liveVideoEnabled: boolean;
  away: NcaaTeam;
  home: NcaaTeam;
  championshipGame?: {
    round: { roundNumber: number; title: string; subtitle: string };
  };
}

interface NcaaScoreboardResponse {
  games: { game: NcaaGame }[];
  updated_at: string;
}

// ---- Scoreboard ----

/**
 * Fetch the NCAA scoreboard. If no date is given, returns today's games.
 * @param date  Optional — format "YYYY/MM/DD"
 */
export async function fetchScoreboard(date?: string): Promise<NcaaGame[]> {
  const path = date
    ? `/scoreboard/basketball-men/d1/${date}`
    : `/scoreboard/basketball-men/d1`;

  const res = await fetch(`${NCAA_API_BASE}${path}`, {
    cache: "no-store",
    headers: { "User-Agent": "NCAA-Bracket-App/1.0" },
  });

  if (!res.ok) {
    throw new Error(`NCAA API error: ${res.status}`);
  }

  const data: NcaaScoreboardResponse = await res.json();
  return (data.games || []).map((g) => g.game);
}

/**
 * Fetch scoreboards for today and the previous `lookbackDays` days.
 * Useful during the tournament to catch games from recent dates.
 */
export async function fetchRecentScoreboards(lookbackDays = 2): Promise<NcaaGame[]> {
  const allGames: NcaaGame[] = [];
  const today = new Date();

  for (let i = 0; i <= lookbackDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;

    try {
      const games = await fetchScoreboard(dateStr);
      allGames.push(...games);
    } catch (e) {
      // If a date fails, continue with others
      console.warn(`Failed to fetch scoreboard for ${dateStr}:`, e);
    }
  }

  return allGames;
}

// ---- Game Detail ----

export async function fetchGameDetail(ncaaGameId: string): Promise<unknown> {
  const res = await fetch(`${NCAA_API_BASE}/game/${ncaaGameId}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`NCAA API game detail error: ${res.status}`);
  return res.json();
}

export async function fetchBoxscore(ncaaGameId: string): Promise<unknown> {
  const res = await fetch(`${NCAA_API_BASE}/game/${ncaaGameId}/boxscore`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`NCAA API boxscore error: ${res.status}`);
  return res.json();
}

export async function fetchPlayByPlay(ncaaGameId: string): Promise<unknown> {
  const res = await fetch(`${NCAA_API_BASE}/game/${ncaaGameId}/play-by-play`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`NCAA API play-by-play error: ${res.status}`);
  return res.json();
}

// ---- Team Name Matching ----

/**
 * Normalize a team name for fuzzy matching.
 * Strips periods, parentheticals, extra whitespace, and lowercases.
 */
function normalize(name: string): string {
  return name
    .replace(/\./g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/['']/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Expand common abbreviations in a normalized name.
 */
function expandAbbreviations(s: string): string {
  return s
    .replace(/\bfla\b/g, "florida")
    .replace(/\bconn\b/g, "connecticut")
    .replace(/\bn dak\b/g, "north dakota")
    .replace(/\bs dak\b/g, "south dakota");
}

/**
 * Check if two team names refer to the same school (fuzzy match).
 */
export function teamsMatch(nameA: string, nameB: string): boolean {
  const a = normalize(nameA);
  const b = normalize(nameB);

  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  // Try with abbreviation expansion
  const ea = expandAbbreviations(a);
  const eb = expandAbbreviations(b);
  if (ea === eb) return true;
  if (ea.includes(eb) || eb.includes(ea)) return true;

  return false;
}
