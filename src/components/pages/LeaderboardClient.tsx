"use client";

import { useState, useRef, useCallback } from "react";
import { useAuth, useLeaderboard, useGames, usePicks, useMessages, useUpsetAlerts, useLiveGames, useMergedGames } from "@/lib/hooks";
import { LeaderboardEntry, ROUND_NAMES } from "@/lib/types";
import { getTeamLogoUrl } from "@/lib/team-logos";
import LoginScreen from "@/components/LoginScreen";
import Nav from "@/components/Nav";
import BracketView from "@/components/BracketView";
import UpsetAlerts from "@/components/UpsetAlerts";
import TrashTalkFeed from "@/components/TrashTalkFeed";
import PicksSummary from "@/components/PicksSummary";
import Image from "next/image";
import { IconCrown, IconChevronLeft, IconChevronDown, IconTarget, IconCrystalBall, IconTrendingUp, IconDownload, IconCheck, IconTrophy, IconX } from "@/components/Icons";

export default function LeaderboardClient() {
  const auth = useAuth();
  const { entries, loading } = useLeaderboard();
  const { games: rawGames } = useGames();
  const liveData = useLiveGames();
  const games = useMergedGames(rawGames, liveData);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const { picks: viewPicks } = usePicks(viewingUserId || undefined);
  const { messages, sendMessage, reactToMessage } = useMessages();
  const upsetAlerts = useUpsetAlerts(games);
  const leaderboardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = useCallback(async () => {
    if (!leaderboardRef.current || exporting) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(leaderboardRef.current, {
        backgroundColor: "#0f172a",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", imgHeight > 297 ? [imgWidth, imgHeight] : "a4");

      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save("leaderboard-2026.pdf");
    } catch (e) {
      console.error("PDF export failed:", e);
    }
    setExporting(false);
  }, [exporting]);

  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!auth.currentUser) {
    return (
      <LoginScreen
        users={auth.users}
        onLogin={auth.login}
        onCreateUser={auth.createUser}
      />
    );
  }

  const viewingEntry = viewingUserId
    ? entries.find((e) => e.user.id === viewingUserId)
    : null;

  const leader = entries[0];

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <Nav currentUser={auth.currentUser} onLogout={auth.logout} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        {viewingUserId && viewingEntry ? (
          <div>
            <button
              onClick={() => setViewingUserId(null)}
              className="text-blue-400 hover:text-blue-300 text-sm mb-4 flex items-center gap-1"
            >
              <IconChevronLeft size={16} /> Back to Leaderboard
            </button>
            {/* Mobile: compact picks summary */}
            <div className="xl:hidden">
              <PicksSummary
                games={games}
                picks={viewPicks}
                userName={viewingEntry.user.name}
              />
            </div>
            {/* Desktop: full bracket view */}
            <div className="hidden xl:block">
              <BracketView
                games={games}
                picks={viewPicks}
                viewOnly
                userName={viewingEntry.user.name}
                liveData={liveData}
              />
            </div>
          </div>
        ) : (
          <>
            <UpsetAlerts alerts={upsetAlerts} />

            {/* Page header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold">Leaderboard</h1>
                <p className="text-slate-400 text-sm mt-1">Warren Family Bracket Challenge 2026</p>
              </div>
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e293b] border border-[#334155] hover:border-blue-500/40 text-sm text-slate-300 hover:text-white transition-colors disabled:opacity-50"
              >
                {exporting ? (
                  <>
                    <span className="animate-spin"><IconDownload size={16} /></span>
                    Exporting...
                  </>
                ) : (
                  <>
                    <IconDownload size={16} />
                    Export PDF
                  </>
                )}
              </button>
            </div>

            {loading ? (
              <div className="text-slate-400">Loading...</div>
            ) : entries.length === 0 ? (
              <div className="text-slate-400">No brackets filled out yet.</div>
            ) : (
              <div ref={leaderboardRef} className="space-y-6">
                {/* ---- Leader Spotlight ---- */}
                {leader && <LeaderSpotlight entry={leader} onViewBracket={setViewingUserId} />}

                {/* ---- Stats Overview ---- */}
                <StatsOverview entries={entries} />

                {/* ---- Full Rankings ---- */}
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-slate-300">Full Rankings</h2>
                  {entries.map((entry, idx) => (
                    <RankCard
                      key={entry.user.id}
                      entry={entry}
                      rank={idx + 1}
                      pointsBack={leader.total_points - entry.total_points}
                      onViewBracket={() => setViewingUserId(entry.user.id)}
                      isCurrentUser={entry.user.id === auth.currentUser?.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <TrashTalkFeed
        messages={messages}
        currentUser={auth.currentUser}
        allUsers={auth.users}
        games={games}
        onSend={sendMessage}
        onReact={reactToMessage}
      />
    </div>
  );
}

// ---- Leader Spotlight ----
function LeaderSpotlight({
  entry,
  onViewBracket,
}: {
  entry: LeaderboardEntry;
  onViewBracket: (id: string) => void;
}) {
  const champLogo = getTeamLogoUrl(entry.championship_pick);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500/10 via-[#1e293b] to-yellow-500/5 border border-yellow-500/20 p-6">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/5 rounded-full blur-3xl" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Crown + Avatar */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-3xl font-black text-black shadow-lg shadow-yellow-500/25">
            1
          </div>
          <span className="absolute -top-3 -right-2"><IconCrown size={22} className="text-yellow-400" /></span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl font-bold">{entry.user.name}</span>
            {champLogo && entry.championship_pick && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 border border-[#334155] text-[11px] text-slate-400">
                <Image src={champLogo} alt="" width={14} height={14} className="object-contain" unoptimized />
                {entry.championship_pick}
                {entry.championship_alive ? (
                  <IconCheck size={12} className="text-green-400" />
                ) : (
                  <IconX size={12} className="text-red-400" />
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1.5 text-sm">
            <span className="text-slate-400">
              <span className="text-green-400 font-bold">{entry.correct_picks}W</span>
              {" "}-{" "}
              <span className="text-red-400 font-bold">{entry.incorrect_picks}L</span>
              {entry.pending_picks > 0 && (
                <>
                  {" "}-{" "}
                  <span className="text-yellow-400 font-bold">{entry.pending_picks}P</span>
                </>
              )}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">{entry.accuracy}% accuracy</span>
            {entry.upset_picks_correct > 0 && (
              <>
                <span className="text-slate-500">|</span>
                <span className="text-orange-400">{entry.upset_picks_correct} upset{entry.upset_picks_correct !== 1 ? "s" : ""} called</span>
              </>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-4xl font-black text-yellow-400">{entry.total_points}</div>
          <div className="text-xs text-slate-500">pts · max {entry.max_possible}</div>
          <button
            onClick={() => onViewBracket(entry.user.id)}
            className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            View bracket →
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Stats Overview Cards ----
function StatsOverview({ entries }: { entries: LeaderboardEntry[] }) {
  // Find interesting stats
  const bestAccuracy = [...entries].sort((a, b) => b.accuracy - a.accuracy)[0];
  const mostUpsets = [...entries].sort((a, b) => b.upset_picks_correct - a.upset_picks_correct)[0];
  const highestCeiling = [...entries].sort((a, b) => b.max_possible - a.max_possible)[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <MiniStatCard
        label="Best Accuracy"
        value={`${bestAccuracy.accuracy}%`}
        sub={bestAccuracy.user.name}
        icon={<IconTarget size={20} className="text-blue-400" />}
      />
      <MiniStatCard
        label="Most Upsets Called"
        value={`${mostUpsets.upset_picks_correct}`}
        sub={mostUpsets.user.name}
        icon={<IconCrystalBall size={20} className="text-purple-400" />}
      />
      <MiniStatCard
        label="Highest Ceiling"
        value={`${highestCeiling.max_possible} pts`}
        sub={highestCeiling.user.name}
        icon={<IconTrendingUp size={20} className="text-green-400" />}
      />
    </div>
  );
}

function MiniStatCard({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: React.ReactNode }) {
  return (
    <div className="bg-[#1e293b] rounded-xl border border-[#334155] px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="shrink-0">{icon}</span>
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
          <div className="text-lg font-bold">{value}</div>
          <div className="text-xs text-slate-400">{sub}</div>
        </div>
      </div>
    </div>
  );
}

// ---- Rank Card ----
function RankCard({
  entry,
  rank,
  pointsBack,
  onViewBracket,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  rank: number;
  pointsBack: number;
  onViewBracket: () => void;
  isCurrentUser: boolean;
}) {
  const champLogo = getTeamLogoUrl(entry.championship_pick);

  const rankBadge =
    rank === 1
      ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-lg shadow-yellow-500/20"
      : rank === 2
      ? "bg-gradient-to-br from-slate-300 to-slate-400 text-black"
      : rank === 3
      ? "bg-gradient-to-br from-orange-500 to-orange-700 text-white"
      : "bg-slate-700 text-slate-300";

  // Points bar: proportion of leader's points
  const maxPoints = entry.total_points + pointsBack;
  const barWidth = maxPoints > 0 ? (entry.total_points / maxPoints) * 100 : 0;

  return (
    <div
      className={`rounded-xl border p-4 transition-colors cursor-pointer hover:border-blue-500/30 ${
        isCurrentUser
          ? "bg-blue-500/5 border-blue-500/20"
          : "bg-[#1e293b] border-[#334155]"
      }`}
      onClick={onViewBracket}
    >
      <div className="flex items-center gap-3">
        {/* Rank badge */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${rankBadge}`}
        >
          {rank}
        </div>

        {/* Name + championship pick */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold truncate ${isCurrentUser ? "text-blue-400" : ""}`}>
              {entry.user.name}
            </span>
            {isCurrentUser && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium uppercase">You</span>
            )}
            {champLogo && entry.championship_pick && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Image src={champLogo} alt="" width={14} height={14} className="object-contain" unoptimized />
                <span className={entry.championship_alive ? "" : "line-through text-slate-600"}>
                  {entry.championship_pick}
                </span>
                {!entry.championship_alive && <span className="text-red-500 text-[9px]">OUT</span>}
              </span>
            )}
          </div>

          {/* Record + accuracy */}
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
            <span>
              <span className="text-green-400">{entry.correct_picks}W</span>
              -
              <span className="text-red-400">{entry.incorrect_picks}L</span>
              {entry.pending_picks > 0 && (
                <>-<span className="text-yellow-400">{entry.pending_picks}P</span></>
              )}
            </span>
            <span className="text-slate-600">·</span>
            <span>{entry.accuracy}%</span>
            {entry.upset_picks_correct > 0 && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-orange-400">{entry.upset_picks_correct} upset{entry.upset_picks_correct !== 1 ? "s" : ""}</span>
              </>
            )}
            {pointsBack > 0 && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-slate-500">-{pointsBack} pts</span>
              </>
            )}
          </div>
        </div>

        {/* Points */}
        <div className="text-right shrink-0">
          <div className={`text-2xl font-black ${rank === 1 ? "text-yellow-400" : ""}`}>
            {entry.total_points}
          </div>
          <div className="text-[10px] text-slate-600">max {entry.max_possible}</div>
        </div>
      </div>

      {/* Points progress bar */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-[#0f172a] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              rank === 1
                ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                : isCurrentUser
                ? "bg-blue-500"
                : "bg-slate-600"
            }`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>

      {/* Round breakdown */}
      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {[0, 1, 2, 3, 4, 5, 6].map((round) => {
          const rd = entry.picks_by_round[round];
          const correct = rd?.correct || 0;
          const total = rd?.total || 0;
          const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

          return (
            <div key={round} className="bg-[#0f172a] rounded-lg p-1.5 relative overflow-hidden">
              {/* Fill bar background */}
              <div
                className="absolute inset-0 bg-green-500/10 transition-all"
                style={{ height: `${pct}%`, top: `${100 - pct}%` }}
              />
              <div className="relative">
                <div className="text-[9px] text-slate-500 truncate font-medium">
                  {ROUND_NAMES[round]?.replace("Round of ", "R").replace("Elite ", "E").replace("Sweet ", "S").replace("First ", "").replace("Championship", "Champ")}
                </div>
                <div className="text-sm font-bold mt-0.5">
                  {correct}<span className="text-slate-600 font-normal">/{total}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
