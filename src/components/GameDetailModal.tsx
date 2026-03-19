"use client";

import { useState, useEffect } from "react";
import { Game, LiveGameInfo } from "@/lib/types";
import { getTeamLogoUrl } from "@/lib/team-logos";
import Image from "next/image";

// ---- Types for NCAA API responses ----
interface TeamInfo {
  teamId: string;
  seoname: string;
  nameShort: string;
  nameFull: string;
  teamName: string;
  color: string;
  isHome: boolean;
}

interface TeamStats {
  fieldGoalsMade: string;
  fieldGoalsAttempted: string;
  fieldGoalPercentage: string;
  freeThrowsMade: string;
  freeThrowsAttempted: string;
  freeThrowPercentage: string;
  threePointsMade: string;
  threePointsAttempted: string;
  threePointPercentage: string;
  offensiveRebounds: string;
  totalRebounds: string;
  assists: string;
  turnovers: string;
  personalFouls: string;
  steals: string;
  blockedShots: string;
}

interface Player {
  firstName: string;
  lastName: string;
  number: number;
  position: string;
  starter: boolean;
  minutesPlayed: string;
  points: string;
  fieldGoalsMade: string;
  fieldGoalsAttempted: string;
  threePointsMade: string;
  threePointsAttempted: string;
  freeThrowsMade: string;
  freeThrowsAttempted: string;
  totalRebounds: string;
  offensiveRebounds: string;
  assists: string;
  steals: string;
  blockedShots: string;
  turnovers: string;
  personalFouls: string;
}

interface BoxscoreTeam {
  teamId: number;
  teamStats: TeamStats;
  playerStats?: Player[];
}

interface BoxscoreData {
  status: string;
  period: string;
  teams: TeamInfo[];
  teamBoxscore: BoxscoreTeam[];
}

// ---- Props ----
interface GameDetailModalProps {
  game: Game;
  liveInfo?: LiveGameInfo;
  onClose: () => void;
}

export default function GameDetailModal({ game, liveInfo, onClose }: GameDetailModalProps) {
  const [boxscore, setBoxscore] = useState<BoxscoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"stats" | "away" | "home">("stats");

  const ncaaGameId = liveInfo?.ncaaGameId || game.espn_game_id;
  const isLive = game.status === "in_progress" || liveInfo?.gameState === "live";
  const isFinal = game.status === "final" || liveInfo?.gameState === "final";
  const hasStarted = isLive || isFinal;

  useEffect(() => {
    if (!hasStarted) {
      setLoading(false);
      return;
    }

    async function fetchDetails() {
      try {
        const params = new URLSearchParams();
        if (ncaaGameId) params.set("ncaaGameId", ncaaGameId);
        params.set("gameId", game.id);
        const res = await fetch(`/api/game-detail?${params}`);
        const data = await res.json();
        if (data.boxscore) {
          setBoxscore(data.boxscore);
        }
      } catch {
        setError("Failed to load game details");
      }
      setLoading(false);
    }

    fetchDetails();
    // Re-fetch every 30s for live games
    if (isLive) {
      const id = setInterval(fetchDetails, 30000);
      return () => clearInterval(id);
    }
  }, [ncaaGameId, game.id, hasStarted, isLive]);

  // Map boxscore teams to our game slots
  const homeTeam = boxscore?.teams?.find((t) => t.isHome);
  const awayTeam = boxscore?.teams?.find((t) => !t.isHome);
  const homeStats = boxscore?.teamBoxscore?.find((t) => String(t.teamId) === homeTeam?.teamId);
  const awayStats = boxscore?.teamBoxscore?.find((t) => String(t.teamId) === awayTeam?.teamId);

  const logoA = getTeamLogoUrl(game.team_a_name);
  const logoB = getTeamLogoUrl(game.team_b_name);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#1e293b] border border-[#334155] rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="shrink-0 px-5 pt-4 pb-3 border-b border-[#334155]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isLive && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-yellow-400 uppercase">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400" />
                  </span>
                  Live {liveInfo?.period && `· ${liveInfo.period}`} {liveInfo?.clock && liveInfo.clock !== "0:00" && `· ${liveInfo.clock}`}
                </span>
              )}
              {isFinal && !isLive && (
                <span className="text-xs font-bold text-slate-400 uppercase">Final</span>
              )}
              {!hasStarted && liveInfo?.startTime && (
                <span className="text-xs text-slate-400">{liveInfo.startTime}</span>
              )}
              {liveInfo?.network && (
                <span className="text-xs text-slate-500 font-semibold">{liveInfo.network}</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-lg leading-none px-1"
            >
              ✕
            </button>
          </div>

          {/* Scoreboard */}
          <div className="flex items-center justify-between gap-4">
            {/* Team A */}
            <div className="flex-1 flex flex-col items-center gap-1">
              {logoA && <Image src={logoA} alt="" width={40} height={40} className="object-contain" unoptimized />}
              <div className="text-sm font-bold text-center">{game.team_a_name || "TBD"}</div>
              {game.team_a_seed && <div className="text-[10px] text-slate-500">Seed {game.team_a_seed}</div>}
            </div>

            {/* Score */}
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-bold tabular-nums ${isFinal && game.winner === game.team_a_name ? "text-white" : isFinal ? "text-slate-500" : ""}`}>
                {hasStarted ? (game.team_a_score ?? 0) : "–"}
              </span>
              <span className="text-slate-600 text-lg">:</span>
              <span className={`text-3xl font-bold tabular-nums ${isFinal && game.winner === game.team_b_name ? "text-white" : isFinal ? "text-slate-500" : ""}`}>
                {hasStarted ? (game.team_b_score ?? 0) : "–"}
              </span>
            </div>

            {/* Team B */}
            <div className="flex-1 flex flex-col items-center gap-1">
              {logoB && <Image src={logoB} alt="" width={40} height={40} className="object-contain" unoptimized />}
              <div className="text-sm font-bold text-center">{game.team_b_name || "TBD"}</div>
              {game.team_b_seed && <div className="text-[10px] text-slate-500">Seed {game.team_b_seed}</div>}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center text-slate-400 py-12">Loading game details...</div>
          ) : error ? (
            <div className="text-center text-red-400 py-12">{error}</div>
          ) : !hasStarted ? (
            <PreGameInfo game={game} liveInfo={liveInfo} />
          ) : !boxscore ? (
            <div>
              <GameSummary game={game} liveInfo={liveInfo} />
              <div className="text-center text-slate-500 py-6 text-sm">
                Detailed box score not available for this game
              </div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex border-b border-[#334155] sticky top-0 bg-[#1e293b] z-10">
                {(["stats", "away", "home"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-3 py-2 text-xs font-semibold uppercase transition-colors ${
                      activeTab === tab
                        ? "text-blue-400 border-b-2 border-blue-400"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {tab === "stats"
                      ? "Team Stats"
                      : tab === "away"
                      ? (awayTeam?.nameShort || game.team_b_name || "Away")
                      : (homeTeam?.nameShort || game.team_a_name || "Home")}
                  </button>
                ))}
              </div>

              <div className="px-4 py-3">
                {activeTab === "stats" && homeStats && awayStats && homeTeam && awayTeam && (
                  <TeamStatsComparison
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    homeStats={homeStats.teamStats}
                    awayStats={awayStats.teamStats}
                  />
                )}
                {activeTab === "home" && homeStats && (
                  <PlayerStatsTable players={homeStats.playerStats || []} teamColor={homeTeam?.color} />
                )}
                {activeTab === "away" && awayStats && (
                  <PlayerStatsTable players={awayStats.playerStats || []} teamColor={awayTeam?.color} />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Game Summary (for games without box score) ----
function GameSummary({ game, liveInfo }: { game: Game; liveInfo?: LiveGameInfo }) {
  const isFinal = game.status === "final";
  return (
    <div className="px-5 py-4 space-y-3">
      <div className="text-center text-xs text-slate-500">
        {game.region && game.region !== "FINAL_FOUR" && game.region !== "CHAMPIONSHIP"
          ? `${game.region} Region`
          : game.region?.replace("_", " ")}
        {liveInfo?.network && ` · ${liveInfo.network}`}
      </div>
      {isFinal && game.winner && (
        <div className="text-center">
          <span className="text-green-400 font-semibold">{game.winner}</span>
          <span className="text-slate-500 text-sm"> wins</span>
        </div>
      )}
      {game.team_a_record && game.team_b_record && (
        <div className="flex justify-between text-sm text-slate-400 border-t border-[#334155] pt-3">
          <div>{game.team_a_name}: {game.team_a_record}</div>
          <div>{game.team_b_name}: {game.team_b_record}</div>
        </div>
      )}
    </div>
  );
}

// ---- Pre-game info ----
function PreGameInfo({ game, liveInfo }: { game: Game; liveInfo?: LiveGameInfo }) {
  return (
    <div className="px-5 py-6 space-y-4">
      <div className="text-center">
        <div className="text-slate-400 text-sm">
          {game.region && game.region !== "FINAL_FOUR" && game.region !== "CHAMPIONSHIP"
            ? `${game.region} Region`
            : game.region?.replace("_", " ")}
        </div>
        {liveInfo?.startTime && (
          <div className="text-lg font-semibold mt-1">{liveInfo.startTime}</div>
        )}
        {liveInfo?.network && (
          <div className="text-slate-400 text-sm mt-1">Watch on {liveInfo.network}</div>
        )}
      </div>
      {game.team_a_record && game.team_b_record && (
        <div className="flex justify-between text-sm text-slate-400 border-t border-[#334155] pt-4">
          <div>{game.team_a_name}: {game.team_a_record}</div>
          <div>{game.team_b_name}: {game.team_b_record}</div>
        </div>
      )}
    </div>
  );
}

// ---- Team Stats Comparison ----
function TeamStatsComparison({
  homeTeam,
  awayTeam,
  homeStats,
  awayStats,
}: {
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  homeStats: TeamStats;
  awayStats: TeamStats;
}) {
  const rows: { label: string; home: string; away: string; higherIsBetter?: boolean }[] = [
    { label: "FG", home: `${homeStats.fieldGoalsMade}/${homeStats.fieldGoalsAttempted}`, away: `${awayStats.fieldGoalsMade}/${awayStats.fieldGoalsAttempted}` },
    { label: "FG%", home: homeStats.fieldGoalPercentage, away: awayStats.fieldGoalPercentage, higherIsBetter: true },
    { label: "3PT", home: `${homeStats.threePointsMade}/${homeStats.threePointsAttempted}`, away: `${awayStats.threePointsMade}/${awayStats.threePointsAttempted}` },
    { label: "3PT%", home: homeStats.threePointPercentage, away: awayStats.threePointPercentage, higherIsBetter: true },
    { label: "FT", home: `${homeStats.freeThrowsMade}/${homeStats.freeThrowsAttempted}`, away: `${awayStats.freeThrowsMade}/${awayStats.freeThrowsAttempted}` },
    { label: "FT%", home: homeStats.freeThrowPercentage, away: awayStats.freeThrowPercentage, higherIsBetter: true },
    { label: "REB", home: homeStats.totalRebounds, away: awayStats.totalRebounds, higherIsBetter: true },
    { label: "OREB", home: homeStats.offensiveRebounds, away: awayStats.offensiveRebounds, higherIsBetter: true },
    { label: "AST", home: homeStats.assists, away: awayStats.assists, higherIsBetter: true },
    { label: "STL", home: homeStats.steals, away: awayStats.steals, higherIsBetter: true },
    { label: "BLK", home: homeStats.blockedShots, away: awayStats.blockedShots, higherIsBetter: true },
    { label: "TO", home: homeStats.turnovers, away: awayStats.turnovers, higherIsBetter: false },
    { label: "FOULS", home: homeStats.personalFouls, away: awayStats.personalFouls, higherIsBetter: false },
  ];

  return (
    <div>
      {/* Column headers */}
      <div className="flex items-center text-[10px] text-slate-500 font-bold uppercase mb-2">
        <span className="flex-1 text-left">{homeTeam.nameShort}</span>
        <span className="w-16 text-center">Stat</span>
        <span className="flex-1 text-right">{awayTeam.nameShort}</span>
      </div>

      <div className="space-y-0.5">
        {rows.map((row) => {
          const hVal = parseFloat(row.home);
          const aVal = parseFloat(row.away);
          const homeWins = row.higherIsBetter !== undefined
            ? (row.higherIsBetter ? hVal > aVal : hVal < aVal)
            : false;
          const awayWins = row.higherIsBetter !== undefined
            ? (row.higherIsBetter ? aVal > hVal : aVal < hVal)
            : false;

          return (
            <div key={row.label} className="flex items-center py-1.5 border-b border-[#334155]/50">
              <span className={`flex-1 text-left text-sm font-mono ${homeWins ? "text-white font-bold" : "text-slate-400"}`}>
                {row.home}
              </span>
              <span className="w-16 text-center text-[10px] text-slate-500 font-semibold uppercase">
                {row.label}
              </span>
              <span className={`flex-1 text-right text-sm font-mono ${awayWins ? "text-white font-bold" : "text-slate-400"}`}>
                {row.away}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Player Stats Table ----
function PlayerStatsTable({ players, teamColor }: { players: Player[]; teamColor?: string }) {
  if (players.length === 0) {
    return <div className="text-center text-slate-500 py-6">Player stats not available</div>;
  }

  const starters = players.filter((p) => p.starter);
  const bench = players.filter((p) => !p.starter && parseInt(p.minutesPlayed) > 0);

  return (
    <div className="overflow-x-auto -mx-4">
      <table className="w-full text-[11px] min-w-[480px]">
        <thead>
          <tr className="text-slate-500 uppercase text-[9px]">
            <th className="text-left px-3 py-1.5 sticky left-0 bg-[#1e293b]">Player</th>
            <th className="px-1.5 py-1.5 text-center">MIN</th>
            <th className="px-1.5 py-1.5 text-center">PTS</th>
            <th className="px-1.5 py-1.5 text-center">FG</th>
            <th className="px-1.5 py-1.5 text-center">3PT</th>
            <th className="px-1.5 py-1.5 text-center">FT</th>
            <th className="px-1.5 py-1.5 text-center">REB</th>
            <th className="px-1.5 py-1.5 text-center">AST</th>
            <th className="px-1.5 py-1.5 text-center">STL</th>
            <th className="px-1.5 py-1.5 text-center">BLK</th>
            <th className="px-1.5 py-1.5 text-center">TO</th>
          </tr>
        </thead>
        <tbody>
          {starters.length > 0 && (
            <>
              <tr>
                <td colSpan={11} className="px-3 py-1 text-[9px] text-slate-600 uppercase font-bold" style={{ borderLeft: `3px solid ${teamColor || "#3b82f6"}` }}>
                  Starters
                </td>
              </tr>
              {starters.map((p, i) => (
                <PlayerRow key={i} player={p} />
              ))}
            </>
          )}
          {bench.length > 0 && (
            <>
              <tr>
                <td colSpan={11} className="px-3 py-1 text-[9px] text-slate-600 uppercase font-bold" style={{ borderLeft: `3px solid ${teamColor || "#3b82f6"}44` }}>
                  Bench
                </td>
              </tr>
              {bench.map((p, i) => (
                <PlayerRow key={i} player={p} />
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PlayerRow({ player: p }: { player: Player }) {
  const pts = parseInt(p.points) || 0;
  return (
    <tr className="border-b border-[#334155]/30 hover:bg-[#334155]/20">
      <td className="px-3 py-1.5 sticky left-0 bg-[#1e293b] whitespace-nowrap">
        <span className="text-slate-500 mr-1">#{p.number}</span>
        <span className={pts >= 15 ? "font-bold text-white" : ""}>
          {p.firstName?.[0]}. {p.lastName}
        </span>
        <span className="text-slate-600 ml-1 text-[9px]">{p.position}</span>
      </td>
      <td className="px-1.5 py-1.5 text-center text-slate-500">{p.minutesPlayed}</td>
      <td className={`px-1.5 py-1.5 text-center font-bold ${pts >= 20 ? "text-yellow-400" : pts >= 15 ? "text-white" : ""}`}>{p.points}</td>
      <td className="px-1.5 py-1.5 text-center text-slate-400">{p.fieldGoalsMade}-{p.fieldGoalsAttempted}</td>
      <td className="px-1.5 py-1.5 text-center text-slate-400">{p.threePointsMade}-{p.threePointsAttempted}</td>
      <td className="px-1.5 py-1.5 text-center text-slate-400">{p.freeThrowsMade}-{p.freeThrowsAttempted}</td>
      <td className={`px-1.5 py-1.5 text-center ${parseInt(p.totalRebounds) >= 8 ? "text-white font-bold" : "text-slate-400"}`}>{p.totalRebounds}</td>
      <td className={`px-1.5 py-1.5 text-center ${parseInt(p.assists) >= 5 ? "text-white font-bold" : "text-slate-400"}`}>{p.assists}</td>
      <td className="px-1.5 py-1.5 text-center text-slate-400">{p.steals}</td>
      <td className="px-1.5 py-1.5 text-center text-slate-400">{p.blockedShots}</td>
      <td className="px-1.5 py-1.5 text-center text-slate-400">{p.turnovers}</td>
    </tr>
  );
}
