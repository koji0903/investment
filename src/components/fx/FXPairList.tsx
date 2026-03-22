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
              <th className="px-6 py-4">エントリー判断</th>
              <th className="px-6 py-4">エネルギー</th>
              <th className="px-6 py-4">推奨サイズ</th>
              <th className="px-6 py-4">RR比・目標</th>
              <th className="px-6 py-4">総合・適正</th>
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
                  {item.entryTimingAnalysis ? (
                    <div className="flex flex-col">
                      <span className={cn("text-xs font-black", 
                        item.entryTimingAnalysis.entryScore >= 85 ? "text-emerald-500" : 
                        item.entryTimingAnalysis.entryScore >= 70 ? "text-indigo-500" : 
                        item.entryTimingAnalysis.entryScore >= 50 ? "text-orange-500" : "text-rose-500"
                      )}>
                        {item.entryTimingAnalysis.entryLabel} ({item.entryTimingAnalysis.entryScore})
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 mt-1 max-w-[140px] truncate" title={item.entryTimingAnalysis.waitReasons[0]}>
                        {item.entryTimingAnalysis.shouldWait ? `待機: ${item.entryTimingAnalysis.waitReasons[0]}` : "エントリー推奨"}
                      </span>
                    </div>
                  ) : "-"}
                </td>
                <td className="px-6 py-5">
                  {item.energyAnalysis ? (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full", item.energyAnalysis.energyScore > 70 ? "bg-yellow-400" : item.energyAnalysis.energyScore > 40 ? "bg-amber-400" : "bg-slate-300")}
                          style={{ width: `${item.energyAnalysis.energyScore}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black tabular-nums text-slate-600 dark:text-slate-300">
                        {item.energyAnalysis.energyScore}
                      </span>
                    </div>
                  ) : "-"}
                </td>
                <td className="px-6 py-5">
                  {item.positionSizing ? (
                    <div className="flex flex-col gap-1">
                      <span className={cn(
                        "text-sm font-black tabular-nums",
                        item.positionSizing.cappedPositionSize > 0 ? "text-slate-800 dark:text-white" : "text-rose-500"
                      )}>
                        {item.positionSizing.suggestedLot}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">
                        損失想定: {new Intl.NumberFormat('ja-JP', { notation: "compact" }).format(item.positionSizing.estimatedLossAmount)}円
                      </span>
                    </div>
                  ) : "-"}
                </td>
                <td className="px-6 py-5">
                  {item.entryTimingAnalysis ? (
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-black text-slate-400">RR:</span>
                        <span className={cn("text-xs font-black tabular-nums", item.entryTimingAnalysis.rrRatio >= 1.5 ? "text-emerald-500" : "text-orange-500")}>
                          {item.entryTimingAnalysis.rrRatio.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400">
                        目標: {item.entryTimingAnalysis.targetPrice.toFixed(pairToDecimals(item.pairCode))}
                      </span>
                    </div>
                  ) : "-"}
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-2 items-start">
                    <SignalBadge label={item.signalLabel} />
                    <TradingSuitabilityBadge suitability={item.suitability} />
                  </div>
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
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
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

            {item.entryTimingAnalysis && (
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">エントリー判断</p>
                  <span className={cn("text-xs font-black", 
                    item.entryTimingAnalysis.entryScore >= 85 ? "text-emerald-500" : 
                    item.entryTimingAnalysis.entryScore >= 70 ? "text-indigo-500" : 
                    item.entryTimingAnalysis.entryScore >= 50 ? "text-orange-500" : "text-rose-500"
                  )}>
                    {item.entryTimingAnalysis.entryLabel} ({item.entryTimingAnalysis.entryScore}pts)
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">RR比</p>
                  <span className={cn("text-xs font-black tabular-nums", item.entryTimingAnalysis.rrRatio >= 1.5 ? "text-emerald-500" : "text-orange-500")}>
                    {item.entryTimingAnalysis.rrRatio.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-50 dark:border-slate-800/50">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase">エネルギー</p>
                <div className="text-[10px] font-black text-amber-500">{item.energyAnalysis?.energyScore || 0} pts</div>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase">売買適正</p>
                <div className="text-[10px] font-black text-slate-600 dark:text-slate-300 leading-tight">{item.suitability}</div>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase text-right">信頼度</p>
                <div className="flex justify-end">
                   <ConfidenceIndicator level={item.confidence} />
                </div>
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
