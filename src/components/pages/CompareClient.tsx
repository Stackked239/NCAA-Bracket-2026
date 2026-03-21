"use client";

import { useState, useEffect } from "react";
import { useAuth, useGames } from "@/lib/hooks";
import { Pick } from "@/lib/types";
import LoginScreen from "@/components/LoginScreen";
import Nav from "@/components/Nav";

export default function CompareClient() {
  const auth = useAuth();
  const { games } = useGames();
  const [userA, setUserA] = useState<string>("");
  const [userB, setUserB] = useState<string>("");
  const [picksA, setPicksA] = useState<Pick[]>([]);
  const [picksB, setPicksB] = useState<Pick[]>([]);

  useEffect(() => {
    if (userA) {
      fetch(`/api/picks?userId=${userA}`)
        .then((r) => r.json())
        .then(setPicksA);
    }
  }, [userA]);

  useEffect(() => {
    if (userB) {
      fetch(`/api/picks?userId=${userB}`)
        .then((r) => r.json())
        .then(setPicksB);
    }
  }, [userB]);

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

  const pickMapA = new Map(picksA.map((p) => [p.game_id, p]));
  const pickMapB = new Map(picksB.map((p) => [p.game_id, p]));

  const diffGames = games.filter((g) => {
    const pA = pickMapA.get(g.id);
    const pB = pickMapB.get(g.id);
    if (!pA && !pB) return false;
    if (!pA || !pB) return true;
    return pA.picked_team !== pB.picked_team;
  });

  const nameA = auth.users.find((u) => u.id === userA)?.name || "Player A";
  const nameB = auth.users.find((u) => u.id === userB)?.name || "Player B";

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <Nav currentUser={auth.currentUser} onLogout={auth.logout} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Compare Brackets</h1>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm text-slate-400 block mb-1">Player 1</label>
            <select
              value={userA}
              onChange={(e) => setUserA(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#1e293b] border border-[#334155] text-sm"
            >
              <option value="">Select...</option>
              {auth.users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1">Player 2</label>
            <select
              value={userB}
              onChange={(e) => setUserB(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#1e293b] border border-[#334155] text-sm"
            >
              <option value="">Select...</option>
              {auth.users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        {userA && userB ? (
          <>
            <div className="text-sm text-slate-400 mb-4">
              {diffGames.length} game{diffGames.length !== 1 ? "s" : ""} where picks differ
            </div>

            {diffGames.length === 0 && picksA.length > 0 && picksB.length > 0 ? (
              <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-center">
                <div className="text-2xl mb-2">🤝</div>
                <div className="text-lg font-semibold">Identical brackets!</div>
                <div className="text-sm text-slate-400">
                  {nameA} and {nameB} picked the same teams.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {diffGames.map((game) => {
                  const pA = pickMapA.get(game.id);
                  const pB = pickMapB.get(game.id);
                  return (
                    <div
                      key={game.id}
                      className="bg-[#1e293b] rounded-xl border border-[#334155] p-4"
                    >
                      <div className="text-xs text-slate-500 mb-2">
                        {game.region} · {game.id}
                      </div>
                      <div className="grid grid-cols-3 gap-3 items-center">
                        <div className="text-right">
                          <div className="text-xs text-slate-500 mb-1">{nameA}</div>
                          <div
                            className={`text-sm font-medium ${
                              pA?.is_correct === true
                                ? "text-green-400"
                                : pA?.is_correct === false
                                ? "text-red-400 line-through"
                                : ""
                            }`}
                          >
                            {pA?.picked_team || "—"}
                          </div>
                        </div>
                        <div className="text-center text-slate-600 text-xs">vs</div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">{nameB}</div>
                          <div
                            className={`text-sm font-medium ${
                              pB?.is_correct === true
                                ? "text-green-400"
                                : pB?.is_correct === false
                                ? "text-red-400 line-through"
                                : ""
                            }`}
                          >
                            {pB?.picked_team || "—"}
                          </div>
                        </div>
                      </div>
                      {game.winner && (
                        <div className="text-center mt-2 text-xs text-green-400">
                          Winner: {game.winner}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="text-slate-500 text-center py-12">
            Select two players to compare their brackets
          </div>
        )}
      </main>
    </div>
  );
}
