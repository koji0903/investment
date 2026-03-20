"use client";

import React, { useMemo } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { analyzeTradingPatterns, TradingPatternInsight } from "@/lib/analyticsUtils";
import { 
  Trophy, 
  AlertOctagon, 
  Lightbulb, 
  History, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  GraduationCap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const SkillCoach = () => {
  const { calculatedAssets } = usePortfolio();
  
  const analysis = useMemo(() => {
    return analyzeTradingPatterns(calculatedAssets);
  }, [calculatedAssets]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 md:p-8 shadow-sm overflow-hidden relative group">
      {/* Premium Background Gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
            <GraduationCap size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white">AI 投資スキル・コーチ</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Skill & Pattern Analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Skill Score</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-800 dark:text-white">{analysis.skillScore}</span>
              <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-indigo-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${analysis.skillScore}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Success Patterns */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-emerald-500 uppercase tracking-widest px-2 flex items-center gap-2">
            <Trophy size={16} />
            成功パターン (STRENGTHS)
          </h3>
          <div className="space-y-3">
            {analysis.insights.filter(i => i.type === "success").length > 0 ? (
              analysis.insights.filter(i => i.type === "success").map((insight, idx) => (
                <InsightCard key={idx} insight={insight} />
              ))
            ) : (
              <p className="text-xs font-bold text-slate-400 px-4 py-8 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                まだ明確な成功パターンは特定されていません。<br/>継続的なトレードでデータを蓄積しましょう。
              </p>
            )}
          </div>
        </div>

        {/* Failure Patterns */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest px-2 flex items-center gap-2">
            <AlertOctagon size={16} />
            改善ポイント (AREAS TO GROW)
          </h3>
          <div className="space-y-3">
            {analysis.insights.filter(i => i.type === "failure").length > 0 ? (
              analysis.insights.filter(i => i.type === "failure").map((insight, idx) => (
                <InsightCard key={idx} insight={insight} />
              ))
            ) : (
              <p className="text-xs font-bold text-emerald-500/80 px-4 py-8 bg-emerald-50/20 dark:bg-emerald-500/5 rounded-2xl border border-dashed border-emerald-200/50 dark:border-emerald-800/30 text-center">
                特筆すべき失敗パターンは見られません。<br/>非常に規律ある運用が維持されています。
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-900 dark:bg-slate-800/60 rounded-[28px] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <TrendingUp size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3 text-indigo-400">
              <Lightbulb size={18} />
              <span className="text-xs font-black uppercase tracking-widest">AIコーチのまとめ</span>
            </div>
            <p className="text-lg font-black leading-snug">
              {analysis.summary}
            </p>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-2 shrink-0">
            トレード規律を学ぶ
            <History size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

const InsightCard = ({ insight }: { insight: TradingPatternInsight }) => {
  const isSuccess = insight.type === "success";
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: isSuccess ? -10 : 10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "p-5 rounded-2xl border flex items-start gap-4 transition-all hover:shadow-lg",
        isSuccess 
          ? "bg-emerald-50/30 dark:bg-emerald-500/5 border-emerald-100/50 dark:border-emerald-500/10" 
          : "bg-rose-50/30 dark:bg-rose-500/5 border-rose-100/50 dark:border-rose-500/10"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
        isSuccess ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
      )}>
        {isSuccess ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h4 className="font-black text-slate-800 dark:text-white text-base leading-none">
            {insight.title}
          </h4>
          <span className={cn(
            "text-[9px] font-black px-2 py-0.5 rounded-full uppercase",
            isSuccess ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
          )}>
            Impact {insight.impactScore}
          </span>
        </div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
          {insight.description}
        </p>
      </div>
    </motion.div>
  );
};
