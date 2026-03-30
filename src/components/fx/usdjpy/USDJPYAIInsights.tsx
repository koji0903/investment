"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  BrainCircuit, 
  TrendingUp, 
  TrendingDown, 
  Lightbulb, 
  History,
  ShieldCheck,
  Zap,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnalysisResult } from "@/utils/fx/FXPatternAnalyzer";
import { FXWeightProfile } from "@/types/fx";

/**
 * AI 戦略インサイト・自己進化ステータスコンポーネント
 */
export const USDJPYAIInsights = ({ 
  analysis, 
  weightProfile 
}: { 
  analysis: AnalysisResult | null;
  weightProfile: FXWeightProfile | null;
}) => {
  if (!analysis) return null;

  return (
    <div className="space-y-6">
      {/* AI Strategy Insights Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="p-2 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <BrainCircuit size={18} />
           </div>
           <div>
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">AI 戦略インサイト</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase">自己進化型インテリジェンス</p>
           </div>
        </div>
        <div className="text-right">
           <span className="text-[10px] font-black text-slate-500 uppercase block">最終最適化</span>
           <span className="text-[10px] font-black text-indigo-400 tabular-nums">
             {weightProfile?.lastOptimizedAt ? new Date(weightProfile.lastOptimizedAt).toLocaleTimeString() : "待機中"}
           </span>
        </div>
      </div>

      {/* Top Win Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-slate-900/50 border border-slate-900 rounded-[24px] space-y-4">
           <div className="flex items-center gap-2 text-emerald-400">
              <TrendingUp size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">主要勝利パターン</span>
           </div>
           <div className="space-y-3">
              {analysis.topWinPatterns.slice(0, 3).map((p, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                   <div className="space-y-0.5">
                      <p className="text-[11px] font-bold text-slate-300">{p.name}</p>
                      <p className="text-[9px] text-slate-500 font-black uppercase">勝率 {(p.winRate * 100).toFixed(0)}%</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[11px] font-black text-emerald-400">+{p.avgPips.toFixed(1)}</p>
                      <p className="text-[8px] text-slate-600 font-bold uppercase">平均 Pips</p>
                   </div>
                </div>
              ))}
              {analysis.topWinPatterns.length === 0 && (
                <p className="text-[10px] text-slate-600 font-bold italic">分析データが不足しています...</p>
              )}
           </div>
        </div>

        <div className="p-5 bg-slate-900/50 border border-slate-900 rounded-[24px] space-y-4">
           <div className="flex items-center gap-2 text-rose-400">
              <TrendingDown size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">ハイリスク・パターン</span>
           </div>
           <div className="space-y-3">
              {analysis.topLossPatterns.slice(0, 3).map((p, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                   <div className="space-y-0.5">
                      <p className="text-[11px] font-bold text-slate-300">{p.name}</p>
                      <p className="text-[9px] text-slate-500 font-black uppercase">勝率 {(p.winRate * 100).toFixed(0)}%</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[11px] font-black text-rose-400">{p.avgPips.toFixed(1)}</p>
                      <p className="text-[8px] text-slate-600 font-bold uppercase">平均 Pips</p>
                   </div>
                </div>
              ))}
              {analysis.topLossPatterns.length === 0 && (
                <p className="text-[10px] text-slate-600 font-bold italic">リスクデータを収集中...</p>
              )}
           </div>
        </div>
      </div>

      {/* AI Weights Status */}
      <div className="p-6 bg-slate-950 border border-slate-900 rounded-[32px] space-y-6">
        <div className="flex items-center justify-between">
           <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
              <Zap size={12} className="text-amber-500" /> 有効なAI重み付け（自己校正済み）
           </h4>
           <div className="px-2 py-0.5 bg-indigo-500/10 rounded flex items-center gap-1.5 border border-indigo-500/20">
              <div className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse" />
              <span className="text-[8px] font-black text-indigo-400 uppercase">リアルタイム最適化中</span>
           </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
           {weightProfile && Object.entries(weightProfile.weights).map(([key, val], i) => (
             <div key={i} className="p-3 bg-slate-900/50 rounded-2xl border border-slate-800/30 text-center space-y-1">
                <span className="text-[8px] font-black text-slate-500 uppercase block truncate">{key}</span>
                <span className={cn(
                  "text-sm font-black tabular-nums",
                  val > 1.1 ? "text-emerald-400" : val < 0.9 ? "text-rose-400" : "text-slate-300"
                )}>
                  x{val.toFixed(2)}
                </span>
             </div>
           ))}
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="p-5 bg-indigo-500/5 border border-indigo-500/20 rounded-[32px] space-y-4">
         <div className="flex items-center gap-2 text-indigo-400">
            <Lightbulb size={18} />
            <span className="text-[11px] font-black border-b border-indigo-500/30 pb-0.5 uppercase tracking-widest">戦略的レコメンド</span>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(analysis.environmentInsights).map(([key, text], i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                 <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <BarChart3 size={16} className="text-indigo-400" />
                 </div>
                 <p className="text-[11px] font-bold text-slate-300 leading-relaxed italic">
                    {text}
                 </p>
              </div>
            ))}
            {Object.keys(analysis.environmentInsights).length === 0 && (
               <p className="text-[10px] text-slate-600 font-bold p-2 italic leading-relaxed">
                 AIはあなたの取引スタイルに基づいた新しい戦略的仮説を形成中です。継続的に学習させてください。
               </p>
            )}
         </div>
      </div>
    </div>
  );
};
