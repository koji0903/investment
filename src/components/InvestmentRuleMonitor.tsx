"use client";

import React, { useMemo } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { detectRuleViolations } from "@/lib/ruleViolationUtils";
import { 
  AlertTriangle, 
  Info, 
  ShieldAlert, 
  ZapOff, 
  MessageSquare,
  ArrowRight,
  TrendingDown,
  Repeat
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const InvestmentRuleMonitor = () => {
  const { transactions } = usePortfolio();
  
  const violations = useMemo(() => detectRuleViolations(transactions), [transactions]);

  if (violations.length === 0) return null;

  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="text-rose-500" size={18} />
        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">投資ルール遵守状況</h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {violations.map((violation, index) => (
            <motion.div
              key={violation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-6 rounded-[28px] border-2 flex flex-col md:flex-row items-start gap-6 relative overflow-hidden",
                violation.severity === "high" 
                  ? "border-rose-500/20 bg-rose-500/5" 
                  : "border-amber-500/20 bg-amber-500/5"
              )}
            >
              {/* 装飾用の背景アイコン */}
              <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                {violation.type === "nanpin" ? <TrendingDown size={120} /> : <ZapOff size={120} />}
              </div>

              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                violation.severity === "high" ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
              )}>
                {violation.type === "nanpin" ? <TrendingDown size={24} /> : <Repeat size={24} />}
              </div>

              <div className="flex-1 space-y-2 relative z-10">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded-full uppercase",
                    violation.severity === "high" ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
                  )}>
                    {violation.severity === "high" ? "Critical Warning" : "Attention Required"}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {new Date(violation.createdAt).toLocaleString('ja-JP')}
                  </span>
                </div>
                <h4 className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                  {violation.message}
                </h4>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                  {violation.details}
                </p>
                
                <div className="pt-4 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    <MessageSquare size={14} className="text-indigo-500" />
                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">AIアドバイス: 24時間の取引停止を推奨</span>
                  </div>
                </div>
              </div>

              <button className="self-end md:self-center p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                <ArrowRight size={18} className="text-slate-400" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
