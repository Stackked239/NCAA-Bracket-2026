"use client";

import { useState } from "react";
import { Game, Pick, ROUND_NAMES } from "@/lib/types";
import { IconTrophy, IconCheck, IconChevronDown } from "./Icons";
import { getTeamLogoUrl } from "@/lib/team-logos";
import Image from "next/image";

interface PicksSummaryProps {
  games: Game[];
  picks: Pick[];
  userName: string;
}

type FilterMode = "all" | "correct" | "incorrect" | "pending";

export default function PicksSummary({ games, picks, userName }: PicksSummaryProps) {
  const [expandedRound, setExpandedRound] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterMode>("all");

  const pickMap = new Map(picks.map((p) => [p.game_id, p]));

  // Build set of eliminated teams (teams that lost in any completed game)
  const eliminatedTeams = new Set<string>();
  games.forEach((g) => {
    if (g.status === "final" && g.winner) {
      if (g.team_a_name && g.team_a_name !== g.winner) eliminatedTeams.add(g.team_a_name);
      if (g.team_b_name && g.team_b_name !== g.winner) eliminatedTeams.add(g.team_b_name);
    }
  });

  // Group games by round
  const rounds = [0, 1, 2, 3, 4, 5, 6].map((round) => {
    const roundGames = games.filter((g) => g.round === round).sort((a, b) => a.id.localeCompare(b.id));
    const roundPicks = roundGames.map((g) => ({ game: g, pick: pickMap.get(g.id) })).filter((p) => p.pick);
    const correct = roundPicks.filter((p) => p.pick?.is_correct === true).length;
    const incorrect = roundPicks.filter((p) => p.pick?.is_correct === false).length;
    const pending = roundPicks.filter((p) => p.pick?.is_correct === null).length;
    return { round, roundGames, roundPicks, correct, incorrect, pending, total: roundGames.length };
  }).filter((r) => r.roundPicks.length > 0);

  // Overall stats
  const totalCorrect = rounds.reduce((s, r) => s + r.correct, 0);
  const totalIncorrect = rounds.reduce((s, r) => s + r.incorrect, 0);
  const totalPending = rounds.reduce((s, r) => s + r.pending, 0);

  // Championship pick
  const chipPick = pickMap.get("FF_CHIP");

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold">{userName}&apos;s Picks</h2>
        <div className="flex items-center gap-3 mt-1 text-sm">
          <span className="text-green-400 font-semibold">{totalCorrect}W</span>
          <span className="text-red-400 font-semibold">{totalIncorrect}L</span>
          {totalPending > 0 && <span className="text-yellow-400 font-semibold">{totalPending} pending</span>}
        </div>
      </div>

      {/* Championship pick banner */}
      {chipPick && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-3">
          <IconTrophy size={24} className="text-yellow-400 shrink-0" />
          <div>
            <div className="text-[10px] text-yellow-500 uppercase font-bold">Champion Pick</div>
            <div className="flex items-center gap-2 mt-0.5">
              {getTeamLogoUrl(chipPick.picked_team) && (
                <Image src={getTeamLogoUrl(chipPick.picked_team)!} alt="" width={20} height={20} className="object-contain" unoptimized />
              )}
              <span className="font-bold">{chipPick.picked_team}</span>
              {chipPick.is_correct === true && <span className="text-green-400 text-xs flex items-center gap-0.5"><IconCheck size={12} /> Correct</span>}
              {chipPick.is_correct === false && <span className="text-red-400 text-xs line-through">Eliminated</span>}
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-hide">
        {([
          { mode: "all" as FilterMode, label: "All", count: totalCorrect + totalIncorrect + totalPending },
          { mode: "correct" as FilterMode, label: "Correct", count: totalCorrect },
          { mode: "incorrect" as FilterMode, label: "Wrong", count: totalIncorrect },
          { mode: "pending" as FilterMode, label: "Pending", count: totalPending },
        ]).map((f) => (
          <button
            key={f.mode}
            onClick={() => setFilter(f.mode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.mode
                ? "bg-blue-600 text-white"
                : "bg-[#1e293b] text-slate-400 hover:text-white"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Rounds */}
      <div className="space-y-2">
        {rounds.map(({ round, roundPicks, correct, incorrect, pending, total }) => {
          const isExpanded = expandedRound === round;

          // Filter picks for display
          const displayPicks = roundPicks.filter((p) => {
            if (filter === "all") return true;
            if (filter === "correct") return p.pick?.is_correct === true;
            if (filter === "incorrect") return p.pick?.is_correct === false;
            if (filter === "pending") return p.pick?.is_correct === null;
            return true;
          });

          if (filter !== "all" && displayPicks.length === 0) return null;

          return (
            <div key={round} className="rounded-xl border border-[#334155] overflow-hidden">
              {/* Round header — clickable to expand */}
              <button
                onClick={() => setExpandedRound(isExpanded ? null : round)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#1e293b] hover:bg-[#1e293b]/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">{ROUND_NAMES[round]}</span>
                  <span className="text-xs text-slate-500">{total} games</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-green-400 font-bold">{correct}</span>
                    <span className="text-slate-600">/</span>
                    <span className="text-red-400 font-bold">{incorrect}</span>
                    {pending > 0 && (
                      <>
                        <span className="text-slate-600">/</span>
                        <span className="text-yellow-400 font-bold">{pending}</span>
                      </>
                    )}
                  </div>
                  <IconChevronDown size={14} className={`text-slate-500 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </button>

              {/* Picks list */}
              {isExpanded && (
                <div className="divide-y divide-[#334155]/50">
                  {displayPicks.map(({ game, pick }) => (
                    <PickRow key={game.id} game={game} pick={pick!} eliminatedTeams={eliminatedTeams} />
                  ))}
                  {displayPicks.length === 0 && (
                    <div className="px-4 py-3 text-sm text-slate-500 text-center">
                      No {filter} picks in this round
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PickRow({ game, pick, eliminatedTeams }: { game: Game; pick: Pick; eliminatedTeams: Set<string> }) {
  const isCorrect = pick.is_correct === true;
  const isIncorrect = pick.is_correct === false;
  const isPending = pick.is_correct === null;
  const isEliminated = isPending && eliminatedTeams.has(pick.picked_team);
  const logo = getTeamLogoUrl(pick.picked_team);

  // Find the opponent (the team they didn't pick)
  const opponent = pick.picked_team === game.team_a_name ? game.team_b_name : game.team_a_name;
  const opponentSeed = pick.picked_team === game.team_a_name ? game.team_b_seed : game.team_a_seed;
  const pickedSeed = pick.picked_team === game.team_a_name ? game.team_a_seed : game.team_b_seed;

  // Region label
  const region = game.region === "FINAL_FOUR" || game.region === "CHAMPIONSHIP"
    ? game.region.replace("_", " ")
    : game.region;

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 ${
      isCorrect ? "bg-green-500/5" : isIncorrect ? "bg-red-500/5" : isEliminated ? "bg-red-500/5 opacity-60" : ""
    }`}>
      {/* Status icon */}
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
        isCorrect ? "bg-green-500/20 text-green-400" :
        isIncorrect ? "bg-red-500/20 text-red-400" :
        isEliminated ? "bg-red-500/20 text-red-400" :
        "bg-yellow-500/20 text-yellow-400"
      }`}>
        {isCorrect ? "✓" : isIncorrect ? "✗" : isEliminated ? "💀" : "?"}
      </div>

      {/* Pick info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {logo && <Image src={logo} alt="" width={16} height={16} className={`shrink-0 object-contain ${isEliminated ? "grayscale" : ""}`} unoptimized />}
          <span className={`text-sm font-semibold truncate ${isIncorrect ? "line-through text-slate-500" : isEliminated ? "line-through text-slate-500" : ""}`}>
            ({pickedSeed}) {pick.picked_team}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          over ({opponentSeed}) {opponent} · {region}
        </div>
      </div>

      {/* Points */}
      <div className="text-right shrink-0">
        {isCorrect && (
          <span className="text-green-400 text-sm font-bold">+{pick.points_earned}</span>
        )}
        {isIncorrect && game.winner && (
          <span className="text-[11px] text-slate-500">{game.winner} won</span>
        )}
        {isEliminated && (
          <span className="text-[11px] text-red-400/70 font-medium">Eliminated</span>
        )}
        {isPending && !isEliminated && (
          <span className="text-[11px] text-yellow-400">TBD</span>
        )}
      </div>
    </div>
  );
}
