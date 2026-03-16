import { Game } from "@/lib/types";

// Helper to generate game IDs
// Region games: {REGION}_R{round}_{matchup}  e.g. EAST_R1_1
// Final Four: FF_SF1, FF_SF2, FF_CHIP

type GameSeed = Omit<Game, "created_at" | "updated_at">;

function makeGame(partial: Partial<GameSeed> & { id: string; region: string; round: number }): GameSeed {
  return {
    team_a_seed: null,
    team_a_name: null,
    team_a_record: null,
    team_b_seed: null,
    team_b_name: null,
    team_b_record: null,
    team_a_score: null,
    team_b_score: null,
    winner: null,
    status: "pregame",
    game_time: null,
    espn_game_id: null,
    next_game_id: null,
    next_game_slot: null,
    ...partial,
  };
}

// ---- FIRST FOUR ----
const firstFour: GameSeed[] = [
  makeGame({
    id: "FF1",
    region: "SOUTH",
    round: 0,
    team_a_seed: 16, team_a_name: "Lehigh", team_a_record: "18-16",
    team_b_seed: 16, team_b_name: "Prairie View A&M", team_b_record: "18-17",
    next_game_id: "SOUTH_R1_1", next_game_slot: "b",
    game_time: "2026-03-17T18:00:00-04:00",
  }),
  makeGame({
    id: "FF2",
    region: "MIDWEST",
    round: 0,
    team_a_seed: 16, team_a_name: "Howard", team_a_record: "23-10",
    team_b_seed: 16, team_b_name: "UMBC", team_b_record: "24-8",
    next_game_id: "MIDWEST_R1_1", next_game_slot: "b",
    game_time: "2026-03-17T20:30:00-04:00",
  }),
  makeGame({
    id: "FF3",
    region: "WEST",
    round: 0,
    team_a_seed: 11, team_a_name: "NC State", team_a_record: "20-13",
    team_b_seed: 11, team_b_name: "Texas", team_b_record: "18-14",
    next_game_id: "WEST_R1_5", next_game_slot: "b",
    game_time: "2026-03-18T18:00:00-04:00",
  }),
  makeGame({
    id: "FF4",
    region: "MIDWEST",
    round: 0,
    team_a_seed: 11, team_a_name: "SMU", team_a_record: "20-13",
    team_b_seed: 11, team_b_name: "Miami (Ohio)", team_b_record: "31-1",
    next_game_id: "MIDWEST_R1_5", next_game_slot: "b",
    game_time: "2026-03-18T20:30:00-04:00",
  }),
];

// ---- REGION DATA ----
interface RegionMatchup {
  seed_a: number; team_a: string; record_a: string;
  seed_b: number; team_b: string; record_b: string;
  team_b_is_first_four?: boolean; // If team_b comes from First Four, leave name/record as placeholder
}

const regionData: Record<string, { matchups: RegionMatchup[] }> = {
  EAST: {
    matchups: [
      { seed_a: 1, team_a: "Duke", record_a: "32-2", seed_b: 16, team_b: "Siena", record_b: "23-11" },
      { seed_a: 8, team_a: "Ohio St.", record_a: "21-12", seed_b: 9, team_b: "TCU", record_b: "22-11" },
      { seed_a: 5, team_a: "St. John's", record_a: "28-6", seed_b: 12, team_b: "Northern Iowa", record_b: "23-12" },
      { seed_a: 4, team_a: "Kansas", record_a: "23-10", seed_b: 13, team_b: "Cal Baptist", record_b: "25-8" },
      { seed_a: 6, team_a: "Louisville", record_a: "23-10", seed_b: 11, team_b: "South Florida", record_b: "25-8" },
      { seed_a: 3, team_a: "Michigan St.", record_a: "25-7", seed_b: 14, team_b: "North Dakota St.", record_b: "27-7" },
      { seed_a: 7, team_a: "UCLA", record_a: "23-11", seed_b: 10, team_b: "UCF", record_b: "21-11" },
      { seed_a: 2, team_a: "UConn", record_a: "29-5", seed_b: 15, team_b: "Furman", record_b: "22-12" },
    ],
  },
  WEST: {
    matchups: [
      { seed_a: 1, team_a: "Arizona", record_a: "32-2", seed_b: 16, team_b: "Long Island", record_b: "24-10" },
      { seed_a: 8, team_a: "Villanova", record_a: "24-8", seed_b: 9, team_b: "Utah St.", record_b: "28-6" },
      { seed_a: 5, team_a: "Wisconsin", record_a: "24-10", seed_b: 12, team_b: "High Point", record_b: "30-4" },
      { seed_a: 4, team_a: "Arkansas", record_a: "26-8", seed_b: 13, team_b: "Hawaii", record_b: "24-8" },
      { seed_a: 6, team_a: "BYU", record_a: "23-11", seed_b: 11, team_b: "TBD", record_b: "TBD", team_b_is_first_four: true },
      { seed_a: 3, team_a: "Gonzaga", record_a: "30-3", seed_b: 14, team_b: "Kennesaw St.", record_b: "21-13" },
      { seed_a: 7, team_a: "Miami (FL)", record_a: "25-8", seed_b: 10, team_b: "Missouri", record_b: "20-12" },
      { seed_a: 2, team_a: "Purdue", record_a: "27-8", seed_b: 15, team_b: "Queens (N.C.)", record_b: "21-13" },
    ],
  },
  SOUTH: {
    matchups: [
      { seed_a: 1, team_a: "Florida", record_a: "26-7", seed_b: 16, team_b: "TBD", record_b: "TBD", team_b_is_first_four: true },
      { seed_a: 8, team_a: "Clemson", record_a: "24-10", seed_b: 9, team_b: "Iowa", record_b: "21-12" },
      { seed_a: 5, team_a: "Vanderbilt", record_a: "26-8", seed_b: 12, team_b: "McNeese", record_b: "28-5" },
      { seed_a: 4, team_a: "Nebraska", record_a: "26-6", seed_b: 13, team_b: "Troy", record_b: "22-11" },
      { seed_a: 6, team_a: "North Carolina", record_a: "24-8", seed_b: 11, team_b: "VCU", record_b: "27-7" },
      { seed_a: 3, team_a: "Illinois", record_a: "24-8", seed_b: 14, team_b: "Penn", record_b: "18-11" },
      { seed_a: 7, team_a: "Saint Mary's", record_a: "27-5", seed_b: 10, team_b: "Texas A&M", record_b: "21-11" },
      { seed_a: 2, team_a: "Houston", record_a: "28-6", seed_b: 15, team_b: "Idaho", record_b: "21-14" },
    ],
  },
  MIDWEST: {
    matchups: [
      { seed_a: 1, team_a: "Michigan", record_a: "31-3", seed_b: 16, team_b: "TBD", record_b: "TBD", team_b_is_first_four: true },
      { seed_a: 8, team_a: "Georgia", record_a: "22-10", seed_b: 9, team_b: "Saint Louis", record_b: "28-5" },
      { seed_a: 5, team_a: "Texas Tech", record_a: "22-10", seed_b: 12, team_b: "Akron", record_b: "29-5" },
      { seed_a: 4, team_a: "Alabama", record_a: "23-9", seed_b: 13, team_b: "Hofstra", record_b: "24-10" },
      { seed_a: 6, team_a: "Tennessee", record_a: "22-11", seed_b: 11, team_b: "TBD", record_b: "TBD", team_b_is_first_four: true },
      { seed_a: 3, team_a: "Virginia", record_a: "29-5", seed_b: 14, team_b: "Wright St.", record_b: "23-11" },
      { seed_a: 7, team_a: "Kentucky", record_a: "21-13", seed_b: 10, team_b: "Santa Clara", record_b: "26-8" },
      { seed_a: 2, team_a: "Iowa St.", record_a: "27-7", seed_b: 15, team_b: "Tennessee St.", record_b: "23-9" },
    ],
  },
};

function buildRegionGames(region: string): GameSeed[] {
  const data = regionData[region];
  const games: GameSeed[] = [];

  // Round 1 (8 games per region)
  data.matchups.forEach((m, i) => {
    const gameNum = i + 1;
    // Determine next game: games 1&2 -> R2_1, 3&4 -> R2_2, 5&6 -> R2_3, 7&8 -> R2_4
    const nextGameNum = Math.ceil(gameNum / 2);
    const nextSlot = gameNum % 2 === 1 ? "a" : "b";

    games.push(
      makeGame({
        id: `${region}_R1_${gameNum}`,
        region,
        round: 1,
        team_a_seed: m.seed_a,
        team_a_name: m.team_a,
        team_a_record: m.record_a,
        team_b_seed: m.seed_b,
        team_b_name: m.team_b_is_first_four ? null : m.team_b,
        team_b_record: m.team_b_is_first_four ? null : m.record_b,
        next_game_id: `${region}_R2_${nextGameNum}`,
        next_game_slot: nextSlot as "a" | "b",
        game_time: "2026-03-19T12:00:00-04:00",
      })
    );
  });

  // Round 2 (4 games)
  for (let i = 1; i <= 4; i++) {
    const nextGameNum = Math.ceil(i / 2);
    const nextSlot = i % 2 === 1 ? "a" : "b";
    games.push(
      makeGame({
        id: `${region}_R2_${i}`,
        region,
        round: 2,
        next_game_id: `${region}_R3_${nextGameNum}`,
        next_game_slot: nextSlot as "a" | "b",
        game_time: "2026-03-21T12:00:00-04:00",
      })
    );
  }

  // Sweet 16 (2 games)
  for (let i = 1; i <= 2; i++) {
    const nextSlot = i === 1 ? "a" : "b";
    games.push(
      makeGame({
        id: `${region}_R3_${i}`,
        region,
        round: 3,
        next_game_id: `${region}_R4_1`,
        next_game_slot: nextSlot as "a" | "b",
        game_time: "2026-03-26T19:00:00-04:00",
      })
    );
  }

  // Elite Eight (1 game)
  const ffSlotMap: Record<string, { next: string; slot: "a" | "b" }> = {
    EAST: { next: "FF_SF1", slot: "a" },
    WEST: { next: "FF_SF1", slot: "b" },
    SOUTH: { next: "FF_SF2", slot: "a" },
    MIDWEST: { next: "FF_SF2", slot: "b" },
  };
  const ff = ffSlotMap[region];
  games.push(
    makeGame({
      id: `${region}_R4_1`,
      region,
      round: 4,
      next_game_id: ff.next,
      next_game_slot: ff.slot,
      game_time: "2026-03-28T14:00:00-04:00",
    })
  );

  return games;
}

// Final Four & Championship
const finalFourGames: GameSeed[] = [
  makeGame({
    id: "FF_SF1",
    region: "FINAL_FOUR",
    round: 5,
    next_game_id: "FF_CHIP",
    next_game_slot: "a",
    game_time: "2026-04-04T18:00:00-04:00",
  }),
  makeGame({
    id: "FF_SF2",
    region: "FINAL_FOUR",
    round: 5,
    next_game_id: "FF_CHIP",
    next_game_slot: "b",
    game_time: "2026-04-04T20:30:00-04:00",
  }),
  makeGame({
    id: "FF_CHIP",
    region: "CHAMPIONSHIP",
    round: 6,
    game_time: "2026-04-06T21:00:00-04:00",
  }),
];

export function getAllGames(): GameSeed[] {
  return [
    ...firstFour,
    ...buildRegionGames("EAST"),
    ...buildRegionGames("WEST"),
    ...buildRegionGames("SOUTH"),
    ...buildRegionGames("MIDWEST"),
    ...finalFourGames,
  ];
}

// Total games: 4 (First Four) + 4*15 (regions) + 3 (Final Four) = 67 games
