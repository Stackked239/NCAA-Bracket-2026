"use client";

import { useState } from "react";
import { User } from "@/lib/types";

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
  onCreateUser: (name: string) => Promise<User>;
}

export default function LoginScreen({ users, onLogin, onCreateUser }: LoginScreenProps) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError("");
    try {
      await onCreateUser(newName.trim());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create user");
    }
    setCreating(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏀</div>
          <h1 className="text-3xl font-bold mb-2">March Madness 2026</h1>
          <p className="text-slate-400">Warren Family Bracket Challenge</p>
        </div>

        <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
          <h2 className="text-lg font-semibold mb-4">Who are you?</h2>

          {users.length > 0 && (
            <div className="space-y-2 mb-6">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onLogin(user)}
                  className="w-full text-left px-4 py-3 rounded-lg bg-[#0f172a] hover:bg-blue-600/20 border border-[#334155] hover:border-blue-500 transition-all flex items-center justify-between"
                >
                  <span className="font-medium">{user.name}</span>
                  {user.is_admin && (
                    <span className="text-xs text-yellow-500">Admin</span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-[#334155] pt-4">
            <p className="text-sm text-slate-400 mb-3">New family member?</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Enter your name"
                className="flex-1 px-3 py-2 rounded-lg bg-[#0f172a] border border-[#334155] focus:border-blue-500 focus:outline-none text-sm"
              />
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                {creating ? "..." : "Join"}
              </button>
            </div>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
