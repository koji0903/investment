"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Zap, 
  Activity, 
  BrainCircuit, 
  ArrowRightCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Timer
} from "lucide-react";
import { cn } from "@/lib/utils";
import { USDJPYDecisionResult } from "@/utils/fx/usdjpyDecision";

/**
 * 価格・スプレッド表示ボード
 */
export const USDJPYPriceBoard = ({ quote }: { quote: any }) => {
  if (!quote) return null;
  const spreadPips = ((quote.ask - quote.bid) * 100).toFixed(1);

  return (
    <div className="p-8 bg-slate-900/80 border border-slate-800 rounded-[40px] shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Activity size={80} />
      </div>
      <div className="flex flex-col gap-6 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">USD/JPY Price Action</span>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-500 text-[10px] font-black animate-pulse">
            <Zap size={10} fill="currentColor" />
            LIVE
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-500 uppercase">Bid</span>
            <div className="text-3xl font-black text-slate-200 tabular-nums">{quote.bid.toFixed(3)}</div>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[9px] font-black text-slate-500 uppercase">Ask</span>
            <div className="text-3xl font-black text-slate-200 tabular-nums">{quote.ask.toFixed(3)}</div>
          </div>
        </div>

        <div className="py-3 bg-slate-950/50 rounded-2xl border border-slate-800/50 flex items-center justify-between px-6">
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Spread</span>
           <span className="text-sm font-black text-indigo-400 tabular-nums">{spreadPips} <span className="text-[9px] opacity-70">pips</span></span>
        </div>
      </div>
    </div>
  );
};

/**
 * マルチ時間足トレンドモニター (勝率70%版)
 */
export const USDJPYTrendMonitor = ({ trends, alignmentLevel }: { trends: any, alignmentLevel?: number }) => {
  if (!trends) return null;
  
  const intervals = ["1m", "5m", "15m", "1h"];
  
  return (
    <div className="p-6 bg-slate-900/50 border border-slate-900 rounded-[32px] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="p-1.5 bg-indigo-500 rounded-lg text-white">
             <Clock size={14} />
           </div>
           <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Trend Alignment</h3>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border",
          alignmentLevel === 100 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" :
          alignmentLevel && alignmentLevel >= 66 ? "bg-amber-500/10 text-amber-500 border-amber-500/30" :
          "bg-slate-800 text-slate-500 border-slate-700"
        )}>
           {alignmentLevel === 100 ? "Strong" : alignmentLevel && alignmentLevel >= 66 ? "Mid" : "Weak"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {intervals.map((itv) => (
          <div key={itv} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-500 uppercase">{itv}</span>
            <div className={cn(
               "p-1.5 rounded-lg",
               trends[itv] === "bullish" ? "bg-emerald-500/10 text-emerald-500" :
               trends[itv] === "bearish" ? "bg-rose-500/10 text-rose-500" :
               "bg-slate-800 text-slate-400"
            )}>
               {trends[itv] === "bullish" ? <TrendingUp size={14} /> :
                trends[itv] === "bearish" ? <TrendingDown size={14} /> :
                <Minus size={14} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 環境フィルター・時間帯情報
 */
export const USDJPYFilterStatus = ({ decision }: { decision: USDJPYDecisionResult | null }) => {
  if (!decision) return null;

  const filters = [
    { label: "Trend", status: decision.alignmentLevel >= 66, icon: TrendingUp },
    { label: "Vol", status: decision.volatilityATR > 0.08, icon: Activity },
    { label: "Session", status: decision.session.isOk, icon: Timer },
    { label: "Stability", status: !decision.isFakeoutSuspicion, icon: ShieldCheck },
    { label: "Perfect", status: decision.envDetails.isPerfectOrder, icon: Search },
  ];

  return (
    <div className="p-6 bg-slate-900/50 border border-slate-900 rounded-[32px] space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Neural Filters</h3>
        <span className={cn(
          "text-[9px] font-black px-2 py-0.5 rounded flex items-center gap-1",
          decision.isEnvironmentOk ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
        )}>
          {decision.isEnvironmentOk ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
          ENV {decision.isEnvironmentOk ? "OK" : "NG"}
        </span>
      </div>
      
      <div className="grid grid-cols-5 gap-2">
        {filters.map((f, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
             <div className={cn(
               "w-10 h-10 rounded-xl flex items-center justify-center border",
               f.status ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-slate-950 text-slate-700 border-slate-800"
             )}>
                <f.icon size={18} />
             </div>
             <span className="text-[8px] font-bold text-slate-500 uppercase">{f.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
         <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Current Session</span>
         <span className={cn(
           "text-[10px] font-black px-2 py-1 rounded bg-slate-950 border border-slate-800",
           decision.session.isOk ? "text-indigo-400" : "text-slate-600"
         )}>
           {decision.session.name.toUpperCase()}
         </span>
      </div>
    </div>
  );
};

/**
 * 判断エンジンモニター (巨大な判定表示)
 */
export const USDJPYDecisionMonitor = ({ decision }: { decision: USDJPYDecisionResult | null }) => {
  if (!decision) return null;

  const isBuy = decision.isEntryAllowed && decision.signal === "buy";
  const isSell = decision.isEntryAllowed && decision.signal === "sell";
  const isWait = !decision.isEntryAllowed;

  return (
    <div className="p-10 bg-slate-900/50 border-2 border-slate-800 rounded-[56px] overflow-hidden relative group">
      {/* Background Neural Network Pulse */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <motion.circle 
            animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.2, 0.05] }}
            transition={{ repeat: Infinity, duration: 3 }}
            cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-indigo-400" 
          />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center gap-8">
        
        {/* Main Status Badge */}
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className={cn(
            "px-6 py-2 rounded-2xl border flex items-center gap-2",
            isBuy ? "bg-emerald-500 text-white border-emerald-400" : 
            isSell ? "bg-rose-500 text-white border-rose-400" : 
            "bg-slate-800 text-slate-400 border-slate-700"
          )}
        >
          {isWait ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
          <span className="text-xs font-black uppercase tracking-[0.2em]">Decision Status</span>
        </motion.div>

        {/* Huge Decision Text */}
        <div className="space-y-2">
           <motion.h2 
             key={decision.signal + decision.isEntryAllowed}
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             className={cn(
              "text-7xl md:text-8xl font-black tracking-tighter uppercase tabular-nums",
              isBuy ? "text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]" : 
              isSell ? "text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,94,0.3)]" : 
              "text-slate-600"
            )}
           >
             {isWait ? "WAITING" : isBuy ? "BUY NOW" : "SELL NOW"}
           </motion.h2>
           <p className="text-xs font-bold text-slate-500 uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
             {decision.reasons[0] || "分析エンジンが市場環境を常時監視中..."}
           </p>
        </div>

        {/* Score & Reasons Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
           <div className="p-6 bg-slate-950/80 rounded-[32px] border border-slate-900 flex flex-col items-center justify-center gap-2">
              <span className="text-[10px] font-black text-slate-500 uppercase">Neural Confidence</span>
              <div className="text-4xl font-black text-indigo-400">{decision.confidence}%</div>
           </div>

           <div className="flex flex-col gap-2 text-left justify-center">
             {decision.reasons.slice(1, 4).map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                   <div className="w-1 h-1 rounded-full bg-indigo-500" />
                   {r}
                </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};
