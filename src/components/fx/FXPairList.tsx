"use client";

import React from "react";
import { FXJudgment } from "@/types/fx";
import { 
  SignalBadge, 
  ConfidenceIndicator, 
  HoldingStyleBadge 
} from "./FXUIComponents";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

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
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4">通貨ペア</th>
              <th className="px-6 py-4 text-right">現在価格</th>
              <th className="px-6 py-4">テクニカル</th>
              <th className="px-6 py-4">ファンダ</th>
              <th className="px-6 py-4">スワップ</th>
              <th className="px-6 py-4">総合判定</th>
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
                    <span className="text-sm font-black text-slate-800 dark:text-white">{item.pairCode}</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-right font-black tabular-nums text-slate-700 dark:text-slate-200">
                  {item.currentPrice.toFixed(pairToDecimals(item.pairCode))}
                </td>
                <td className="px-6 py-5">
                   <div className={cn("text-xs font-bold", item.technicalScore > 0 ? "text-emerald-500" : item.technicalScore < 0 ? "text-rose-500" : "text-slate-400")}>
                    {item.technicalScore > 20 ? "買い優勢" : item.technicalScore > 0 ? "やや買い" : item.technicalScore < -20 ? "売り優勢" : item.technicalScore < 0 ? "やや売り" : "中立"}
                   </div>
                </td>
                <td className="px-6 py-5">
                   <div className={cn("text-xs font-bold", item.fundamentalScore > 0 ? "text-emerald-500" : item.fundamentalScore < 0 ? "text-rose-500" : "text-slate-400")}>
                    {item.fundamentalScore > 20 ? "買い支持" : item.fundamentalScore > 0 ? "やや買い" : item.fundamentalScore < -20 ? "売り支持" : item.fundamentalScore < 0 ? "やや売り" : "中立"}
                   </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 leading-none">
                      {item.swapDirection === "long_positive" ? "買いスワップ有利" : item.swapDirection === "short_positive" ? "売りスワップ有利" : "スワップ影響小"}
                    </span>
                    <HoldingStyleBadge style={item.holdingStyle} />
                  </div>
                </td>
                <td className="px-6 py-5">
                  <SignalBadge label={item.signalLabel} />
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
                <p className="text-[10px] font-black text-slate-400 capitalize">信頼度</p>
                <ConfidenceIndicator level={item.confidence} />
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] font-black text-slate-400 capitalize">保有向き</p>
                <HoldingStyleBadge style={item.holdingStyle} />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>分析理由を表示する</span>
              <ChevronRight size={16} className="text-slate-300" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Utils inside this file for simplicity as they are UI specific
function pairToDecimals(pair: string): number {
  return pair.includes("JPY") ? 3 : 5;
}

// cn helper if not available, but it should be in @/lib/utils
import { cn } from "@/lib/utils";
