"use client";

import React, { useState, useMemo } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { generateScenarioStrategies, calculateMarketCondition } from "@/lib/analyticsUtils";
import { TrendingUp, TrendingDown, HelpCircle, ShieldAlert, ArrowRight, ShieldCheck, PieChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const ScenarioStrategyOptimization = () => {
  const { calculatedAssets } = usePortfolio();
  
  // デモ用の市場スコア計算
  const market = useMemo(() => calculateMarketCondition(4.0, 0.8, 0.2), []);
  const scenarios = useMemo(() => generateScenarioStrategies(market.score), [market]);
  
  const [activeTab, setActiveTab] = useState<"bull" | "uncertain" | "bear">("uncertain");
  const activeScenario = scenarios.find(s => s.id === activeTab) || scenarios[1];

  // 現在のカテゴリ別比率
  const currentAllocation = useMemo(() => {
    const total = calculatedAssets.reduce((sum, a) => sum + Math.max(0, a.evaluatedValue), 0);
    const categoryTotals: Record<string, number> = {};
    calculatedAssets.forEach(a => {
      categoryTotals[a.category] = (categoryTotals[a.category] || 0) + Math.max(0, a.evaluatedValue);
    });
    return Object.entries(categoryTotals).map(([category, value]) => ({
      category,
      ratio: total > 0 ? (value / total) * 100 : 0
    }));
  }, [calculatedAssets]);

  const tabs = [
    { id: "bull", label: "上昇期待", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-500" },
    { id: "uncertain", label: "波乱含み", icon: HelpCircle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-500" },
    { id: "bear", label: "下落警戒", icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10", border: "border-rose-500" }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm relative group">
      <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform">
        <PieChart size={120} className="text-indigo-500" />
      </div>

      <div className="p-6 md:p-8 space-y-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">AI シナリオ別・投資戦略</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">さまざまな未来に備えるプラン</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const scenarioInfo = scenarios.find(s => s.id === tab.id);
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-black",
                  isActive 
                    ? cn(tab.bg, tab.color, tab.border, "shadow-sm") 
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {isActive && scenarioInfo && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/50 dark:bg-black/20 ml-1">
                    確率 {scenarioInfo.probability}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <ShieldAlert size={18} className="text-indigo-500" />
                  {activeScenario.scenario} の場合
                </h3>
                
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">AIからのお知らせ</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                    {activeScenario.description}
                  </p>
                </div>

                <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 space-y-2">
                  <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest leading-none">おすすめの対応（戦略）</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-white leading-relaxed">
                    {activeScenario.recommendedStrategy}
                  </p>
                </div>
                
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 pl-1 border-l-2 border-slate-300 dark:border-slate-600">
                  <span className="font-black">期待される効果：</span> {activeScenario.expectedImpact}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Target Allocation Comparison */}
          <div className="space-y-5">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              資産配分シミュレーション (現在 vs AI推奨)
            </h4>
            
            <div className="space-y-4">
              {activeScenario.targetAllocation.map(target => {
                const current = currentAllocation.find(c => c.category === target.category)?.ratio || 0;
                
                return (
                  <div key={target.category} className="space-y-1.5">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-black text-slate-800 dark:text-white">{target.category}</span>
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span className="text-slate-400">現在 {current.toFixed(1)}%</span>
                        <ArrowRight size={12} className="text-slate-300" />
                        <span className="text-indigo-500 dark:text-indigo-400">推奨 {target.ratio}%</span>
                      </div>
                    </div>
                    
                    <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      {/* ターゲット（薄い背景） */}
                      <div 
                        className="absolute h-full bg-indigo-100 dark:bg-indigo-900/40 rounded-full"
                        style={{ width: `${target.ratio}%` }}
                      />
                      {/* 現在地（濃いバー） */}
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${current}%` }}
                        className={cn(
                          "absolute h-full rounded-full bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-500",
                          current > target.ratio && "from-rose-400 to-rose-500" // 目標より持ちすぎている場合は警告色
                        )}
                      />
                      {/* ターゲットマーカー */}
                      <motion.div
                        animate={{ left: `${target.ratio}%` }}
                        className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 shadow-[0_0_4px_rgba(99,102,241,0.5)] z-10"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex items-center justify-end gap-2 pt-2">
               <div className="w-2 h-2 rounded-full bg-slate-400" />
               <span className="text-[10px] font-bold text-slate-400">現在の割合</span>
               <div className="w-0.5 h-3 bg-indigo-500 ml-2" />
               <span className="text-[10px] font-bold text-slate-400">AI推奨の割合</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
