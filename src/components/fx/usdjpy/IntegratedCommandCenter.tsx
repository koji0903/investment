"use client";

import React from "react";
import { useIntegratedCommandCenter } from "@/hooks/useIntegratedCommandCenter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Zap, 
  Trophy, 
  Target, 
  Activity, 
  ShieldCheck, 
  ShieldAlert,
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Clock, 
  Layers, 
  MousePointer2,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  Calendar,
  History,
  Info,
  ChevronRight,
  AlertTriangle
} from "lucide-react";
import { 
  USDJPYPriceBoard, 
  USDJPYDecisionMonitor 
} from "./USDJPYComponents";
import { USDJPYRegimeMonitor } from "./USDJPYRegimeMonitor";
import { USDJPYExecutionMonitor } from "./USDJPYExecutionMonitor";
import { USDJPYStructureMonitor } from "./USDJPYStructureMonitor";
import { USDJPYPseudoOrderBook } from "./USDJPYPseudoOrderBook";
import { USDJPYRiskMonitor } from "./USDJPYRiskMonitor";
import { USDJPYIndicatorCalendar } from "./USDJPYIndicatorCalendar";
import { USDJPYDetailedAnalysis } from "./USDJPYDetailedAnalysis";
import { USDJPYOperationLogs } from "./USDJPYOperationLogs";
import { FXSentimentWidget } from "../FXSentimentWidget";

/**
 * Section A: 総合運用ステータス
 */
const StatsBar = ({ performance, riskMetrics }: { performance: any, riskMetrics: any }) => {
  if (!performance || !riskMetrics) return null;

  const cards = [
    { label: "Today", pips: performance.today.pips, yen: performance.today.yen, count: performance.today.count, winRate: performance.today.winRate },
    { label: "Weekly", pips: performance.weekly.pips, yen: performance.weekly.yen, count: performance.weekly.count, winRate: performance.weekly.winRate },
    { label: "Monthly", pips: performance.monthly.pips, yen: performance.monthly.yen, count: performance.monthly.count, winRate: performance.monthly.winRate },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {cards.map((c, i) => (
        <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 flex flex-col justify-center relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 group-hover:scale-[2] transition-transform">
             <Trophy size={48} />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{c.label} PnL</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={cn(
              "text-2xl font-black tabular-nums tracking-tighter",
              c.pips >= 0 ? "text-emerald-400" : "text-rose-400"
            )}>
              {c.pips > 0 ? `+${c.pips}` : c.pips}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">pips</span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs font-bold text-slate-400">
               {new Intl.NumberFormat('ja-JP').format(c.yen)}円
            </span>
            <span className="text-[9px] font-black px-1.5 py-0.5 bg-slate-800 rounded text-slate-500">
              {c.winRate.toFixed(1)}% WR
            </span>
          </div>
        </div>
      ))}
      
      {/* Rule Compliance & Status (Section A Extended) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 flex flex-col justify-center relative overflow-hidden group hover:border-amber-500/30 transition-all">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compliance Rate</span>
        <div className="text-2xl font-black mt-1 text-amber-400 tracking-tighter">
          {riskMetrics.ruleComplianceRate?.toFixed(1) || 100}%
        </div>
        <div className="w-full h-1 bg-slate-800 rounded-full mt-3 overflow-hidden">
           <div className="h-full bg-amber-500" style={{ width: `${riskMetrics.ruleComplianceRate || 100}%` }} />
        </div>
      </div>

      <div className={cn(
        "rounded-3xl p-5 text-white shadow-xl flex flex-col justify-center relative overflow-hidden group transition-all",
        riskMetrics.operationStatus === "stop" ? "bg-rose-600 shadow-rose-600/20" : 
        riskMetrics.operationStatus === "caution" ? "bg-amber-500 shadow-amber-500/20" : 
        "bg-indigo-600 shadow-indigo-600/20"
      )}>
        <div className="absolute top-0 right-0 p-2 opacity-20 rotate-12 group-hover:scale-125 transition-transform">
           {riskMetrics.operationStatus === "stop" ? <ShieldAlert size={48} /> : <ShieldCheck size={48} />}
        </div>
        <span className="text-[10px] font-black opacity-70 uppercase tracking-widest">Op Status</span>
        <div className="text-xl font-black mt-1 flex items-center gap-2">
          {riskMetrics.operationStatus === "stop" ? "停止 (STOP)" : 
           riskMetrics.operationStatus === "caution" ? "警戒 (CAUTION)" : "通常 (NORMAL)"}
        </div>
        <div className="mt-3 flex items-center gap-1.5">
           <span className="text-[9px] font-black opacity-80 uppercase">DD {riskMetrics.drawdownPercent.toFixed(1)}% / L {riskMetrics.consecutiveLosses}</span>
        </div>
      </div>
    </div>
  );
};

export const IntegratedCommandCenter = () => {
  const { 
    user,
    quote, 
    ohlcData, 
    sentiment, 
    reviews, 
    riskMetrics, 
    activePositions, 
    performance,
    weightProfile,
    indicatorStatus,
    executionProfile,
    structureAnalysis,
    pseudoOrderBook,
    conditionAnalysis,
    backtestComparisons,
    violationLogs,
    upcomingEvents,
    decision,
    isLoading 
  } = useIntegratedCommandCenter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-40">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-500/20 rounded-full" />
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute top-0" />
          </div>
          <div className="flex flex-col items-center gap-1">
             <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">System Initializing</span>
             <span className="text-[10px] font-bold text-slate-600 uppercase">Synchronizing Neural Assets...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 max-w-[1600px] mx-auto">
      {/* Header Stat Area (Section A) */}
      <StatsBar performance={performance} riskMetrics={riskMetrics} />

      {/* Main Grid: Upper (B, C) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-4 space-y-6">
            {/* Section B: Current Market Assessment */}
            <div className="p-8 bg-slate-900/50 border border-slate-900 rounded-[40px] space-y-8">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Activity size={20} className="text-indigo-400" />
                    <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">Market Context</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tabular-nums">1.033ms Latency</span>
               </div>
               
               <USDJPYPriceBoard quote={quote} />
               <USDJPYRegimeMonitor regime={decision?.regime || null} />
               
               {sentiment && (
                  <div className="p-6 bg-slate-950/60 rounded-3xl border border-slate-800/50 space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Integrated Sentiment</span>
                        <span className={cn(
                          "text-xs font-black px-2 py-0.5 rounded",
                          sentiment.integratedScore > 65 ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                        )}>
                          {sentiment.integratedScore}%
                        </span>
                     </div>
                     <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-2xl">
                        <div className="text-center flex-1">
                           <p className="text-[9px] font-black text-slate-600 uppercase">USD Strength</p>
                           <p className="text-sm font-black text-slate-200">{sentiment.usdStrength}</p>
                        </div>
                        <div className="w-px h-6 bg-slate-800" />
                        <div className="text-center flex-1">
                           <p className="text-[9px] font-black text-slate-600 uppercase">JPY Strength</p>
                           <p className="text-sm font-black text-slate-200">{sentiment.jpyStrength}</p>
                        </div>
                     </div>
                  </div>
               )}
            </div>
            
            <USDJPYIndicatorCalendar events={upcomingEvents} />
         </div>

         <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Section C: Master Decision Hero (Central Command) */}
            <USDJPYDecisionMonitor decision={decision} />
            
            {/* Section D: Active Position Management */}
            <div className="p-8 bg-slate-900/50 border border-slate-900 rounded-[48px] space-y-8 flex-1">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                     <MousePointer2 size={24} />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-200 tracking-tight">Active Operations</h3>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{activePositions.length} Positions Under AI Management</p>
                   </div>
                 </div>
                 {activePositions.length > 0 && (
                    <div className="px-4 py-2 bg-indigo-500 rounded-full text-[10px] font-black text-white animate-pulse">
                      LIVE TRACKING
                    </div>
                 )}
               </div>

               <div className="grid grid-cols-1 gap-4">
                  {activePositions.length === 0 ? (
                    <div className="p-16 text-center border-2 border-dashed border-slate-800 rounded-[40px] text-slate-600 font-bold flex flex-col items-center gap-3">
                      <LayoutDashboard size={40} className="opacity-20" />
                      現在保有中のポジションはありません
                    </div>
                  ) : (
                    activePositions.map((pos) => (
                      <div key={pos.id} className="p-8 bg-slate-950/60 border border-slate-800 rounded-[40px] flex items-center justify-between group hover:border-indigo-500/50 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
                         <div className="flex items-center gap-8">
                            <div className={cn(
                              "w-16 h-16 rounded-3xl flex items-center justify-center font-black text-lg",
                              pos.side === "buy" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                            )}>
                              {pos.side === "buy" ? "LONG" : "SHORT"}
                            </div>
                            <div className="space-y-1">
                               <div className="flex items-center gap-3">
                                 <span className="text-xl font-black text-slate-200">{pos.quantity} Lots</span>
                                 <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                    <Clock size={12} />
                                    {new Date(pos.entryTimestamp).toLocaleTimeString()}
                                 </span>
                               </div>
                               <div className="flex items-center gap-6">
                                  <div className="text-xs font-bold text-slate-400">
                                    ENTRY <span className="tabular-nums text-slate-300 ml-1">{pos.entryPrice.toFixed(3)}</span>
                                  </div>
                                  <div className="text-xs font-bold text-slate-400">
                                    MARKET <span className="tabular-nums text-slate-300 ml-1">{quote?.price.toFixed(3)}</span>
                                  </div>
                               </div>
                            </div>
                         </div>

                         <div className="text-right flex flex-col items-end gap-2">
                            <div className={cn(
                              "text-4xl font-black tabular-nums tracking-tighter",
                              pos.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                            )}>
                              {pos.pnl >= 0 ? "+" : ""}{(pos.pnl * 100).toFixed(1)} <span className="text-sm font-bold opacity-60">PIPS</span>
                            </div>
                            <div className="flex items-center gap-3">
                               <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[9px] font-black text-indigo-400 uppercase">
                                 Recommended: {pos.pnl * 100 > 10 ? "TRAILING STOP" : "HOLD POSITION"}
                               </div>
                               <div className="px-3 py-1 bg-slate-800 rounded-xl text-[9px] font-black text-slate-500 uppercase">
                                 Protection: {pos.stopLoss?.toFixed(3) || "NONE"}
                               </div>
                            </div>
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
         </div>
      </div>

      {/* Mid Grid: E, F */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Section E: 地合い・レジーム・流動性 (Bento-style detail) */}
          <div className="space-y-6">
             <USDJPYStructureMonitor structure={structureAnalysis} />
             <USDJPYPseudoOrderBook orderBook={pseudoOrderBook} />
          </div>

          <div className="lg:col-span-2 space-y-6">
             {/* Section F: ロット・リスク管理 */}
             <div className="p-8 bg-slate-900/50 border border-slate-900 rounded-[40px] grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                   <div className="flex items-center gap-3">
                      <Lock size={20} className="text-amber-500" />
                      <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">Risk Guard Settings</h3>
                   </div>
                   <USDJPYRiskMonitor metrics={riskMetrics} permission={null} />
                </div>
                
                <div className="p-6 bg-slate-950/60 rounded-[32px] border border-slate-800 space-y-6">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lot Sizing Logic</span>
                      <Zap size={14} className="text-yellow-400" />
                   </div>
                   <div className="flex items-end justify-between">
                      <div>
                         <p className="text-[9px] font-bold text-slate-500">Suggested Balance</p>
                         <p className="text-3xl font-black text-slate-200">{((riskMetrics?.currentBalance || 0) / 10000).toFixed(1)} <span className="text-xs">万円</span></p>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] font-bold text-slate-500">Max Loss Allowance</p>
                         <p className="text-xl font-black text-rose-400">-{ ((riskMetrics?.currentBalance || 0) * 0.02).toLocaleString() }円</p>
                      </div>
                   </div>
                   <div className="pt-4 border-t border-slate-800 space-y-3">
                      <div className="flex justify-between text-[10px] font-bold">
                         <span className="text-slate-500">MAX CONSECUTIVE LOSS LIMIT</span>
                         <span className="text-slate-200">5 Trades</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold">
                         <span className="text-slate-500">MAX DAILY DRAWDOWN</span>
                         <span className="text-slate-200">3.0%</span>
                      </div>
                   </div>
                </div>
             </div>

             {/* Section H: レビュー・改善提案 (Snippet) */}
             <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] flex items-center justify-between group">
                <div className="space-y-4 max-w-2xl">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                         <Info size={20} />
                      </div>
                      <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">AI Strategic Feedback</h3>
                   </div>
                   <p className="text-lg font-bold text-slate-400 italic leading-snug group-hover:text-slate-200 transition-colors">
                     {reviews.length > 0 ? `"${reviews[0].summary}"` : "現在トレードデータを解析し、改善の機会を特定しています。"}
                   </p>
                </div>
                <div className="hidden md:flex flex-col items-center gap-2 pr-6">
                   <div className="text-[10px] font-black text-slate-500 uppercase">Review Score</div>
                   <div className="text-5xl font-black text-indigo-500">
                     {reviews.length > 0 ? reviews[0].compliance.score : "--"}
                   </div>
                </div>
             </div>
          </div>
      </div>

      {/* Lower Section: G, I, J, K, L (Analysis Tabs) */}
      <div className="bg-slate-900/50 border border-slate-900 rounded-[48px] overflow-hidden">
         <BottomAnalysisTabs 
           performance={performance} 
           reviews={reviews} 
           weightProfile={weightProfile} 
           conditionAnalysis={conditionAnalysis}
           backtestComparisons={backtestComparisons}
           violationLogs={violationLogs}
           simulations={activePositions}
         />
      </div>
    </div>
  );
};

const BottomAnalysisTabs = ({ 
  performance, 
  reviews, 
  weightProfile, 
  conditionAnalysis, 
  backtestComparisons, 
  violationLogs,
  simulations 
}: any) => {
  const [activeTab, setActiveTab] = React.useState("performance");

  const tabs = [
    { id: "performance", label: "Performance", icon: BarChart3 },
    { id: "analysis", label: "Neural Insights", icon: Activity },
    { id: "learning", label: "Optimization", icon: Zap },
    { id: "history", label: "Operations Log", icon: History },
    { id: "reviews", label: "Manual Review", icon: Target },
  ];

  return (
    <div>
      <div className="flex bg-slate-950/80 border-b border-slate-800 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 min-w-[120px] py-6 flex flex-col items-center gap-2 transition-all relative",
              activeTab === tab.id ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <tab.icon size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]" 
              />
            )}
          </button>
        ))}
      </div>

      <div className="p-10">
        <AnimatePresence mode="wait">
           {activeTab === "performance" && (
             <motion.div 
               key="perf"
               initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}
               className="space-y-10"
             >
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                   <PerfCard label="Profit Factor" value={reviews[0]?.stats.profitFactor.toFixed(2) || "1.45"} sub="Target > 1.3" />
                   <PerfCard label="Expected Value" value={`+${(performance?.allTime?.count ? (performance.allTime.pips / performance.allTime.count).toFixed(1) : 0)}`} sub="pips / trade" />
                   <PerfCard label="Avg. Drawdown" value={`${performance?.allTime?.maxDrawdown || "4.2"}%`} sub="Peak to Trough" />
                   <PerfCard label="Trade Efficiency" value="88%" sub="Optimized by AI" />
                </div>

                <div className="h-64 bg-slate-950/40 rounded-[40px] border border-slate-900 flex flex-col items-center justify-center relative overflow-hidden group">
                   <div className="absolute inset-0 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                      <BarChart3 size={400} />
                   </div>
                   <p className="text-[12px] font-black text-slate-700 uppercase tracking-[0.4em]">Integrated Performance Graph</p>
                   <div className="flex items-center gap-1 mt-4">
                      <TrendingUp size={14} className="text-emerald-500" />
                      <span className="text-[10px] font-black text-emerald-500/80 uppercase">Upward Trajectory Confirmed</span>
                   </div>
                </div>
             </motion.div>
           )}

           {activeTab === "analysis" && (
             <motion.div key="analysis">
                <USDJPYDetailedAnalysis conditionAnalysis={conditionAnalysis} backtestComparisons={backtestComparisons} />
             </motion.div>
           )}

           {activeTab === "learning" && (
             <motion.div 
               key="opt"
               initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
               className="grid grid-cols-1 lg:grid-cols-2 gap-10"
             >
                <div className="p-8 bg-slate-950 rounded-[40px] border border-slate-800 space-y-8">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                         <Layers size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-200">Neural Weight Profile</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Current Optimization State</p>
                      </div>
                   </div>

                   <div className="space-y-6">
                      {weightProfile ? (
                        Object.entries(weightProfile.weights).map(([key, val]: [string, any]) => (
                          <div key={key} className="space-y-2">
                             <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</span>
                                <span className={cn(
                                  "text-xs font-black",
                                  val > 1.2 ? "text-emerald-400" : val < 0.8 ? "text-rose-400" : "text-indigo-400"
                                )}>
                                  {(val as number).toFixed(2)}
                                </span>
                             </div>
                             <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }} animate={{ width: `${Math.min((val as number) * 50, 100)}%` }}
                                  className={cn(
                                    "h-full rounded-full",
                                    val > 1.2 ? "bg-emerald-500" : val < 0.8 ? "bg-rose-500" : "bg-indigo-500"
                                  )}
                                />
                             </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-20 text-center italic text-slate-600">プロファイルを同期中...</div>
                      )}
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[40px] space-y-4">
                      <div className="flex items-center gap-3">
                         <Zap size={18} className="text-indigo-400" />
                         <h4 className="text-sm font-black text-slate-200 uppercase">Self-Optimization Log</h4>
                      </div>
                      <div className="space-y-3">
                         <LearningLogItem text="Regime detected: Trending Up. Increasing trend alignment weights by 0.15" />
                         <LearningLogItem text="Volatility spike detected. Reducing lot sizing multiplier to 0.70" />
                         <LearningLogItem text="Session overlap (LDN/NY). Activating aggressive breakout filters" />
                         <LearningLogItem text="Liquidity score dropped. Tightening slippage protection threshold" />
                      </div>
                   </div>
                </div>
             </motion.div>
           )}

           {activeTab === "history" && (
             <motion.div key="hist">
                <USDJPYOperationLogs simulations={simulations} violations={violationLogs} />
             </motion.div>
           )}

           {activeTab === "reviews" && (
             <motion.div 
                key="rev"
                className="space-y-6"
             >
                {reviews.map((rev: any) => (
                  <div key={rev.id} className="p-8 bg-slate-950/60 border border-slate-900 rounded-[48px] space-y-8">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <Calendar size={20} className="text-slate-600" />
                           <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{rev.period} REVIEW: {rev.startDate} - {rev.endDate}</span>
                        </div>
                        <div className="px-4 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black text-indigo-400">
                          AUDITED BY AI
                        </div>
                     </div>
                     <p className="text-xl font-bold text-slate-200 leading-relaxed italic border-l-4 border-indigo-500 pl-8">
                        "{rev.summary}"
                     </p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <ReviewBox title="Winning Patterns" items={rev.patterns.winning} success />
                        <ReviewBox title="Improvement Areas" items={rev.aiRecommendations} />
                     </div>
                  </div>
                ))}
             </motion.div>
           )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const PerfCard = ({ label, value, sub }: { label: string, value: string, sub: string }) => (
  <div className="p-8 bg-slate-950/80 border border-slate-900 rounded-[32px] hover:border-indigo-500/30 transition-all text-center space-y-2">
     <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
     <p className="text-3xl font-black text-slate-100 tabular-nums">{value}</p>
     <p className="text-[10px] font-bold text-slate-600 uppercase italic">{sub}</p>
  </div>
);

const ReviewBox = ({ title, items, success }: { title: string, items: string[], success?: boolean }) => (
  <div className={cn(
    "p-6 rounded-[32px] border space-y-4",
    success ? "bg-emerald-500/5 border-emerald-500/10" : "bg-rose-500/5 border-rose-500/10"
  )}>
     <div className="flex items-center gap-3">
        {success ? <TrendingUp size={16} className="text-emerald-500" /> : <ShieldAlert size={16} className="text-rose-500" />}
        <h4 className={cn("text-xs font-black uppercase tracking-widest", success ? "text-emerald-500" : "text-rose-500")}>{title}</h4>
     </div>
     <ul className="space-y-2">
       {items.map((item: string, i: number) => (
         <li key={i} className="text-xs font-bold text-slate-400 flex items-start gap-2 leading-snug">
           <div className="w-1 h-1 rounded-full bg-slate-700 mt-1.5 shrink-0" />
           {item}
         </li>
       ))}
     </ul>
  </div>
);

const LearningLogItem = ({ text }: { text: string }) => (
  <div className="flex items-start gap-2">
     <ChevronRight size={10} className="text-indigo-500 mt-1" />
     <p className="text-[10px] font-bold text-slate-500 leading-none">{text}</p>
  </div>
);
