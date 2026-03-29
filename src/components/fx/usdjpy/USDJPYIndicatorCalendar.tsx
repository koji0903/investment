"use client";

import React from "react";
import { FXEconomicEvent } from "@/types/fx";
import { Calendar, Clock, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  events: FXEconomicEvent[];
}

export const USDJPYIndicatorCalendar = ({ events }: Props) => {
  if (!events || events.length === 0) return null;

  // グループ化 (日付別)
  const groupedEvents: Record<string, FXEconomicEvent[]> = {};
  events.forEach(e => {
    const dateStr = new Date(e.timestamp).toLocaleDateString("ja-JP", { weekday: "short", month: "short", day: "numeric" });
    if (!groupedEvents[dateStr]) groupedEvents[dateStr] = [];
    groupedEvents[dateStr].push(e);
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-[32px] space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Calendar size={18} className="text-indigo-400" />
        <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">Economic Calendar</h3>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedEvents).map(([date, evts]) => (
          <div key={date} className="space-y-3">
            <div className="text-[10px] font-black text-slate-500 uppercase border-l-2 border-indigo-500 pl-2">
              {date}
            </div>
            <div className="space-y-2">
              {evts.map((evt) => (
                <div key={evt.id} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800/50 rounded-2xl group hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      evt.importance === "high" ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" : "bg-amber-500"
                    )} />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                        {evt.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-black px-1 rounded bg-slate-800 text-slate-400 uppercase">
                          {evt.currency}
                        </span>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
                          <Clock size={10} />
                          {new Date(evt.timestamp).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {evt.importance === "high" && (
                    <div className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-md">
                      <span className="text-[8px] font-black text-rose-400 uppercase">High Risk</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
