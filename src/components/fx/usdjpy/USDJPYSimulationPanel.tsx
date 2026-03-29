"use client";

import React, { useState, useEffect } from "react";
import { FXSimulation, TechnicalTrend, StructurePhase } from "@/types/fx";
import { FXSimulationService } from "@/services/fxSimulationService";
import { useAuth } from "@/context/AuthContext";
import { 
  Plus, 
  X, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck,
  History,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, cn } from "@/lib/utils";
import { USDJPYDecisionResult } from "@/utils/fx/usdjpyDecision";

/**
 * USD/JPY シミュレーション（仮想トレード）パネル
 */
export const USDJPYSimulationPanel = ({ 
  currentPrice, 
  decision 
}: { 
  currentPrice: number; 
  decision: USDJPYDecisionResult | null 
}) => {
  const { user } = useAuth();
  const [activeSims, setActiveSims] = useState<FXSimulation[]>([]);
  const [history, setHistory] = useState<FXSimulation[]>([]);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 入力フォームの状態
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [riskAmount, setRiskAmount] = useState(10000); // 1万円リスク
  const [stopPips, setStopPips] = useState(20); // 20 pips 損切り
  const [tpPips, setTpPips] = useState(40); // 40 pips 利確 (RR 1:2)

  // ロット計算 (1ロット = 1万通貨想定)
  const lotSize = (riskAmount / (stopPips * 0.01 * 10000)).toFixed(2);

  const fetchSims = async () => {
    if (!user) return;
    const active = await FXSimulationService.getActiveSimulations(user.uid);
    const past = await FXSimulationService.getSimulationHistory(user.uid);
    setActiveSims(active);
    setHistory(past);
  };

  useEffect(() => {
    fetchSims();
  }, [user]);

  const handleEntry = async () => {
    if (!user || !decision) return;
    setIsSubmitting(true);
    try {
      const stopPrice = side === "buy" ? currentPrice - (stopPips * 0.01) : currentPrice + (stopPips * 0.01);
      const tpPrice = side === "buy" ? currentPrice + (tpPips * 0.01) : currentPrice - (tpPips * 0.01);

      await FXSimulationService.createSimulation(user.uid, {
        userId: user.uid,
        pairCode: "USD/JPY",
        side,
        entryPrice: currentPrice,
        entryTimestamp: new Date().toISOString(),
        takeProfit: tpPrice,
        stopLoss: stopPrice,
        quantity: parseFloat(lotSize),
        entryReason: decision.reasons.join(", "),
        status: "open",
        context: {
          trend1m: decision.trends["1m"],
          trend5m: decision.trends["5m"],
          trend15m: decision.trends["15m"],
          trend1h: decision.trends["1h"],
          rsi15m: 50, // 簡易
          volatilityATR: decision.volatility.atr,
          isBreakout: false,
          structuralPhase: "consolidating",
          totalScore: decision.score
        }
      });
      fetchSims();
      setShowEntryForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async (id: string, currentPrice: number) => {
    if (!user) return;
    try {
      await FXSimulationService.closeSimulation(user.uid, id, currentPrice, "Manual Market Exit");
      fetchSims();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header & Stats */}
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
               <Plus size={20} />
            </div>
            <h3 className="text-xl font-black tracking-tight">Simulator</h3>
         </div>
         <button 
           onClick={() => setShowEntryForm(true)}
           className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 active:scale-95 transition-all text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/10"
         >
           New Position
         </button>
      </div>

      {/* Active Positions List */}
      <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] sticky top-0 bg-slate-950/80 backdrop-blur pb-2 z-10">Active Trades</h4>
        
        {activeSims.length === 0 ? (
          <div className="p-8 bg-slate-900/30 border border-dashed border-slate-800 rounded-[32px] flex flex-col items-center justify-center gap-3 text-slate-600">
             <History size={32} />
             <p className="text-[10px] font-black uppercase tracking-widest">No active simulations</p>
          </div>
        ) : (
          activeSims.map((sim) => {
            const currentPnl = sim.side === "buy" ? currentPrice - sim.entryPrice : sim.entryPrice - currentPrice;
            const pnlAmount = currentPnl * sim.quantity * 100 * 100; // 1Lot=1万通貨
            const isProfit = pnlAmount >= 0;

            return (
              <motion.div 
                layout
                key={sim.id}
                className="p-5 bg-slate-900 border border-slate-800 rounded-3xl relative overflow-hidden group"
              >
                <div className={cn(
                  "absolute top-0 left-0 w-1 h-full",
                  sim.side === "buy" ? "bg-emerald-500" : "bg-rose-500"
                )} />
                <div className="flex items-start justify-between">
                   <div className="space-y-1">
                      <div className="flex items-center gap-2">
                         <span className={cn(
                           "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter",
                           sim.side === "buy" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                         )}>
                           {sim.side}
                         </span>
                         <span className="text-xs font-black text-slate-300">{(sim.quantity).toFixed(2)} Lots</span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Entry: {sim.entryPrice.toFixed(3)}</div>
                   </div>
                   <div className="text-right">
                      <div className={cn(
                        "text-lg font-black tabular-nums",
                        isProfit ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {isProfit ? "+" : ""}{formatCurrency(pnlAmount)}
                      </div>
                      <button 
                        onClick={() => handleClose(sim.id, currentPrice)}
                        className="text-[9px] font-black text-slate-500 hover:text-rose-500 transition-colors uppercase tracking-widest"
                      >
                        Market Exit
                      </button>
                   </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Entry Dialog Overlay */}
      <AnimatePresence>
        {showEntryForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEntryForm(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 p-8 rounded-[48px] shadow-2xl"
            >
              <button 
                onClick={() => setShowEntryForm(false)}
                className="absolute top-6 right-6 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-500"
              >
                <X size={20} />
              </button>

              <div className="space-y-8">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white">
                       <Zap size={24} fill="currentColor" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black tracking-tight">Execution Panel</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Setup Virtual Position</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setSide("buy")}
                      className={cn(
                        "py-4 rounded-2xl border-2 font-black text-sm uppercase flex items-center justify-center gap-2 transition-all",
                        side === "buy" ? "bg-emerald-500 border-emerald-400 text-white shadow-2xl shadow-emerald-500/20" : "bg-slate-950 border-slate-800 text-slate-600"
                      )}
                    >
                      <TrendingUp size={18} /> BUY
                    </button>
                    <button 
                      onClick={() => setSide("sell")}
                      className={cn(
                        "py-4 rounded-2xl border-2 font-black text-sm uppercase flex items-center justify-center gap-2 transition-all",
                        side === "sell" ? "bg-rose-500 border-rose-400 text-white shadow-2xl shadow-rose-500/20" : "bg-slate-950 border-slate-800 text-slate-600"
                      )}
                    >
                      <TrendingDown size={18} /> SELL
                    </button>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-3">
                       <div className="flex justify-between text-[11px] font-black uppercase text-slate-500">
                          <span>Risk Amount (JPY)</span>
                          <span className="text-slate-300">¥{riskAmount.toLocaleString()}</span>
                       </div>
                       <input 
                        type="range" min="1000" max="100000" step="1000"
                        value={riskAmount} onChange={(e) => setRiskAmount(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-full appearance-none accent-indigo-500"
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stop Loss (Pips)</label>
                          <input 
                            type="number" value={stopPips} onChange={(e) => setStopPips(parseInt(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-black focus:border-indigo-500 outline-none"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Take Profit (Pips)</label>
                          <input 
                            type="number" value={tpPips} onChange={(e) => setTpPips(parseInt(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-black focus:border-indigo-500 outline-none"
                          />
                       </div>
                    </div>
                 </div>

                 <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800 flex items-center justify-between">
                    <div className="space-y-1">
                       <span className="text-[10px] font-black text-slate-500 uppercase">Calculated Lot</span>
                       <div className="text-2xl font-black text-indigo-400">{lotSize} <span className="text-sm opacity-50">Lots</span></div>
                    </div>
                    <div className={cn(
                      "p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                    )}>
                       <ShieldCheck size={28} />
                    </div>
                 </div>

                 <button 
                  disabled={isSubmitting || !decision}
                  onClick={handleEntry}
                  className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 active:scale-[0.98] transition-all"
                 >
                   {isSubmitting ? "Processing..." : "Confirm Execution"}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
