"use client";

import { Game, Pick, LiveGameInfo, BRACKET_LOCK_TIME } from "@/lib/types";
import { getTeamLogoUrl } from "@/lib/team-logos";
import Image from "next/image";

interface GameCardProps {
  game: Game;
  pick?: Pick;
  onPick?: (gameId: string, team: string) => void;
  compact?: boolean;
  viewOnly?: boolean;
  liveInfo?: LiveGameInfo;
  onGameClick?: (game: Game) => void;
}

export default function GameCard({ game, pick, onPick, compact, viewOnly, liveInfo, onGameClick }: GameCardProps) {
  const locked = new Date() >= BRACKET_LOCK_TIME;
  const canPick = !locked && !viewOnly && onPick && game.team_a_name && game.team_b_name;

  function getTeamClass(teamName: string | null) {
    if (!teamName || !pick) return "";
    if (pick.picked_team !== teamName) return "";

    if (game.status === "final") {
      return pick.is_correct ? "correct" : "incorrect";
    }
    if (game.status === "in_progress") return "pending";
    return "selected";
  }

  function handlePick(team: string) {
    if (!canPick) return;
    onPick!(game.id, team);
  }

  const isLive = game.status === "in_progress" || liveInfo?.gameState === "live";
  const isFinal = game.status === "final" || liveInfo?.gameState === "final";
  const isPre = !isLive && !isFinal;

  // Live data
  const clock = liveInfo?.clock;
  const period = liveInfo?.period;
  const network = liveInfo?.network;
  const startTime = liveInfo?.startTime;

  return (
    <div
      onClick={onGameClick && game.team_a_name && game.team_b_name ? () => onGameClick(game) : undefined}
      className={`game-card bg-[#1e293b] rounded-lg border overflow-hidden ${
        isLive
          ? "border-yellow-500/50"
          : isFinal
          ? "border-[#334155]/50"
          : "border-[#334155]"
      } ${compact ? "text-xs" : "text-sm"} ${
        onGameClick && game.team_a_name && game.team_b_name
          ? "cursor-pointer hover:border-blue-500/40 transition-colors"
          : ""
      }`}
    >
      {/* Status bar */}
      <div
        className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 pointer-events-none ${
          isLive
            ? "bg-yellow-500/20 text-yellow-400"
            : isFinal
            ? "bg-slate-700/50 text-slate-400"
            : "bg-slate-800/50 text-slate-500"
        }`}
      >
        {isLive && (
          <>
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-400" />
            </span>
            <span>LIVE</span>
            {period && <span className="text-yellow-400/70">· {period}</span>}
            {clock && clock !== "0:00" && (
              <span className="font-mono text-yellow-400/70">· {clock}</span>
            )}
          </>
        )}
        {isFinal && !isLive && <span>FINAL</span>}
        {isPre && startTime && <span>{startTime}</span>}
        {isPre && !startTime && <span className="opacity-0">—</span>}

        {/* TV Network — right-aligned */}
        {network && (
          <span className="ml-auto text-slate-500 normal-case font-semibold">
            {network}
          </span>
        )}
      </div>

      {/* Team A */}
      <TeamRow
        seed={game.team_a_seed}
        name={game.team_a_name}
        score={game.team_a_score}
        record={!compact ? game.team_a_record : undefined}
        isWinner={isFinal && game.winner === game.team_a_name}
        className={getTeamClass(game.team_a_name)}
        canPick={!!canPick}
        onClick={() => game.team_a_name && handlePick(game.team_a_name)}
        compact={compact}
        showScore={isLive || isFinal}
      />

      <div className="border-t border-[#334155]/50 pointer-events-none" />

      {/* Team B */}
      <TeamRow
        seed={game.team_b_seed}
        name={game.team_b_name}
        score={game.team_b_score}
        record={!compact ? game.team_b_record : undefined}
        isWinner={isFinal && game.winner === game.team_b_name}
        className={getTeamClass(game.team_b_name)}
        canPick={!!canPick}
        onClick={() => game.team_b_name && handlePick(game.team_b_name)}
        compact={compact}
        showScore={isLive || isFinal}
      />
    </div>
  );
}

function TeamRow({
  seed,
  name,
  score,
  record,
  isWinner,
  className,
  canPick,
  onClick,
  compact,
  showScore,
}: {
  seed: number | null;
  name: string | null;
  score: number | null;
  record?: string | null;
  isWinner: boolean;
  className: string;
  canPick: boolean;
  onClick: () => void;
  compact?: boolean;
  showScore: boolean;
}) {
  const logoUrl = getTeamLogoUrl(name);

  if (!name) {
    return (
      <div className={`flex items-center gap-2 ${compact ? "px-2 py-1.5" : "px-3 py-2"} opacity-30 pointer-events-none`}>
        <span className="w-5 text-center text-slate-500">{seed || "?"}</span>
        <span className="text-slate-500 italic">TBD</span>
      </div>
    );
  }

  const content = (
    <>
      <span className="w-5 text-center text-slate-400 font-mono text-xs shrink-0">
        {seed}
      </span>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          width={compact ? 16 : 20}
          height={compact ? 16 : 20}
          className="shrink-0 object-contain"
          unoptimized
        />
      ) : (
        <span className={`shrink-0 ${compact ? "w-4" : "w-5"}`} />
      )}
      <span className={`flex-1 text-left truncate ${!name ? "text-slate-500 italic" : ""}`}>
        {name || "TBD"}
      </span>
      {record && (
        <span className="text-[10px] text-slate-500 shrink-0">{record}</span>
      )}
      {showScore && score !== null && (
        <span className={`font-mono font-bold shrink-0 ${isWinner ? "text-green-400" : ""}`}>
          {score}
        </span>
      )}
    </>
  );

  // When picks are active, render as a clickable button.
  // Otherwise render as a plain div with pointer-events-none so clicks
  // pass through to the parent card (for opening game details).
  if (canPick) {
    return (
      <button
        onClick={onClick}
        className={`team-btn w-full flex items-center gap-2 ${
          compact ? "px-2 py-1.5" : "px-3 py-2"
        } ${className} ${isWinner ? "font-bold" : ""} hover:bg-[#334155] cursor-pointer`}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={`w-full flex items-center gap-2 ${
        compact ? "px-2 py-1.5" : "px-3 py-2"
      } ${className} ${isWinner ? "font-bold" : ""} pointer-events-none`}
    >
      {content}
    </div>
  );
}
