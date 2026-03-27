"use client";

import React from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertCircle, 
  CheckCircle2,
  Info,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignalLabel, ConfidenceLevel, HoldingStyle, TradingSuitability } from "@/types/fx";

/**
 * 判定シグナルバッジ
 */
export const SignalBadge = ({ label }: { label: SignalLabel }) => {
  if (!label) return null;
  
  const styles = {
    "買い優勢": "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
    "やや買い": "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30",
    "中立": "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700",
    "やや売り": "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30",
    "売り優勢": "bg-rose-500 text-white shadow-lg shadow-rose-500/20",
    "押し目待ち": "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30",
    "戻り売り待ち": "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30",
  };

  const safeLabel = label || "中立";
  const Icon = safeLabel.includes("買い") || safeLabel === "押し目待ち" ? TrendingUp : safeLabel.includes("売り") || safeLabel === "戻り売り待ち" ? TrendingDown : Minus;

  return (
    <div className={cn(
      "px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 transition-all",
      styles[safeLabel as keyof typeof styles] || styles["中立"]
    )}>
      <Icon size={14} />
      <span>{safeLabel}</span>
    </div>
  );
};

/**
 * 信頼度表示
 */
export const ConfidenceIndicator = ({ level }: { level: ConfidenceLevel }) => {
  if (!level) return null;
  const colors = {
    "高": "text-emerald-500",
    "中": "text-amber-500",
    "低": "text-slate-400",
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className={cn(
              "w-2 h-2 rounded-full",
              i <= (level === "高" ? 3 : level === "中" ? 2 : 1) 
                ? (level === "高" ? "bg-emerald-500" : level === "中" ? "bg-amber-500" : "bg-slate-400")
                : "bg-slate-200 dark:bg-slate-700"
            )}
          />
        ))}
      </div>
      <span className={cn("text-xs font-black ml-1", colors[level as keyof typeof colors] || colors["低"])}>{level}</span>
    </div>
  );
};

/**
 * 保有スタイルバッジ
 */
export const HoldingStyleBadge = ({ style }: { style: HoldingStyle }) => {
  if (!style) return null;
  const config = {
    short_term_only: { label: "短期向き", color: "text-slate-500 bg-slate-100 dark:bg-slate-800" },
    medium_term_long: { label: "中長期ロング向き", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" },
    medium_term_short: { label: "中長期ショート向き", color: "text-rose-600 bg-rose-50 dark:bg-rose-500/10" },
    not_suitable_for_hold: { label: "非推奨", color: "text-rose-500 bg-rose-50" },
  };

  const item = config[style as keyof typeof config] || config.short_term_only;

  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-bold", item.color)}>
      {item.label}
    </span>
  );
};

/**
 * 売買適正バッジ
 */
export const TradingSuitabilityBadge = ({ suitability }: { suitability: TradingSuitability }) => {
  if (!suitability) return null;
  const styles = {
    "短期売買向き": "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20",
    "中長期保有向き": "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20",
    "短期・中長期共に良好": "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20",
    "様子見推奨": "bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-800",
  };

  return (
    <div className={cn("px-2.5 py-1 rounded-lg text-xs font-black", styles[suitability as keyof typeof styles] || styles["様子見推奨"])}>
      {suitability}
    </div>
  );
};

/**
 * 同期ステータスバッジ
 */
export const SyncStatusBadge = ({ status }: { status?: "pending" | "syncing" | "completed" | "failed" }) => {
  if (!status || status === "completed") return null;

  const config = {
    pending: { label: "待機中", color: "text-slate-400 bg-slate-100 dark:bg-slate-800" },
    syncing: { label: "同期中...", color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10 animate-pulse" },
    failed: { label: "失敗", color: "text-rose-500 bg-rose-50 dark:bg-rose-500/10" },
  };

  const { label, color } = config[status as keyof typeof config] || config.pending;

  return (
    <div className={cn("px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 border border-current opacity-80", color)}>
      <RefreshCw size={10} className={status === "syncing" ? "animate-spin" : ""} />
      <span>{label}</span>
    </div>
  );
};

/**
 * 分析スコアバッジ
 */
export const ScoreBadge = ({ score, label }: { score: number, label: string }) => {
  const isPositive = score > 15;
  const isNegative = score < -15;
  
  const color = isPositive ? "text-emerald-500 border-emerald-100 bg-emerald-50/50 dark:bg-emerald-500/10 dark:border-emerald-500/20" : 
                isNegative ? "text-rose-500 border-rose-100 bg-rose-50/50 dark:bg-rose-500/10 dark:border-rose-500/20" :
                "text-slate-400 border-slate-100 bg-slate-50 dark:bg-slate-800/50 dark:border-slate-800";
  
  return (
    <div className={cn("inline-flex flex-col items-center justify-center w-9 h-9 rounded-lg border font-black text-[11px]", color)}>
      <span className="opacity-40 leading-none mb-0.5 text-[9px]">{label}</span>
      <span className="leading-none">{score > 0 ? `+${score}` : score}</span>
    </div>
  );
};
