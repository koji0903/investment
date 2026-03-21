"use client";

import React, { useMemo } from "react";
import { calculateMarketCondition, generateAIMarketAnalysis } from "@/lib/analyticsUtils";
import { 
  Sparkles, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Search,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const MarketAnalysisDashboard = () => {
  // デモ用の入力データ (本来はコンテキストやAPIから)
  const condition = useMemo(() => {
    return calculateMarketCondition(4.5, 0.8, 0.3);
  }, []);

  const analysis = useMemo(() => {
    return generateAIMarketAnalysis(condition);
  }, [condition]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm relative group">
      {/* Background Subtle Gradient */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
      
      <div className="p-6 md:p-8 flex flex-col md:flex-row gap-10 relative z-10">
        {/* Sidebar: Status & Score */}
        <div className="md:w-1/3 flex flex-col items-center justify-center space-y-8 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 pb-10 md:pb-0 md:pr-10">
          <div className="relative">
            <div className="w-40 h-40 rounded-full border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center p-4">
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Outlook</p>
                <h4 className={cn(
                  "text-2xl font-black mb-1",
                  analysis.overallOutlook === "Bullish" ? "text-emerald-500" :
                  analysis.overallOutlook === "Bearish" ? "text-rose-500" : "text-amber-500"
                )}>
                  {analysis.overallOutlook}
                </h4>
                <div className="flex items-center justify-center gap-1 text-[10px] font-black text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Score {analysis.score}
                </div>
              </div>
            </div>
            {/* Animated Ring */}
            <svg className="absolute inset-0 w-40 h-40 transform -rotate-90">
              <motion.circle
                cx="80"
                cy="80"
                r="78"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={490.09}
                initial={{ strokeDashoffset: 490.09 }}
                animate={{ strokeDashoffset: 490.09 * (1 - analysis.score / 100) }}
                transition={{ duration: 2, ease: "circOut" }}
                className="text-indigo-500"
              />
            </svg>
          </div>

          <div className="w-full space-y-4">
            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <BarChart3 size={14} className="text-indigo-500" />
              セクター診断
            </h3>
            <div className="space-y-3">
              {[
                { label: "Equity", status: condition.factors.equity > 0 ? "Strong" : "Weak", color: "text-emerald-500" },
                { label: "Yield", status: condition.factors.yield > 0 ? "Stable" : "Unstable", color: "text-amber-500" },
                { label: "FX", status: Math.abs(condition.factors.fx) < 5 ? "Neutral" : "Volatile", color: "text-slate-400" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</span>
                  <span className={cn("text-xs font-black", s.color)}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content: AI Synthesis */}
        <div className="md:w-2/3 space-y-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-indigo-500 rounded-lg text-white">
                <Sparkles size={14} />
              </div>
              <h2 className="text-lg font-black text-slate-800 dark:text-white">AI 市場分析レポート</h2>
              <span className="ml-auto text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase">2026/03/20</span>
            </div>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed bg-indigo-50/50 dark:bg-indigo-500/5 p-5 rounded-[24px] border border-indigo-100 dark:border-indigo-500/10 italic">
              「{analysis.summary}」
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Key Points */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                重要材料・カタリスト
              </h3>
              <div className="space-y-3">
                {analysis.points.map((p, i) => (
                  <div key={i} className="group cursor-default">
                    <p className="text-xs font-black text-slate-800 dark:text-white mb-1 group-hover:text-indigo-500 transition-colors">
                      {p.title}
                    </p>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                      {p.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Factors */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={14} className="text-rose-500" />
                警戒すべきリスク要因
              </h3>
              <div className="space-y-3">
                {analysis.risks.map((r, i) => (
                  <div key={i} className="group cursor-default">
                    <p className="text-xs font-black text-slate-800 dark:text-white mb-1 group-hover:text-rose-500 transition-colors">
                      {r.title}
                    </p>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                      {r.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link href="/market-analysis" className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1 hover:gap-2 transition-all">
              業界地図・詳細レポートを表示 <ArrowRight size={12} />
            </Link>
            <div className="flex -space-x-2 ml-auto">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-black text-slate-400">
                  <Search size={10} />
                </div>
              ))}
            </div>
            <span className="text-[9px] font-black text-slate-400 uppercase">AI Synced 4 Sources</span>
          </div>
        </div>
      </div>
    </div>
  );
};
