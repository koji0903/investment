"use client";

import React from "react";
import { motion } from "framer-motion";
import { Layers, Activity, Zap, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { FXStructureAnalysis } from "@/types/fx";
import { HelpTooltip } from "../FXUIComponents";

/**
 * EUR/USD 相場構造解析モニター
 */
export const EURUSDStructureMonitor = ({ 
  structure 
}: { 
  structure: FXStructureAnalysis | null 
}) => {
  if (!structure) return null;

  return (
    <div className="p-6 bg-slate-900/50 border border-slate-900 rounded-[32px] space-y-6 relative overflow-hidden group">
      {/* Background Accent */}
      <div className={cn(
        "absolute -left-12 -bottom-12 w-32 h-32 blur-3xl opacity-10 transition-colors",
        structure.isEntryTiming ? "bg-indigo-500" : "bg-slate-500"
      )} />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
           <div className={cn(
             "p-1.5 rounded-lg text-white",
             structure.isEntryTiming ? "bg-indigo-500 shadow-lg shadow-indigo-500/20" : "bg-slate-700"
           )}>
             <Layers size={14} />
           </div>
           <div>
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">相場構造解析</h3>
             <p className="text-[9px] text-slate-500 font-bold uppercase">パターン完成度分析</p>
           </div>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-tighter",
          structure.isEntryTiming ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" : "bg-slate-800 text-slate-500 border-slate-700"
        )}>
          {structure.type.replace("_", " ")}
        </div>
      </div>

      {/* Completion Score */}
      <div className="space-y-3 relative z-10 group/p1 cursor-help">
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
            完成スコア
            <Info size={10} className="opacity-0 group-hover/p1:opacity-40 transition-opacity" />
          </span>
          <span className={cn(
            "text-2xl font-black tabular-nums tracking-tighter",
            structure.completionScore >= 75 ? "text-indigo-400" : "text-slate-300"
          )}>
            {Math.round(structure.completionScore)}%
          </span>
        </div>
        
        <HelpTooltip 
          text="チャートの形（ダブルボトム等）がどれだけ完成に近いかを示します。75%以上がエントリーの理想です。" 
          className="group-hover/p1:opacity-100 group-hover/p1:visible"
        />

        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${structure.completionScore}%` }}
            className={cn(
              "h-full rounded-full transition-all duration-1000",
              structure.completionScore >= 75 ? "bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]" : "bg-slate-600"
            )}
          />
        </div>

        <div className="flex items-center gap-2 mt-2">
          {structure.isEntryTiming ? (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
               <CheckCircle2 size={12} /> 構造完成：執行準備完了
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
               <Activity size={12} className="animate-pulse" /> 構造形成中...
            </div>
          )}
        </div>
      </div>

      {/* Energy & Reasons */}
      <div className="grid grid-cols-1 gap-4 relative z-10">
        <div className="space-y-2 group cursor-help relative">
           <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase">
              <span className="flex items-center gap-1">
                エネルギー蓄積
                <Info size={10} className="opacity-0 group-hover:opacity-40 transition-opacity" />
              </span>
              <span className="text-slate-300">{Math.round(structure.energyLevel)}%</span>
           </div>
           <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${structure.energyLevel}%` }}
                className="h-full bg-indigo-400 rounded-full"
              />
           </div>
           <HelpTooltip 
             text="値動きのパワーがどれくらい溜まっているかです。数値が高いほど、ブレイク時に勢いが出やすくなります。" 
           />
        </div>

        <div className="space-y-1.5">
           {structure.reasons.map((reason, i) => (
             <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/50 rounded-xl border border-slate-800/30">
                <div className="w-1 h-1 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-bold text-slate-400">{reason}</span>
             </div>
           ))}
        </div>
      </div>

      {!structure.isEntryTiming && structure.completionScore >= 50 && (
        <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-3">
           <AlertCircle size={14} className="text-amber-500 shrink-0" />
           <p className="text-[9px] font-bold text-slate-500 leading-tight uppercase italic">
              構造の確定を待ってください。早すぎるエントリーはダマシのリスクを高めます。
           </p>
        </div>
      )}
    </div>
  );
};
