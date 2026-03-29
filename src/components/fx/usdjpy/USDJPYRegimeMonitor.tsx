"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Compass, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  Zap,
  Activity,
  AlertTriangle,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FXMarketRegime } from "@/types/fx";

/**
 * 相場レジーム判定モニター
 */
export const USDJPYRegimeMonitor = ({ regime }: { regime: FXMarketRegime | null }) => {
  if (!regime) return null;

  const getIcon = () => {
    switch (regime.type) {
      case "TREND_UP": return <TrendingUp size={18} className="text-emerald-400" />;
      case "TREND_DOWN": return <TrendingDown size={18} className="text-rose-400" />;
      case "RANGE": return <RotateCcw size={18} className="text-indigo-400" />;
      case "HIGH_VOLATILITY": return <Zap size={18} className="text-amber-400" />;
      case "LOW_VOLATILITY": return <Activity size={18} className="text-slate-500" />;
      case "INSTABILITY": return <AlertTriangle size={18} className="text-rose-500" />;
      default: return <Compass size={18} className="text-slate-400" />;
    }
  };

  const getStatusColor = () => {
    if (regime.confidence > 80) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (regime.confidence > 60) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    return "bg-slate-800 text-slate-500 border-slate-700";
  };

  return (
    <div className="p-6 bg-slate-900/50 border border-slate-900 rounded-[40px] shadow-2xl space-y-6 relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
         <Compass size={120} />
      </div>

      <div className="flex items-center justify-between relative z-10">
         <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-800 rounded-xl">
               <Compass size={18} className="text-indigo-400" />
            </div>
            <div>
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Market Regime</h3>
               <p className="text-[10px] text-indigo-400 font-black uppercase">Real-time Classification</p>
            </div>
         </div>
         <div className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border", getStatusColor())}>
            Confidence {regime.confidence}%
         </div>
      </div>

      <div className="space-y-4 relative z-10">
         <div className="flex items-center gap-4 bg-slate-950/80 p-5 rounded-[24px] border border-slate-800/50">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800 group-hover:scale-110 transition-transform">
               {getIcon()}
            </div>
            <div className="space-y-1">
               <h4 className="text-xl font-black text-slate-200 tracking-tight">{regime.name}</h4>
               <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 leading-tight">
                  <Info size={12} className="text-indigo-500 shrink-0" />
                  {regime.reason}
               </p>
            </div>
         </div>

         <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-950/30 rounded-2xl border border-slate-800/30 text-center space-y-1 hover:bg-slate-800/30 transition-colors">
               <span className="text-[8px] font-black text-slate-500 uppercase">Trend Slope</span>
               <div className="text-xs font-black text-slate-300 tabular-nums">
                  {regime.metrics.maSlope > 0 ? "+" : ""}{regime.metrics.maSlope.toFixed(2)}
               </div>
            </div>
            <div className="p-3 bg-slate-950/30 rounded-2xl border border-slate-800/30 text-center space-y-1 hover:bg-slate-800/30 transition-colors">
               <span className="text-[8px] font-black text-slate-500 uppercase">ATR Level</span>
               <div className="text-xs font-black text-slate-300 tabular-nums">
                  {regime.metrics.atrLevel.toFixed(3)}
               </div>
            </div>
            <div className="p-3 bg-slate-950/30 rounded-2xl border border-slate-800/30 text-center space-y-1 hover:bg-slate-800/30 transition-colors">
               <span className="text-[8px] font-black text-slate-500 uppercase">BB Width</span>
               <div className="text-xs font-black text-slate-300 tabular-nums">
                  {regime.metrics.bbWidth.toFixed(2)}%
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
