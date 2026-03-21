"use client";

import { useState } from "react";
import { UpsetAlert, ROUND_NAMES } from "@/lib/types";
import { IconAlertTriangle, IconEye, IconChevronDown } from "./Icons";

interface UpsetAlertsProps {
  alerts: UpsetAlert[];
}

export default function UpsetAlerts({ alerts }: UpsetAlertsProps) {
  const [expanded, setExpanded] = useState(false);

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition-colors"
      >
        <span className="text-sm font-semibold text-red-400 uppercase tracking-wider flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          {alerts.length} Upset Alert{alerts.length > 1 ? "s" : ""}
        </span>
        <IconChevronDown size={16} className={`text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.game.id}
              className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${
                alert.type === "leading"
                  ? "bg-yellow-500/10 border-yellow-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <span className="shrink-0">
                {alert.type === "won"
                  ? <IconAlertTriangle size={22} className="text-red-400" />
                  : <IconEye size={22} className="text-yellow-400" />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">
                  {alert.type === "won" ? (
                    <>
                      <span className="text-red-400">UPSET!</span>{" "}
                      ({alert.underdogSeed}) {alert.underdog} knocked off ({alert.favoriteSeed}) {alert.favorite}
                    </>
                  ) : (
                    <>
                      <span className="text-yellow-400">UPSET WATCH:</span>{" "}
                      ({alert.underdogSeed}) {alert.underdog} leads ({alert.favoriteSeed}) {alert.favorite}
                      {alert.game.team_a_score !== null && (
                        <span className="ml-2 text-slate-400">
                          {alert.game.team_a_name === alert.underdog
                            ? `${alert.game.team_a_score}-${alert.game.team_b_score}`
                            : `${alert.game.team_b_score}-${alert.game.team_a_score}`}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {alert.game.region} · {ROUND_NAMES[alert.game.round]}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
