"use client";

import { useAuth, useGames, usePicks, useScorePolling, useMessages, useUpsetAlerts } from "@/lib/hooks";
import LoginScreen from "@/components/LoginScreen";
import Nav from "@/components/Nav";
import BracketView from "@/components/BracketView";
import UpsetAlerts from "@/components/UpsetAlerts";
import TrashTalkFeed from "@/components/TrashTalkFeed";

export default function HomeClient() {
  const auth = useAuth();
  const { games, loading: gamesLoading } = useGames();
  const { picks, loading: picksLoading, makePick } = usePicks(auth.currentUser?.id);
  const { messages, sendMessage } = useMessages();
  const upsetAlerts = useUpsetAlerts(games);
  useScorePolling(60000);

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

  return (
    <div className="min-h-screen">
      <Nav currentUser={auth.currentUser} onLogout={auth.logout} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <UpsetAlerts alerts={upsetAlerts} />
        {gamesLoading || picksLoading ? (
          <div className="text-slate-400">Loading bracket...</div>
        ) : (
          <BracketView
            games={games}
            picks={picks}
            onPick={makePick}
            userName={auth.currentUser.name}
          />
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
