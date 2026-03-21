"use client";

import { Game, Pick, LiveGameInfo, BRACKET_LOCK_TIME } from "@/lib/types";
import { getTeamLogoUrl } from "@/lib/team-logos";
import Image from "next/image";

// ---- Layout constants ----
const SLOT_W = 128;
const CONNECTOR_W = 16;
const LINE_W = 14;
const REGION_H = 380;
const BORDER = "#475569";

// ---- Props ----
interface FullBracketProps {
  games: Game[];
  picks: Pick[];
  onPick?: (gameId: string, team: string) => void;
  viewOnly?: boolean;
  liveData?: Record<string, LiveGameInfo>;
  onGameClick?: (game: Game) => void;
  eliminatedTeams?: Set<string>;
  pickDistribution?: Record<string, Record<string, number>>;
}

// ---- Main Component ----
export default function FullBracket({ games, picks, onPick, viewOnly, liveData, onGameClick, eliminatedTeams, pickDistribution }: FullBracketProps) {
  const pickMap = new Map(picks.map((p) => [p.game_id, p]));
  const locked = new Date() >= BRACKET_LOCK_TIME;

  // Build display games with pick propagation
  function getDisplayGame(game: Game): Game {
    const teamA = resolveSlot(game, "a", games, pickMap);
    const teamB = resolveSlot(game, "b", games, pickMap);
    return {
      ...game,
      team_a_name: game.team_a_name || teamA.name,
      team_a_seed: game.team_a_seed ?? teamA.seed,
      team_b_name: game.team_b_name || teamB.name,
      team_b_seed: game.team_b_seed ?? teamB.seed,
    };
  }

  function getRegionRounds(region: string) {
    const rg = games.filter((g) => g.region === region);
    return {
      r1: rg.filter((g) => g.round === 1).sort((a, b) => a.id.localeCompare(b.id)),
      r2: rg.filter((g) => g.round === 2).sort((a, b) => a.id.localeCompare(b.id)),
      r3: rg.filter((g) => g.round === 3).sort((a, b) => a.id.localeCompare(b.id)),
      r4: rg.filter((g) => g.round === 4),
    };
  }

  const east = getRegionRounds("EAST");
  const west = getRegionRounds("WEST");
  const south = getRegionRounds("SOUTH");
  const midwest = getRegionRounds("MIDWEST");

  const ffSf1 = games.find((g) => g.id === "FF_SF1");
  const ffSf2 = games.find((g) => g.id === "FF_SF2");
  const chip = games.find((g) => g.id === "FF_CHIP");

  const slotProps = { pickMap, onPick: (!locked && !viewOnly) ? onPick : undefined, liveData, onGameClick };

  const roundLabels = ["1st Round", "2nd Round", "Sweet 16", "Elite 8"];
  const roundLabelsRev = [...roundLabels].reverse();

  return (
    <div className="overflow-x-auto pb-4">
      <div style={{ minWidth: 1200 }}>
        {/* Round headers */}
        <div className="flex">
          <RoundHeaders labels={roundLabels} />
          <div style={{ width: LINE_W }} />
          <div style={{ width: SLOT_W }} className="text-center text-[10px] text-yellow-400 font-bold uppercase pb-1">Final Four</div>
          <div style={{ width: LINE_W }} />
          <RoundHeaders labels={roundLabelsRev} />
        </div>

        {/* Top row: East → FF_SF1 ← West */}
        <div className="flex items-stretch relative" style={{ height: REGION_H }}>
          <RegionLabel name="EAST" side="left" />
          <RoundCol games={east.r1} display={getDisplayGame} {...slotProps} />
          <Connectors pairs={4} dir="ltr" />
          <RoundCol games={east.r2} display={getDisplayGame} {...slotProps} />
          <Connectors pairs={2} dir="ltr" />
          <RoundCol games={east.r3} display={getDisplayGame} {...slotProps} />
          <Connectors pairs={1} dir="ltr" />
          <RoundCol games={east.r4} display={getDisplayGame} {...slotProps} />
          <HLine />
          <div className="flex items-center" style={{ width: SLOT_W }}>
            {ffSf1 && <BracketSlot game={getDisplayGame(ffSf1)} pick={pickMap.get(ffSf1.id)} liveInfo={liveData?.[ffSf1.id]} onPick={slotProps.onPick} onGameClick={onGameClick ? () => onGameClick(getDisplayGame(ffSf1)) : undefined} />}
          </div>
          <HLine />
          <RoundCol games={west.r4} display={getDisplayGame} {...slotProps} />
          <Connectors pairs={1} dir="rtl" />
          <RoundCol games={west.r3} display={getDisplayGame} {...slotProps} />
          <Connectors pairs={2} dir="rtl" />
          <RoundCol games={west.r2} display={getDisplayGame} {...slotProps} />
          <Connectors pairs={4} dir="rtl" />
          <RoundCol games={west.r1} display={getDisplayGame} {...slotProps} />
          <RegionLabel name="WEST" side="right" />
        </div>

        {/* Center: Championship (between the two region rows) */}
        <div className="flex justify-center py-1">
          <div className="flex flex-col items-center" style={{ width: SLOT_W }}>
            <div className="w-0.5 h-3" style={{ backgroundColor: BORDER }} />
            {chip && <BracketSlot game={getDisplayGame(chip)} pick={pickMap.get(chip.id)} liveInfo={liveData?.["FF_CHIP"]} onPick={slotProps.onPick} onGameClick={onGameClick ? () => onGameClick(getDisplayGame(chip)) : undefined} />}
            {(chip?.winner || pickMap.get("FF_CHIP")?.picked_team) && (
              <div className="text-center mt-1">
                <div className="text-[10px] text-slate-500 uppercase">Champion</div>
                <div className="text-sm font-bold text-yellow-400">
                  {chip?.winner || pickMap.get("FF_CHIP")?.picked_team}
                </div>
              </div>
            )}
            <div className="w-0.5 h-3" style={{ backgroundColor: BORDER }} />
          </div>
        </div>

        {/* Bottom row: South → FF_SF2 ← Midwest */}
        <div className="flex items-stretch relative" style={{ height: REGION_H }}>
          <RegionLabel name="SOUTH" side="left" />
          <RoundCol games={south.r1} display={getDisplayGame} {...slotProps} />
          <Connectors pairs={4} dir="ltr" />
          <RoundCol games={south.r2} display={getDisplayGame} {...slotProps} />
          <Connectors pairs={2} dir="ltr" />
          <RoundCol games={south.r3} display={getDisplayGame} {...slotProps} />
          <Connectors pairs={1} dir="ltr" />
          <RoundCol games={south.r4} display={getDisplayGame} {...slotProps} />
          <HLine />
          <div className="flex items-center" style={{ width: SLOT_W }}>
            {ffSf2 && <BracketSlot game={getDisplayGame(ffSf2)} pick={pickMap.get(ffSf2.id)} liveInfo={liveData?.[ffSf2.id]} onPick={slotProps.onPick} onGameClick={onGameClick ? () => onGameClick(getDisplayGame(ffSf2)) : undefined} />}
          </div>
          <HLine />
          <RoundCol games={midwest.r4} display={getDisplayGame} {...slotProps} />
          <Connectors pairs={1} dir="rtl" />
          <RoundCol games={midwest.r3} display={getDisplayGame} {...slotProps} />
          <Connectors pairs={2} dir="rtl" />
          <RoundCol games={midwest.r2} display={getDisplayGame} {...slotProps} />
          <Connectors pairs={4} dir="rtl" />
          <RoundCol games={midwest.r1} display={getDisplayGame} {...slotProps} />
          <RegionLabel name="MIDWEST" side="right" />
        </div>

      </div>
    </div>
  );
}

// ---- Round Column ----
function RoundCol({
  games,
  display,
  pickMap,
  onPick,
  liveData,
  onGameClick,
}: {
  games: Game[];
  display: (g: Game) => Game;
  pickMap: Map<string, Pick>;
  onPick?: (gameId: string, team: string) => void;
  liveData?: Record<string, LiveGameInfo>;
  onGameClick?: (game: Game) => void;
}) {
  return (
    <div className="flex flex-col" style={{ width: SLOT_W }}>
      {games.map((g) => {
        const dg = display(g);
        return (
          <div key={g.id} className="flex-1 flex items-center">
            <BracketSlot
              game={dg}
              pick={pickMap.get(g.id)}
              onPick={onPick}
              liveInfo={liveData?.[g.id]}
              onGameClick={onGameClick ? () => onGameClick(dg) : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}

// ---- Bracket Connectors ----
function Connectors({ pairs, dir }: { pairs: number; dir: "ltr" | "rtl" }) {
  const isLtr = dir === "ltr";
  return (
    <div className="flex flex-col" style={{ width: CONNECTOR_W }}>
      {Array.from({ length: pairs }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col">
          <div
            className="flex-1"
            style={{
              borderTop: `2px solid ${BORDER}`,
              ...(isLtr
                ? { borderRight: `2px solid ${BORDER}` }
                : { borderLeft: `2px solid ${BORDER}` }),
            }}
          />
          <div
            className="flex-1"
            style={{
              borderBottom: `2px solid ${BORDER}`,
              ...(isLtr
                ? { borderRight: `2px solid ${BORDER}` }
                : { borderLeft: `2px solid ${BORDER}` }),
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ---- Horizontal line connector ----
function HLine() {
  return (
    <div className="flex items-center" style={{ width: LINE_W }}>
      <div className="w-full" style={{ borderTop: `2px solid ${BORDER}` }} />
    </div>
  );
}

// ---- Round Headers ----
function RoundHeaders({ labels }: { labels: string[] }) {
  return (
    <>
      {labels.map((label, i) => (
        <div key={i} className="flex items-center" style={{ width: i < labels.length - 1 ? SLOT_W + CONNECTOR_W : SLOT_W }}>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider w-full text-center">
            {label}
          </span>
        </div>
      ))}
    </>
  );
}

// ---- Region Label ----
function RegionLabel({ name, side }: { name: string; side: "left" | "right" }) {
  return (
    <div
      className={`absolute ${side === "left" ? "left-0" : "right-0"} top-0 flex items-center`}
      style={{
        writingMode: "vertical-lr",
        transform: side === "left" ? "rotate(180deg)" : undefined,
        height: "100%",
      }}
    >
      <span className="text-[10px] font-bold text-blue-400/50 uppercase tracking-widest">
        {name}
      </span>
    </div>
  );
}

// ---- Compact Bracket Slot ----
function BracketSlot({
  game,
  pick,
  onPick,
  liveInfo,
  onGameClick,
}: {
  game: Game;
  pick?: Pick;
  onPick?: (gameId: string, team: string) => void;
  liveInfo?: LiveGameInfo;
  onGameClick?: () => void;
}) {
  const isLive = game.status === "in_progress" || liveInfo?.gameState === "live";
  const isFinal = game.status === "final" || liveInfo?.gameState === "final";
  const canPick = !!(onPick && game.team_a_name && game.team_b_name);

  function teamClass(teamName: string | null) {
    if (!teamName || !pick || pick.picked_team !== teamName) return "";
    if (game.status === "final") return pick.is_correct ? "correct" : "incorrect";
    if (game.status === "in_progress") return "pending";
    return "selected";
  }

  return (
    <div
      onClick={onGameClick && game.team_a_name && game.team_b_name ? onGameClick : undefined}
      className={`w-full rounded border overflow-hidden text-[11px] leading-tight ${
        isLive ? "border-yellow-500/50" : "border-[#334155]"
      } ${onGameClick && game.team_a_name && game.team_b_name ? "cursor-pointer hover:border-blue-500/50 transition-colors" : ""}`}
      style={{ background: "#1e293b" }}
    >
      {/* Tiny status bar for live games */}
      {isLive && (
        <div className="flex items-center justify-center gap-1 px-1 py-px bg-yellow-500/20 text-[9px] font-bold text-yellow-400 uppercase">
          <span className="relative flex h-1 w-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1 w-1 bg-yellow-400" />
          </span>
          {liveInfo?.period && <span>{liveInfo.period}</span>}
          {liveInfo?.clock && liveInfo.clock !== "0:00" && <span>{liveInfo.clock}</span>}
        </div>
      )}

      <SlotRow
        seed={game.team_a_seed}
        name={game.team_a_name}
        score={game.team_a_score}
        isWinner={isFinal && game.winner === game.team_a_name}
        showScore={isLive || isFinal}
        className={teamClass(game.team_a_name)}
        canPick={canPick}
        onClick={() => game.team_a_name && onPick?.(game.id, game.team_a_name)}
      />
      <div style={{ borderTop: "1px solid #334155" }} />
      <SlotRow
        seed={game.team_b_seed}
        name={game.team_b_name}
        score={game.team_b_score}
        isWinner={isFinal && game.winner === game.team_b_name}
        showScore={isLive || isFinal}
        className={teamClass(game.team_b_name)}
        canPick={canPick}
        onClick={() => game.team_b_name && onPick?.(game.id, game.team_b_name)}
      />
    </div>
  );
}

function SlotRow({
  seed,
  name,
  score,
  isWinner,
  showScore,
  className,
  canPick,
  onClick,
}: {
  seed: number | null;
  name: string | null;
  score: number | null;
  isWinner: boolean;
  showScore: boolean;
  className: string;
  canPick: boolean;
  onClick: () => void;
}) {
  const logoUrl = getTeamLogoUrl(name);

  if (!name) {
    return (
      <div className="flex items-center gap-1 px-1 py-1 opacity-30 h-[18px]">
        <span className="w-3 text-center text-[9px] text-slate-500 font-mono">{seed || "?"}</span>
        <span className="text-slate-500 italic text-[10px]">TBD</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={!canPick}
      className={`team-btn w-full flex items-center gap-1 px-1 py-1 h-[18px] ${className} ${
        canPick ? "hover:bg-[#334155] cursor-pointer" : "cursor-default"
      } ${isWinner ? "font-bold" : ""}`}
    >
      <span className="w-3 text-center text-[9px] text-slate-400 font-mono shrink-0">{seed}</span>
      {logoUrl && (
        <Image src={logoUrl} alt="" width={12} height={12} className="shrink-0 object-contain" unoptimized />
      )}
      <span className="flex-1 text-left truncate">{name}</span>
      {showScore && score !== null && (
        <span className={`font-mono font-bold shrink-0 ${isWinner ? "text-green-400" : ""}`}>
          {score}
        </span>
      )}
    </button>
  );
}

// ---- Pick propagation helper ----
function resolveSlot(
  game: Game,
  slot: "a" | "b",
  allGames: Game[],
  pickMap: Map<string, Pick>
): { name: string | null; seed: number | null } {
  if (slot === "a" && game.team_a_name) return { name: game.team_a_name, seed: game.team_a_seed };
  if (slot === "b" && game.team_b_name) return { name: game.team_b_name, seed: game.team_b_seed };

  const feeder = allGames.find((g) => g.next_game_id === game.id && g.next_game_slot === slot);
  if (!feeder) return { name: null, seed: null };

  if (feeder.winner) {
    const seed = feeder.winner === feeder.team_a_name ? feeder.team_a_seed : feeder.team_b_seed;
    return { name: feeder.winner, seed };
  }

  const pick = pickMap.get(feeder.id);
  if (pick) {
    const seed = pick.picked_team === feeder.team_a_name ? feeder.team_a_seed : feeder.team_b_seed;
    return { name: pick.picked_team, seed };
  }

  return { name: null, seed: null };
}
