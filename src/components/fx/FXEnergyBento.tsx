"use client";

import React from "react";
import { MarketEnergyAnalysis } from "@/types/fx";
import { motion } from "framer-motion";
import { Zap, ArrowUpRight, ArrowDownRight, Target, AlertTriangle, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface FXEnergyBentoProps {
  analysis: MarketEnergyAnalysis;
  pairCode: string;
}

export const FXEnergyBento: React.FC<FXEnergyBentoProps> = ({ analysis, pairCode }) => {
  const isUp = analysis.breakoutDirection === "up";
  const isDown = analysis.breakoutDirection === "down";
  const isNone = analysis.breakoutDirection === "none";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {/* 1. Main Score Card */}
      <div className="md:col-span-1 bg-slate-900 dark:bg-black rounded-[32px] p-6 text-white border border-slate-800 flex flex-col justify-between shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Zap size={120} className={cn(analysis.energyScore > 70 ? "text-yellow-400 fill-yellow-400" : "text-slate-400")} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-yellow-400 fill-yellow-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Market Energy</span>
          </div>
          <h3 className="text-2xl font-black mb-4">{pairCode}</h3>
          
          <div className="flex items-end gap-2">
            <span className="text-6xl font-black tabular-nums">{analysis.energyScore}</span>
            <span className="text-sm font-bold text-slate-400 mb-2">pts</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-black">
            LEVEL: {analysis.energyLevel.toUpperCase()}
          </div>
          <div className="flex items-center gap-2 text-xs font-bold">
            {analysis.status === "accumulating" ? (
              <>
                <Pause size={14} className="text-blue-400" />
                <span>エネルギー蓄積中</span>
              </>
            ) : (
              <>
                <Play size={14} className="text-emerald-400" />
                <span>エネルギー放出中</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Breakout & Strategy Card */}
      <div className="md:col-span-1 bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className={cn(
              "p-2 rounded-xl",
              isUp ? "bg-emerald-50 text-emerald-500" : isDown ? "bg-rose-50 text-rose-500" : "bg-slate-50 text-slate-400"
            )}>
              {isUp ? <ArrowUpRight size={20} /> : isDown ? <ArrowDownRight size={20} /> : <Target size={20} />}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Breakout Logic</p>
              <h4 className="text-sm font-black text-slate-800 dark:text-white">ブレイク判定</h4>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500">方向</span>
              <span className={cn("text-sm font-black", isUp ? "text-emerald-500" : isDown ? "text-rose-500" : "text-slate-400")}>
                {isUp ? "上方向ブレイク" : isDown ? "下方向ブレイク" : "レンジ内巡航"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500">強度</span>
              <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                {analysis.breakoutStrength === "strong" ? "強烈" : analysis.breakoutStrength === "medium" ? "中等度" : "微弱"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500">だましリスク</span>
              <div className="flex items-center gap-2">
                <span className={cn("text-sm font-black", analysis.fakeBreakProbability > 60 ? "text-rose-500" : analysis.fakeBreakProbability > 30 ? "text-orange-500" : "text-emerald-500")}>
                  {analysis.fakeBreakProbability}%
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  ({analysis.fakeBreakProbability > 60 ? "高" : analysis.fakeBreakProbability > 30 ? "中" : "低"})
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={cn(
          "mt-6 p-4 rounded-2xl flex items-center gap-3",
          analysis.entryRecommendation === "enter" ? "bg-emerald-500 text-white" : analysis.entryRecommendation === "wait" ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500"
        )}>
          {analysis.entryRecommendation === "avoid" ? <AlertTriangle size={18} /> : <Zap size={18} />}
          <div className="flex-1">
            <p className="text-[9px] font-black uppercase opacity-70 leading-none mb-1">Recommendation</p>
            <p className="text-sm font-black tracking-tight">
              {analysis.entryRecommendation === "enter" ? "即エントリー推奨" : analysis.entryRecommendation === "wait" ? "ブレイク待ち" : "エントリー回避"}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Target Prices Card */}
      <div className="md:col-span-1 bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-xl bg-orange-50 text-orange-500">
            <Target size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Profit Targets</p>
            <h4 className="text-sm font-black text-slate-800 dark:text-white">理論目標価格</h4>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {analysis.targetPrices.map((price, idx) => (
            <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center justify-between group hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase">Target {idx + 1}</span>
                <span className="text-xs font-bold text-slate-500">{idx === 0 ? "レンジ拡張" : idx === 1 ? "ATR拡張" : "BB拡張"}</span>
              </div>
              <span className="text-lg font-black text-slate-800 dark:text-white tabular-nums group-hover:text-orange-500 transition-colors">
                {price}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[10px] font-bold text-slate-400 mt-6 leading-relaxed">
          ※目標価格はボラティリティと価格変動幅に基づき動的に算出されています。
        </p>
      </div>
    </motion.div>
  );
};
