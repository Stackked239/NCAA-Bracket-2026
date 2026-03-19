"use client";

import { Game, Pick, LiveGameInfo } from "@/lib/types";
import GameCard from "./GameCard";

interface FinalFourProps {
  games: Game[];
  allGames: Game[];
  picks: Pick[];
  onPick?: (gameId: string, team: string) => void;
  viewOnly?: boolean;
  liveData?: Record<string, LiveGameInfo>;
  onGameClick?: (game: Game) => void;
}

export default function FinalFour({ games, allGames, picks, onPick, viewOnly, liveData, onGameClick }: FinalFourProps) {
  const sf1 = games.find((g) => g.id === "FF_SF1");
  const sf2 = games.find((g) => g.id === "FF_SF2");
  const chip = games.find((g) => g.id === "FF_CHIP");
  const pickMap = new Map(picks.map((p) => [p.game_id, p]));

  function getUserTeamForSlot(game: Game, slot: "a" | "b"): { name: string | null; seed: number | null } {
    if (slot === "a" && game.team_a_name) return { name: game.team_a_name, seed: game.team_a_seed };
    if (slot === "b" && game.team_b_name) return { name: game.team_b_name, seed: game.team_b_seed };

    const feederGame = allGames.find(
      (g) => g.next_game_id === game.id && g.next_game_slot === slot
    );
    if (!feederGame) return { name: null, seed: null };

    if (feederGame.winner) {
      const seed = feederGame.winner === feederGame.team_a_name ? feederGame.team_a_seed : feederGame.team_b_seed;
      return { name: feederGame.winner, seed };
    }

    // Check user pick for feeder
    const pick = pickMap.get(feederGame.id);
    if (pick) {
      const seed = pick.picked_team === feederGame.team_a_name ? feederGame.team_a_seed : feederGame.team_b_seed;
      return { name: pick.picked_team, seed };
    }

    // Go deeper - check if user has picked the regional champion
    const feederFeeder = allGames.filter(
      (g) => g.next_game_id === feederGame.id
    );
    for (const ff of feederFeeder) {
      const ffPick = pickMap.get(ff.id);
      if (ffPick) {
        const e8Pick = pickMap.get(feederGame.id);
        if (e8Pick) {
          const seed = e8Pick.picked_team === feederGame.team_a_name ? feederGame.team_a_seed : feederGame.team_b_seed;
          return { name: e8Pick.picked_team, seed };
        }
      }
    }

    return { name: null, seed: null };
  }

  function buildDisplayGame(game: Game): Game {
    const teamA = getUserTeamForSlot(game, "a");
    const teamB = getUserTeamForSlot(game, "b");
    return {
      ...game,
      team_a_name: game.team_a_name || teamA.name,
      team_a_seed: game.team_a_seed ?? teamA.seed,
      team_b_name: game.team_b_name || teamB.name,
      team_b_seed: game.team_b_seed ?? teamB.seed,
    };
  }

  // Champion pick display
  const chipDisplay = chip ? buildDisplayGame(chip) : null;
  const championPick = chip ? pickMap.get(chip.id) : undefined;
  const championName = chip?.winner || championPick?.picked_team;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold mb-4 text-center text-yellow-400">
        Final Four — Indianapolis
      </h3>

      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          {/* Semifinal 1: East vs West */}
          <div>
            <div className="text-xs text-slate-500 font-medium mb-2 uppercase text-center">
              Semifinal 1 — East vs West
            </div>
            {sf1 && (
              <GameCard
                game={buildDisplayGame(sf1)}
                pick={pickMap.get(sf1.id)}
                onPick={onPick}
                viewOnly={viewOnly}
                liveInfo={liveData?.[sf1.id]}
                onGameClick={onGameClick}
              />
            )}
          </div>

          {/* Championship */}
          <div>
            <div className="text-xs text-slate-500 font-medium mb-2 uppercase text-center">
              Championship
            </div>
            {chipDisplay && (
              <GameCard
                game={chipDisplay}
                pick={championPick}
                onPick={onPick}
                viewOnly={viewOnly}
                liveInfo={liveData?.["FF_CHIP"]}
                onGameClick={onGameClick}
              />
            )}
            {championName && (
              <div className="mt-3 text-center">
                <div className="text-xs text-slate-500 uppercase">Champion</div>
                <div className="text-xl font-bold text-yellow-400 mt-1">
                  🏆 {championName}
                </div>
              </div>
            )}
          </div>

          {/* Semifinal 2: South vs Midwest */}
          <div>
            <div className="text-xs text-slate-500 font-medium mb-2 uppercase text-center">
              Semifinal 2 — South vs Midwest
            </div>
            {sf2 && (
              <GameCard
                game={buildDisplayGame(sf2)}
                pick={pickMap.get(sf2.id)}
                onPick={onPick}
                viewOnly={viewOnly}
                liveInfo={liveData?.[sf2.id]}
                onGameClick={onGameClick}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
