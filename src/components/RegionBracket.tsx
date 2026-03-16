"use client";

import { Game, Pick } from "@/lib/types";
import GameCard from "./GameCard";

interface RegionBracketProps {
  region: string;
  games: Game[];
  picks: Pick[];
  onPick?: (gameId: string, team: string) => void;
  viewOnly?: boolean;
}

export default function RegionBracket({ region, games, picks, onPick, viewOnly }: RegionBracketProps) {
  const regionGames = games.filter((g) => g.region === region);

  const r1 = regionGames.filter((g) => g.round === 1).sort((a, b) => a.id.localeCompare(b.id));
  const r2 = regionGames.filter((g) => g.round === 2).sort((a, b) => a.id.localeCompare(b.id));
  const r3 = regionGames.filter((g) => g.round === 3).sort((a, b) => a.id.localeCompare(b.id));
  const r4 = regionGames.filter((g) => g.round === 4);

  // For R2+, populate teams from picks (user's bracket view)
  // The actual game data may not have teams filled in yet, but the user's picks determine what they see
  const pickMap = new Map(picks.map((p) => [p.game_id, p]));

  function getUserTeamForSlot(game: Game, slot: "a" | "b"): { name: string | null; seed: number | null } {
    // First check if actual game data has the team
    if (slot === "a" && game.team_a_name) return { name: game.team_a_name, seed: game.team_a_seed };
    if (slot === "b" && game.team_b_name) return { name: game.team_b_name, seed: game.team_b_seed };

    // Otherwise look for the feeder game and user's pick
    const allGames = games;
    const feederGame = allGames.find(
      (g) => g.next_game_id === game.id && g.next_game_slot === slot
    );
    if (!feederGame) return { name: null, seed: null };

    // If the feeder game has an actual winner, use that
    if (feederGame.winner) {
      const seed = feederGame.winner === feederGame.team_a_name ? feederGame.team_a_seed : feederGame.team_b_seed;
      return { name: feederGame.winner, seed };
    }

    // Otherwise use the user's pick for the feeder game
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

  // Build display games with user picks propagated
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
