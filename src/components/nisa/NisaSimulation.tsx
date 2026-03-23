"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  calculateFutureProjection, 
  ProjectionResult 
} from "@/lib/analyticsUtils";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { formatCurrency, cn } from "@/lib/utils";
import { TrendingUp, Target, PlusCircle, Info, Calculator, Calendar, Landmark, PiggyBank } from "lucide-react";
import { motion } from "framer-motion";

interface NisaSimulationProps {
  initialCapital: number;
  monthlyContribution: number;
  className?: string;
}

const TAX_RATE = 0.20315; // 住民税含む非課税メリット計算用

export const NisaSimulation = ({ initialCapital: defaultInitial, monthlyContribution: defaultMonthly, className }: NisaSimulationProps) => {
  const [initialCapital, setInitialCapital] = useState<number>(defaultInitial);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(defaultMonthly);
  const [annualYield, setAnnualYield] = useState<number>(5);
  const [years, setYears] = useState<number>(20);

  // プロパティが更新されたらステートを更新（初期化時のみまたは設定変更時）
  useEffect(() => {
    setInitialCapital(defaultInitial);
    setMonthlyContribution(defaultMonthly);
  }, [defaultInitial, defaultMonthly]);

  const projection = useMemo(() => {
    return calculateFutureProjection(initialCapital, monthlyContribution, annualYield, years);
  }, [initialCapital, monthlyContribution, annualYield, years]);

  const finalData = projection.data[projection.data.length - 1];
  const taxSavings = Math.round(finalData.earnings * TAX_RATE);

  const MilestoneCard = ({ yearLabel, data }: { yearLabel: string, data: any }) => (
    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
          <Calendar size={16} />
        </div>
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{yearLabel}</span>
      </div>
      <div className="space-y-2">
        <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{formatCurrency(data.total)}</p>
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="text-slate-400">元本合計</span>
          <span className="text-slate-600 dark:text-slate-300">{formatCurrency(data.contributions)}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-bold pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-emerald-500">運用益</span>
          <span className="text-emerald-500">+{formatCurrency(data.earnings)}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-black text-indigo-500 pt-1">
          <span>推定節税額</span>
          <span>+{formatCurrency(Math.round(data.earnings * TAX_RATE))}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-sm overflow-hidden", className)}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
            <Calculator size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">NISA 将来シミュレーション</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Interactive Tax-Free Projection</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 bg-indigo-50 dark:bg-indigo-500/5 px-6 py-4 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
          <div className="text-right">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1">推定合計節税額 ({years}年)</span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
              {formatCurrency(taxSavings)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-600">
            <Landmark size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Controls */}
        <div className="xl:col-span-4 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-6">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <PiggyBank size={14} className="text-indigo-500" /> NISA資産・初期原資
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={initialCapital} 
                  onChange={(e) => setInitialCapital(Number(e.target.value))}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none pr-12 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">円</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <PlusCircle size={14} className="text-emerald-500" /> 毎月の新規積立
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={monthlyContribution} 
                  onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none pr-12 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">円</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={14} className="text-amber-500" /> 想定利回り (年利)
              </label>
              <div className="space-y-4">
                <input 
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={annualYield}
                  onChange={(e) => setAnnualYield(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold text-slate-400">0%</span>
                  <span className="text-sm font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-lg">{annualYield}%</span>
                  <span className="text-[10px] font-bold text-slate-400">15%</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14} className="text-slate-500" /> 積立期間
              </label>
              <select
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
              >
                {[5, 10, 15, 20, 25, 30].map(y => (
                  <option key={y} value={y}>{y}年間</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-5 bg-amber-50 dark:bg-amber-500/5 rounded-[1.5rem] border border-amber-100 dark:border-amber-500/20 flex gap-4">
            <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed font-medium">
              節税額は、運用益に対して一律20.315%の税率が課せられた場合と比較して算出しています。手数料や信託報酬は考慮されていません。
            </p>
          </div>
        </div>

        {/* Chart Area */}
        <div className="xl:col-span-8 flex flex-col gap-8">
          <div className="h-[400px] w-full bg-slate-50/50 dark:bg-slate-800/30 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-800 relative group transition-all">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projection.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" strokeOpacity={0.05} />
                <XAxis 
                  dataKey="year" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 800, fill: "#94a3b8" }}
                  tickFormatter={(val) => `${val}y`}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-2xl space-y-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.year}年目</p>
                          <div className="space-y-1">
                            <p className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(d.total)}</p>
                            <div className="flex items-center justify-between text-[11px] font-bold gap-8">
                              <span className="text-slate-400">元本合計</span>
                              <span className="text-slate-600 dark:text-slate-300">{formatCurrency(d.contributions)}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-500 gap-8">
                              <span>運用損益</span>
                              <span>+{formatCurrency(d.earnings)}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-black text-indigo-500 border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                              <span>節税金額</span>
                              <span>+{formatCurrency(Math.round(d.earnings * TAX_RATE))}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="contributions" 
                  stroke="#94a3b8" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fillOpacity={1} 
                  fill="url(#colorCost)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#6366f1" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Milestones */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <MilestoneCard yearLabel="5年後" data={projection.milestones.year5 || projection.data[5]} />
            <MilestoneCard yearLabel="10年後" data={projection.milestones.year10 || projection.data[10]} />
            <MilestoneCard yearLabel={`${years}年後 (完結)`} data={finalData} />
          </div>
        </div>
      </div>
    </div>
  );
};
