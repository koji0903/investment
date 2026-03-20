"use client";

import React from "react";
import { ArrowLeft, TrendingUp, TrendingDown, Clock, Building2, Coins, Landmark, CircleDollarSign } from "lucide-react";
import { AssetCalculated } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AssetDetailHeaderProps {
  asset: AssetCalculated;
}

const CategoryIcon = ({ category, className }: { category: string; className?: string }) => {
  switch (category) {
    case "株": return <Building2 className={className} />;
    case "FX": return <CircleDollarSign className={className} />;
    case "仮想通貨": return <Coins className={className} />;
    case "投資信託": return <Landmark className={className} />;
    default: return <CircleDollarSign className={className} />;
  }
};

export const AssetDetailHeader = ({ asset }: AssetDetailHeaderProps) => {
  const isProfit = asset.profitAndLoss >= 0;
  const isDailyProfit = asset.dailyChange >= 0;

  return (
    <div className="space-y-8">
      <button 
        onClick={() => window.location.href = "/"}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-500 transition-colors font-bold group"
      >
        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm group-hover:border-indigo-500/30 transition-all">
          <ArrowLeft size={16} />
        </div>
        <span className="text-sm">ダッシュボードへ戻る</span>
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CategoryIcon category={asset.category} className="w-8 h-8 md:w-10 md:h-10 text-indigo-500 relative z-10" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-[10px] font-black text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 uppercase tracking-widest">
                {asset.category}
              </span>
              <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{asset.symbol}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              {asset.name}
            </h1>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1">
          <div className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
            {formatCurrency(asset.currentPrice)}
          </div>
          <div className={cn(
            "flex items-center gap-2 font-black text-sm px-3 py-1 rounded-full border",
            isDailyProfit 
              ? "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400" 
              : "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400"
          )}>
            {isDailyProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{isDailyProfit ? "+" : ""}{formatCurrency(asset.dailyChange)} ({isDailyProfit ? "+" : ""}{asset.dailyChangePercentage.toFixed(2)}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
