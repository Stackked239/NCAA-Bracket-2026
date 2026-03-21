"use client";

import { useState } from "react";
import { useAuth, useGames, usePicks, useScorePolling, useMessages, useUpsetAlerts, useLiveGames, useMergedGames, usePickDistribution, useEliminatedTeams, useLeaderboard } from "@/lib/hooks";
import { Game, BRACKET_LOCK_TIME } from "@/lib/types";
import LoginScreen from "@/components/LoginScreen";
import Nav from "@/components/Nav";
import BracketView from "@/components/BracketView";
import BracketWizard from "@/components/BracketWizard";
import UpsetAlerts from "@/components/UpsetAlerts";
import TrashTalkFeed from "@/components/TrashTalkFeed";
import GameDetailModal from "@/components/GameDetailModal";
import AnnouncementModal from "@/components/AnnouncementModal";
import TodayTicker from "@/components/TodayTicker";
import ScoreTicker from "@/components/ScoreTicker";

export default function HomeClient() {
  const auth = useAuth();
  const { games: rawGames, loading: gamesLoading } = useGames();
  const { picks, loading: picksLoading, makePick, refetch: refetchPicks } = usePicks(auth.currentUser?.id);
  const { messages, sendMessage } = useMessages();
  const liveData = useLiveGames();
  const games = useMergedGames(rawGames, liveData);
  const upsetAlerts = useUpsetAlerts(games);
  const eliminatedTeams = useEliminatedTeams(games);
  const pickDistribution = usePickDistribution();
  const { entries: leaderboardEntries } = useLeaderboard();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  useScorePolling(120000); // DB updates every 2 minutes (live data via /api/live every 30s)

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

  const locked = new Date() >= BRACKET_LOCK_TIME;
  const totalGames = games.length;
  const pickedCount = picks.length;

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <Nav currentUser={auth.currentUser} onLogout={auth.logout} />
      <ScoreTicker games={games} liveData={liveData} />
      <TodayTicker games={games} liveData={liveData} onGameClick={setSelectedGame} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <UpsetAlerts alerts={upsetAlerts} />

        {/* Wizard CTA — prominent on mobile when bracket isn't complete */}
        {!locked && !gamesLoading && !picksLoading && pickedCount < totalGames && (
          <button
            onClick={() => setWizardOpen(true)}
            className="w-full mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] transition-all shadow-lg shadow-blue-600/20"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="text-lg font-bold">
                  {pickedCount === 0 ? "Fill Out Your Bracket" : "Continue Your Bracket"}
                </div>
                <div className="text-sm text-blue-200 mt-0.5">
                  {pickedCount === 0
                    ? "Tap to pick your way through each round"
                    : `${pickedCount}/${totalGames} picks made — keep going!`}
                </div>
              </div>
              <div className="text-3xl">→</div>
            </div>
            {pickedCount > 0 && (
              <div className="mt-3 w-full h-2 bg-blue-800/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/30 rounded-full transition-all"
                  style={{ width: `${(pickedCount / totalGames) * 100}%` }}
                />
              </div>
            )}
          </button>
        )}

        {gamesLoading || picksLoading ? (
          <div className="text-slate-400">Loading bracket...</div>
        ) : (
          <BracketView
            games={games}
            picks={picks}
            onPick={makePick}
            userName={auth.currentUser.name}
            liveData={liveData}
            onGameClick={setSelectedGame}
            eliminatedTeams={eliminatedTeams}
            pickDistribution={pickDistribution}
          />
        )}
      </main>

      {/* Bracket Wizard overlay */}
      {wizardOpen && (
        <BracketWizard
          games={games}
          picks={picks}
          onPick={makePick}
          onClose={() => {
            setWizardOpen(false);
            refetchPicks();
          }}
        />
      )}

      {/* Game Detail Modal */}
      {selectedGame && (
        <GameDetailModal
          game={selectedGame}
          liveInfo={liveData[selectedGame.id]}
          onClose={() => setSelectedGame(null)}
        />
      )}

      <TrashTalkFeed
        messages={messages}
        currentUser={auth.currentUser}
        allUsers={auth.users}
        games={games}
        onSend={sendMessage}
      />

      {/* Second Round Announcement */}
      <AnnouncementModal leader={leaderboardEntries[0] || null} />
    </div>
  );
}
