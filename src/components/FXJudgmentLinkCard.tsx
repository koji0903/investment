"use client";

import React from "react";
import { Zap, TrendingUp, ChevronRight, Sparkles, Activity } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export const FXJudgmentLinkCard = () => {
  return (
    <Link href="/fx-judgment">
      <motion.div 
        whileHover={{ scale: 1.02, y: -5 }}
        whileTap={{ scale: 0.98 }}
        className="relative group overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 rounded-[32px] p-8 text-white shadow-xl shadow-amber-500/20 cursor-pointer"
      >
        {/* Animated Background Ornaments */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-400/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
              <Zap size={12} className="text-white" fill="currentColor" />
              Analyze Now
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tighter">FX 投資判断エンジン</h2>
            <p className="text-sm font-bold text-orange-50/80 max-w-sm leading-relaxed">
              テクニカル・ファンダメンタル・スワップを統合分析。短期売買と中長期保有の優位性をAIが即座に判定。
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center -space-x-3">
               {[1,2,3].map(i => (
                 <div key={i} className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                    <Activity size={20} className="text-white/60" />
                 </div>
               ))}
            </div>
            <div className="w-14 h-14 bg-white text-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <ChevronRight size={24} />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
