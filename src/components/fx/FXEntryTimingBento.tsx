"use client";

import React from "react";
import { EntryTimingAnalysis } from "@/types/fx";
import { motion } from "framer-motion";
import { 
  Crosshair, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  Map, 
  Scale, 
  AlertTriangle 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FXEntryTimingBentoProps {
  analysis: EntryTimingAnalysis;
  pairCode: string;
}

export const FXEntryTimingBento: React.FC<FXEntryTimingBentoProps> = ({ analysis, pairCode }) => {
  const isGo = !analysis.shouldWait;

  const phaseLabels: Record<string, string> = {
    pre_consolidation: "蓄積前",
    consolidating: "蓄積中",
    breakout_initial: "ブレイク初動",
    pullback_waiting: "押し目待ち",
    reacceleration: "再加速",
    extended_move: "伸び切り警戒",
    possible_fakeout: "だまし疑い"
  };

  const entryLabels: Record<string, string> = {
    initial_breakout_entry: "ブレイク初動狙い",
    pullback_entry: "押し目・戻り待ち",
    reacceleration_entry: "再加速局面狙い"
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {/* 1. 構造フェーズとエントリー判断 (Main) */}
      <div className={cn(
        "md:col-span-1 p-6 rounded-[32px] border flex flex-col justify-between shadow-xl relative overflow-hidden text-white transition-colors",
        isGo ? "bg-emerald-600 dark:bg-emerald-900 border-emerald-500" 
             : analysis.entryScore >= 70 ? "bg-indigo-600 dark:bg-indigo-900 border-indigo-500"
             : "bg-slate-800 dark:bg-black border-slate-700"
      )}>
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Map size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Structure Phase</span>
            <div className="px-3 py-1 rounded-full bg-white/20 text-[10px] font-black backdrop-blur-sm border border-white/10">
              SCORE: {analysis.entryScore}
            </div>
          </div>
          <h3 className="text-2xl font-black mb-2">{phaseLabels[analysis.structurePhase] || analysis.structurePhase}</h3>
          <p className="text-xs font-bold text-white/80 leading-relaxed mb-6">{analysis.structureComment}</p>
          
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 mt-auto">
            <p className="text-[10px] font-black text-white/60 mb-1 uppercase tracking-wider">Recommended Strategy</p>
            <p className="text-sm font-black mb-1">{entryLabels[analysis.recommendedEntryType]}</p>
            <p className="text-[10px] font-bold text-white/80 leading-relaxed">{analysis.entryTypeReason}</p>
          </div>
        </div>
      </div>

      {/* 2. リスクリワード (Risk / Reward) */}
      <div className="md:col-span-1 bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-500">
              <Scale size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Risk & Reward</p>
              <h4 className="text-sm font-black text-slate-800 dark:text-white">RR比・価格目標</h4>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-slate-400">想定エントリー</span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-200 tabular-nums tracking-tighter">{analysis.suggestedEntryPrice.toFixed(pairCode.includes("JPY") ? 3 : 5)}</span>
              </div>
            </div>
            
            <div className="flex flex-col justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5"><ShieldAlert size={12} className="text-rose-400" /><span className="text-[10px] font-black text-rose-400">損切りライン</span></div>
                <span className="text-sm font-black text-rose-500 tabular-nums tracking-tighter">{analysis.invalidationPrice.toFixed(pairCode.includes("JPY") ? 3 : 5)}</span>
              </div>
              <span className="text-[9px] font-bold text-slate-400 leading-tight">{analysis.stopComment}</span>
            </div>

            <div className="flex flex-col justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5"><Crosshair size={12} className="text-emerald-500" /><span className="text-[10px] font-black text-emerald-500">目標価格</span></div>
                <span className="text-sm font-black text-emerald-500 tabular-nums tracking-tighter">{analysis.targetPrice.toFixed(pairCode.includes("JPY") ? 3 : 5)}</span>
              </div>
              <span className="text-[9px] font-bold text-slate-400 leading-tight">{analysis.targetComment}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
          <span className="text-xs font-black text-slate-500">推定RR比 (Reward/Risk)</span>
          <span className={cn("text-lg font-black tabular-nums", analysis.rrRatio >= 1.5 ? "text-emerald-500" : "text-orange-500")}>
            {analysis.rrRatio.toFixed(2)}
          </span>
        </div>
      </div>

      {/* 3. 待機理由 / アクション (Caution / Action) */}
      <div className="md:col-span-1 bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className={cn(
              "p-2 rounded-xl",
              isGo ? "bg-emerald-50 text-emerald-500" : "bg-indigo-50 text-indigo-500"
            )}>
              {isGo ? <CheckCircle2 size={20} /> : <Clock size={20} />}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Entry Judgment</p>
              <h4 className="text-sm font-black text-slate-800 dark:text-white">総合判断</h4>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-2xl font-black tracking-tight",
                analysis.entryScore >= 85 ? "text-emerald-500" : analysis.entryScore >= 70 ? "text-indigo-500" : analysis.entryScore >= 50 ? "text-orange-500" : "text-rose-500"
              )}>
                {analysis.entryLabel}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase">判断理由・留意事項</p>
              <ul className="space-y-2">
                {analysis.waitReasons.map((reason, idx) => (
                  <li key={idx} className="flex gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 items-start">
                    {reason === "最適なエントリー条件が揃っています" ? (
                      <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle size={12} className="text-orange-500 mt-0.5 shrink-0" />
                    )}
                    <span className="leading-snug">
                      {reason}
                      {reason === "ヒストリカルデータ収集中" && analysis.dataProgress < 100 && (
                        <span className="ml-1 text-orange-500">({analysis.dataProgress}%)</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className={cn(
          "p-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-black transition-colors border",
          isGo ? "bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20" 
               : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
        )}>
          {isGo ? (
            <>
              <Crosshair size={16} />
              <span>エントリー条件クリア</span>
            </>
          ) : (
            <>
              <Clock size={16} />
              <span>
                {analysis.dataProgress < 100 
                  ? `データ収集中 (${analysis.dataProgress}%)` 
                  : "現在は待機を推奨"}
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};
