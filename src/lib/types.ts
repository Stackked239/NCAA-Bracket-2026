export interface User {
  id: string;
  name: string;
  is_admin: boolean;
  avatar_url: string | null;
  created_at: string;
}

export interface Game {
  id: string;
  region: string;
  round: number;
  team_a_seed: number | null;
  team_a_name: string | null;
  team_a_record: string | null;
  team_b_seed: number | null;
  team_b_name: string | null;
  team_b_record: string | null;
  team_a_score: number | null;
  team_b_score: number | null;
  winner: string | null;
  status: "pregame" | "in_progress" | "final";
  game_time: string | null;
  espn_game_id: string | null;
  next_game_id: string | null;
  next_game_slot: "a" | "b" | null;
  created_at: string;
  updated_at: string;
}

export interface Pick {
  id: string;
  user_id: string;
  game_id: string;
  picked_team: string;
  is_correct: boolean | null;
  points_earned: number;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  user: User;
  total_points: number;
  correct_picks: number;
  total_picks: number;
  max_possible: number;
  picks_by_round: Record<number, { correct: number; total: number; possible: number }>;
}

export const ROUND_NAMES: Record<number, string> = {
  0: "First Four",
  1: "Round of 64",
  2: "Round of 32",
  3: "Sweet 16",
  4: "Elite Eight",
  5: "Final Four",
  6: "Championship",
};

export const POINTS_BY_ROUND: Record<number, number> = {
  0: 1,
  1: 1,
  2: 2,
  3: 4,
  4: 8,
  5: 16,
  6: 32,
};

export interface Message {
  id: string;
  user_id: string;
  user_name: string;
  body: string;
  game_id: string | null;
  created_at: string;
}

export interface UpsetAlert {
  game: Game;
  type: "leading" | "won";
  underdog: string;
  underdogSeed: number;
  favorite: string;
  favoriteSeed: number;
}

export const REGIONS = ["EAST", "WEST", "SOUTH", "MIDWEST"] as const;
export type Region = (typeof REGIONS)[number];

// Bracket lock time — temporarily extended to let late entries finish
export const BRACKET_LOCK_TIME = new Date("2026-03-18T00:00:00-04:00");
