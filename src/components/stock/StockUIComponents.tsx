"use client";

import React from "react";
import { 
  StockSignalLabel, 
  GrowthProfile, 
  FinancialHealth, 
  ValuationLabel,
  DividendProfile,
  TradingSuitability
} from "@/types/stock";
import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldAlert, Shield, TrendingUp, TrendingDown, Minus, Target, Zap, Waves, Coins } from "lucide-react";

/**
 * 投資判断信号バッジ
 */
export const StockSignalBadge = ({ label }: { label: StockSignalLabel }) => {
  const styles = {
    "買い優勢": "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
    "やや買い": "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    "中立": "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    "やや売り": "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    "売り優勢": "bg-rose-500 text-white shadow-lg shadow-rose-500/20",
    "押し目待ち": "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    "戻り売り待ち": "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400",
  };

  return (
    <span className={cn(
      "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap",
      styles[label] || styles["中立"]
    )}>
      {label}
    </span>
  );
};

/**
 * 確信度表示 (0-100%)
 */
export const StockCertaintyIndicator = ({ certainty }: { certainty: number }) => {
  const color = certainty >= 80 ? "text-emerald-500" : certainty >= 50 ? "text-amber-500" : "text-slate-400";
  const bgColor = certainty >= 80 ? "bg-emerald-500" : certainty >= 50 ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-700";

  return (
    <div className="flex flex-col gap-1 w-full max-w-[80px]">
      <div className="flex justify-between items-end">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Certainty</span>
        <span className={cn("text-[11px] font-black tabular-nums leading-none", color)}>{certainty}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-1000", bgColor)} style={{ width: `${certainty}%` }} />
      </div>
    </div>
  );
};

/**
 * 同期ステータス表示
 */
export const SyncStatusIndicator = ({ status }: { status?: "pending" | "syncing" | "completed" | "failed" | "warning" }) => {
  if (status === "syncing") {
    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping absolute" />
          <div className="w-2 h-2 bg-indigo-500 rounded-full relative" />
        </div>
        <span className="text-[10px] font-black text-indigo-500 animate-pulse tracking-tighter">分析中...</span>
      </div>
    );
  }
  if (status === "completed") {
    return (
      <div className="flex items-center gap-1.5 text-emerald-500 font-black">
        <ShieldCheck size={12} />
        <span className="text-[10px] tracking-tighter">分析完了</span>
      </div>
    );
  }
  if (status === "warning") {
    return (
      <div className="flex items-center gap-1.5 text-amber-500 font-black">
        <ShieldAlert size={12} />
        <span className="text-[10px] tracking-tighter">一部制限</span>
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className="flex items-center gap-1.5 text-rose-500 font-black">
        <ShieldAlert size={12} />
        <span className="text-[10px] tracking-tighter">エラー</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-slate-300 font-black">
      <div className="w-2 h-2 bg-slate-200 dark:bg-slate-800 rounded-full" />
      <span className="text-[10px] tracking-tighter">待機中</span>
    </div>
  );
};

/**
 * 保有適正バッジ
 */
export const StockSuitabilityBadge = ({ suitability }: { suitability: TradingSuitability }) => {
  const config = {
    "good_for_short_term": { label: "短期向", icon: <Zap size={10} />, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" },
    "good_for_long_term": { label: "中長期向", icon: <Waves size={10} />, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" },
    "neutral": { label: "中立", icon: <Minus size={10} />, color: "text-slate-400 bg-slate-50 dark:bg-slate-800" },
    "weak_for_long_term": { label: "長期不向", icon: <ShieldAlert size={10} />, color: "text-rose-500 bg-rose-50 dark:bg-rose-500/10" },
  };

  const item = config[suitability] || config["neutral"];

  return (
    <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black", item.color)}>
      {item.icon}
      <span>{item.label}</span>
    </div>
  );
};

/**
 * 財務健全性バッジ
 */
export const FinancialHealthBadge = ({ health }: { health: FinancialHealth }) => {
  const config = {
    "strong": { label: "強固", icon: <ShieldCheck size={12} />, color: "text-emerald-500" },
    "medium": { label: "標準", icon: <Shield size={12} />, color: "text-amber-500" },
    "weak": { label: "脆弱", icon: <ShieldAlert size={12} />, color: "text-rose-500" },
  };
  const item = config[health];
  return (
    <div className={cn("flex items-center gap-1 text-xs font-black", item.color)}>
      {item.icon}
      <span>{item.label}</span>
    </div>
  );
};
