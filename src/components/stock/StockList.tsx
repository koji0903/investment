"use client";

import React from "react";
import { StockJudgment } from "@/types/stock";
import { 
  StockSignalBadge, 
  StockConfidenceIndicator, 
  StockSuitabilityBadge,
  FinancialHealthBadge
} from "./StockUIComponents";
import { ChevronRight, Zap, Target, Coins, Scale } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StockListProps {
  items: StockJudgment[];
  onSelect: (item: StockJudgment) => void;
}

export const StockList: React.FC<StockListProps> = ({ items, onSelect }) => {
  return (
    <div className="w-full">
      {/* Desktop View */}
      <div className="hidden md:block overflow-hidden rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4">銘柄 / 株価</th>
              <th className="px-6 py-4 text-center">短期(Tech)</th>
              <th className="px-6 py-4 text-center">基礎(Fund)</th>
              <th className="px-6 py-4 text-center">割安(Val)</th>
              <th className="px-6 py-4 text-center">還元(Div)</th>
              <th className="px-6 py-4">総合判定</th>
              <th className="px-6 py-4">適正/信頼度</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr 
                key={item.ticker}
                onClick={() => onSelect(item)}
                className="group border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors"
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs border border-slate-800">
                      {item.ticker}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-800 dark:text-white leading-tight">{item.companyName}</div>
                      <div className="text-xs font-bold text-slate-400 mt-0.5 tabular-nums">
                        {item.currentPrice.toLocaleString()}円
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-center">
                  <ScoreBadge score={item.technicalScore} />
                </td>
                <td className="px-6 py-5 text-center">
                  <ScoreBadge score={item.fundamentalScore} />
                </td>
                <td className="px-6 py-5 text-center">
                  <ScoreBadge score={item.valuationScore} />
                </td>
                <td className="px-6 py-5 text-center">
                  <ScoreBadge score={item.shareholderReturnScore} />
                </td>
                <td className="px-6 py-5">
                  <StockSignalBadge label={item.signalLabel} />
                </td>
                <td className="px-6 py-5 space-y-2">
                  <StockSuitabilityBadge suitability={item.holdSuitability} />
                  <StockConfidenceIndicator level={item.confidence} />
                </td>
                <td className="px-6 py-5 text-right">
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {items.map((item) => (
          <motion.div 
            key={item.ticker}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(item)}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                  {item.ticker}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white leading-none">{item.companyName}</h3>
                  <p className="text-[11px] font-bold text-slate-400 mt-1 tabular-nums">{item.currentPrice.toLocaleString()}円</p>
                </div>
              </div>
              <StockSignalBadge label={item.signalLabel} />
            </div>

            <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50 dark:border-slate-800/50">
               <div className="flex flex-col gap-1">
                 <span className="text-[8px] font-black text-slate-400 uppercase">総合スコア</span>
                 <span className={cn("text-lg font-black", 
                   item.totalScore > 0 ? "text-emerald-500" : item.totalScore < 0 ? "text-rose-500" : "text-slate-400"
                 )}>
                   {item.totalScore > 0 ? `+${item.totalScore}` : item.totalScore}
                 </span>
               </div>
               <div className="space-y-1 text-right">
                 <StockSuitabilityBadge suitability={item.holdSuitability} />
                 <StockConfidenceIndicator level={item.confidence} />
               </div>
            </div>
            
            <div className="text-xs font-bold text-slate-500 line-clamp-1">
              {item.summaryComment}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const ScoreBadge = ({ score }: { score: number }) => {
  const color = score > 40 ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : 
                score > 10 ? "text-emerald-400" :
                score < -40 ? "text-rose-500 bg-rose-50 dark:bg-rose-500/10" :
                score < -10 ? "text-rose-400" :
                "text-slate-400";
  
  return (
    <div className={cn("inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-xs", color)}>
      {score > 0 ? `+${score}` : score}
    </div>
  );
};
