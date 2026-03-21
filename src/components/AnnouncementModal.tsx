"use client";

import { useState } from "react";
import { LeaderboardEntry } from "@/lib/types";
import { getTeamLogoUrl } from "@/lib/team-logos";
import { IconTrophy, IconX, IconBasketball, IconChevronRight, IconChevronLeft, IconFlame, IconTarget, IconCrown, IconChat, IconCheck } from "./Icons";
import Image from "next/image";

const DISMISSED_KEY = "ncaa_announcement_v2_dismissed";

function isDismissed(): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage?.getItem(DISMISSED_KEY) === "true";
  } catch { return false; }
}

function setDismissed() {
  try {
    if (typeof window !== "undefined") window.localStorage?.setItem(DISMISSED_KEY, "true");
  } catch {}
}

interface AnnouncementModalProps {
  leader: LeaderboardEntry | null;
}

export default function AnnouncementModal({ leader }: AnnouncementModalProps) {
  const [open, setOpen] = useState(() => !isDismissed());
  const [page, setPage] = useState<"welcome" | "features">("welcome");

  if (!open) return null;

  const handleClose = () => {
    setDismissed();
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-[#1e293b] border border-[#334155] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 text-slate-500 hover:text-white transition-colors"
        >
          <IconX size={20} />
        </button>

        {page === "welcome" ? (
          <WelcomePage leader={leader} onNext={() => setPage("features")} onClose={handleClose} />
        ) : (
          <FeaturesPage onBack={() => setPage("welcome")} onClose={handleClose} />
        )}
      </div>
    </div>
  );
}

function WelcomePage({
  leader,
  onNext,
  onClose,
}: {
  leader: LeaderboardEntry | null;
  onNext: () => void;
  onClose: () => void;
}) {
  const champLogo = leader?.championship_pick ? getTeamLogoUrl(leader.championship_pick) : null;

  return (
    <div>
      {/* Hero gradient header */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 pt-8 pb-6 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-6"><IconBasketball size={40} className="text-white" /></div>
          <div className="absolute bottom-4 right-8"><IconBasketball size={32} className="text-white" /></div>
          <div className="absolute top-8 right-20"><IconBasketball size={24} className="text-white" /></div>
        </div>
        <div className="relative">
          <div className="text-blue-200 text-sm font-medium uppercase tracking-wider mb-2">
            March Madness 2026
          </div>
          <h2 className="text-2xl font-black text-white mb-1">
            Welcome to the Second Round
          </h2>
          <p className="text-blue-200 text-sm">
            32 teams remain. The stakes are higher.
          </p>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Current leader */}
        {leader && (
          <div className="rounded-xl bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <IconCrown size={18} className="text-yellow-400" />
              <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                Current Leader
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-lg font-black text-black">
                  1
                </div>
                <div>
                  <div className="font-bold text-lg">{leader.user.name}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{leader.correct_picks}W-{leader.incorrect_picks}L</span>
                    <span className="text-slate-600">|</span>
                    <span>{leader.accuracy}% accuracy</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-yellow-400">{leader.total_points}</div>
                <div className="text-[10px] text-slate-500">points</div>
              </div>
            </div>
            {champLogo && leader.championship_pick && (
              <div className="mt-3 pt-3 border-t border-yellow-500/10 flex items-center gap-2 text-xs text-slate-400">
                <span>Champion pick:</span>
                <Image src={champLogo} alt="" width={14} height={14} className="object-contain" unoptimized />
                <span className="font-medium text-slate-300">{leader.championship_pick}</span>
              </div>
            )}
          </div>
        )}

        {/* Prize reminder */}
        <div className="rounded-xl bg-[#0f172a] border border-[#334155] p-4 flex items-start gap-3">
          <IconTrophy size={24} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold mb-1">Don&apos;t forget the prize</div>
            <p className="text-sm text-slate-400 leading-relaxed">
              The winner receives an <span className="text-white font-semibold">all-expenses-paid fishing trip to Depot Bay</span>. Good luck to everyone!
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <button
            onClick={onNext}
            className="w-full py-3 rounded-xl bg-[#0f172a] border border-[#334155] hover:border-blue-500/40 text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            See what&apos;s new in the app
            <IconChevronRight size={16} />
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-bold text-white transition-colors"
          >
            Let&apos;s Go
          </button>
        </div>
      </div>
    </div>
  );
}

const NEW_FEATURES = [
  {
    icon: <IconBasketball size={20} className="text-orange-400" />,
    title: "Live Score Integration",
    description: "Real-time scores, game clocks, TV networks, and start times powered by the official NCAA API.",
  },
  {
    icon: <IconTarget size={20} className="text-blue-400" />,
    title: "Game Detail Pages",
    description: "Tap any game to see full box scores, player stats, team shooting splits, and more.",
  },
  {
    icon: <IconCrown size={20} className="text-yellow-400" />,
    title: "Enhanced Leaderboard",
    description: "Championship pick logos, W-L records, accuracy %, upset tracking, and PDF export.",
  },
  {
    icon: <IconFlame size={20} className="text-orange-400" />,
    title: "Trash Talk with @Mentions",
    description: "Type @ to mention a family member. They'll get a notification when you call them out.",
  },
  {
    icon: <IconChat size={20} className="text-purple-400" />,
    title: "Pick Distribution",
    description: "See what percentage of the family picked each team on every game card.",
  },
];

function FeaturesPage({
  onBack,
  onClose,
}: {
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <div>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-[#334155]">
        <button onClick={onBack} className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-3">
          <IconChevronLeft size={14} /> Back
        </button>
        <h2 className="text-xl font-bold">What&apos;s New</h2>
        <p className="text-sm text-slate-400 mt-1">
          We&apos;ve been busy upgrading the bracket experience.
        </p>
      </div>

      {/* Feature list */}
      <div className="px-6 py-4 space-y-4 max-h-[50vh] overflow-y-auto">
        {NEW_FEATURES.map((feature, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f172a] border border-[#334155] flex items-center justify-center shrink-0">
              {feature.icon}
            </div>
            <div>
              <div className="text-sm font-semibold">{feature.title}</div>
              <div className="text-xs text-slate-400 leading-relaxed mt-0.5">
                {feature.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Close button */}
      <div className="px-6 py-4 border-t border-[#334155]">
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-bold text-white transition-colors"
        >
          Got it, let&apos;s go
        </button>
      </div>
    </div>
  );
}
