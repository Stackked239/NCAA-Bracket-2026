"use client";

import { useState } from "react";
import { Game, Pick, REGIONS } from "@/lib/types";
import FirstFour from "./FirstFour";
import RegionBracket from "./RegionBracket";
import FinalFour from "./FinalFour";

interface BracketViewProps {
  games: Game[];
  picks: Pick[];
  onPick?: (gameId: string, team: string) => void;
  viewOnly?: boolean;
  userName?: string;
}

export default function BracketView({ games, picks, onPick, viewOnly, userName }: BracketViewProps) {
  const [activeTab, setActiveTab] = useState<string>("ALL");

  const tabs = [
    { id: "ALL", label: "Full Bracket" },
    { id: "FIRST_FOUR", label: "First Four" },
    ...REGIONS.map((r) => ({ id: r, label: r.charAt(0) + r.slice(1).toLowerCase() })),
    { id: "FINAL_FOUR", label: "Final Four" },
  ];

  const ffGames = games.filter((g) => g.region === "FINAL_FOUR" || g.region === "CHAMPIONSHIP");

  // Count picks progress
  const totalGames = games.length;
  const pickedCount = picks.length;
  const progress = totalGames > 0 ? Math.round((pickedCount / totalGames) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          {userName && (
            <h2 className="text-xl font-bold">
              {viewOnly ? `${userName}'s Bracket` : "My Bracket"}
            </h2>
          )}
          <div className="flex items-center gap-3 mt-1">
            <div className="text-sm text-slate-400">
              {pickedCount}/{totalGames} picks made
            </div>
            <div className="w-32 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-[#1e293b] text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-8">
        {(activeTab === "ALL" || activeTab === "FIRST_FOUR") && (
          <FirstFour games={games} picks={picks} onPick={onPick} viewOnly={viewOnly} />
        )}

        {activeTab === "ALL" &&
          REGIONS.map((region) => (
            <RegionBracket
              key={region}
              region={region}
              games={games}
              picks={picks}
              onPick={onPick}
              viewOnly={viewOnly}
            />
          ))}

        {activeTab !== "ALL" &&
          activeTab !== "FIRST_FOUR" &&
          activeTab !== "FINAL_FOUR" &&
          REGIONS.includes(activeTab as typeof REGIONS[number]) && (
            <RegionBracket
              region={activeTab}
              games={games}
              picks={picks}
              onPick={onPick}
              viewOnly={viewOnly}
            />
          )}

        {(activeTab === "ALL" || activeTab === "FINAL_FOUR") && (
          <FinalFour
            games={ffGames}
            allGames={games}
            picks={picks}
            onPick={onPick}
            viewOnly={viewOnly}
          />
        )}
      </div>
    </div>
  );
}
