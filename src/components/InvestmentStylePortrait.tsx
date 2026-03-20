"use client";

import React, { useMemo } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { useAuth } from "@/context/AuthContext";
import { classifyInvestmentStyle, StyleAnalysisResult } from "@/lib/analyticsUtils";
import { 
  ShieldCheck, 
  Zap, 
  Compass, 
  User, 
  Calendar, 
  BarChart, 
  Activity,
  Award,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const InvestmentStylePortrait = () => {
  const { calculatedAssets } = usePortfolio();
  const { riskLevel } = useAuth(); // AuthContextやユーザー設定から

  const analysis = useMemo(() => {
    return classifyInvestmentStyle(calculatedAssets, "moderate"); // デモ用
  }, [calculatedAssets]);

  const styleConfig = {
    "long-term": {
      icon: ShieldCheck,
      color: "from-emerald-500 to-teal-600",
      lightColor: "bg-emerald-500/10 text-emerald-500",
      glow: "shadow-emerald-500/20"
    },
    "short-term": {
      icon: Zap,
      color: "from-rose-500 to-orange-600",
      lightColor: "bg-rose-500/10 text-rose-500",
      glow: "shadow-rose-500/20"
    },
    "balanced": {
      icon: Compass,
      color: "from-indigo-500 to-purple-600",
      lightColor: "bg-indigo-500/10 text-indigo-500",
      glow: "shadow-indigo-500/20"
    }
  }[analysis.style];

  const Icon = styleConfig.icon;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm relative group">
      {/* Premium Background Visuals */}
      <div className={cn(
        "absolute top-0 right-0 w-64 h-64 bg-gradient-to-br opacity-5 blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2",
        styleConfig.color
      )} />
      
      <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-10 relative z-10">
        {/* Left Side: Avatar & Badge */}
        <div className="lg:w-1/3 flex flex-col items-center justify-center space-y-6 lg:border-r border-slate-100 dark:border-slate-800 lg:pr-10">
          <div className="relative">
            <div className={cn(
              "w-32 h-32 rounded-full flex items-center justify-center p-1 border-4 border-white dark:border-slate-800 shadow-2xl relative z-10",
              styleConfig.glow
            )}>
              <div className={cn(
                "w-full h-full rounded-full flex items-center justify-center text-white bg-gradient-to-br",
                styleConfig.color
              )}>
                <Icon size={48} />
              </div>
            </div>
            {/* Animated Ring */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-full opacity-50"
            />
            <div className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800">
              <Award size={16} className="text-amber-500" />
            </div>
          </div>

          <div className="text-center space-y-1">
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
              {analysis.label}
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Investment Identity</p>
          </div>

          <div className="w-full space-y-4 pt-4">
            {[
              { label: "Frequency", value: analysis.metrics.frequency, icon: Activity },
              { label: "Hold Duration", value: analysis.metrics.duration, icon: Calendar },
              { label: "Risk Appetite", value: analysis.metrics.risk, icon: BarChart },
            ].map(m => (
              <div key={m.label} className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span className="flex items-center gap-1.5"><m.icon size={10} /> {m.label}</span>
                  <span>{m.value}%</span>
                </div>
                <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${m.value}%` }}
                    className={cn("h-full bg-gradient-to-r", styleConfig.color)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Analysis & Traits */}
        <div className="lg:w-2/3 space-y-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-500" />
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">AI 投資スタイル分析</h2>
            </div>
            <p className="text-lg font-black text-slate-800 dark:text-white leading-snug">
              「{analysis.description}」
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">主な行動特性 (TRAITS)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {analysis.traits.map((trait, i) => (
                <motion.div 
                  key={trait}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-indigo-500/30 transition-all"
                >
                  <p className="text-xs font-black text-slate-800 dark:text-white mb-1">{trait}</p>
                  <div className={cn("w-6 h-1 rounded-full bg-gradient-to-r", styleConfig.color)} />
                </motion.div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-slate-900 dark:bg-slate-800/80 rounded-[28px] text-white relative overflow-hidden group/btn cursor-pointer">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover/btn:scale-110 transition-transform">
              <Icon size={100} />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400">Personalized Insights</p>
                <h4 className="text-sm font-black">スタイルに合わせた推奨構成を見る</h4>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover/btn:translate-x-1 transition-transform">
                <ChevronRight size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChevronRight = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
);
