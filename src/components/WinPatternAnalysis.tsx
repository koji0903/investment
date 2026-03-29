"use client";

import React, { useMemo } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { analyzeWinningPatterns, generateActionableStrategy } from "@/lib/winPatternUtils";
import { 
  Trophy, 
  Lightbulb, 
  BarChart, 
  Target, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export const WinPatternAnalysis = () => {
  const { calculatedAssets } = usePortfolio();

  const patterns = useMemo(() => analyzeWinningPatterns(calculatedAssets), [calculatedAssets]);
  const strategyProposal = useMemo(() => generateActionableStrategy(patterns), [patterns]);

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899"];

  if (patterns.length === 0) return null;

  return (
    <div className="space-y-8 mb-8">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm">
        <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-xl text-white shadow-lg shadow-amber-500/20">
              <Trophy size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white">勝ちパターンの相関分析</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Winning correlation & Insight</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-800">
            <Sparkles size={12} className="text-amber-500" />
            <span className="text-[10px] font-black text-slate-500">AI INSIGHT ACTIVE</span>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Chart Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <BarChart size={14} className="text-indigo-500" />
                  カテゴリ別利益貢献度
                </h4>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <ReBarChart data={patterns}>
                    <XAxis 
                      dataKey="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: "bold", fill: "#94a3b8" }} 
                    />
                    <YAxis hide domain={[0, 'auto']} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length && payload[0].value !== undefined) {
                          const value = typeof payload[0].value === 'number' 
                            ? payload[0].value 
                            : parseFloat(payload[0].value as string);
                          
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-[10px] font-bold">
                              {payload[0].payload.category}: +{value.toFixed(1)}%
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="averageReturn" radius={[10, 10, 10, 10]} barSize={40}>
                      {patterns.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6">
                {patterns.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[10px] font-black text-slate-400 uppercase">{p.category}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Insight List Section */}
            <div className="space-y-6">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Lightbulb size={14} className="text-amber-500" />
                抽出された成功因子
              </h4>
              <div className="grid grid-cols-1 gap-4">
                {patterns.slice(0, 3).map((pattern, index) => (
                  <motion.div
                    key={pattern.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-start gap-4"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                      index === 0 ? "bg-amber-100 text-amber-600" : "bg-white dark:bg-slate-900 text-slate-400"
                    )}>
                      <Award size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black text-slate-800 dark:text-white">{pattern.category} × {pattern.commonFactor}</span>
                        <span className="text-[10px] font-black text-emerald-500">+{pattern.averageReturn.toFixed(1)}%</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
                        {pattern.insight}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Strategy Proposal Box */}
          <div className="mt-12 p-6 bg-slate-900 dark:bg-white rounded-[28px] text-white dark:text-slate-900 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500">
              <Target size={120} />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500 rounded-lg">
                  <TrendingUp size={14} className="text-white" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Actionable Strategy Proposal</span>
              </div>
              <h4 className="text-base md:text-lg font-black leading-tight">
                {strategyProposal}
              </h4>
              <button className="flex items-center gap-2 text-xs font-black group-hover:gap-3 transition-all text-indigo-400 dark:text-indigo-600">
                この戦略でマーケットをスキャン
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
