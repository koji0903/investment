"use client";

import React, { useMemo } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { useAuth } from "@/context/AuthContext";
import { calculateOptimalPortfolio, OptimizationSegment } from "@/lib/analyticsUtils";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  ArrowRight
} from "recharts";
import { cn } from "@/lib/utils";
import { Cpu, Repeat, ArrowRight as ArrowRightIcon, Zap, Target, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const PortfolioOptimization = () => {
  const { calculatedAssets } = usePortfolio();
  // 注意: 本来はFirestoreなどからユーザーのリスク許容度を取得するが、
  // ここではデモとして moderate をデフォルトとする
  const riskTolerance: "low" | "moderate" | "high" = "moderate"; 

  const optimization = useMemo(() => {
    return calculateOptimalPortfolio(calculatedAssets, riskTolerance);
  }, [calculatedAssets, riskTolerance]);

  const currentAllocationData = useMemo(() => {
    return optimization.segments
      .filter(s => s.currentValue > 0)
      .map(s => ({
        name: s.category,
        value: s.currentRatio,
        color: s.color
      }));
  }, [optimization]);

  const targetAllocationData = useMemo(() => {
    return optimization.segments
      .filter(s => s.targetRatio > 0)
      .map(s => ({
        name: s.category,
        value: s.targetRatio,
        color: s.color
      }));
  }, [optimization]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 md:p-8 shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500 rounded-2xl text-white shadow-lg shadow-sky-500/20">
            <Cpu size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white">AI ポートフォリオ最適化</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Portfolio Optimization</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-full border border-slate-100 dark:border-slate-800">
          <Target size={14} className="text-sky-500" />
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
            目標: {riskTolerance === "low" ? "安定重視" : riskTolerance === "high" ? "積極成長" : "バランス"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        {/* Comparison Charts */}
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4 h-[240px]">
            {/* Current */}
            <div className="flex flex-col items-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">現在</p>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentAllocationData}
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {currentAllocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-lg">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{payload[0].name}</p>
                            <p className="text-sm font-black text-slate-800 dark:text-white">{payload[0].value}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Target */}
            <div className="flex flex-col items-center relative">
              <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
                <div className="p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full shadow-md text-slate-400">
                  <ArrowRightIcon size={16} />
                </div>
              </div>
              <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.2em] mb-4">目標配分</p>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={targetAllocationData}
                    innerRadius={45}
                    outerRadius={80} // ターゲットを少し大きくして強調
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {targetAllocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-lg">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{payload[0].name}</p>
                            <p className="text-sm font-black text-sky-500">{payload[0].value}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-5 bg-sky-50/50 dark:bg-sky-500/5 rounded-[28px] border border-sky-100 dark:border-sky-500/10">
            <h4 className="text-xs font-black text-sky-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <TrendingUp size={14} />
              AI最適化インサイト
            </h4>
            <p className="text-[12px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {optimization.rationalAdvice}
              現在、ポートフォリオの一部で目標とするバランスからの乖離が見られます。
              効率的なリスク・リターン特性を維持するため、以下の調整を推奨します。
            </p>
          </div>
        </div>

        {/* Action List */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 px-2 flex items-center gap-2">
            <Repeat size={16} className="text-indigo-500" />
            リバランス調整案
          </h3>
          <div className="space-y-3">
            {optimization.segments.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).map((s, index) => (
              <motion.div 
                key={s.category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: s.color }} />
                  <div>
                    <label className="text-xs font-black text-slate-800 dark:text-white">{s.category}</label>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      現在 {s.currentRatio}% → 目標 {s.targetRatio}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "text-[13px] font-black flex items-center justify-end gap-1",
                    s.delta > 0 ? "text-emerald-500" : s.delta < 0 ? "text-rose-500" : "text-slate-400"
                  )}>
                    {s.delta > 0 ? "+" : ""}{formatCurrency(s.delta)}
                    {s.delta !== 0 && (
                      <span className="text-[10px] bg-current opacity-10 px-1.5 py-0.5 rounded uppercase">
                        {s.delta > 0 ? "追加" : "削減"}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">調整見込額</p>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-6 flex items-start gap-2 p-3 bg-amber-50/30 dark:bg-amber-500/5 rounded-xl border border-amber-100/50 dark:border-amber-500/10">
            <Zap size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-600 dark:text-amber-400/80 leading-relaxed font-bold">
              目標配分への調整は、新規資金の投入時や利益確定のタイミングで段階的に行うことをお勧めします。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
