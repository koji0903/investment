"use client";

import React from "react";
import { motion } from "framer-motion";
import { Activity, Zap, ShieldCheck, ShieldAlert, BarChart3, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { FXExecutionProfile } from "@/types/fx";

/**
 * 執行品質・スプレッド監視パネル
 */
export const USDJPYExecutionMonitor = ({ 
  profile 
}: { 
  profile: FXExecutionProfile | null 
}) => {
  if (!profile) return null;

  return (
    <div className="p-6 bg-slate-900/50 border border-slate-900 rounded-[32px] space-y-6 overflow-hidden relative group">
      {/* Background Accent */}
      <div className={cn(
        "absolute -right-12 -top-12 w-32 h-32 blur-3xl opacity-10 transition-colors",
        profile.status === "ideal" ? "bg-emerald-500" :
        profile.status === "caution" ? "bg-amber-500" : "bg-rose-500"
      )} />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
           <div className={cn(
             "p-1.5 rounded-lg text-white",
             profile.status === "ideal" ? "bg-indigo-500 shadow-lg shadow-indigo-500/20" :
             profile.status === "caution" ? "bg-amber-500" : "bg-rose-500"
           )}>
             <Zap size={14} />
           </div>
           <div>
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">執行品質</h3>
             <p className="text-[9px] text-slate-500 font-bold uppercase">リアルタイム流動性スキャン</p>
           </div>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-tighter",
          profile.status === "ideal" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" :
          profile.status === "caution" ? "bg-amber-500/10 text-amber-500 border-amber-500/30" :
          "bg-rose-500/10 text-rose-400 border-rose-500/30"
        )}>
          {profile.status === "ideal" ? "最適" : profile.status === "caution" ? "注意" : "警戒"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        {/* Spread Display */}
        <div className="p-4 bg-slate-950 border border-slate-800/50 rounded-2xl flex flex-col items-center justify-center gap-1 group/item">
          <span className="text-[9px] font-black text-slate-500 uppercase">現在のスプレッド</span>
          <div className={cn(
            "text-2xl font-black tabular-nums transition-colors",
            profile.spreadPips <= 0.3 ? "text-emerald-400" :
            profile.spreadPips <= 1.0 ? "text-amber-400" :
            "text-rose-400"
          )}>
            {profile.spreadPips.toFixed(1)} <span className="text-[10px] opacity-70">pips</span>
          </div>
        </div>

        {/* Quality Score Display */}
        <div className="p-4 bg-slate-950 border border-slate-800/50 rounded-2xl flex flex-col items-center justify-center gap-1">
          <span className="text-[9px] font-black text-slate-500 uppercase">品質スコア</span>
          <div className={cn(
            "text-2xl font-black tabular-nums",
            profile.qualityScore >= 80 ? "text-indigo-400" :
            profile.qualityScore >= 60 ? "text-amber-400" :
            "text-rose-400"
          )}>
            {profile.qualityScore}%
          </div>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        {/* Liquidity Indicator */}
        <div className="space-y-2">
           <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase">
              <span className="flex items-center gap-1"><BarChart3 size={10} /> 流動性レベル</span>
              <span className="text-slate-300">{profile.liquidityScore}%</span>
           </div>
           <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${profile.liquidityScore}%` }}
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  profile.liquidityScore >= 80 ? "bg-indigo-500" : "bg-amber-500"
                )}
              />
           </div>
        </div>

        {/* Slippage & Spike Badges */}
        <div className="flex flex-wrap gap-2 pt-2">
           <div className={cn(
             "px-2 py-1 rounded-lg border text-[8px] font-black uppercase flex items-center gap-1.5",
             profile.volatilitySpike ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-slate-950 text-slate-600 border-slate-800"
           )}>
             <Activity size={10} />
             ボラティリティ急増: {profile.volatilitySpike ? "検出" : "正常"}
           </div>
           <div className={cn(
             "px-2 py-1 rounded-lg border text-[8px] font-black uppercase flex items-center gap-1.5",
             profile.slippageRisk === "low" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
           )}>
             <ShieldCheck size={10} />
             スリッページ: {profile.slippageRisk === "low" ? "低" : profile.slippageRisk === "medium" ? "中" : "高"}
           </div>
        </div>
      </div>

      {profile.status !== "ideal" && (
        <div className="mt-2 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-center gap-3">
           <Info size={14} className="text-indigo-400 shrink-0" />
           <p className="text-[9px] font-bold text-slate-500 leading-tight uppercase italic">
              約定に若干の遅延が予想されます。ロットサイズの縮小を推奨します。
           </p>
        </div>
      )}
    </div>
  );
};
