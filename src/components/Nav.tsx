"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "@/lib/types";

interface NavProps {
  currentUser: User | null;
  onLogout: () => void;
}

export default function Nav({ currentUser, onLogout }: NavProps) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Bracket" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/compare", label: "Compare" },
  ];

  if (currentUser?.is_admin) {
    links.push({ href: "/admin", label: "Admin" });
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#0f172a]/95 backdrop-blur border-b border-[#334155]">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold mr-4 hidden sm:block">
            🏀 March Madness 2026
          </span>
          <span className="text-lg font-bold mr-4 sm:hidden">🏀 MM26</span>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                pathname === l.href
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        {currentUser && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">
              {currentUser.name}
              {currentUser.is_admin && (
                <span className="ml-1 text-xs text-yellow-500">★</span>
              )}
            </span>
            <button
              onClick={onLogout}
              className="text-xs text-slate-500 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
