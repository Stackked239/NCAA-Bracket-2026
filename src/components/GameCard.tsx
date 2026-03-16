"use client";

import { Game, Pick, BRACKET_LOCK_TIME } from "@/lib/types";

interface GameCardProps {
  game: Game;
  pick?: Pick;
  onPick?: (gameId: string, team: string) => void;
  compact?: boolean;
  viewOnly?: boolean;
}

export default function GameCard({ game, pick, onPick, compact, viewOnly }: GameCardProps) {
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

  const isLive = game.status === "in_progress";
  const isFinal = game.status === "final";

  return (
    <div
      className={`game-card bg-[#1e293b] rounded-lg border overflow-hidden ${
        isLive
          ? "border-yellow-500/50"
          : isFinal
          ? "border-[#334155]/50"
          : "border-[#334155]"
      } ${compact ? "text-xs" : "text-sm"}`}
    >
      {/* Status bar */}
      {(isLive || isFinal) && (
        <div
          className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-center ${
            isLive ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-700/50 text-slate-400"
          }`}
        >
          {isLive ? "LIVE" : "FINAL"}
          {isLive && game.team_a_score !== null && (
            <span className="ml-2">
              {game.team_a_score} - {game.team_b_score}
            </span>
          )}
        </div>
      )}

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

      <div className="border-t border-[#334155]/50" />

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
  if (!name) {
    return (
      <div className={`flex items-center gap-2 ${compact ? "px-2 py-1.5" : "px-3 py-2"} opacity-30`}>
        <span className="w-5 text-center text-slate-500">{seed || "?"}</span>
        <span className="text-slate-500 italic">TBD</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={!canPick}
      className={`team-btn w-full flex items-center gap-2 ${
        compact ? "px-2 py-1.5" : "px-3 py-2"
      } ${className} ${
        canPick
          ? "hover:bg-[#334155] cursor-pointer"
          : "cursor-default"
      } ${isWinner ? "font-bold" : ""}`}
    >
      <span className="w-5 text-center text-slate-400 font-mono text-xs shrink-0">
        {seed}
      </span>
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
    </button>
  );
}
