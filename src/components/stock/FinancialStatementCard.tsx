"use client";

import React from "react";
import { FinancialAnalysisResult } from "@/types/financial";
import { 
  BarChart, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  HelpCircle,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancialStatementCardProps {
  analysis: FinancialAnalysisResult;
}

export const FinancialStatementCard: React.FC<FinancialStatementCardProps> = ({ analysis }) => {
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A": return "text-emerald-500 border-emerald-500/20 bg-emerald-500/5";
      case "B": return "text-blue-500 border-blue-500/20 bg-blue-500/5";
      case "C": return "text-amber-500 border-amber-500/20 bg-amber-500/5";
      case "D": return "text-rose-500 border-rose-500/20 bg-rose-500/5";
      default: return "text-slate-400 border-slate-400/20 bg-slate-400/5";
    }
  };

  const getLabelBadge = (label: string, type: "pl" | "bs" | "cf") => {
    const isPositive = ["strong", "safe", "healthy"].includes(label);
    const isWarning = ["caution"].includes(label);
    
    return (
      <span className={cn(
        "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
        isPositive ? "bg-emerald-500/10 text-emerald-500" : 
        isWarning ? "bg-amber-500/10 text-amber-500" : 
        "bg-rose-500/10 text-rose-500"
      )}>
        {label === "strong" ? "強い" : 
         label === "normal" ? "普通" : 
         label === "weak" ? "弱い" : 
         label === "safe" ? "安全" : 
         label === "risky" ? "危険" : 
         label === "healthy" ? "健全" : 
         label === "caution" ? "注意" : "不健全"}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-2xl">
            <FileText size={20} />
          </div>
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">財務諸表判定分析</h3>
        </div>
        <div className={cn(
          "w-12 h-12 flex items-center justify-center rounded-2xl border-2 font-black text-2xl shadow-sm",
          getGradeColor(analysis.financialGrade)
        )}>
          {analysis.financialGrade}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PL Analysis */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">損益計算書 (PL)</span>
            {getLabelBadge(analysis.plLabel, "pl")}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-800 dark:text-white">{analysis.plScore}</span>
            <span className="text-[10px] font-bold text-slate-400">/100</span>
          </div>
          <ul className="space-y-1.5">
            {analysis.plReasons.slice(0, 2).map((r, i) => (
              <li key={i} className="text-[10px] font-bold text-slate-500 flex items-start gap-1.5">
                <TrendingUp size={12} className="mt-0.5 text-indigo-500/50" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* BS Analysis */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">貸借対照表 (BS)</span>
            {getLabelBadge(analysis.bsLabel, "bs")}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-800 dark:text-white">{analysis.bsScore}</span>
            <span className="text-[10px] font-bold text-slate-400">/100</span>
          </div>
          <ul className="space-y-1.5">
            {analysis.bsReasons.slice(0, 2).map((r, i) => (
              <li key={i} className="text-[10px] font-bold text-slate-500 flex items-start gap-1.5">
                <ShieldCheck size={12} className="mt-0.5 text-emerald-500/50" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CF Analysis */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">キャッシュフロー (CF)</span>
            {getLabelBadge(analysis.cfLabel, "cf")}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-800 dark:text-white">{analysis.cfScore}</span>
            <span className="text-[10px] font-bold text-slate-400">/100</span>
          </div>
          <ul className="space-y-1.5">
            {analysis.cfReasons.slice(0, 2).map((r, i) => (
              <li key={i} className="text-[10px] font-bold text-slate-500 flex items-start gap-1.5">
                <Activity size={12} className="mt-0.5 text-blue-500/50" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-3xl bg-slate-50/30 dark:bg-slate-900/20 space-y-4">
        <div className="flex items-center gap-2">
           <BarChart size={16} className="text-indigo-500" />
           <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">三表整合性・リスク判定</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {analysis.riskFlags.length === 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/5 text-emerald-500 rounded-xl text-[10px] font-black border border-emerald-500/10">
              <CheckCircle2 size={12} />
              重大な財務リスクは検出されませんでした
            </div>
          ) : (
            analysis.riskFlags.map((flag, i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/5 text-rose-500 rounded-xl text-[10px] font-black border border-rose-500/10">
                <AlertTriangle size={12} />
                {flag === "net_income_up_operating_cf_down" ? "利益増/営業CF減の不整合" : 
                 flag === "low_equity_ratio" ? "自己資本比率の低下" : 
                 flag === "repeated_negative_operating_cf" ? "営業CFの連続マイナス" : 
                 flag === "high_dividend_weak_cf_flag" ? "CF不足での高配当維持" : flag}
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic">
            &ldquo;{analysis.financialComment}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
};
