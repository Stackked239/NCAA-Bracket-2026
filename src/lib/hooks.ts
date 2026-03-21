"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { User, Game, Pick, LeaderboardEntry, Message, Reaction, UpsetAlert, LiveGameInfo } from "./types";

// Simple fetch wrapper
async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// ---- Auth Context ----
const USER_KEY = "ncaa_bracket_user";

// Safe localStorage access — Node.js 22 has a broken global `localStorage`
function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== "undefined" && typeof window.localStorage?.getItem === "function") {
      return window.localStorage.getItem(key);
    }
  } catch {}
  return null;
}

function safeSetItem(key: string, value: string) {
  try {
    if (typeof window !== "undefined" && typeof window.localStorage?.setItem === "function") {
      window.localStorage.setItem(key, value);
    }
  } catch {}
}

function safeRemoveItem(key: string) {
  try {
    if (typeof window !== "undefined" && typeof window.localStorage?.removeItem === "function") {
      window.localStorage.removeItem(key);
    }
  } catch {}
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = safeGetItem(USER_KEY);
    if (saved) {
      try { setCurrentUser(JSON.parse(saved)); } catch {}
    }
    api<User[]>("/api/users").then(setUsers).finally(() => setLoading(false));
  }, []);

  const login = useCallback((user: User) => {
    setCurrentUser(user);
    safeSetItem(USER_KEY, JSON.stringify(user));
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    safeRemoveItem(USER_KEY);
  }, []);

  const createUser = useCallback(async (name: string) => {
    const user = await api<User>("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setUsers((prev) => [...prev.filter((u) => u.id !== user.id), user]);
    login(user);
    return user;
  }, [login]);

  const removeUser = useCallback(async (id: string) => {
    await api("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const refreshUsers = useCallback(async () => {
    const u = await api<User[]>("/api/users");
    setUsers(u);
  }, []);

  return { currentUser, users, loading, login, logout, createUser, removeUser, refreshUsers };
}

// ---- Games ----
export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGames = useCallback(async () => {
    const g = await api<Game[]>("/api/games");
    setGames(g);
    setLoading(false);
  }, []);

  useEffect(() => { fetchGames(); }, [fetchGames]);

  return { games, loading, refetch: fetchGames };
}

// ---- Picks ----
export function usePicks(userId: string | undefined) {
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPicks = useCallback(async () => {
    if (!userId) { setPicks([]); setLoading(false); return; }
    const p = await api<Pick[]>(`/api/picks?userId=${userId}`);
    setPicks(p);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchPicks(); }, [fetchPicks]);

  const makePick = useCallback(
    async (gameId: string, pickedTeam: string) => {
      if (!userId) return;
      const pick = await api<Pick>("/api/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, gameId, pickedTeam }),
      });
      setPicks((prev) => {
        const filtered = prev.filter((p) => p.game_id !== gameId);
        return [...filtered, pick];
      });
      // Refetch to get any cleared downstream picks
      setTimeout(fetchPicks, 100);
    },
    [userId, fetchPicks]
  );

  return { picks, loading, makePick, refetch: fetchPicks };
}

// ---- Leaderboard ----
export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    const e = await api<LeaderboardEntry[]>("/api/leaderboard");
    setEntries(e);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  return { entries, loading, refetch: fetchLeaderboard };
}

// ---- Messages (Trash Talk Feed) ----
export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    try {
      const m = await api<Message[]>("/api/messages?limit=100");
      // Fetch all reactions for the returned messages
      const ids = m.map((msg) => msg.id);
      if (ids.length > 0) {
        const reactionsMap: Record<string, Reaction[]> = {};
        // Batch fetch reactions for all message ids
        const res = await fetch(`/api/messages/reactions?messageId=${ids.join(",")}`);
        if (res.ok) {
          const allReactions: Reaction[] = await res.json();
          for (const r of allReactions) {
            if (!reactionsMap[r.message_id]) reactionsMap[r.message_id] = [];
            reactionsMap[r.message_id].push(r);
          }
        }
        for (const msg of m) {
          msg.reactions = reactionsMap[msg.id] || [];
        }
      }
      setMessages(m);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 10 seconds
    const id = setInterval(fetchMessages, 10000);
    return () => clearInterval(id);
  }, [fetchMessages]);

  const sendMessage = useCallback(
    async (userId: string, userName: string, body: string, gameId?: string) => {
      const msg = await api<Message>("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userName, body, gameId }),
      });
      msg.reactions = [];
      setMessages((prev) => [...prev, msg]);
      return msg;
    },
    []
  );

  const reactToMessage = useCallback(
    async (messageId: string, userId: string, emoji: string): Promise<Reaction[]> => {
      const reactions = await api<Reaction[]>("/api/messages/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, userId, emoji }),
      });
      // Update the message's reactions in state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, reactions } : msg
        )
      );
      return reactions;
    },
    []
  );

  return { messages, loading, sendMessage, reactToMessage, refetch: fetchMessages };
}

// ---- Live Game Data (NCAA API) ----
export function useLiveGames() {
  const [liveData, setLiveData] = useState<Record<string, LiveGameInfo>>({});

  const fetchLive = useCallback(async () => {
    try {
      const data = await api<Record<string, LiveGameInfo>>("/api/live");
      setLiveData(data);
    } catch {
      // Silently fail — live data is non-critical
    }
  }, []);

  useEffect(() => {
    fetchLive();
    // Poll every 30 seconds for live game data
    const id = setInterval(fetchLive, 30000);
    return () => clearInterval(id);
  }, [fetchLive]);

  return liveData;
}

/**
 * Merge live NCAA API data into the games array.
 * Memoized to avoid creating new references on every render.
 */
export function useMergedGames(
  games: Game[],
  liveData: Record<string, LiveGameInfo>
): Game[] {
  // Serialize liveData into a stable key so useMemo only recomputes when values change
  const liveKey = useRef("");
  const nextKey = JSON.stringify(liveData);
  if (nextKey !== liveKey.current) {
    liveKey.current = nextKey;
  }

  return useMemo(() => {
    if (Object.keys(liveData).length === 0) return games;

    return games.map((g) => {
      const live = liveData[g.id];
      if (!live) return g;

      return {
        ...g,
        team_a_score: live.teamAScore ?? g.team_a_score,
        team_b_score: live.teamBScore ?? g.team_b_score,
        status:
          live.gameState === "live"
            ? "in_progress"
            : live.gameState === "final"
            ? "final"
            : g.status,
      } as Game;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games, liveKey.current]);
}

// ---- Pick Distribution ----
export function usePickDistribution() {
  const [dist, setDist] = useState<Record<string, Record<string, number>>>({});

  const fetchDist = useCallback(async () => {
    try {
      const data = await api<Record<string, Record<string, number>>>("/api/picks/distribution");
      setDist(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchDist();
    const id = setInterval(fetchDist, 60000); // Refresh every minute
    return () => clearInterval(id);
  }, [fetchDist]);

  return dist;
}

// ---- Eliminated Teams ----
export function useEliminatedTeams(games: Game[]): Set<string> {
  return useMemo(() => {
    const eliminated = new Set<string>();
    for (const g of games) {
      if (g.status === "final" && g.winner) {
        const loser = g.winner === g.team_a_name ? g.team_b_name : g.team_a_name;
        if (loser) eliminated.add(loser);
      }
    }
    return eliminated;
  }, [games]);
}

// ---- Upset Alerts ----
export function useUpsetAlerts(games: Game[]): UpsetAlert[] {
  const [alerts, setAlerts] = useState<UpsetAlert[]>([]);

  useEffect(() => {
    const upsets: UpsetAlert[] = [];

    for (const game of games) {
      if (!game.team_a_seed || !game.team_b_seed) continue;
      if (!game.team_a_name || !game.team_b_name) continue;

      // Determine which is the higher seed (lower number = better)
      const aIsFavorite = game.team_a_seed < game.team_b_seed;
      const favoriteName = aIsFavorite ? game.team_a_name : game.team_b_name;
      const favoriteSeed = aIsFavorite ? game.team_a_seed : game.team_b_seed;
      const underdogName = aIsFavorite ? game.team_b_name : game.team_a_name;
      const underdogSeed = aIsFavorite ? game.team_b_seed : game.team_a_seed;

      // Same seed = not an upset
      if (game.team_a_seed === game.team_b_seed) continue;

      // Upset win (final)
      if (game.status === "final" && game.winner === underdogName) {
        upsets.push({
          game,
          type: "won",
          underdog: underdogName,
          underdogSeed,
          favorite: favoriteName,
          favoriteSeed,
        });
      }

      // Underdog leading (in progress)
      if (
        game.status === "in_progress" &&
        game.team_a_score !== null &&
        game.team_b_score !== null
      ) {
        const underdogScore = aIsFavorite ? game.team_b_score : game.team_a_score;
        const favoriteScore = aIsFavorite ? game.team_a_score : game.team_b_score;
        if (underdogScore > favoriteScore) {
          upsets.push({
            game,
            type: "leading",
            underdog: underdogName,
            underdogSeed,
            favorite: favoriteName,
            favoriteSeed,
          });
        }
      }
    }

    // Sort: in-progress upsets first, then by seed difference (biggest upsets first)
    upsets.sort((a, b) => {
      if (a.type !== b.type) return a.type === "leading" ? -1 : 1;
      return (b.underdogSeed - b.favoriteSeed) - (a.underdogSeed - a.favoriteSeed);
    });

    setAlerts(upsets);
  }, [games]);

  return alerts;
}

// ---- Live Score Polling ----
export function useScorePolling(intervalMs = 60000) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        await api("/api/scores", { method: "POST" });
        setLastUpdate(new Date());
      } catch (e) {
        console.error("Score polling error:", e);
      }
    };

    poll();
    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return { lastUpdate };
}
