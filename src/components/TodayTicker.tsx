"use client";

import { Game, LiveGameInfo } from "@/lib/types";
import { getTeamLogoUrl } from "@/lib/team-logos";
import Image from "next/image";

interface TodayTickerProps {
  games: Game[];
  liveData: Record<string, LiveGameInfo>;
  onGameClick?: (game: Game) => void;
}

export default function TodayTicker({ games, liveData, onGameClick }: TodayTickerProps) {
  // Build today's games from live data (the live endpoint returns today's scoreboard)
  const todayGameIds = Object.keys(liveData);
  if (todayGameIds.length === 0) return null;

  // Map to game objects sorted by start time
  const todayGames = todayGameIds
    .map((id) => {
      const game = games.find((g) => g.id === id);
      if (!game) return null;
      return { game, live: liveData[id] };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const epochA = parseInt(a!.live.startTimeEpoch) || 0;
      const epochB = parseInt(b!.live.startTimeEpoch) || 0;
      return epochA - epochB;
    }) as { game: Game; live: LiveGameInfo }[];

  if (todayGames.length === 0) return null;

  // Duplicate for seamless loop
  const scrollDuration = todayGames.length * 6;

  return (
    <div className="bg-[#0f172a] border-b border-[#334155]/50 overflow-hidden">
      <div
        className="flex items-center gap-2 py-1.5 animate-ticker hover:[animation-play-state:paused]"
        style={{ animationDuration: `${scrollDuration}s` }}
      >
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider shrink-0 px-2">
          Today
        </span>
        {/* Render twice for seamless loop */}
        {[...todayGames, ...todayGames].map(({ game, live }, i) => (
          <TickerCard key={`${game.id}-${i}`} game={game} live={live} onClick={onGameClick} />
        ))}
      </div>
    </div>
  );
}

function TickerCard({
  game,
  live,
  onClick,
}: {
  game: Game;
  live: LiveGameInfo;
  onClick?: (game: Game) => void;
}) {
  const isLive = live.gameState === "live";
  const isFinal = live.gameState === "final" || game.status === "final";
  const isPre = !isLive && !isFinal;

  const logoA = getTeamLogoUrl(game.team_a_name);
  const logoB = getTeamLogoUrl(game.team_b_name);

  const scoreA = live.teamAScore ?? game.team_a_score;
  const scoreB = live.teamBScore ?? game.team_b_score;
  const aWins = isFinal && game.winner === game.team_a_name;
  const bWins = isFinal && game.winner === game.team_b_name;

  return (
    <button
      onClick={() => onClick?.(game)}
      className={`shrink-0 rounded-lg px-2.5 py-1.5 flex items-center gap-2.5 transition-colors min-w-[140px] ${
        isLive
          ? "bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/15"
          : "bg-[#1e293b]/60 border border-[#334155]/50 hover:bg-[#1e293b]"
      }`}
    >
      {/* Teams + scores */}
      <div className="flex flex-col gap-0.5 text-[11px] flex-1 min-w-0">
        {/* Team A */}
        <div className={`flex items-center gap-1.5 ${isFinal && !aWins ? "opacity-50" : ""}`}>
          {logoA && <Image src={logoA} alt="" width={12} height={12} className="shrink-0 object-contain" unoptimized />}
          <span className={`truncate ${aWins ? "font-bold" : ""}`}>
            {game.team_a_name || "TBD"}
          </span>
          {(isLive || isFinal) && (
            <span className={`ml-auto font-mono font-bold shrink-0 ${aWins ? "text-white" : ""}`}>
              {scoreA ?? ""}
            </span>
          )}
        </div>
        {/* Team B */}
        <div className={`flex items-center gap-1.5 ${isFinal && !bWins ? "opacity-50" : ""}`}>
          {logoB && <Image src={logoB} alt="" width={12} height={12} className="shrink-0 object-contain" unoptimized />}
          <span className={`truncate ${bWins ? "font-bold" : ""}`}>
            {game.team_b_name || "TBD"}
          </span>
          {(isLive || isFinal) && (
            <span className={`ml-auto font-mono font-bold shrink-0 ${bWins ? "text-white" : ""}`}>
              {scoreB ?? ""}
            </span>
          )}
        </div>
      </div>

      {/* Status badge */}
      <div className="shrink-0 text-center">
        {isLive && (
          <div className="flex flex-col items-center gap-0.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-400" />
            </span>
            <span className="text-[9px] text-yellow-400 font-bold">{live.period}</span>
            {live.clock && live.clock !== "0:00" && (
              <span className="text-[9px] text-yellow-400/70 font-mono">{live.clock}</span>
            )}
          </div>
        )}
        {isFinal && (
          <span className="text-[9px] text-slate-500 font-bold uppercase">Final</span>
        )}
        {isPre && (
          <span className="text-[9px] text-slate-500">{live.startTime?.replace(" ET", "")}</span>
        )}
      </div>
    </button>
  );
}
