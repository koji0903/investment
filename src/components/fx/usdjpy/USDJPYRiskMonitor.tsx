"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  ShieldAlert, 
  ShieldCheck, 
  TrendingDown, 
  Flame, 
  Wallet,
  Target,
  AlertTriangle,
  History
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { FXRiskMetrics } from "@/types/fx";
import { TradePermissionResult } from "@/utils/fx/tradeGovernance";

/**
 * リスク・資金管理モニター (ガバナンス強化版)
 */
export const USDJPYRiskMonitor = ({ metrics, permission }: { metrics: FXRiskMetrics | null, permission: TradePermissionResult | null }) => {
  if (!metrics || !permission) return null;

  const isWarning = permission.status === "caution";
  const isCritical = permission.status === "stop";

  return (
    <div className="p-6 bg-slate-900/50 border border-slate-900 rounded-[32px] space-y-6 relative overflow-hidden group">
      {/* Background Pulse for Warning */}
      {isWarning && (
        <motion.div 
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className={cn(
            "absolute inset-0 pointer-events-none",
            isCritical ? "bg-rose-500" : "bg-amber-500"
          )}
        />
      )}

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
           <div className={cn(
             "p-1.5 rounded-lg text-white",
             isCritical ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-indigo-500"
           )}>
             {isCritical ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
           </div>
           <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Operational Governance</h3>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[9px] font-black text-slate-500 uppercase">System Status:</span>
           <span className={cn(
             "text-[9px] font-black uppercase px-2 py-0.5 rounded",
             isCritical ? "bg-rose-500 text-white" : isWarning ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
           )}>
             {permission.status === "stop" ? "STOP" : permission.status === "caution" ? "CAUTION" : "NORMAL"}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        <div className="space-y-1">
           <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase">
              <Wallet size={10} /> Equity
           </div>
           <div className="text-xl font-black text-slate-200 tabular-nums">
              {formatCurrency(metrics.currentBalance)}
           </div>
        </div>
        <div className="space-y-1 text-right">
           <div className="flex items-center justify-end gap-1.5 text-[9px] font-black text-slate-500 uppercase">
              <TrendingDown size={10} /> Daily PnL
           </div>
           <div className={cn(
             "text-xl font-black tabular-nums",
             metrics.dailyPnlPercent < 0 ? "text-rose-400" : "text-emerald-400"
           )}>
              {metrics.dailyPnlPercent >= 0 ? "+" : ""}{metrics.dailyPnlPercent.toFixed(2)}%
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 relative z-10">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-slate-950 flex flex-col items-center justify-center border border-slate-800">
              <span className="text-[8px] font-bold text-slate-500 uppercase">Limit</span>
              <span className="text-sm font-black text-indigo-400">{permission.dailyTradeRemaining}</span>
           </div>
           <div className="space-y-0.5">
              <span className="text-[8px] font-bold text-slate-500 uppercase">Remaining</span>
              <p className="text-[10px] font-black text-slate-400 uppercase">Daily Trades</p>
           </div>
        </div>
        
        <div className="flex items-center gap-3 justify-end">
           <div className="text-right space-y-0.5">
              <span className="text-[8px] font-bold text-slate-500 uppercase">Performance</span>
              <p className="text-[10px] font-black text-slate-400 uppercase">Win Rate {(metrics.winRate * 100).toFixed(0)}%</p>
           </div>
           <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800">
              <Target size={18} className="text-indigo-500" />
           </div>
        </div>
      </div>

      {isCritical && (
        <div className="mt-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3">
           <AlertTriangle size={16} className="text-rose-500 shrink-0" />
           <p className="text-[9px] font-bold text-rose-400 leading-tight uppercase">
              {permission.reason}
           </p>
        </div>
      )}
    </div>
  );
};
