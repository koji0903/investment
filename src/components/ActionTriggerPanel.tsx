"use client";

import React, { useMemo } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { 
  evaluateActionTriggers, 
  calculateMarketCondition, 
  ActionTrigger 
} from "@/lib/analyticsUtils";
import { 
  Radar, 
  Zap, 
  AlertTriangle, 
  TrendingUp, 
  ArrowRight,
  Sparkles,
  Timer,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const ActionTriggerPanel = () => {
  const { calculatedAssets } = usePortfolio();
  
  const triggers = useMemo(() => {
    const market = calculateMarketCondition(4.0, 0.8, 0.2); // デモ用
    return evaluateActionTriggers(calculatedAssets, market);
  }, [calculatedAssets]);

  const activeCount = triggers.length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm relative group">
      {/* Visual Accent */}
      <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform">
        <Radar size={120} className="text-indigo-500" />
      </div>

      <div className="p-6 md:p-8 space-y-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-500/20">
                <Radar size={20} />
              </div>
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[10px] font-bold text-white items-center justify-center">
                    {activeCount}
                  </span>
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">AI 投資アクショントリガー</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Real-time Opportunity Detection</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/5 rounded-xl border border-indigo-100 dark:border-indigo-500/10">
            <Timer size={14} className="text-indigo-500" />
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">Market Scan: ACTIVE</span>
          </div>
        </div>

        {activeCount === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/60 rounded-full flex items-center justify-center text-slate-300">
              <Sparkles size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-800 dark:text-white">現在、特別なアクショントリガーはありません</p>
              <p className="text-xs font-bold text-slate-400">市場価格とポートフォリオを24時間スキャンしています。</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {triggers.map((trigger, idx) => (
                <TriggerCard key={trigger.id} trigger={trigger} index={idx} />
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-tighter">Oversold Scan</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span className="text-[9px] font-black text-rose-600 dark:text-rose-500 uppercase tracking-tighter">Exit Signal Check</span>
            </div>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">AI is watching 128 global factors</p>
        </div>
      </div>
    </div>
  );
};

const TriggerCard = ({ trigger, index }: { trigger: ActionTrigger, index: number }) => {
  const isHigh = trigger.urgency === "high";
  const colors = {
    opportunity: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
    warning: "bg-rose-500/10 border-rose-500/20 text-rose-500",
    strategic: "bg-indigo-500/10 border-indigo-500/20 text-indigo-500"
  }[trigger.type];

  const Icon = {
    opportunity: TrendingUp,
    warning: AlertTriangle,
    strategic: Zap
  }[trigger.type];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "p-5 rounded-[24px] border transition-all hover:shadow-xl relative overflow-hidden",
        isHigh ? "ring-2 ring-indigo-500/20" : "border-slate-100 dark:border-slate-800"
      )}
    >
      <div className="flex items-start gap-4 h-full">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border", colors)}>
          <Icon size={24} />
          {isHigh && (
            <span className="absolute -top-1 -left-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-40"></span>
            </span>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="space-y-0.5">
            <h4 className="text-sm font-black text-slate-800 dark:text-white leading-tight">
              {trigger.title}
            </h4>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
              {trigger.assetName} • {trigger.action}
            </p>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 pr-4">
            {trigger.reason}
          </p>
        </div>

        <button className="h-full flex items-center p-2 text-slate-300 hover:text-indigo-500 transition-colors">
          <ArrowRight size={20} />
        </button>
      </div>
    </motion.div>
  );
};
