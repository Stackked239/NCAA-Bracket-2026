"use client";

import { useState } from "react";
import { useAuth, useGames } from "@/lib/hooks";
import { Game } from "@/lib/types";
import LoginScreen from "@/components/LoginScreen";
import Nav from "@/components/Nav";

export default function AdminClient() {
  const auth = useAuth();
  const { games, refetch: refetchGames } = useGames();
  const [newMemberName, setNewMemberName] = useState("");
  const [status, setStatus] = useState("");
  const [scoreStatus, setScoreStatus] = useState("");

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

  if (!auth.currentUser.is_admin) {
    return (
      <div className="min-h-screen">
        <Nav currentUser={auth.currentUser} onLogout={auth.logout} />
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-red-400">Admin access required.</div>
        </main>
      </div>
    );
  }

  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;
    try {
      await auth.createUser(newMemberName.trim());
      setNewMemberName("");
      setStatus(`Added ${newMemberName.trim()}`);
      auth.refreshUsers();
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : "Error");
    }
  };

  const handleRemoveMember = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} and all their picks?`)) return;
    try {
      await auth.removeUser(id);
      setStatus(`Removed ${name}`);
      auth.refreshUsers();
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : "Error");
    }
  };

  const handleFetchScores = async () => {
    setScoreStatus("Fetching scores from NCAA API...");
    try {
      const res = await fetch("/api/scores", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setScoreStatus(`Error: ${data.error}`);
      } else {
        setScoreStatus(
          `Updated ${data.updated_games} game(s) from ${data.ncaa_games} NCAA API events`
        );
        refetchGames();
      }
    } catch {
      setScoreStatus("Failed to fetch scores");
    }
  };

  const handleSetWinner = async (gameId: string, winner: string) => {
    try {
      await fetch("/api/games", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: gameId, winner, status: "final" }),
      });
      refetchGames();
    } catch (e) {
      console.error(e);
    }
  };

  const liveGames = games.filter((g) => g.status === "in_progress");
  const pregameGames = games.filter(
    (g) => g.status === "pregame" && g.team_a_name && g.team_b_name
  );

  return (
    <div className="min-h-screen">
      <Nav currentUser={auth.currentUser} onLogout={auth.logout} />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        <h1 className="text-2xl font-bold">Admin Panel</h1>

        <section className="bg-[#1e293b] rounded-xl border border-[#334155] p-6">
          <h2 className="text-lg font-semibold mb-4">Family Members</h2>
          <div className="space-y-2 mb-4">
            {auth.users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between bg-[#0f172a] rounded-lg px-4 py-2"
              >
                <span>
                  {u.name}
                  {u.is_admin && (
                    <span className="ml-2 text-xs text-yellow-500">Admin</span>
                  )}
                </span>
                {!u.is_admin && (
                  <button
                    onClick={() => handleRemoveMember(u.id, u.name)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
              placeholder="New member name"
              className="flex-1 px-3 py-2 rounded-lg bg-[#0f172a] border border-[#334155] focus:border-blue-500 focus:outline-none text-sm"
            />
            <button
              onClick={handleAddMember}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium"
            >
              Add
            </button>
          </div>
          {status && <p className="text-sm text-slate-400 mt-2">{status}</p>}
        </section>

        <section className="bg-[#1e293b] rounded-xl border border-[#334155] p-6">
          <h2 className="text-lg font-semibold mb-4">Score Management</h2>
          <button
            onClick={handleFetchScores}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-sm font-medium"
          >
            Fetch Live Scores from NCAA
          </button>
          {scoreStatus && <p className="text-sm text-slate-400 mt-2">{scoreStatus}</p>}

          {liveGames.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-yellow-400 mb-2">
                Live Games ({liveGames.length})
              </h3>
              {liveGames.map((g) => (
                <GameRow key={g.id} game={g} onSetWinner={handleSetWinner} />
              ))}
            </div>
          )}

          <div className="mt-4">
            <h3 className="text-sm font-medium text-slate-400 mb-2">
              Manual Winner Override
            </h3>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {pregameGames.slice(0, 20).map((g) => (
                <GameRow key={g.id} game={g} onSetWinner={handleSetWinner} />
              ))}
            </div>
            {pregameGames.length > 20 && (
              <p className="text-xs text-slate-500 mt-1">
                ...and {pregameGames.length - 20} more
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function GameRow({
  game,
  onSetWinner,
}: {
  game: Game;
  onSetWinner: (id: string, winner: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-[#0f172a] rounded px-3 py-1.5 text-sm">
      <span className="text-xs text-slate-500 w-24 shrink-0 truncate">{game.id}</span>
      <button
        onClick={() => game.team_a_name && onSetWinner(game.id, game.team_a_name)}
        className="px-2 py-0.5 rounded bg-slate-700 hover:bg-green-600/30 text-xs truncate max-w-[120px]"
      >
        ({game.team_a_seed}) {game.team_a_name}
      </button>
      <span className="text-slate-600 text-xs">vs</span>
      <button
        onClick={() => game.team_b_name && onSetWinner(game.id, game.team_b_name)}
        className="px-2 py-0.5 rounded bg-slate-700 hover:bg-green-600/30 text-xs truncate max-w-[120px]"
      >
        ({game.team_b_seed}) {game.team_b_name}
      </button>
    </div>
  );
}
