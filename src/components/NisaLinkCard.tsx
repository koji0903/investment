"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight, TrendingUp, PieChart } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface NisaLinkCardProps {
  growthUsage: number;
  accumulationUsage: number;
  className?: string;
}

export const NisaLinkCard = ({ growthUsage, accumulationUsage, className }: NisaLinkCardProps) => {
  const totalUsage = growthUsage + accumulationUsage;
  const yearlyLimit = 3600000; // 240 + 120
  const usagePct = Math.min((totalUsage / yearlyLimit) * 100, 100);

  return (
    <Link href="/nisa" className={cn("block group", className)}>
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-2xl hover:border-indigo-500/30 relative overflow-hidden h-full flex flex-col justify-between">
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">NISA 活用状況</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">NISA Tax-Free Quota</p>
              </div>
            </div>
            <ArrowRight className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" size={24} />
          </div>

          <div className="space-y-5">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">本年度の使用額</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(totalUsage)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">消化率</span>
                <div className="text-xl font-black text-indigo-500">{usagePct.toFixed(1)}%</div>
              </div>
            </div>

            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                style={{ width: `${usagePct}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-400">つみたて: {formatCurrency(accumulationUsage)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-bold text-slate-400">成長投資: {formatCurrency(growthUsage)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-all duration-700 group-hover:scale-150 group-hover:-rotate-12">
          <ShieldCheck size={160} />
        </div>
      </div>
    </Link>
  );
};
