"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  calculateOverallSentiment, 
  SentimentResult 
} from "@/lib/sentimentUtils";
import { NewsItem } from "@/app/api/news/route";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Flame, 
  Snowflake, 
  Zap,
  RefreshCw,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePortfolio } from "@/context/PortfolioContext";

export const MarketSentiment = () => {
  const { news, isNewsFetching: isLoading, fetchNews } = usePortfolio();

  const sentiment = useMemo(() => {
    if (!news || news.length === 0) {
      return { score: 50, type: "neutral" as const, label: "中立" };
    }
    return calculateOverallSentiment(news);
  }, [news]);

  // ゲージの角度計算 (0-100 -> -90deg to 90deg)
  const rotation = (sentiment.score / 100) * 180 - 90;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[var(--radius-card)] shadow-sm overflow-hidden p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">市場センチメント</h3>
        </div>
        <button 
          onClick={fetchNews}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          disabled={isLoading}
        >
          <RefreshCw className={cn("w-4 h-4 text-slate-400", isLoading && "animate-spin")} />
        </button>
      </div>

      <div className="flex flex-col items-center">
        {/* センチメントゲージ */}
        <div className="relative w-48 h-24 overflow-hidden mb-4">
          {/* 背景の円弧 */}
          <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[12px] border-slate-100 dark:border-slate-800" />
          
          {/* カラーグラデーションの円弧 */}
          <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[12px] border-transparent border-t-rose-500 border-r-indigo-500 border-l-emerald-500 opacity-20" 
               style={{ transform: "rotate(-45deg)" }} />

          {/* 指針 */}
          <div 
            className="absolute bottom-0 left-1/2 w-1.5 h-20 bg-slate-800 dark:bg-slate-200 rounded-full origin-bottom transition-transform duration-1000 ease-out"
            style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 dark:bg-slate-200 rounded-full" />
          </div>
          
          {/* 中心点 */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-2 bg-slate-800 dark:bg-slate-200 rounded-t-full" />
        </div>

        {/* 評価テキスト */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            {sentiment.type === "bullish" ? (
              <Flame className="w-6 h-6 text-rose-500 animate-pulse" />
            ) : sentiment.type === "bearish" ? (
              <Snowflake className="w-6 h-6 text-blue-400 animate-pulse" />
            ) : (
              <Minus className="w-6 h-6 text-slate-400" />
            )}
            <span className={cn(
              "text-2xl font-black tracking-tighter",
              sentiment.type === "bullish" ? "text-rose-600 dark:text-rose-400" :
              sentiment.type === "bearish" ? "text-blue-600 dark:text-blue-400" :
              "text-slate-600 dark:text-slate-400"
            )}>
              {sentiment.label}
            </span>
          </div>
          <p className="text-sm font-bold text-slate-400">
            センチメントスコア: <span className="text-slate-700 dark:text-slate-200">{sentiment.score}</span>
          </p>
        </div>

        {/* 凡例・詳細 */}
        <div className="grid grid-cols-3 gap-2 w-full pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-center">
            <p className="text-[10px] font-bold text-rose-500 mb-1">強気</p>
            <div className="h-1 bg-rose-500 rounded-full opacity-30" />
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-400 mb-1">中立</p>
            <div className="h-1 bg-slate-400 rounded-full opacity-30" />
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-emerald-500 mb-1">弱気</p>
            <div className="h-1 bg-emerald-500 rounded-full opacity-30" />
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl w-full">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            直近の{news.length}件のニュースからAIが市場の気配を分析。70以上で「強気」、40未満で「弱気」と判定します。
          </p>
        </div>
      </div>
    </div>
  );
};
