"use client";

import React from "react";
import { NisaProgress } from "@/types/nisa";
import { formatCurrency, cn } from "@/lib/utils";
import { ShieldCheck, TrendingUp, PieChart, Info } from "lucide-react";
import { motion } from "framer-motion";

interface NisaStatusCardProps {
  progress: NisaProgress;
  className?: string;
}

export const NisaStatusCard = ({ progress, className }: NisaStatusCardProps) => {
  const { growthYearlyUsage, accumulationYearlyUsage, totalAccumulated, limits } = progress;
  
  const growthPct = Math.min((growthYearlyUsage / limits.yearlyGrowth) * 100, 100);
  const accumulationPct = Math.min((accumulationYearlyUsage / limits.yearlyAccumulation) * 100, 100);
  const lifetimePct = Math.min((totalAccumulated / limits.lifetimeTotal) * 100, 100);

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6", className)}>
      {/* 成長投資枠 */}
      <StatusItem
        title="成長投資枠"
        usage={growthYearlyUsage}
        limit={limits.yearlyGrowth}
        percent={growthPct}
        color="bg-indigo-500"
        icon={TrendingUp}
        description="株式・ETF・投信など"
      />

      {/* つみたて投資枠 */}
      <StatusItem
        title="つみたて投資枠"
        usage={accumulationYearlyUsage}
        limit={limits.yearlyAccumulation}
        percent={accumulationPct}
        color="bg-emerald-500"
        icon={PieChart}
        description="長期・積立・分散投資"
      />

      {/* 生涯投資枠 */}
      <StatusItem
        title="生涯投資枠"
        usage={totalAccumulated}
        limit={limits.lifetimeTotal}
        percent={lifetimePct}
        color="bg-slate-800 dark:bg-slate-200"
        icon={ShieldCheck}
        description="非課税保有限度額"
        isLifetime
      />
    </div>
  );
};

interface StatusItemProps {
  title: string;
  usage: number;
  limit: number;
  percent: number;
  color: string;
  icon: React.ElementType;
  description: string;
  isLifetime?: boolean;
}

const StatusItem = ({ title, usage, limit, percent, color, icon: Icon, description, isLifetime }: StatusItemProps) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg", color)}>
              <Icon size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">{title}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{description}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-black text-slate-400">充足率</span>
            <div className="text-lg font-black text-slate-900 dark:text-white">{percent.toFixed(1)}%</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-end justify-between">
            <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(usage)}
              <span className="text-xs text-slate-400 font-bold ml-1">使用済み</span>
            </div>
            <div className="text-xs font-bold text-slate-400">
              上限: {formatCurrency(limit)}
            </div>
          </div>
          
          <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn("h-full rounded-full shadow-sm", color)}
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Info size={10} /> 残り非課税枠
          </span>
          <span className="text-xs font-black text-indigo-500">
            {formatCurrency(limit - usage)}
          </span>
        </div>
      </div>

      {/* Background patterns */}
      <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-700">
        <Icon size={120} />
      </div>
    </div>
  );
};
