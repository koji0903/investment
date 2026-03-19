"use client";

import { useMemo } from "react";
import { getThisWeekEvents, WEEKDAY_JP, type EconomicEvent } from "@/lib/economicCalendarUtils";
import { Calendar, AlertTriangle, AlertCircle, MinusCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ImpactBadge = ({ impact }: { impact: EconomicEvent["impact"] }) => {
  if (impact === "high") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 whitespace-nowrap">
      <AlertTriangle className="w-2.5 h-2.5" /> 影響度:高
    </span>
  );
  if (impact === "medium") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 whitespace-nowrap">
      <AlertCircle className="w-2.5 h-2.5" /> 影響度:中
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400 whitespace-nowrap">
      <MinusCircle className="w-2.5 h-2.5" /> 影響度:低
    </span>
  );
};

const DataCell = ({ label, value, isActual }: { label: string; value: string | null; isActual?: boolean }) => (
  <div className="flex flex-col items-center min-w-[60px]">
    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</span>
    <span className={cn(
      "text-xs font-bold",
      isActual && value ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-300",
      !value && "text-slate-300 dark:text-slate-600"
    )}>
      {value ?? "---"}
    </span>
  </div>
);

export const EconomicCalendar = () => {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const events = useMemo(() => getThisWeekEvents(now), []);

  // 日付ごとにグループ化
  const grouped = useMemo(() => {
    const map = new Map<string, EconomicEvent[]>();
    for (const ev of events) {
      const arr = map.get(ev.date) ?? [];
      arr.push(ev);
      map.set(ev.date, arr);
    }
    return map;
  }, [events]);

  const { start } = useMemo(() => {
    const d = new Date(now);
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    return { start: monday, end: friday };
  }, []);

  // 月〜金の日付一覧を生成
  const weekDays = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [start]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[var(--radius-card)] shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">今週の経済指標カレンダー</h3>
        <span className="ml-auto text-xs text-slate-400 font-medium">
          {start.toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}〜
        </span>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[520px] overflow-y-auto custom-scrollbar">
        {weekDays.map(day => {
          const dateStr = day.toISOString().slice(0, 10);
          const dayEvents = grouped.get(dateStr) ?? [];
          const isToday = dateStr === todayStr;
          const isPast = new Date(dateStr) < new Date(todayStr);

          return (
            <div key={dateStr} className={cn(isToday && "bg-indigo-50/40 dark:bg-indigo-900/10")}>
              {/* 曜日ヘッダー */}
              <div className={cn(
                "flex items-center gap-2 px-6 py-2 sticky top-0 backdrop-blur-sm",
                isToday
                  ? "bg-indigo-100/80 dark:bg-indigo-900/40 border-l-2 border-indigo-500"
                  : "bg-slate-50/80 dark:bg-slate-900/80"
              )}>
                <span className={cn(
                  "text-sm font-black",
                  isToday ? "text-indigo-700 dark:text-indigo-300" : isPast ? "text-slate-400" : "text-slate-700 dark:text-slate-200"
                )}>
                  {day.getMonth() + 1}/{day.getDate()}（{WEEKDAY_JP[day.getDay()]}）
                </span>
                {isToday && (
                  <span className="text-[10px] font-bold bg-indigo-500 text-white px-1.5 py-0.5 rounded-full">TODAY</span>
                )}
                {dayEvents.length === 0 && (
                  <span className="text-xs text-slate-400 ml-2">主要イベントなし</span>
                )}
              </div>

              {/* イベントリスト */}
              {dayEvents.map(ev => (
                <div key={ev.id} className={cn(
                  "px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3 transition-colors",
                  isPast && !ev.actual && "opacity-60"
                )}>
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base">{ev.country}</span>
                      <ImpactBadge impact={ev.impact} />
                      <span className="text-[10px] text-slate-400">{ev.time}</span>
                      {ev.actual && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> 発表済
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{ev.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{ev.description}</p>
                    </div>
                  </div>

                  {/* 予想・前回・結果のデータテーブル */}
                  <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-2 border border-slate-100 dark:border-slate-700 shrink-0">
                    <DataCell label="前回" value={ev.previous} />
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                    <DataCell label="予想" value={ev.forecast} />
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                    <DataCell label="結果" value={ev.actual} isActual />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
