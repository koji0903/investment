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
  Timer,
  AlertCircle,
  Target,
  ChevronRightSquare
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
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">USD/JPY 価格アクション</span>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-500 text-[10px] font-black animate-pulse">
            <Zap size={10} fill="currentColor" />
            LIVE
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-500 uppercase">売値 (Bid)</span>
            <div className="text-3xl font-black text-slate-200 tabular-nums">{quote.bid.toFixed(3)}</div>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[9px] font-black text-slate-500 uppercase">買値 (Ask)</span>
            <div className="text-3xl font-black text-slate-200 tabular-nums">{quote.ask.toFixed(3)}</div>
          </div>
        </div>

        <div className="py-3 bg-slate-950/50 rounded-2xl border border-slate-800/50 flex items-center justify-between px-6">
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">スプレッド</span>
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
           <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">トレンド一致度</h3>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border",
          alignmentLevel === 100 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" :
          alignmentLevel && alignmentLevel >= 66 ? "bg-amber-500/10 text-amber-500 border-amber-500/30" :
          "bg-slate-800 text-slate-500 border-slate-700"
        )}>
           {alignmentLevel === 100 ? "一致（強）" : alignmentLevel && alignmentLevel >= 66 ? "一致（中）" : "乖離（弱）"}
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
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">ニューラル・フィルター</h3>
        <span className={cn(
          "text-[9px] font-black px-2 py-0.5 rounded flex items-center gap-1",
          decision.isEnvironmentOk ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
        )}>
          {decision.isEnvironmentOk ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
          環境 {decision.isEnvironmentOk ? "OK" : "NG"}
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
         <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">現在のセッション</span>
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
 * 判断エンジンモニター (巨大な判定表示 - Section C 最終トレード判定)
 */
export const USDJPYDecisionMonitor = ({ decision }: { decision: USDJPYDecisionResult | null }) => {
  if (!decision) return null;

  const rec = decision.recommendation;
  const isActionAllowed = decision.isEntryAllowed && rec.action !== "WAIT" && rec.action !== "PROHIBITED";
  
  const getActionColor = () => {
    switch (rec.action) {
      case "BUY": return "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_40px_rgba(16,185,129,0.1)]";
      case "SELL": return "text-rose-400 border-rose-500/30 bg-rose-500/5 shadow-[0_0_40px_rgba(244,63,94,0.1)]";
      case "BUY_PROBE": return "text-emerald-300 border-emerald-500/20 bg-emerald-500/3";
      case "SELL_PROBE": return "text-rose-300 border-rose-500/20 bg-rose-500/3";
      case "BUY_PARTIAL": return "text-emerald-200 border-emerald-500/15 bg-emerald-500/2";
      case "SELL_PARTIAL": return "text-rose-200 border-rose-500/15 bg-rose-500/2";
      case "CAUTION_LOT_REDUCTION": return "text-amber-400 border-amber-500/30 bg-amber-500/5";
      case "PROHIBITED": return "text-slate-600 border-slate-700 bg-slate-900/50 grayscale";
      default: return "text-slate-500 border-slate-800 bg-slate-900/30";
    }
  };

  const statusMap: Record<string, { label: string; icon: any }> = {
    BUY: { label: "買い推奨", icon: ArrowRightCircle },
    SELL: { label: "売り推奨", icon: ArrowRightCircle },
    BUY_PROBE: { label: "試し買い", icon: ArrowRightCircle },
    SELL_PROBE: { label: "試し売り", icon: ArrowRightCircle },
    BUY_PARTIAL: { label: "部分買い", icon: ArrowRightCircle },
    SELL_PARTIAL: { label: "部分売り", icon: ArrowRightCircle },
    CAUTION_LOT_REDUCTION: { label: "ロット縮小", icon: AlertCircle },
    WAIT: { label: "待機", icon: Timer },
    PROHIBITED: { label: "禁止", icon: ShieldAlert },
  };

  const StatusIcon = (statusMap[rec.action] || statusMap.WAIT).icon;

  return (
    <div className={cn(
      "p-10 border-2 rounded-[56px] overflow-hidden relative group transition-all duration-700",
      getActionColor()
    )}>
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <div className="relative z-10 flex flex-col items-center text-center gap-8">
        
        {/* Upper Header: Mission Control Status */}
        <div className="flex items-center gap-6 w-full">
           <div className="h-px flex-1 bg-current opacity-10" />
           <motion.div 
             initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
             className="flex items-center gap-2"
           >
              <StatusIcon size={14} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">意思決定エンジン v2.0</span>
           </motion.div>
           <div className="h-px flex-1 bg-current opacity-10" />
        </div>

        {/* Huge Decision Text */}
        <div className="space-y-4">
           <motion.h2 
             key={rec.action}
             initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
             className="text-7xl md:text-9xl font-black tracking-tighter uppercase tabular-nums leading-none"
           >
             {rec.action === "BUY" ? "BUY" : rec.action === "SELL" ? "SELL" : rec.action.replace(/_/g, " ")}
           </motion.h2>
           <div className="flex items-center justify-center gap-3">
              <span className="px-4 py-1 bg-white/5 rounded-full text-sm font-black tracking-widest text-white/40">
                信頼度: {decision.confidence}%
              </span>
           </div>
        </div>

        {/* Recommended Strategy Detail Grid */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
           {[
             { label: "推奨ロット", value: `${rec.lot} L`, icon: Zap },
             { label: "損切り (SL)", value: rec.sl.toFixed(3), icon: ShieldCheck },
             { label: "利確 (TP)", value: rec.tp.toFixed(3), icon: Target },
             { label: "リスクリワード", value: `1:${rec.rr}`, icon: ChevronRightSquare },
           ].map((item, i) => (
             <div key={i} className="p-5 bg-black/20 border border-white/5 rounded-[32px] flex flex-col items-center gap-1 group/item hover:bg-black/40 transition-all">
                <item.icon size={14} className="text-white/20 mb-1" />
                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{item.label}</span>
                <span className="text-lg font-black text-white/90 tabular-nums">{item.value}</span>
             </div>
           ))}
        </div>

        {/* Strategy Context Reason */}
        <div className="max-w-xl p-6 bg-white/5 rounded-[40px] border border-white/5 space-y-2">
           <div className="flex items-center justify-center gap-2 text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">
              <Search size={10} />
              判断根拠 / Reasoning Context
           </div>
           <p className="text-sm font-bold text-white/80 leading-relaxed italic">
             "{rec.reason}"
           </p>
           <div className="flex flex-wrap justify-center gap-2 pt-2">
              {decision.reasons.slice(1, 4).map((r, i) => (
                <span key={i} className="px-2 py-0.5 bg-black/20 rounded text-[9px] font-bold text-white/40">
                   {r}
                </span>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
