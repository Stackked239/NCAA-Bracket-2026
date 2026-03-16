"use client";

import { useState } from "react";
import { useAuth, useLeaderboard, useGames, usePicks, useMessages, useUpsetAlerts } from "@/lib/hooks";
import { ROUND_NAMES } from "@/lib/types";
import LoginScreen from "@/components/LoginScreen";
import Nav from "@/components/Nav";
import BracketView from "@/components/BracketView";
import UpsetAlerts from "@/components/UpsetAlerts";
import TrashTalkFeed from "@/components/TrashTalkFeed";

export default function LeaderboardClient() {
  const auth = useAuth();
  const { entries, loading } = useLeaderboard();
  const { games } = useGames();
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const { picks: viewPicks } = usePicks(viewingUserId || undefined);
  const { messages, sendMessage } = useMessages();
  const upsetAlerts = useUpsetAlerts(games);

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

  return (
    <div className="min-h-screen">
      <Nav currentUser={auth.currentUser} onLogout={auth.logout} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        {viewingUserId && viewingEntry ? (
          <div>
            <button
              onClick={() => setViewingUserId(null)}
              className="text-blue-400 hover:text-blue-300 text-sm mb-4 flex items-center gap-1"
            >
              ← Back to Leaderboard
            </button>
            <BracketView
              games={games}
              picks={viewPicks}
              viewOnly
              userName={viewingEntry.user.name}
            />
          </div>
        ) : (
          <>
            <UpsetAlerts alerts={upsetAlerts} />
            <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>

            {loading ? (
              <div className="text-slate-400">Loading...</div>
            ) : entries.length === 0 ? (
              <div className="text-slate-400">No brackets filled out yet.</div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry, idx) => (
                  <div
                    key={entry.user.id}
                    className="bg-[#1e293b] rounded-xl border border-[#334155] p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            idx === 0
                              ? "bg-yellow-500 text-black"
                              : idx === 1
                              ? "bg-slate-300 text-black"
                              : idx === 2
                              ? "bg-orange-600 text-white"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <button
                            onClick={() => setViewingUserId(entry.user.id)}
                            className="font-semibold hover:text-blue-400 transition-colors"
                          >
                            {entry.user.name}
                            {entry.user.is_admin && (
                              <span className="ml-1 text-yellow-500 text-xs">★</span>
                            )}
                          </button>
                          <div className="text-xs text-slate-500">
                            {entry.correct_picks} correct · {entry.total_picks} picks made
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{entry.total_points}</div>
                        <div className="text-xs text-slate-500">
                          max: {entry.max_possible} pts
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center">
                      {[0, 1, 2, 3, 4, 5, 6].map((round) => {
                        const rd = entry.picks_by_round[round];
                        return (
                          <div key={round} className="bg-[#0f172a] rounded p-1.5">
                            <div className="text-[9px] text-slate-500 truncate">
                              {ROUND_NAMES[round]?.replace("Round of ", "R")}
                            </div>
                            <div className="text-sm font-bold">
                              {rd?.correct || 0}
                            </div>
                            <div className="text-[9px] text-slate-600">
                              /{rd?.total || 0}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <TrashTalkFeed
        messages={messages}
        currentUser={auth.currentUser}
        games={games}
        onSend={sendMessage}
      />
    </div>
  );
}
