"use client";

import React from "react";
import Link from "next/link";
import { BarChart3, ArrowRight, Zap, Target, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export const StockJudgmentLinkCard = () => {
  return (
    <Link href="/stock-judgment">
      <motion.div 
        whileHover={{ y: -5, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group relative h-full p-8 rounded-[40px] bg-gradient-to-br from-slate-900 to-slate-800 dark:from-white dark:to-slate-100 text-white dark:text-slate-900 shadow-2xl shadow-slate-900/20 dark:shadow-white/10 overflow-hidden cursor-pointer border border-white/10 dark:border-slate-200"
      >
        {/* Decorative elements */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-colors" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors" />

        <div className="relative z-10 flex flex-col h-full justify-between gap-8">
          <div className="flex items-center justify-between">
            <div className="p-4 bg-white/10 dark:bg-slate-900/5 rounded-2xl backdrop-blur-md border border-white/10 dark:border-slate-200 shadow-inner">
              <BarChart3 size={28} className="text-white dark:text-slate-900" />
            </div>
            <div className="flex gap-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400/60" />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 dark:text-indigo-500">Analysis Engine</span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
                日本株投資<br />判断エンジン
              </h2>
            </div>
            
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 leading-relaxed max-w-[240px]">
              国内上場銘柄を4軸で多角的に分析。買い・売りのチャンスをAIがスコアリング。
            </p>

            <div className="flex items-center gap-4 pt-2">
               <div className="flex items-center gap-1.5">
                  <Zap size={10} className="text-amber-400" />
                  <span className="text-[9px] font-black uppercase">Technical</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <Target size={10} className="text-emerald-400" />
                  <span className="text-[9px] font-black uppercase">Fundamental</span>
               </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 group-hover:translate-x-1 transition-transform">
            <span className="text-xs font-black uppercase tracking-widest text-white/50 dark:text-slate-400">Launch Matrix</span>
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-slate-900 dark:text-white shadow-lg">
              <ArrowRight size={20} />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
