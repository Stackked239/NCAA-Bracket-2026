"use client";

import { Game, Pick, LiveGameInfo } from "@/lib/types";
import GameCard from "./GameCard";

interface RegionBracketProps {
  region: string;
  games: Game[];
  picks: Pick[];
  onPick?: (gameId: string, team: string) => void;
  viewOnly?: boolean;
  liveData?: Record<string, LiveGameInfo>;
  onGameClick?: (game: Game) => void;
}

export default function RegionBracket({ region, games, picks, onPick, viewOnly, liveData, onGameClick }: RegionBracketProps) {
  const regionGames = games.filter((g) => g.region === region);

  const r1 = regionGames.filter((g) => g.round === 1).sort((a, b) => a.id.localeCompare(b.id));
  const r2 = regionGames.filter((g) => g.round === 2).sort((a, b) => a.id.localeCompare(b.id));
  const r3 = regionGames.filter((g) => g.round === 3).sort((a, b) => a.id.localeCompare(b.id));
  const r4 = regionGames.filter((g) => g.round === 4);

  const pickMap = new Map(picks.map((p) => [p.game_id, p]));

  function getUserTeamForSlot(game: Game, slot: "a" | "b"): { name: string | null; seed: number | null } {
    if (slot === "a" && game.team_a_name) return { name: game.team_a_name, seed: game.team_a_seed };
    if (slot === "b" && game.team_b_name) return { name: game.team_b_name, seed: game.team_b_seed };

    const allGames = games;
    const feederGame = allGames.find(
      (g) => g.next_game_id === game.id && g.next_game_slot === slot
    );
    if (!feederGame) return { name: null, seed: null };

    if (feederGame.winner) {
      const seed = feederGame.winner === feederGame.team_a_name ? feederGame.team_a_seed : feederGame.team_b_seed;
      return { name: feederGame.winner, seed };
    }

    const pick = pickMap.get(feederGame.id);
    if (pick) {
      const seed =
        pick.picked_team === feederGame.team_a_name
          ? feederGame.team_a_seed
          : feederGame.team_b_seed;
      return { name: pick.picked_team, seed };
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

  const regionLabels: Record<string, string> = {
    EAST: "East — Washington, D.C.",
    WEST: "West — San Jose, CA",
    SOUTH: "South — Houston, TX",
    MIDWEST: "Midwest — Chicago, IL",
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-blue-400">
        {regionLabels[region] || region}
      </h3>

      {/* Desktop: horizontal bracket layout */}
      <div className="hidden lg:grid grid-cols-4 gap-4 items-start">
        {/* Round 1 */}
        <div className="space-y-2">
          <div className="text-xs text-slate-500 font-medium mb-1 uppercase">Round of 64</div>
          {r1.map((g) => {
            const dg = buildDisplayGame(g);
            return (
              <GameCard
                key={g.id}
                game={dg}
                pick={pickMap.get(g.id)}
                onPick={onPick}
                viewOnly={viewOnly}
                compact
                liveInfo={liveData?.[g.id]}
                onGameClick={onGameClick}
              />
            );
          })}
        </div>

        {/* Round 2 */}
        <div className="space-y-4 pt-6">
          <div className="text-xs text-slate-500 font-medium mb-1 uppercase">Round of 32</div>
          {r2.map((g) => {
            const dg = buildDisplayGame(g);
            return (
              <GameCard
                key={g.id}
                game={dg}
                pick={pickMap.get(g.id)}
                onPick={onPick}
                viewOnly={viewOnly}
                compact
                liveInfo={liveData?.[g.id]}
                onGameClick={onGameClick}
              />
            );
          })}
        </div>

        {/* Sweet 16 */}
        <div className="space-y-8 pt-16">
          <div className="text-xs text-slate-500 font-medium mb-1 uppercase">Sweet 16</div>
          {r3.map((g) => {
            const dg = buildDisplayGame(g);
            return (
              <GameCard
                key={g.id}
                game={dg}
                pick={pickMap.get(g.id)}
                onPick={onPick}
                viewOnly={viewOnly}
                liveInfo={liveData?.[g.id]}
                onGameClick={onGameClick}
              />
            );
          })}
        </div>

        {/* Elite 8 */}
        <div className="pt-32">
          <div className="text-xs text-slate-500 font-medium mb-1 uppercase">Elite Eight</div>
          {r4.map((g) => {
            const dg = buildDisplayGame(g);
            return (
              <GameCard
                key={g.id}
                game={dg}
                pick={pickMap.get(g.id)}
                onPick={onPick}
                viewOnly={viewOnly}
                liveInfo={liveData?.[g.id]}
                onGameClick={onGameClick}
              />
            );
          })}
        </div>
      </div>

      {/* Mobile: stacked rounds */}
      <div className="lg:hidden space-y-4">
        {[
          { label: "Round of 64", games: r1 },
          { label: "Round of 32", games: r2 },
          { label: "Sweet 16", games: r3 },
          { label: "Elite Eight", games: r4 },
        ].map(({ label, games: roundGames }) => (
          <div key={label}>
            <div className="text-xs text-slate-500 font-medium mb-2 uppercase">{label}</div>
            <div className="space-y-2">
              {roundGames.map((g) => {
                const dg = buildDisplayGame(g);
                return (
                  <GameCard
                    key={g.id}
                    game={dg}
                    pick={pickMap.get(g.id)}
                    onPick={onPick}
                    viewOnly={viewOnly}
                    liveInfo={liveData?.[g.id]}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
