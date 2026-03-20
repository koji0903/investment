"use client";

import React, { useMemo } from "react";
import { calculateMarketCondition, formatCurrency } from "@/lib/analyticsUtils";
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Zap, 
  Compass, 
  Info, 
  Activity,
  ArrowRightCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const MarketCondition = () => {
  // デモ用の入力データ (本来はAPIやコンテキストから取得)
  const mockData = {
    equityTrend: 4.5, // 日経平均が200日線から+4.5%
    yieldSpread: 0.8, // 長短金利差 0.8%
    fxVolatility: 0.3, // 為替変動 0.3%
  };

  const condition = useMemo(() => {
    return calculateMarketCondition(
      mockData.equityTrend,
      mockData.yieldSpread,
      mockData.fxVolatility
    );
  }, []);

  const isAttack = condition.strategy === "Attack";

  const getStatusColor = () => {
    if (condition.label === "Bullish") return "text-emerald-500 bg-emerald-500";
    if (condition.label === "Bearish") return "text-rose-500 bg-rose-500";
    return "text-amber-500 bg-amber-500";
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 md:p-8 shadow-sm overflow-hidden relative group">
      {/* Background Decor */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-500" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 dark:bg-white rounded-2xl text-white dark:text-slate-900 shadow-lg shadow-slate-900/10">
            <Compass size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white">マーケット・コンパス</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Market Condition</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-6 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-full border border-slate-100 dark:border-slate-800 shadow-inner">
          <Activity size={14} className="text-indigo-500" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Update: Just Now</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Status Gauge Area */}
        <div className="lg:col-span-1 flex flex-col items-center justify-center text-center py-6 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800">
          <div className="relative w-48 h-48 mb-6">
            {/* Custom SVG Gauge */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-100 dark:text-slate-800"
              />
              <motion.circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray={552.92}
                initial={{ strokeDashoffset: 552.92 }}
                animate={{ strokeDashoffset: 552.92 * (1 - condition.score / 100) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={isAttack ? "text-emerald-500" : "text-rose-500"}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-slate-800 dark:text-white mb-1">{condition.score}</span>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full",
                condition.label === "Bullish" ? "bg-emerald-500/10 text-emerald-500" :
                condition.label === "Bearish" ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
              )}>
                {condition.label}
              </span>
            </div>
          </div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Market Sentiment Index</p>
        </div>

        {/* Strategy Advice Area */}
        <div className="lg:col-span-2 space-y-8">
          <div className="relative overflow-hidden bg-slate-50 dark:bg-slate-800/40 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800/60 transition-all hover:border-indigo-500/30">
            <div className="flex items-start gap-5 relative z-10">
              <div className={cn(
                "w-16 h-16 rounded-[22px] flex items-center justify-center shrink-0 shadow-lg",
                isAttack ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-emerald-500/20" : "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-indigo-500/20"
              )}>
                {isAttack ? <Zap size={28} /> : <ShieldAlert size={28} />}
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">推奨戦略フェーズ</h3>
                <div className="flex items-center gap-3 mb-3">
                  <span className={cn(
                    "text-2xl font-black",
                    isAttack ? "text-emerald-500" : "text-slate-800 dark:text-white"
                  )}>
                    {isAttack ? "攻めの一手 (ATTACK)" : "守りと静観 (DEFENSE)"}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {condition.description}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Equity Trend", val: condition.factors.equity, icon: TrendingUp },
              { label: "Yield Spread", val: condition.factors.yield, icon: Activity },
              { label: "FX Stability", val: condition.factors.fx, icon: Compass },
            ].map((f, i) => (
              <div key={i} className="flex flex-col gap-2 p-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <f.icon size={14} className="text-slate-400" />
                  <span className={cn(
                    "text-xs font-black",
                    f.val > 0 ? "text-emerald-500" : f.val < 0 ? "text-rose-500" : "text-slate-400"
                  )}>
                    {f.val > 0 ? "+" : ""}{f.val}
                  </span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{f.label}</p>
                <div className="h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full transition-all duration-1000", f.val > 0 ? "bg-emerald-500" : "bg-rose-500")}
                    style={{ width: `${Math.abs(f.val) * 10}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 p-3 bg-amber-50/50 dark:bg-amber-500/5 rounded-xl border border-amber-100/50 dark:border-amber-500/10">
            <Info size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-600 dark:text-amber-400/80 leading-relaxed font-bold">
              マクロ環境の急変時には「守り」にシフトすることで、暴落時のドローダウンを最小限に抑え、次の反騰局面での利益を最大化できます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
