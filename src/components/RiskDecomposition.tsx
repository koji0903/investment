"use client";

import React, { useMemo } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { calculatePortfolioRisk } from "@/lib/analyticsUtils";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { formatCurrency, cn } from "@/lib/utils";
import { ShieldAlert, Fingerprint, PieChart as PieChartIcon, Info, Zap, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export const RiskDecomposition = () => {
  const { calculatedAssets } = usePortfolio();
  
  const riskData = useMemo(() => {
    return calculatePortfolioRisk(calculatedAssets);
  }, [calculatedAssets]);

  // リスク寄与度が高い順にソート (Top 5)
  const chartData = useMemo(() => {
    return riskData.assetRisks
      .sort((a, b) => b.riskContribution - a.riskContribution)
      .slice(0, 8)
      .map(ar => ({
        name: ar.name,
        value: Math.round(ar.riskContribution * 100),
        rawRisk: ar.riskScore,
        weight: Math.round(ar.contribution * 100)
      }));
  }, [riskData]);

  const CATEGORY_COLORS: Record<string, string> = {
    "株": "#6366f1", // indigo-500
    "投資信託": "#10b981", // emerald-500
    "仮想通貨": "#f43f5e", // rose-500
    "FX": "#f59e0b", // amber-500
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 md:p-8 shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500 rounded-2xl text-white shadow-lg shadow-rose-500/20">
            <Fingerprint size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white">リスク分解・分散効果</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Risk Decomposition</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Risk Contribution Chart */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <PieChartIcon size={16} className="text-indigo-500" />
              資産ごとのリスク寄与度 (%)
            </h3>
            <span className="text-[10px] font-bold text-slate-400">Total: 100%</span>
          </div>

          <div className="h-[300px] w-full bg-slate-50/50 dark:bg-slate-800/20 rounded-3xl p-4 border border-slate-100 dark:border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: -10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#888888" strokeOpacity={0.05} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={90}
                  tick={{ fontSize: 11, fontWeight: 700, fill: "#94a3b8" }}
                />
                <Tooltip 
                  cursor={{ fill: "rgba(99, 102, 241, 0.05)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xl">
                          <p className="text-xs font-black text-slate-800 dark:text-white mb-2">{d.name}</p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-6">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">リスク寄与度</span>
                              <span className="text-sm font-black text-indigo-500">{d.value}%</span>
                            </div>
                            <div className="flex items-center justify-between gap-6">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">保有比率</span>
                              <span className="text-[11px] font-black text-slate-600 dark:text-slate-300">{d.weight}%</span>
                            </div>
                            <div className="flex items-center justify-between gap-6">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">個別リスク</span>
                              <span className="text-[11px] font-black text-rose-500">{d.rawRisk}/100</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.value > entry.weight * 1.5 ? "#f43f5e" : "#6366f1"} 
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="px-2 text-[11px] text-slate-400 leading-relaxed font-medium">
            <Zap size={12} className="inline mr-1 text-amber-500" />
            <span className="text-rose-500">赤色</span>のバーは、保有比率に対してリスク寄与が過大な資産（ハイリスク銘柄）を示しています。
          </p>
        </div>

        {/* Diversification Insight */}
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6 px-2">
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300">分散・安定性分析</h3>
          </div>

          <div className="flex-1 space-y-6">
            {/* Diversification Gauge */}
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck size={120} />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">分散効果スコア</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black tabular-nums">{Math.round(riskData.diversificationScore)}</span>
                  <span className="text-lg font-bold opacity-80">/ 100</span>
                </div>
                <div className="mt-4 h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${riskData.diversificationScore}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  />
                </div>
                <p className="mt-4 text-xs font-bold leading-relaxed opacity-90">
                  {riskData.diversificationScore >= 80 ? "優れた分散効果が得られています。少数の銘柄にリスクが集中せず、堅牢なポートフォリオです。" :
                   riskData.diversificationScore >= 50 ? "一定の分散効果がありますが、特定の銘柄やアセットクラスがリスクの大部分を占めています。" :
                   "リスクの集中が顕著です。暴落時のダメージを抑えるため、相関の低い資産への分散を推奨します。"}
                </p>
              </div>
            </div>

            {/* Top Risk Drivers */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">主要なリスク要因</h4>
              <div className="grid grid-cols-1 gap-3">
                {riskData.highRiskAssets.slice(0, 2).map((ar, i) => (
                  <div key={ar.assetId} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-8 bg-rose-500 rounded-full" />
                      <div>
                        <p className="text-xs font-black text-slate-800 dark:text-white">{ar.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{ar.category} / 個別スコア: {ar.riskScore}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-rose-500">+{Math.round(ar.riskContribution * 100)}%</p>
                      <p className="text-[10px] font-bold text-slate-400">リスク寄与</p>
                    </div>
                  </div>
                ))}
                {riskData.highRiskAssets.length === 0 && (
                  <div className="p-4 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                    <p className="text-[11px] font-bold text-slate-400">リスクの突出した資産はありません</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
