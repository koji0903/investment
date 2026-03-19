"use client";

import React from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { Brain, TrendingUp, TrendingDown, Clock, Lightbulb, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const BehaviorInsight = () => {
  const { behavior } = usePortfolio();

  if (!behavior) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded"></div>
          <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  const { tendency, advice, avgWinDays, avgLossDays, patterns } = behavior;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
          <Brain size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">投資行動インサイト</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">過去の取引パターンから AI が分析</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 投資傾向カード */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">現在の投資スタイル</div>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            {tendency}
            <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-full font-medium">診断済</span>
          </div>
          
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-emerald-500" /> 平均利確期間
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{avgWinDays.toFixed(1)}日</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-1.5">
                <TrendingDown size={14} className="text-rose-500" /> 平均損切期間
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{avgLossDays.toFixed(1)}日</span>
            </div>
          </div>
        </div>

        {/* AI アドバイス */}
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold mb-2">
            <Lightbulb size={18} />
            <span>改善アドバイス</span>
          </div>
          <p className="text-sm text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
            {advice}
          </p>
        </div>
      </div>

      {/* サマリーパターン */}
      <div className="mt-6 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-medium border border-emerald-100 dark:border-emerald-900/30">
          <TrendingUp size={14} />
          勝ちパターン: {patterns.winning}
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-medium border border-rose-100 dark:border-rose-900/30">
          <AlertCircle size={14} />
          負けパターン: {patterns.losing}
        </div>
      </div>
    </div>
  );
};
