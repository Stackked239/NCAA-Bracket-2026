"use client";

import { Game, LiveGameInfo } from "@/lib/types";
import { getTeamLogoUrl } from "@/lib/team-logos";
import Image from "next/image";

interface ScoreTickerProps {
  games: Game[];
  liveData: Record<string, LiveGameInfo>;
}

export default function ScoreTicker({ games, liveData }: ScoreTickerProps) {
  // Only show games that are live or recently finished (today)
  const activeGames = Object.entries(liveData)
    .filter(([, live]) => live.gameState === "live" || live.gameState === "final")
    .map(([id, live]) => {
      const game = games.find((g) => g.id === id);
      return game ? { game, live } : null;
    })
    .filter(Boolean)
    .sort((a, b) => {
      // Live games first, then by start time
      if (a!.live.gameState === "live" && b!.live.gameState !== "live") return -1;
      if (a!.live.gameState !== "live" && b!.live.gameState === "live") return 1;
      return parseInt(a!.live.startTimeEpoch) - parseInt(b!.live.startTimeEpoch);
    }) as { game: Game; live: LiveGameInfo }[];

  if (activeGames.length === 0) return null;

  // Duplicate items for seamless loop
  const items = [...activeGames, ...activeGames];
  const animationDuration = activeGames.length * 5; // 5s per game

  return (
    <div className="sticky top-14 z-40 bg-[#0a0f1a] border-b border-[#334155]/30 overflow-hidden h-7">
      <div
        className="flex items-center gap-6 h-full whitespace-nowrap animate-marquee"
        style={{ animationDuration: `${animationDuration}s` }}
      >
        {items.map(({ game, live }, i) => {
          const isLive = live.gameState === "live";
          const logoA = getTeamLogoUrl(game.team_a_name);
          const logoB = getTeamLogoUrl(game.team_b_name);
          const scoreA = live.teamAScore ?? game.team_a_score;
          const scoreB = live.teamBScore ?? game.team_b_score;
          const aWins = game.winner === game.team_a_name;
          const bWins = game.winner === game.team_b_name;

          return (
            <span key={`${game.id}-${i}`} className="inline-flex items-center gap-2 text-[11px]">
              {isLive && (
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-400" />
                </span>
              )}
              <span className={`inline-flex items-center gap-1 ${game.status === "final" && !aWins ? "opacity-50" : ""}`}>
                {logoA && <Image src={logoA} alt="" width={10} height={10} className="object-contain" unoptimized />}
                <span className={aWins ? "font-bold" : ""}>{game.team_a_name}</span>
                <span className={`font-mono ${aWins ? "font-bold" : "text-slate-400"}`}>{scoreA}</span>
              </span>
              <span className="text-slate-600">-</span>
              <span className={`inline-flex items-center gap-1 ${game.status === "final" && !bWins ? "opacity-50" : ""}`}>
                <span className={`font-mono ${bWins ? "font-bold" : "text-slate-400"}`}>{scoreB}</span>
                {logoB && <Image src={logoB} alt="" width={10} height={10} className="object-contain" unoptimized />}
                <span className={bWins ? "font-bold" : ""}>{game.team_b_name}</span>
              </span>
              {isLive && live.period && (
                <span className="text-yellow-400 text-[9px] font-bold">{live.period} {live.clock !== "0:00" ? live.clock : ""}</span>
              )}
              {!isLive && <span className="text-slate-600 text-[9px]">F</span>}
              <span className="text-[#1e293b] mx-1">|</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
