"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "@/lib/types";
import { IconBasketball, IconTrophy, IconCompare, IconSettings } from "./Icons";
import Image from "next/image";

interface NavProps {
  currentUser: User | null;
  onLogout: () => void;
}

const NAV_LINKS = [
  { href: "/", label: "Bracket", icon: IconBasketball },
  { href: "/leaderboard", label: "Standings", icon: IconTrophy },
  { href: "/compare", label: "Compare", icon: IconCompare },
];

export default function Nav({ currentUser, onLogout }: NavProps) {
  const pathname = usePathname();

  const links = [...NAV_LINKS];
  if (currentUser?.is_admin) {
    links.push({ href: "/admin", label: "Admin", icon: IconSettings });
  }

  return (
    <>
      {/* Top bar */}
      <nav className="sticky top-0 z-50 bg-[#0f172a]/95 backdrop-blur border-b border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Link href="/" className="flex items-center gap-2 mr-4">
              <Image src="/ncaa-logo.png" alt="NCAA March Madness" width={120} height={30} className="object-contain hidden sm:block" unoptimized />
              <Image src="/ncaa-logo.png" alt="NCAA March Madness" width={80} height={20} className="object-contain sm:hidden" unoptimized />
            </Link>

            {/* Desktop nav links */}
            <div className="hidden sm:flex items-center gap-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === l.href
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {currentUser && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400 hidden sm:inline">
                {currentUser.name}
                {currentUser.is_admin && (
                  <span className="ml-1 text-xs text-yellow-500">*</span>
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

      {/* Bottom tab bar (mobile) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f172a]/95 backdrop-blur border-t border-[#334155] safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {links.map((l) => {
            const isActive = pathname === l.href;
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg min-w-[60px] transition-colors ${
                  isActive
                    ? "text-blue-400"
                    : "text-slate-500 active:text-slate-300"
                }`}
              >
                <Icon size={22} />
                <span className={`text-[10px] font-medium ${isActive ? "text-blue-400" : ""}`}>
                  {l.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
