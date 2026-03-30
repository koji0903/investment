"use client";

import React from "react";
import { FXConditionAnalysis, FXBacktestComparison } from "@/types/fx";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, BarChart, Zap, Shield, Bug, Search } from "lucide-react";

interface Props {
  conditionAnalysis: FXConditionAnalysis | null;
  backtestComparisons: FXBacktestComparison[];
}

export const USDJPYDetailedAnalysis = ({ conditionAnalysis, backtestComparisons }: Props) => {
  const [activeSubTab, setActiveSubTab] = React.useState<"conditions" | "backtests">("conditions");

  if (!conditionAnalysis) return <div className="p-20 text-center text-slate-500 font-bold">分析データをロード中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex gap-4 p-1 bg-slate-950/80 rounded-2xl border border-slate-900 w-fit mx-auto mb-6">
        <button
          onClick={() => setActiveSubTab("conditions")}
          className={cn(
            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeSubTab === "conditions" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
          )}
        >
          状況別分析
        </button>
        <button
          onClick={() => setActiveSubTab("backtests")}
          className={cn(
            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeSubTab === "backtests" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
          )}
        >
          バックテスト比較
        </button>
      </div>

      {activeSubTab === "conditions" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Regime Analysis */}
           <AnalysisCard 
             title="レジーム別収益性" 
             data={conditionAnalysis.regime} 
             icon={Zap} 
           />
           {/* Time Analysis */}
           <AnalysisCard 
             title="時間帯別パフォーマンス" 
             data={conditionAnalysis.timeOfDay} 
             icon={BarChart} 
           />
           {/* Sentiment Analysis */}
           <AnalysisCard 
             title="センチメント感度" 
             data={conditionAnalysis.sentiment} 
             icon={TrendingUp} 
           />
           {/* Liquidity Analysis */}
           <AnalysisCard 
             title="流動性と執行品質" 
             data={conditionAnalysis.liquidity} 
             icon={Shield} 
           />
        </div>
      )}

      {activeSubTab === "backtests" && (
        <div className="space-y-4">
           {backtestComparisons.map((bt) => (
             <div key={bt.id} className="p-6 bg-slate-950/40 border border-slate-800 rounded-[32px] hover:border-indigo-500/30 transition-all group overflow-hidden relative">
                <div className="flex items-center justify-between relative z-10">
                   <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        bt.id === "current" ? "bg-indigo-500/10 text-indigo-400" : "bg-slate-800 text-slate-400"
                      )}>
                         <Search size={24} />
                      </div>
                      <div>
                         <h4 className="text-sm font-black text-slate-200">{bt.name}</h4>
                         <p className="text-[10px] font-bold text-slate-500">{bt.tradeCount} 件のトレード試行</p>
                      </div>
                   </div>

                    <div className="flex items-center gap-8">
                        <div className="text-right group relative cursor-help">
                           <p className="text-[9px] font-black text-slate-500 uppercase">勝率</p>
                           <p className="text-sm font-black text-emerald-400">{bt.winRate}%</p>
                           <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                             <p className="text-[10px] font-bold text-slate-200 leading-relaxed">
                               全トレード数に対する勝ちトレードの割合です。
                             </p>
                             <div className="absolute top-full right-4 border-8 border-transparent border-t-slate-800" />
                           </div>
                        </div>
                        <div className="text-right group relative cursor-help">
                           <p className="text-[9px] font-black text-slate-500 uppercase font-sans">PF</p>
                           <p className="text-sm font-black text-indigo-400">{bt.profitFactor}</p>
                           <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none text-left">
                             <p className="text-[10px] font-bold text-slate-200 leading-relaxed uppercase">
                               Profit Factor: 総利益÷総損失。数値が高いほど収益性が高いことを示します。
                             </p>
                             <div className="absolute top-full right-4 border-8 border-transparent border-t-slate-800" />
                           </div>
                        </div>
                        <div className="text-right group relative cursor-help">
                           <p className="text-[9px] font-black text-slate-500 uppercase">安定性</p>
                           <p className="text-sm font-black text-slate-200">{bt.stabilityScore}/100</p>
                           <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none text-left">
                             <p className="text-[10px] font-bold text-slate-200 leading-relaxed font-sans">
                               資産曲線の滑らかさを示す指標。100に近いほどリスク管理が徹底されています。
                             </p>
                             <div className="absolute top-full right-4 border-8 border-transparent border-t-slate-800" />
                           </div>
                        </div>
                    </div>
                </div>

                {bt.overfittingWarning && (
                  <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-3">
                     <Bug size={14} className="text-amber-500" />
                     <span className="text-[10px] font-bold text-amber-500/80 uppercase">警告: 過剰適合（オーバーフィッティング）の可能性あり</span>
                  </div>
                )}
             </div>
           ))}
        </div>
      )}
    </div>
  );
};

const AnalysisCard = ({ title, data, icon: Icon }: { title: string, data: Record<string, any>, icon: any }) => {
  const entries = Object.entries(data).sort((a, b) => b[1].profit - a[1].profit);

  return (
    <CardContainer title={title} icon={Icon}>
       <div className="space-y-4">
         {entries.length === 0 ? (
           <p className="text-[10px] font-black text-slate-600 uppercase italic">データなし</p>
         ) : (
           entries.map(([key, val]) => (
             <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                   <span className="font-black text-slate-400 uppercase tracking-tighter">{key}</span>
                    <div className="flex gap-3 font-bold group relative cursor-help">
                       <span className={cn(val.profit >= 0 ? "text-emerald-500" : "text-rose-500")}>
                         {val.profit > 0 ? "+" : ""}{val.profit.toFixed(1)} pips
                       </span>
                       <span className="text-slate-500 font-sans">{val.winRate.toFixed(1)}% WR</span>
                       <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none text-left">
                         <p className="text-[10px] font-bold text-slate-200 leading-relaxed uppercase">
                           Win Rate (WR): 勝率。この条件下での過去のトレード成功率です。
                         </p>
                         <div className="absolute top-full right-4 border-8 border-transparent border-t-slate-800" />
                       </div>
                    </div>
                </div>
                <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }} 
                     animate={{ width: `${Math.min(Math.max(val.winRate, 0), 100)}%` }}
                     className={cn(
                       "h-full rounded-full transition-all",
                       val.profit >= 0 ? "bg-emerald-500" : "bg-rose-500"
                     )}
                   />
                </div>
             </div>
           ))
         )}
       </div>
    </CardContainer>
  );
};

const CardContainer = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
  <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-[32px] space-y-4">
    <div className="flex items-center gap-3">
       <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400">
          <Icon size={16} />
       </div>
       <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{title}</h3>
    </div>
    {children}
  </div>
);
