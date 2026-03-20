"use client";

import React, { useState, useMemo } from "react";
import { 
  calculateScenarioComparison, 
  ScenarioConfig, 
  getScenarioRiskLevel
} from "@/lib/analyticsUtils";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { usePortfolio } from "@/context/PortfolioContext";
import { Layers, Plus, Trash2, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = [
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#f43f5e", // Rose
];

export const ScenarioComparison = () => {
  const { totalAssetsValue } = usePortfolio();
  
  const [scenarios, setScenarios] = useState<ScenarioConfig[]>([
    {
      id: "scenario-1",
      name: "堅実プラン",
      initialCapital: Math.round(totalAssetsValue),
      monthlyContribution: 50000,
      annualYield: 3,
      color: COLORS[0]
    },
    {
      id: "scenario-2",
      name: "成長重視",
      initialCapital: Math.round(totalAssetsValue),
      monthlyContribution: 50000,
      annualYield: 7,
      color: COLORS[1]
    }
  ]);

  const comparisonData = useMemo(() => {
    return calculateScenarioComparison(scenarios);
  }, [scenarios]);

  const addScenario = () => {
    if (scenarios.length >= 3) return;
    const newId = `scenario-${Date.now()}`;
    setScenarios([...scenarios, {
      id: newId,
      name: `プラン ${scenarios.length + 1}`,
      initialCapital: Math.round(totalAssetsValue),
      monthlyContribution: 50000,
      annualYield: 5,
      color: COLORS[scenarios.length]
    }]);
  };

  const removeScenario = (id: string) => {
    if (scenarios.length <= 1) return;
    setScenarios(scenarios.filter(s => s.id !== id));
  };

  const updateScenario = (id: string, updates: Partial<ScenarioConfig>) => {
    setScenarios(scenarios.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 md:p-8 shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white">投資シナリオ比較</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scenario Comparison</p>
          </div>
        </div>
        
        {scenarios.length < 3 && (
          <button 
            onClick={addScenario}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm font-black rounded-full transition-all border border-transparent hover:border-indigo-200"
          >
            <Plus size={16} />
            シナリオを追加
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
        {/* Scenario Controls */}
        <div className="xl:col-span-1 space-y-4">
          <AnimatePresence initial={false}>
            {scenarios.map((s, index) => (
              <motion.div 
                key={s.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="relative bg-slate-50 dark:bg-slate-800/40 rounded-[28px] p-5 border border-slate-100 dark:border-slate-800/60 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <input 
                      value={s.name} 
                      onChange={(e) => updateScenario(s.id, { name: e.target.value })}
                      className="bg-transparent text-sm font-black text-slate-800 dark:text-white outline-none border-b border-transparent focus:border-indigo-400 pb-0.5 w-32"
                    />
                  </div>
                  {scenarios.length > 1 && (
                    <button 
                      onClick={() => removeScenario(s.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">月額積立</p>
                    <div className="relative">
                      <input 
                        type="number"
                        value={s.monthlyContribution}
                        onChange={(e) => updateScenario(s.id, { monthlyContribution: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 rounded-xl text-[13px] font-bold border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">想定利回り</p>
                    <div className="relative">
                      <input 
                        type="number"
                        step="0.1"
                        value={s.annualYield}
                        onChange={(e) => updateScenario(s.id, { annualYield: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 rounded-xl text-[13px] font-bold border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className={cn(
                      getScenarioRiskLevel(s.annualYield) === "High" ? "text-rose-500" : 
                      getScenarioRiskLevel(s.annualYield) === "Moderate" ? "text-amber-500" : "text-emerald-500"
                    )} />
                    <span className="text-[10px] font-bold text-slate-500">リスク: {
                      getScenarioRiskLevel(s.annualYield) === "High" ? "高い" : 
                      getScenarioRiskLevel(s.annualYield) === "Moderate" ? "中程度" : "低い"
                    }</span>
                  </div>
                  <p className="text-xs font-black text-slate-800 dark:text-white">
                    最終予想: {formatCurrency(comparisonData[30][s.id] || 0)}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Multi-line Chart */}
        <div className="xl:col-span-2 h-[450px] w-full bg-slate-50/50 dark:bg-slate-800/20 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={comparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" strokeOpacity={0.1} />
              <XAxis 
                dataKey="year" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                tickFormatter={(val) => `${val}年`}
              />
              <YAxis hide />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xl space-y-3">
                        <p className="text-xs font-black text-slate-400">{payload[0].payload.year}年後</p>
                        {payload.map((p, i) => {
                          const scenario = scenarios.find(s => s.id === p.dataKey);
                          return (
                            <div key={i} className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                <span className="text-[11px] font-black text-slate-500">{scenario?.name}</span>
                              </div>
                              <p className="text-sm font-black text-slate-800 dark:text-white ml-4">{formatCurrency(p.value as number)}</p>
                            </div>
                          )
                        })}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                content={({ payload }) => (
                  <div className="flex items-center justify-center gap-6 mt-4">
                    {payload?.map((p: any, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{p.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              />
              {scenarios.map((s) => (
                <Line 
                  key={s.id}
                  type="monotone" 
                  dataKey={s.id} 
                  name={s.name}
                  stroke={s.color} 
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  animationDuration={1500}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insight Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-[28px] border border-indigo-100 dark:border-indigo-500/10">
          <h4 className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <TrendingUp size={14} />
            期待リターン比較
          </h4>
          <p className="text-[13px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
            想定利回りを1%上げるだけで、30年後の資産額は大きく変わります。
            例えば、利回りを {scenarios[0].annualYield}% から {scenarios[1]?.annualYield || scenarios[0].annualYield + 1}% に引き上げることで、
            {formatCurrency(Math.abs((comparisonData[30][scenarios[1]?.id || scenarios[0].id] || 0) - (comparisonData[30][scenarios[0].id] || 0)))} もの差が生まれる可能性があります。
          </p>
        </div>
        <div className="p-5 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-[28px] border border-emerald-100 dark:border-emerald-500/10">
          <h4 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <CheckCircle2 size={14} />
            リスク管理の視点
          </h4>
          <p className="text-[13px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
            高い利回りは魅力的ですが、市場の変動リスクも高まります。
            目標金額を達成するために必要な「最低限の利回り」を見極め、過度なリスクを取らないプランニングを推奨します。
          </p>
        </div>
      </div>
    </div>
  );
};
