"use client";

import React, { useState, useMemo } from "react";
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
import { usePortfolio } from "@/context/PortfolioContext";
import { formatCurrency, cn } from "@/lib/utils";
import { TrendingUp, Target, PlusCircle, Info, Calculator, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export const FutureSimulation = () => {
  const { totalAssetsValue } = usePortfolio();
  
  const [initialCapital, setInitialCapital] = useState<number>(Math.round(totalAssetsValue));
  const [monthlyContribution, setMonthlyContribution] = useState<number>(50000);
  const [annualYield, setAnnualYield] = useState<number>(5);

  const projection = useMemo(() => {
    return calculateFutureProjection(initialCapital, monthlyContribution, annualYield);
  }, [initialCapital, monthlyContribution, annualYield]);

  const MilestoneCard = ({ year, data }: { year: string, data: any }) => (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
          <Calendar size={16} />
        </div>
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{year}</span>
      </div>
      <div className="space-y-1">
        <p className="text-xl font-black text-slate-800 dark:text-white">{formatCurrency(data.total)}</p>
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span className="text-slate-400">元本合計</span>
          <span className="text-slate-600 dark:text-slate-300">{formatCurrency(data.contributions)}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span className="text-emerald-500">運用益</span>
          <span className="text-emerald-500">+{formatCurrency(data.earnings)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 md:p-8 shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
            <Calculator size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white">将来シミュレーション</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Investment Projection</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Inputs */}
        <div className="space-y-6">
          <div className="space-y-4">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">初期投資額</span>
              <div className="relative">
                <input 
                  type="number" 
                  value={initialCapital} 
                  onChange={(e) => setInitialCapital(Number(e.target.value))}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none pr-12 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">円</span>
              </div>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">毎月の積立額</span>
              <div className="relative">
                <input 
                  type="number" 
                  value={monthlyContribution} 
                  onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none pr-12 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">円</span>
              </div>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">想定利回り (年利)</span>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.1"
                  value={annualYield} 
                  onChange={(e) => setAnnualYield(Number(e.target.value))}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none pr-12 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
              </div>
            </label>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-100 dark:border-amber-500/20 flex gap-3">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
              ※この計算は複利（1ヶ月複利）に基づいたシミュレーションです。将来の運用成果を保証するものではありません。
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="lg:col-span-2 h-[350px] w-full bg-slate-50/50 dark:bg-slate-800/20 rounded-[32px] p-4 border border-slate-100 dark:border-slate-800">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projection.data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" strokeOpacity={0.1} />
              <XAxis 
                dataKey="year" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                tickFormatter={(val) => `${val}年`}
              />
              <YAxis 
                hide 
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xl">
                        <p className="text-xs font-black text-slate-400 mb-2">{d.year}年後</p>
                        <p className="text-lg font-black text-slate-800 dark:text-white mb-1">{formatCurrency(d.total)}</p>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-500">元本: {formatCurrency(d.contributions)}</p>
                          <p className="text-[10px] font-bold text-emerald-500">収益: +{formatCurrency(d.earnings)}</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#6366f1" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorTotal)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MilestoneCard year="1年後" data={projection.milestones.year1} />
        <MilestoneCard year="5年後" data={projection.milestones.year5} />
        <MilestoneCard year="10年後" data={projection.milestones.year10} />
      </div>
    </div>
  );
};
