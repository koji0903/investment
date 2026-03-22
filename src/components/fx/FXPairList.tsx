"use client";

import React from "react";
import { FXJudgment } from "@/types/fx";
import { 
  SignalBadge, 
  ConfidenceIndicator, 
  HoldingStyleBadge,
  TradingSuitabilityBadge
} from "./FXUIComponents";
import { ChevronRight, Zap, Target } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FXPairListProps {
  judgments: FXJudgment[];
  onSelect: (judgment: FXJudgment) => void;
}

export const FXPairList: React.FC<FXPairListProps> = ({ judgments, onSelect }) => {
  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4">通貨ペア / 価格</th>
              <th className="px-6 py-4">短期判定 (テクニカル)</th>
              <th className="px-6 py-4">中長期判定 (基礎/SWAP)</th>
              <th className="px-6 py-4">総合判定</th>
              <th className="px-6 py-4">売買適正</th>
              <th className="px-6 py-4">信頼度</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {judgments.map((item) => (
              <tr 
                key={item.pairCode}
                onClick={() => onSelect(item)}
                className="group border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors"
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-xs border border-slate-200 dark:border-slate-700">
                      {item.pairCode.split("/")[0]}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-800 dark:text-white">{item.pairCode}</div>
                      <div className="text-[10px] font-bold text-slate-400 tabular-nums">{item.currentPrice.toFixed(pairToDecimals(item.pairCode))}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-indigo-400" />
                    <span className={cn("text-xs font-bold", 
                      item.technicalScore > 25 ? "text-emerald-500" : item.technicalScore < -25 ? "text-rose-500" : "text-slate-400"
                    )}>
                      {item.shortTermSignal}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <Target size={14} className="text-blue-400" />
                    <span className={cn("text-xs font-bold", 
                      item.fundamentalScore > 25 ? "text-emerald-500" : item.fundamentalScore < -25 ? "text-rose-500" : "text-slate-400"
                    )}>
                      {item.mediumTermSignal}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <SignalBadge label={item.signalLabel} />
                </td>
                <td className="px-6 py-5">
                  <TradingSuitabilityBadge suitability={item.suitability} />
                </td>
                <td className="px-6 py-5">
                  <ConfidenceIndicator level={item.confidence} />
                </td>
                <td className="px-6 py-5 text-right">
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {judgments.map((item) => (
          <motion.div 
            key={item.pairCode}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(item)}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-xs border border-slate-200 dark:border-slate-700">
                  {item.pairCode.split("/")[0]}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white leading-none">{item.pairCode}</h3>
                  <p className="text-[11px] font-bold text-slate-400 mt-1 tabular-nums">
                    {item.currentPrice.toFixed(pairToDecimals(item.pairCode))}
                  </p>
                </div>
              </div>
              <SignalBadge label={item.signalLabel} />
            </div>

            <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50 dark:border-slate-800/50">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 capitalize">売買適正</p>
                <div className="text-[10px] font-black text-slate-600 dark:text-slate-300">{item.suitability}</div>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] font-black text-slate-400 capitalize">信頼度</p>
                <ConfidenceIndicator level={item.confidence} />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>詳細分析を確認</span>
              <ChevronRight size={16} className="text-slate-300" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

function pairToDecimals(pair: string): number {
  return pair.includes("JPY") ? 3 : 5;
}
