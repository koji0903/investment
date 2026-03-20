"use client";

import React, { useMemo } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { 
  calculateOptimalPortfolio, 
  calculateMarketCondition, 
  generateStrategyActions,
  StrategyAction
} from "@/lib/analyticsUtils";
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus,
  Navigation,
  Target,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const StrategyActionPoints = () => {
  const { calculatedAssets } = usePortfolio();
  
  // モック用の市場・リスクパラメータ (本来はコンテキストから)
  const strategyResult = useMemo(() => {
    const optimization = calculateOptimalPortfolio(calculatedAssets, "aggressive");
    const market = calculateMarketCondition(4.5, 0.8, 0.3);
    return generateStrategyActions(optimization, market, "aggressive");
  }, [calculatedAssets]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm relative group">
      {/* Visual Accent */}
      <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 pointer-events-none" />
      
      <div className="p-6 md:p-8 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 dark:bg-white rounded-2xl text-white dark:text-slate-900 shadow-xl shadow-slate-900/10 dark:shadow-white/10">
              <Navigation size={20} className="fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">AI 戦略実行リスト</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Personalized Action Points</p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <Target size={14} className="text-indigo-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggressive Mode</span>
          </div>
        </div>

        <div className="p-5 bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/10 mb-2">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-indigo-500 rounded-lg text-white mt-0.5">
              <ShieldCheck size={14} />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
              {strategyResult.summary}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {strategyResult.actions.map((action, idx) => (
              <ActionCard key={action.assetName} action={action} index={idx} />
            ))}
          </AnimatePresence>
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase">Sell Required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase">Buy Recommend</span>
            </div>
          </div>
          <button className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1 hover:translate-x-1 transition-transform">
            全ての推奨銘柄を見る <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

const ActionCard = ({ action, index }: { action: StrategyAction, index: number }) => {
  const isBuy = action.type === "buy";
  const isSell = action.type === "sell";
  const isHold = action.type === "hold";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group p-5 bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 transition-all hover:shadow-lg hover:border-indigo-500/30 overflow-hidden relative"
    >
      {/* Type-based Background Glow */}
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 blur-[40px] opacity-10 pointer-events-none -translate-y-1/2 translate-x-1/2",
        isBuy ? "bg-emerald-500" : isSell ? "bg-rose-500" : "bg-slate-500"
      )} />

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative z-10">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2",
          isBuy ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : 
          isSell ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : 
          "bg-slate-500/10 border-slate-500/20 text-slate-500"
        )}>
          {isBuy ? <ArrowUpRight size={20} /> : isSell ? <ArrowDownRight size={20} /> : <Minus size={20} />}
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-3">
            <h4 className="text-base font-black text-slate-800 dark:text-white leading-none">
              {action.assetName}
            </h4>
            <div className={cn(
              "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
              action.priority === "High" ? "bg-rose-500 text-white border-rose-600" : 
              action.priority === "Medium" ? "bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20" :
              "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
            )}>
              {action.priority} Priority
            </div>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest",
              isBuy ? "text-emerald-500" : isSell ? "text-rose-500" : "text-slate-500"
            )}>
              {action.type}
            </span>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed pr-8">
            {action.reason}
          </p>
        </div>

        <div className="shrink-0 flex sm:flex-col items-center gap-2">
          {action.priority === "High" ? (
            <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-full text-rose-500 animate-pulse">
              <AlertCircle size={18} />
            </div>
          ) : (
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-full text-emerald-500">
              <CheckCircle2 size={18} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
