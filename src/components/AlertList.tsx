"use client";

import React from "react";
import { AlertCircle, Bell, TrendingUp, TrendingDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertItem {
  id: string;
  type: "price" | "news" | "system";
  level: "high" | "medium" | "low";
  message: string;
  time: string;
}

const dummyAlerts: AlertItem[] = [
  { id: "1", type: "price", level: "high", message: "ビットコイン(BTC)が目標価格 ¥10,000,000 を上回りました", time: "10分前" },
  { id: "2", type: "news", level: "medium", message: "トヨタ自動車の決算発表が予定されています", time: "1時間前" },
  { id: "3", type: "system", level: "low", message: "ポートフォリオの週次分析レポートが作成されました", time: "3時間前" },
  { id: "4", type: "price", level: "medium", message: "Apple(AAPL)が5%以上下落しています", time: "5時間前" },
];

export const AlertList = () => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="w-5 h-5 text-indigo-500" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">アラート一覧</h3>
      </div>
      
      <div className="space-y-4">
        {dummyAlerts.map((alert) => (
          <div 
            key={alert.id}
            className={cn(
              "flex gap-4 p-4 rounded-2xl border transition-all duration-300",
              alert.level === "high" ? "bg-rose-50/50 border-rose-100 dark:bg-rose-500/5 dark:border-rose-500/20" :
              alert.level === "medium" ? "bg-amber-50/50 border-amber-100 dark:bg-amber-500/5 dark:border-amber-500/20" :
              "bg-slate-50/50 border-slate-100 dark:bg-slate-500/5 dark:border-slate-500/20"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl shrink-0 h-fit",
              alert.level === "high" ? "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400" :
              alert.level === "medium" ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400" :
              "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400"
            )}>
              {alert.type === "price" && (alert.message.includes("上回") || alert.message.includes("上昇") ? <TrendingUp size={18} /> : <TrendingDown size={18} />)}
              {alert.type === "news" && <Info size={18} />}
              {alert.type === "system" && <AlertCircle size={18} />}
            </div>
            
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
                {alert.message}
              </p>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {alert.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
