"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Game, Pick, ROUND_NAMES, REGIONS } from "@/lib/types";
import { getTeamLogoUrl } from "@/lib/team-logos";
import Image from "next/image";

interface BracketWizardProps {
  games: Game[];
  picks: Pick[];
  onPick: (gameId: string, team: string) => void;
  onClose: () => void;
}

interface WizardStep {
  type: "intro" | "game";
  roundName?: string;
  roundNumber?: number;
  gameCount?: number;
  game?: Game;
  displayGame?: Game; // with user picks propagated
  stepIndex: number;
}

export default function BracketWizard({ games, picks, onPick, onClose }: BracketWizardProps) {
  const pickMap = new Map(picks.map((p) => [p.game_id, p]));
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animating, setAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build ordered list of steps: round intros + game cards
  const steps = buildSteps(games, picks, pickMap);

  // Find first unpicked game to start there
  useEffect(() => {
    const firstUnpicked = steps.findIndex(
      (s) => s.type === "game" && s.game && !pickMap.has(s.game.id)
    );
    if (firstUnpicked > 0) {
      // Go to the round intro before it
      const introIdx = steps.findLastIndex(
        (s, i) => i < firstUnpicked && s.type === "intro"
      );
      setCurrentStep(introIdx >= 0 ? introIdx : firstUnpicked);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const step = steps[currentStep];
  const totalGames = steps.filter((s) => s.type === "game").length;
  const pickedGames = steps.filter(
    (s) => s.type === "game" && s.game && pickMap.has(s.game.id)
  ).length;
  const progress = totalGames > 0 ? (pickedGames / totalGames) * 100 : 0;

  const goTo = useCallback(
    (idx: number, dir: "forward" | "back") => {
      if (idx < 0 || idx >= steps.length || animating) return;
      setDirection(dir);
      setAnimating(true);
      setTimeout(() => {
        setCurrentStep(idx);
        setAnimating(false);
      }, 150);
    },
    [steps.length, animating]
  );

  const goNext = useCallback(() => goTo(currentStep + 1, "forward"), [currentStep, goTo]);
  const goBack = useCallback(() => goTo(currentStep - 1, "back"), [currentStep, goTo]);

  const handlePick = useCallback(
    (gameId: string, team: string) => {
      onPick(gameId, team);
      // Auto-advance after a short delay
      setTimeout(() => {
        if (currentStep < steps.length - 1) {
          goTo(currentStep + 1, "forward");
        }
      }, 400);
    },
    [onPick, currentStep, steps.length, goTo]
  );

  // Swipe handling
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      if (dx < 0) goNext();
      else goBack();
    }
    touchStart.current = null;
  };

  if (!step) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0f172a] flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-4 pt-3 pb-2 border-b border-[#334155]">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm flex items-center gap-1"
          >
            ← Done
          </button>
          <span className="text-xs text-slate-500">
            {pickedGames}/{totalGames} picks
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content area */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center px-4 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`w-full max-w-md transition-all duration-150 ${
            animating
              ? direction === "forward"
                ? "opacity-0 translate-x-8"
                : "opacity-0 -translate-x-8"
              : "opacity-100 translate-x-0"
          }`}
        >
          {step.type === "intro" ? (
            <RoundIntro
              roundName={step.roundName!}
              gameCount={step.gameCount!}
              onStart={goNext}
            />
          ) : step.game && step.displayGame ? (
            <GamePickCard
              game={step.displayGame}
              pick={pickMap.get(step.game.id)}
              onPick={(team) => handlePick(step.game!.id, team)}
              roundName={ROUND_NAMES[step.game.round] || ""}
              region={step.game.region}
              stepLabel={`Game ${step.stepIndex}`}
            />
          ) : null}
        </div>
      </div>

      {/* Footer nav */}
      <div className="shrink-0 px-4 py-3 border-t border-[#334155] flex items-center justify-between">
        <button
          onClick={goBack}
          disabled={currentStep === 0}
          className="px-5 py-2.5 rounded-xl bg-[#1e293b] text-slate-400 disabled:opacity-30 text-sm font-medium"
        >
          Back
        </button>

        {/* Step dots — show nearby dots */}
        <div className="flex gap-1 items-center max-w-[200px] overflow-hidden">
          {getVisibleDots(currentStep, steps.length).map((idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx, idx > currentStep ? "forward" : "back")}
              className={`rounded-full shrink-0 transition-all ${
                idx === currentStep
                  ? "w-2.5 h-2.5 bg-blue-500"
                  : steps[idx]?.type === "intro"
                  ? "w-1.5 h-1.5 bg-slate-600"
                  : steps[idx]?.game && pickMap.has(steps[idx].game!.id)
                  ? "w-1.5 h-1.5 bg-green-500/60"
                  : "w-1.5 h-1.5 bg-slate-700"
              }`}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={currentStep >= steps.length - 1}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-sm font-medium"
        >
          {step.type === "intro" ? "Start" : "Skip"}
        </button>
      </div>
    </div>
  );
}

// ---- Round Intro Screen ----
function RoundIntro({
  roundName,
  gameCount,
  onStart,
}: {
  roundName: string;
  gameCount: number;
  onStart: () => void;
}) {
  const emoji: Record<string, string> = {
    "First Four": "4️⃣",
    "Round of 64": "🏀",
    "Round of 32": "🔥",
    "Sweet 16": "🍬",
    "Elite Eight": "💪",
    "Final Four": "🏟️",
    Championship: "🏆",
  };

  return (
    <div className="text-center py-8">
      <div className="text-6xl mb-6">{emoji[roundName] || "🏀"}</div>
      <h2 className="text-3xl font-bold mb-2">{roundName}</h2>
      <p className="text-slate-400 text-lg mb-8">
        {gameCount} game{gameCount !== 1 ? "s" : ""} to pick
      </p>
      <button
        onClick={onStart}
        className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-lg font-semibold transition-colors active:scale-95"
      >
        Let&apos;s Go
      </button>
    </div>
  );
}

// ---- Game Pick Card ----
function GamePickCard({
  game,
  pick,
  onPick,
  roundName,
  region,
  stepLabel,
}: {
  game: Game;
  pick?: Pick;
  onPick: (team: string) => void;
  roundName: string;
  region: string;
  stepLabel: string;
}) {
  const teamA = game.team_a_name;
  const teamB = game.team_b_name;
  const picked = pick?.picked_team;
  const logoA = getTeamLogoUrl(teamA);
  const logoB = getTeamLogoUrl(teamB);

  return (
    <div className="w-full">
      {/* Context */}
      <div className="text-center mb-5">
        <div className="text-xs text-slate-500 uppercase tracking-wider">
          {region !== "FINAL_FOUR" && region !== "CHAMPIONSHIP"
            ? `${region} Region`
            : region.replace("_", " ")}{" "}
          · {roundName}
        </div>
      </div>

      {/* Team A */}
      <button
        onClick={() => teamA && onPick(teamA)}
        disabled={!teamA}
        className={`w-full rounded-2xl border-2 p-5 mb-3 transition-all active:scale-[0.98] ${
          picked === teamA
            ? "border-blue-500 bg-blue-600/20 shadow-lg shadow-blue-500/20"
            : "border-[#334155] bg-[#1e293b] hover:border-slate-500"
        } ${!teamA ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${
              picked === teamA ? "bg-blue-500" : "bg-slate-700"
            }`}
          >
            {logoA ? (
              <Image src={logoA} alt="" width={32} height={32} className="object-contain" unoptimized />
            ) : (
              <span className="text-xl font-bold">{game.team_a_seed || "?"}</span>
            )}
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">{game.team_a_seed}</span>
              <span className={`text-lg font-bold truncate ${!teamA ? "text-slate-600" : ""}`}>
                {teamA || "TBD"}
              </span>
            </div>
            {game.team_a_record && (
              <div className="text-sm text-slate-400">{game.team_a_record}</div>
            )}
          </div>
          {picked === teamA && (
            <div className="text-2xl shrink-0">✓</div>
          )}
        </div>
      </button>

      {/* VS divider */}
      <div className="flex items-center gap-3 my-2 px-4">
        <div className="flex-1 h-px bg-[#334155]" />
        <span className="text-sm font-bold text-slate-500">VS</span>
        <div className="flex-1 h-px bg-[#334155]" />
      </div>

      {/* Team B */}
      <button
        onClick={() => teamB && onPick(teamB)}
        disabled={!teamB}
        className={`w-full rounded-2xl border-2 p-5 mt-3 transition-all active:scale-[0.98] ${
          picked === teamB
            ? "border-blue-500 bg-blue-600/20 shadow-lg shadow-blue-500/20"
            : "border-[#334155] bg-[#1e293b] hover:border-slate-500"
        } ${!teamB ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${
              picked === teamB ? "bg-blue-500" : "bg-slate-700"
            }`}
          >
            {logoB ? (
              <Image src={logoB} alt="" width={32} height={32} className="object-contain" unoptimized />
            ) : (
              <span className="text-xl font-bold">{game.team_b_seed || "?"}</span>
            )}
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">{game.team_b_seed}</span>
              <span className={`text-lg font-bold truncate ${!teamB ? "text-slate-600" : ""}`}>
                {teamB || "TBD"}
              </span>
            </div>
            {game.team_b_record && (
              <div className="text-sm text-slate-400">{game.team_b_record}</div>
            )}
          </div>
          {picked === teamB && (
            <div className="text-2xl shrink-0">✓</div>
          )}
        </div>
      </button>

      {/* Picked indicator */}
      {picked && (
        <div className="text-center mt-5">
          <span className="text-sm text-green-400 font-medium">
            ✓ {picked} advances
          </span>
        </div>
      )}
    </div>
  );
}

// ---- Helpers ----

function buildSteps(games: Game[], picks: Pick[], pickMap: Map<string, Pick>): WizardStep[] {
  const steps: WizardStep[] = [];
  let gameIndex = 0;

  // Define round order with grouping
  const roundGroups: { round: number; label: string; filter?: (g: Game) => boolean }[] = [
    { round: 0, label: "First Four" },
    ...REGIONS.map((r) => ({ round: 1, label: `Round of 64 — ${r.charAt(0) + r.slice(1).toLowerCase()}`, filter: (g: Game) => g.region === r })),
    ...REGIONS.map((r) => ({ round: 2, label: `Round of 32 — ${r.charAt(0) + r.slice(1).toLowerCase()}`, filter: (g: Game) => g.region === r })),
    ...REGIONS.map((r) => ({ round: 3, label: `Sweet 16 — ${r.charAt(0) + r.slice(1).toLowerCase()}`, filter: (g: Game) => g.region === r })),
    ...REGIONS.map((r) => ({ round: 4, label: `Elite Eight — ${r.charAt(0) + r.slice(1).toLowerCase()}`, filter: (g: Game) => g.region === r })),
    { round: 5, label: "Final Four" },
    { round: 6, label: "Championship" },
  ];

  for (const group of roundGroups) {
    let roundGames = games
      .filter((g) => g.round === group.round)
      .filter((g) => (group.filter ? group.filter(g) : true))
      .sort((a, b) => a.id.localeCompare(b.id));

    if (roundGames.length === 0) continue;

    // Build display games with user picks propagated
    const displayGames = roundGames.map((g) => buildDisplayGame(g, games, pickMap));

    // Round intro
    steps.push({
      type: "intro",
      roundName: group.label,
      roundNumber: group.round,
      gameCount: roundGames.length,
      stepIndex: 0,
    });

    // Game cards
    for (let i = 0; i < roundGames.length; i++) {
      gameIndex++;
      steps.push({
        type: "game",
        game: roundGames[i],
        displayGame: displayGames[i],
        stepIndex: gameIndex,
      });
    }
  }

  return steps;
}

function buildDisplayGame(game: Game, allGames: Game[], pickMap: Map<string, Pick>): Game {
  const teamA = getUserTeamForSlot(game, "a", allGames, pickMap);
  const teamB = getUserTeamForSlot(game, "b", allGames, pickMap);
  return {
    ...game,
    team_a_name: game.team_a_name || teamA.name,
    team_a_seed: game.team_a_seed ?? teamA.seed,
    team_b_name: game.team_b_name || teamB.name,
    team_b_seed: game.team_b_seed ?? teamB.seed,
  };
}

function getUserTeamForSlot(
  game: Game,
  slot: "a" | "b",
  allGames: Game[],
  pickMap: Map<string, Pick>
): { name: string | null; seed: number | null } {
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

  const pick = pickMap.get(feederGame.id);
  if (pick) {
    const seed = pick.picked_team === feederGame.team_a_name ? feederGame.team_a_seed : feederGame.team_b_seed;
    return { name: pick.picked_team, seed };
  }

  return { name: null, seed: null };
}

function getVisibleDots(current: number, total: number): number[] {
  const maxDots = 15;
  if (total <= maxDots) return Array.from({ length: total }, (_, i) => i);

  const half = Math.floor(maxDots / 2);
  let start = Math.max(0, current - half);
  let end = Math.min(total, start + maxDots);
  if (end === total) start = Math.max(0, end - maxDots);

  return Array.from({ length: end - start }, (_, i) => start + i);
}
