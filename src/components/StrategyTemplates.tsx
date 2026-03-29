"use client";

import React, { useState, useMemo } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { STRATEGY_TEMPLATES } from "@/lib/strategyTemplates";
import { compareWithTemplate, AllocationComparison } from "@/lib/analyticsUtils";
import { 
  Compass, 
  Target, 
  ArrowRight, 
  TrendingUp, 
  Shield, 
  Zap, 
  Check,
  BarChart3,
  Waves
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

export const StrategyTemplates = () => {
  const { calculatedAssets, totalAssetsValue } = usePortfolio();
  const [selectedId, setSelectedId] = useState(STRATEGY_TEMPLATES[0].id);

  const selectedTemplate = useMemo(() => 
    STRATEGY_TEMPLATES.find(t => t.id === selectedId) || STRATEGY_TEMPLATES[0]
  , [selectedId]);

  // 現在の構成（カテゴリ別）
  const currentAllocationData = useMemo(() => {
    const categories = ["株", "FX", "仮想通貨", "投資信託"];
    return categories.map(cat => ({
      name: cat,
      value: calculatedAssets
        .filter(a => a.category === cat)
        .reduce((sum, a) => sum + a.evaluatedValue, 0)
    }));
  }, [calculatedAssets]);

  const comparison = useMemo(() => 
    compareWithTemplate(currentAllocationData, selectedTemplate.allocation)
  , [currentAllocationData, selectedTemplate]);

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899"];

  return (
    <div className="space-y-8">
      {/* テンプレート選択エリア */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STRATEGY_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => setSelectedId(template.id)}
            className={cn(
              "p-5 rounded-[28px] border-2 text-left transition-all relative overflow-hidden group",
              selectedId === template.id
                ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/10"
                : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg",
                template.riskLevel === "low" ? "bg-emerald-500 shadow-emerald-500/20" :
                template.riskLevel === "moderate" ? "bg-indigo-500 shadow-indigo-500/20" :
                "bg-rose-500 shadow-rose-500/20"
              )}>
                {template.id === "core-satellite" ? <Shield size={20} /> :
                 template.id === "aggressive" ? <Zap size={20} /> :
                 template.id === "conservative" ? <Waves size={20} /> : <Target size={20} />}
              </div>
              {selectedId === template.id && (
                <div className="bg-indigo-500 text-white rounded-full p-1">
                  <Check size={12} strokeWidth={4} />
                </div>
              )}
            </div>
            <h4 className="text-sm font-black text-slate-800 dark:text-white mb-1">{template.name}</h4>
            <p className="text-[10px] font-bold text-slate-400 line-clamp-2 leading-relaxed">
              {template.description}
            </p>
          </button>
        ))}
      </div>

      {/* 詳細比較エリア */}
      <motion.div 
        key={selectedId}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm"
      >
        <div className="p-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500 rounded-2xl text-white shadow-xl shadow-indigo-500/20">
                <Compass size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white">戦略との乖離を分析</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Strategy Alignment Analysis</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Risk</span>
              <span className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded-full border uppercase",
                selectedTemplate.riskLevel === "low" ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" :
                selectedTemplate.riskLevel === "moderate" ? "text-indigo-500 border-indigo-500/20 bg-indigo-500/5" :
                "text-rose-500 border-rose-500/20 bg-rose-500/5"
              )}>
                {selectedTemplate.riskLevel}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Chart Column */}
            <div className="space-y-6">
              <div className="h-64 relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={comparison}
                      dataKey="target"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      stroke="none"
                    >
                      {comparison.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Target</span>
                  <span className="text-lg font-black text-slate-800 dark:text-white">100%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {comparison.map((item, index) => (
                  <div key={item.category} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">{item.category}</span>
                      <span className="text-sm font-black text-slate-800 dark:text-white leading-none">{item.target}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* List Column */}
            <div className="space-y-6">
              <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <BarChart3 size={16} className="text-indigo-500" />
                現状との比較
              </h4>
              <div className="space-y-4">
                {comparison.map((item, index) => {
                  const isUnder = item.diff < -2;
                  const isOver = item.diff > 2;
                  const isPerfect = Math.abs(item.diff) <= 2;

                  return (
                    <div key={item.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-600 dark:text-slate-400">{item.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">{item.current.toFixed(1)}%</span>
                          <ArrowRight size={10} className="text-slate-300" />
                          <span className="text-xs font-black text-slate-800 dark:text-white">{item.target}%</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                        <div 
                          className="h-full bg-slate-200 dark:bg-slate-700 absolute inset-0" 
                          style={{ width: `${item.current}%` }}
                        />
                        <div 
                          className="h-full bg-indigo-500/40 absolute inset-0 border-r-2 border-indigo-500" 
                          style={{ width: `${item.target}%` }}
                        />
                      </div>
                      <div className="flex justify-end">
                        <span className={cn(
                          "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                          isUnder ? "text-amber-500 bg-amber-500/10" :
                          isOver ? "text-rose-500 bg-rose-500/10" :
                          "text-emerald-500 bg-emerald-500/10"
                        )}>
                          {isUnder ? `不足: ${Math.abs(item.diff).toFixed(1)}%` :
                           isOver ? `過剰: ${Math.abs(item.diff).toFixed(1)}%` : "TARGET CLEAR"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4">
                <button className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-white/5 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95">
                  <TrendingUp size={18} />
                  この戦略でリバランスを計画
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
