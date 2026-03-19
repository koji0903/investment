"use client";

import React from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { Sparkles, TrendingUp, TrendingDown, Minus, Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const InvestmentStrategyCard = () => {
  const { strategy } = usePortfolio();

  if (!strategy) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 dark:bg-slate-900/50 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const { riskTolerance, recommendations } = strategy;

  const getActionStyles = (action: string) => {
    switch (action) {
      case "BUY":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50";
      case "SELL":
        return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800/50";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "BUY":
        return <TrendingUp size={14} />;
      case "SELL":
        return <TrendingDown size={14} />;
      default:
        return <Minus size={14} />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI 投資戦略</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">ポートフォリオに基づく推奨アクション</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
          <ShieldCheck size={14} className="text-indigo-500" />
          リスク許容度: {riskTolerance === "low" ? "低" : riskTolerance === "high" ? "高" : "中"}
        </div>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {recommendations && recommendations.length > 0 ? (
          recommendations.map((rec: any) => (
            <div 
              key={rec.assetId} 
              className="p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">{rec.symbol}</div>
                  <div className="font-bold text-slate-800 dark:text-slate-100">{rec.name}</div>
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border",
                  getActionStyles(rec.action)
                )}>
                  {getActionIcon(rec.action)}
                  {rec.action}
                </div>
              </div>
              
              <div className="flex items-start gap-2 mt-3 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                <Info size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {rec.reason}
                </p>
              </div>

              <div className="flex gap-4 mt-3 px-1 text-[10px] font-medium text-slate-400">
                <span>含み損益: <span className={cn(rec.profitRate >= 0 ? "text-emerald-500" : "text-rose-500")}>
                  {rec.profitRate >= 0 ? "+" : ""}{rec.profitRate.toFixed(2)}%
                </span></span>
                <span>ポ重比率: <span className="text-slate-600 dark:text-slate-300">
                  {rec.weight.toFixed(1)}%
                </span></span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">
              資産データが不足しているため、戦略を生成できません。取引を入力してください。
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
          ※本アドバイスは過去のデータに基づくAIの推測であり、利益を保証するものではありません。最終的な投資判断はご自身の責任で行ってください。
        </p>
      </div>
    </div>
  );
};
