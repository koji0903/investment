"use client";

import React from "react";
import { StockJudgment, TradingSuitability, FinancialHealth } from "@/types/stock";
import { 
  X, 
  Zap, 
  BarChart, 
  Scale, 
  Coins, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Landmark
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  StockSignalBadge, 
  StockConfidenceIndicator, 
  StockSuitabilityBadge,
  FinancialHealthBadge 
} from "./StockUIComponents";

interface StockDetailModalProps {
  judgment: StockJudgment | null;
  onClose: () => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({ judgment, onClose }) => {
  if (!judgment) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden bg-slate-900/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl bg-white dark:bg-slate-950 rounded-[40px] shadow-2xl overflow-hidden border border-white/20"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-[22px] bg-slate-900 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-slate-900/20">
                {judgment.ticker}
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{judgment.companyName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{judgment.sector}</span>
                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-sm font-black text-indigo-500 tabular-nums">{judgment.currentPrice.toLocaleString()}円</span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 border border-slate-100 dark:border-slate-800"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-8 space-y-10 max-h-[70vh] overflow-y-auto">
            {/* Top Summary Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-indigo-50 dark:bg-indigo-500/5 rounded-[32px] p-8 flex flex-col md:flex-row items-center gap-8 border border-indigo-100 dark:border-indigo-500/10">
                 <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="64" cy="64" r="58" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                      <circle cx="64" cy="64" r="58" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="364.4" strokeDashoffset={364.4 - (364.4 * (judgment.totalScore + 100) / 200)} className="text-indigo-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-slate-800 dark:text-white">{judgment.totalScore > 0 ? `+${judgment.totalScore}` : judgment.totalScore}</span>
                      <span className="text-xs font-black text-slate-400 uppercase">Score</span>
                    </div>
                 </div>
                 <div className="flex-1 space-y-4 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                      <StockSignalBadge label={judgment.signalLabel} />
                      <StockConfidenceIndicator level={judgment.confidence} />
                      <StockSuitabilityBadge suitability={judgment.holdSuitability} />
                    </div>
                    <p className="text-base font-bold text-slate-600 dark:text-slate-300 leading-relaxed italic border-l-4 border-indigo-500 pl-4 py-1 bg-white/50 dark:bg-white/5 rounded-r-xl">
                      「{judgment.summaryComment}」
                    </p>
                 </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">分析ウェイト</h4>
                <div className="space-y-3">
                  <WeightBar label="Short-term" weight="25%" color="bg-indigo-400" />
                  <WeightBar label="Base-Fund" weight="35%" color="bg-emerald-400" />
                  <WeightBar label="Valuation" weight="25%" color="bg-amber-400" />
                  <WeightBar label="Shareholder" weight="15%" color="bg-rose-400" />
                </div>
              </div>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Technical Analysis */}
              <AnalysisSection 
                title="テクニカル分析" 
                score={judgment.technicalScore} 
                icon={<Zap size={20} className="text-indigo-500" />}
                reasons={judgment.technicalReasons}
                badge={<span className="text-xs font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md uppercase tracking-wider">{judgment.technicalTrend}</span>}
              />

              {/* Fundamental Analysis */}
              <AnalysisSection 
                title="ファンダメンタル" 
                score={judgment.fundamentalScore} 
                icon={<BarChart size={20} className="text-emerald-500" />}
                reasons={judgment.fundamentalReasons}
                badge={<FinancialHealthBadge health={judgment.financialHealth} />}
              />

              {/* Valuation Analysis */}
              <AnalysisSection 
                title="バリュエーション" 
                score={judgment.valuationScore} 
                icon={<Scale size={20} className="text-amber-500" />}
                reasons={judgment.valuationReasons}
                badge={<span className="text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md uppercase tracking-wider">{judgment.valuationLabel}</span>}
              />

              {/* Dividend/Shareholder Analysis */}
              <AnalysisSection 
                title="配当・個人還元" 
                score={judgment.shareholderReturnScore} 
                icon={<Coins size={20} className="text-rose-500" />}
                reasons={judgment.shareholderReasons}
                badge={
                  <span className="text-xs font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-md uppercase tracking-wider">
                    {judgment.dividendProfile === "high_dividend" ? "High Div" :
                     judgment.dividendProfile === "stable_dividend" ? "Stable" :
                     judgment.dividendProfile === "low_dividend" ? "Growth-oriented" : "Risky"}
                  </span>
                }
              />
            </div>

            <div className="flex items-center gap-4 p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800">
               <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 flex-shrink-0">
                  <Info size={20} />
               </div>
               <p className="text-xs font-bold text-slate-400 leading-normal">
                  本判定は公開情報および独自のアルゴリズムに基づき自動算出された参考情報です。実際の投資判断にあたっては自己責任で行ってください。
               </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const AnalysisSection = ({ title, score, icon, reasons, badge }: { title: string, score: number, icon: React.ReactNode, reasons: string[], badge: React.ReactNode }) => (
  <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[32px] hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-none transition-all duration-300">
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {icon}
        </div>
        <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">{title}</h4>
      </div>
      <div className="flex items-center gap-3">
        {badge}
        <div className={cn(
          "px-3 py-1 rounded-full text-base font-black tabular-nums",
          score > 20 ? "text-emerald-500 bg-emerald-500/10" : 
          score < -20 ? "text-rose-500 bg-rose-500/10" : 
          "text-slate-400 bg-slate-400/10"
        )}>
          {score > 0 ? `+${score}` : score}
        </div>
      </div>
    </div>
    <ul className="space-y-3">
      {reasons.map((reason, i) => (
        <li key={i} className="flex items-start gap-3 group">
          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-indigo-500 transition-colors flex-shrink-0" />
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed">{reason}</span>
        </li>
      ))}
    </ul>
  </div>
);

const WeightBar = ({ label, weight, color }: { label: string, weight: string, color: string }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-xs font-black text-slate-500 uppercase tracking-tighter">
      <span>{label}</span>
      <span>{weight}</span>
    </div>
    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: weight }}
        transition={{ duration: 1.5, ease: "circOut" }}
        className={cn("h-full rounded-full", color)} 
      />
    </div>
  </div>
);
