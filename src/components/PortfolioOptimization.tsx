"use client";

import { useMemo } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { calculateOptimization } from "@/lib/analyticsUtils";
import { Lightbulb, ArrowRight, TrendingDown, TrendingUp, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const PortfolioOptimization = () => {
  const { calculatedAssets } = usePortfolio();
  
  const optimizations = useMemo(() => calculateOptimization(calculatedAssets), [calculatedAssets]);

  if (optimizations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[var(--radius-card)] p-4 md:p-6 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-5 pointer-events-none mix-blend-overlay">
        <Lightbulb className="w-32 h-32 md:w-48 md:h-48" />
      </div>

      <div className="relative z-10 block">
        <h3 className="text-lg md:text-xl font-bold mb-2 flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          AI ポートフォリオ最適化
        </h3>
        <p className="text-[10px] md:text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          理想的なモデル配分と比較し、リスク分散のためのアクションを提案します。
        </p>

        <div className="space-y-4 md:space-y-6">
          {optimizations.map((opt) => {
            const isExcess = opt.status === "Excess";
            const isDeficit = opt.status === "Deficit";
            const isOptimal = opt.status === "Optimal";

            let StatusIcon = CheckCircle;
            let statusColor = "text-emerald-500";
            let barColor = "bg-emerald-500 dark:bg-emerald-400";
            let badgeBg = "bg-emerald-50 dark:bg-emerald-500/10";
            
            if (isExcess) {
              StatusIcon = TrendingDown;
              statusColor = "text-amber-500";
              barColor = "bg-amber-500 dark:bg-amber-400";
              badgeBg = "bg-amber-50 dark:bg-amber-500/10";
            } else if (isDeficit) {
              StatusIcon = TrendingUp;
              statusColor = "text-blue-500";
              barColor = "bg-blue-500 dark:bg-blue-400";
              badgeBg = "bg-blue-50 dark:bg-blue-500/10";
            }

            return (
              <div key={opt.category} className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-50 dark:bg-slate-800/30 p-3.5 md:p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                {/* 左側：カテゴリと比率バー */}
                <div className="flex-1 w-full md:min-w-[200px]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm md:text-base">{opt.category}</span>
                    <span className="text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400">
                      現在 <span className="text-slate-800 dark:text-slate-200">{opt.currentRatio.toFixed(1)}%</span> / 理想 {opt.targetRatio}%
                    </span>
                  </div>
                  {/* Progress Bar Background */}
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden relative">
                    <div 
                      className={cn("absolute top-0 left-0 h-full rounded-full transition-all duration-1000", barColor)}
                      style={{ width: `${Math.min(100, opt.currentRatio)}%` }}
                    />
                    {/* 理想ラインのマーカー */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-800 dark:bg-slate-300 z-10"
                      style={{ left: `${opt.targetRatio}%` }}
                    />
                  </div>
                </div>

                <div className="hidden md:flex items-center text-slate-300 dark:text-slate-600 px-2 shrink-0">
                  <ArrowRight className="w-5 h-5" />
                </div>

                {/* 右側：アクション提案 */}
                <div className={cn("flex-1 p-3 rounded-xl border flex items-start gap-3 w-full", badgeBg, "border-transparent")}>
                  <StatusIcon className={cn("w-5 h-5 shrink-0 mt-0.5", statusColor)} />
                  <div>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider mb-1 block", statusColor)}>
                      {isOptimal ? "適正" : (isExcess ? "Sell (売却推奨)" : "Buy (買い増し推奨)")}
                    </span>
                    <p className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-300">
                      {opt.actionText}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
