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
  Clock
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
 * マルチ時間足トレンドモニター
 */
export const USDJPYTrendMonitor = ({ trends }: { trends: any }) => {
  if (!trends) return null;
  
  const intervals = ["1m", "5m", "15m", "1h"];
  
  return (
    <div className="p-6 bg-slate-900/50 border border-slate-900 rounded-[32px] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="p-1.5 bg-indigo-500 rounded-lg text-white">
             <Clock size={14} />
           </div>
           <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Multi-Timeframe</h3>
        </div>
        <span className="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
          Sync {trends.alignment}%
        </span>
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
 * 判断エンジンモニター
 */
export const USDJPYDecisionMonitor = ({ decision }: { decision: USDJPYDecisionResult | null }) => {
  if (!decision) return null;

  const isBuy = decision.signal === "buy";
  const isSell = decision.signal === "sell";
  const isWait = decision.signal === "wait";

  return (
    <div className="p-8 bg-slate-900/50 border border-slate-900 rounded-[48px] overflow-hidden relative group">
      {/* Background Neural Network Pulse */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-indigo-500 opacity-20" />
          <motion.circle 
            animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
            transition={{ repeat: Infinity, duration: 4 }}
            cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-indigo-500" 
          />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
        {/* Score Ring */}
        <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
            <motion.circle 
              initial={{ strokeDasharray: "0 283" }}
              animate={{ strokeDasharray: `${(decision.score / 100) * 283} 283` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              cx="50" cy="50" r="45" fill="none" 
              stroke={isBuy ? "#10b981" : isSell ? "#f43f5e" : "#6366f1"} 
              strokeWidth="8" strokeLinecap="round" 
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
             <span className="text-3xl font-black tabular-nums">{decision.score.toFixed(0)}</span>
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Score</span>
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-3">
             <div className={cn(
               "p-3 rounded-2xl",
               isBuy ? "bg-emerald-500 text-white" : 
               isSell ? "bg-rose-500 text-white" : "bg-slate-700 text-slate-300"
             )}>
                <BrainCircuit size={24} />
             </div>
             <div>
                <h3 className="text-2xl font-black tracking-tight uppercase">
                  {isBuy ? "Strong Buy" : isSell ? "Strong Sell" : "Neutral / Wait"}
                </h3>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Logic: Confidence {decision.confidence}%</span>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {decision.reasons.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-900/50">
                 <ArrowRightCircle size={14} className="mt-0.5 text-indigo-500" />
                 <span className="text-xs font-bold text-slate-400 break-all">{reason}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
