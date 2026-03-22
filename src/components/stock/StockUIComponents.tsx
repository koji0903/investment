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
 * 信頼度表示
 */
export const StockConfidenceIndicator = ({ level }: { level: "高" | "中" | "低" }) => {
  const dots = level === "高" ? 3 : level === "中" ? 2 : 1;
  const color = level === "高" ? "bg-emerald-500" : level === "中" ? "bg-amber-500" : "bg-slate-300";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3].map(i => (
          <div 
            key={i} 
            className={cn("w-2 h-1 rounded-full", i <= dots ? color : "bg-slate-100 dark:bg-slate-800")} 
          />
        ))}
      </div>
      <span className="text-xs font-bold text-slate-400 leading-none">信頼度:{level}</span>
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
