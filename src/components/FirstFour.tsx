"use client";

import { Game, Pick } from "@/lib/types";
import GameCard from "./GameCard";

interface FirstFourProps {
  games: Game[];
  picks: Pick[];
  onPick?: (gameId: string, team: string) => void;
  viewOnly?: boolean;
}

export default function FirstFour({ games, picks, onPick, viewOnly }: FirstFourProps) {
  const ffGames = games.filter((g) => g.round === 0).sort((a, b) => a.id.localeCompare(b.id));
  const pickMap = new Map(picks.map((p) => [p.game_id, p]));

  if (ffGames.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold mb-3 text-purple-400">
        First Four — Dayton, OH
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ffGames.map((g) => (
          <GameCard
            key={g.id}
            game={g}
            pick={pickMap.get(g.id)}
            onPick={onPick}
            viewOnly={viewOnly}
          />
        ))}
      </div>
    </div>
  );
}
