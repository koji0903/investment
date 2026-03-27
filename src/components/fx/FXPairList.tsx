"use client";

import React from "react";
import { FXJudgment } from "@/types/fx";
import { 
  SignalBadge, 
  ConfidenceIndicator, 
  HoldingStyleBadge,
  TradingSuitabilityBadge,
  SyncStatusBadge,
  ScoreBadge
} from "./FXUIComponents";
import { ChevronRight, Zap, Target, ShieldCheck, ShieldAlert, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, AreaChart, Area, YAxis } from "recharts";

interface FXPairListProps {
  judgments: FXJudgment[];
  onSelect: (judgment: FXJudgment) => void;
}

const MiniChart = ({ data, color }: { data: any[], color: string }) => {
  if (!data || data.length === 0) return <div className="h-8 w-24 bg-slate-50 dark:bg-slate-800/50 rounded animate-pulse" />;
  
  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <YAxis hide domain={['auto', 'auto']} />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={1.5}
            fillOpacity={1} 
            fill={`url(#gradient-${color})`} 
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

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
              <th className="px-6 py-4">総合判断</th>
              <th className="px-6 py-4">適正・信頼度</th>
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
                      {item.pairCode?.split("/")[0] || "?"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-black text-slate-800 dark:text-white">{item.pairCode || "---"}</div>
                        <SyncStatusBadge status={item.syncStatus} />
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 tabular-nums">{(item.currentPrice || 0).toFixed(pairToDecimals(item.pairCode || ""))}</div>
                    </div>
                    <div className="ml-auto pr-4 hidden lg:block">
                      <MiniChart 
                        data={(item.chartData || []).slice(-30)} 
                        color={(item.chartData && item.chartData.length > 1 && item.chartData[item.chartData.length - 1].value >= item.chartData[Math.max(0, item.chartData.length - 30)].value) ? "#10b981" : "#ef4444"} 
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  {item.entryTimingAnalysis ? (
                    <div className="flex flex-col">
                      <div className={cn("flex items-center gap-1.5 text-xs font-black", 
                        item.entryTimingAnalysis.entryLabel.includes("買い") ? "text-emerald-500" : 
                        item.entryTimingAnalysis.entryLabel.includes("売り") ? "text-rose-500" : "text-slate-500"
                      )}>
                        {item.entryTimingAnalysis.entryLabel.includes("買い") ? <TrendingUp size={14} /> : 
                         item.entryTimingAnalysis.entryLabel.includes("売り") ? <TrendingDown size={14} /> : <Minus size={14} />}
                        <span>{item.entryTimingAnalysis.entryLabel}</span>
                        <span className="opacity-60 text-[10px]">({item.entryTimingAnalysis.entryScore || 0})</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 mt-1 max-w-[140px] truncate" title={item.entryTimingAnalysis.waitReasons?.[0] || ""}>
                        {item.entryTimingAnalysis.shouldWait ? `待機: ${item.entryTimingAnalysis.waitReasons?.[0] || "---"}` : "エントリー推奨"}
                      </span>
                    </div>
                  ) : "-"}
                </td>
                <td className="px-6 py-5">
                  {item.energyAnalysis ? (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full", (item.energyAnalysis.energyScore || 0) > 70 ? "bg-yellow-400" : (item.energyAnalysis.energyScore || 0) > 40 ? "bg-amber-400" : "bg-slate-300")}
                          style={{ width: `${item.energyAnalysis.energyScore || 0}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black tabular-nums text-slate-600 dark:text-slate-300">
                        {item.energyAnalysis.energyScore || 0}
                      </span>
                    </div>
                  ) : "-"}
                </td>
                <td className="px-6 py-5">
                  {item.positionSizing ? (
                    <div className="flex flex-col gap-1">
                      <span className={cn(
                        "text-sm font-black tabular-nums",
                        (item.positionSizing.cappedPositionSize || 0) > 0 ? "text-slate-800 dark:text-white" : "text-rose-500"
                      )}>
                        {item.positionSizing.suggestedLot || "---"}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold text-slate-400">
                          損失想定: {new Intl.NumberFormat('ja-JP', { notation: "compact" }).format(item.positionSizing.estimatedLossAmount || 0)}円
                        </span>
                        <div className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-[9px] font-black text-blue-600 dark:text-blue-400 flex items-center gap-1 shadow-sm">
                          <ShieldCheck size={10} className="text-blue-500" />
                          <span>安全 {item.safetyScore || 0}%</span>
                        </div>
                      </div>
                    </div>
                  ) : "-"}
                </td>
                <td className="px-6 py-5">
                  {item.entryTimingAnalysis ? (
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-black text-slate-400">RR:</span>
                        <span className={cn("text-xs font-black tabular-nums", (item.entryTimingAnalysis.rrRatio || 0) >= 1.5 ? "text-emerald-500" : "text-orange-500")}>
                          {(item.entryTimingAnalysis.rrRatio || 0).toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400">
                        目標: {(item.entryTimingAnalysis.targetPrice || 0).toFixed(pairToDecimals(item.pairCode || ""))}
                      </span>
                    </div>
                  ) : "-"}
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-2.5 items-start">
                    {item.syncStatus === "failed" ? (
                      <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-100 dark:border-rose-500/20 max-w-[150px] leading-tight">
                        {item.summaryComment || "同期失敗"}
                      </span>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <SignalBadge label={item.signalLabel} />
                          <span className={cn(
                            "text-xs font-black tabular-nums",
                            (item.totalScore || 0) >= 60 ? "text-emerald-500" : (item.totalScore || 0) <= -60 ? "text-rose-500" : "text-slate-500"
                          )}>
                             {Math.abs(item.totalScore || 0)}点
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 pl-0.5">
                          <ScoreBadge score={item.technicalScore} label="T" />
                          <ScoreBadge score={item.fundamentalScore} label="F" />
                          <ScoreBadge score={item.swapScore} label="S" />
                        </div>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-2.5">
                    <div className="flex flex-col gap-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter opacity-60">売買適正</p>
                      <TradingSuitabilityBadge suitability={item.suitability} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter opacity-60">信頼度・精度</p>
                      <div className="flex items-center gap-2">
                        <ConfidenceIndicator level={item.confidence} />
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[9px] font-black text-slate-500 dark:text-slate-400 w-fit">
                          <ShieldCheck size={10} />
                          <span>精度 {item.certainty}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
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
              {item.syncStatus === "failed" ? (
               <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-500 border border-rose-100 dark:border-rose-500/20 rounded-full">
                 <ShieldAlert size={12} />
                 <span className="text-[10px] font-black">エラー発生</span>
               </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <SignalBadge label={item.signalLabel} />
                  <span className={cn(
                    "text-sm font-black tabular-nums",
                    (item.totalScore || 0) >= 60 ? "text-emerald-500" : (item.totalScore || 0) <= -60 ? "text-rose-500" : "text-slate-500"
                  )}>
                     {Math.abs(item.totalScore || 0)}点
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <ScoreBadge score={item.technicalScore} label="T" />
                  <ScoreBadge score={item.fundamentalScore} label="F" />
                  <ScoreBadge score={item.swapScore} label="S" />
                </div>
              </div>
            )}
            
            {item.syncStatus === "failed" && (
              <div className="p-3 bg-rose-50 dark:bg-rose-500/5 rounded-2xl border border-rose-100/50 dark:border-rose-500/10 mt-2">
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 break-words leading-relaxed">
                   原因: {item.summaryComment || "一時的な接続エラーまたはデータ欠損"}
                </p>
              </div>
            )}

            {/* Mobile Mini Chart */}
            {item.chartData && item.chartData.length > 0 && (
              <div className="w-full h-16 opacity-80 pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={item.chartData.slice(-30)}>
                    <YAxis hide domain={['auto', 'auto']} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={item.chartData[item.chartData.length-1].value >= item.chartData[Math.max(0, item.chartData.length-30)].value ? "#10b981" : "#ef4444"} 
                      strokeWidth={1.5}
                      fillOpacity={0.1}
                      fill={item.chartData[item.chartData.length-1].value >= item.chartData[Math.max(0, item.chartData.length-30)].value ? "#10b981" : "#ef4444"}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {item.entryTimingAnalysis && (
              <div className="flex items-center justify-between py-2 border-t border-slate-50 dark:border-slate-800/50 pt-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">エントリー判断</p>
                  <div className={cn("flex items-center gap-1.5 text-xs font-black", 
                    item.entryTimingAnalysis.entryLabel.includes("買い") ? "text-emerald-500" : 
                    item.entryTimingAnalysis.entryLabel.includes("売り") ? "text-rose-500" : "text-slate-500"
                  )}>
                    {item.entryTimingAnalysis.entryLabel.includes("買い") ? <TrendingUp size={14} /> : 
                     item.entryTimingAnalysis.entryLabel.includes("売り") ? <TrendingDown size={14} /> : <Minus size={14} />}
                    <span>{item.entryTimingAnalysis.entryLabel}</span>
                  </div>
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
                <p className="text-[9px] font-black text-slate-400 uppercase">売買適正 / 安全性</p>
                <div className="flex flex-col gap-1">
                  <div className="text-[10px] font-black text-slate-600 dark:text-slate-300 leading-tight">{item.suitability}</div>
                  <div className="flex items-center gap-1 text-[9px] font-black text-emerald-500">
                    <ShieldCheck size={8} />
                    <span>安全 {item.safetyScore}%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase text-right">信頼度・精度</p>
                <div className="flex flex-col items-end gap-1">
                   <ConfidenceIndicator level={item.confidence} />
                   <div className="text-[9px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-500/20">
                     精度 {item.certainty}%
                   </div>
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
