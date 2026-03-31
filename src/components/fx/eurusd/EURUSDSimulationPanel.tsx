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
import { EURUSDDecisionResult } from "@/utils/fx/eurusdDecision";
import { calculateAdjustedLot } from "@/utils/fx/lotCalculator";
import { checkTradePermission, TradePermissionResult } from "@/utils/fx/tradeGovernance";
import { FXRiskMetrics } from "@/types/fx";
import { FXTuningConfig } from "@/types/fxTuning";
import { Settings2, Calculator, Info, ShieldX, MessageSquare } from "lucide-react";
import { HelpTooltip } from "../FXUIComponents";

/**
 * EUR/USD シミュレーション（仮想トレード）パネル
 */
export const EURUSDSimulationPanel = ({ 
  currentPrice,
  decision,
  showEntryForm,
  setShowEntryForm,
  riskMetrics,
  indicatorStatus,
  executionProfile,
  tuningConfig
}: { 
  currentPrice: number; 
  decision: EURUSDDecisionResult | null;
  showEntryForm: boolean;
  setShowEntryForm: (show: boolean) => void;
  riskMetrics: FXRiskMetrics | null;
  indicatorStatus?: { status: "normal" | "caution" | "prohibited", message: string };
  executionProfile?: { spreadPips: number, qualityScore: number, status: "ideal" | "caution" | "critical", volatilitySpike: boolean };
  tuningConfig?: FXTuningConfig | null;
}) => {
  const { user } = useAuth();
  const [activeSims, setActiveSims] = useState<FXSimulation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useAutoLot, setUseAutoLot] = useState(true);

  // 入力フォームの状態
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [riskPercent, setRiskPercent] = useState(1.0); 
  const [stopPips, setStopPips] = useState(15); // EURUSDはUSDJPYより若干ボラが安定している想定
  const [tpPips, setTpPips] = useState(30);
  const [manualLot, setManualLot] = useState(0.1);

  // 統合ロット計算
  const lotResult = React.useMemo(() => {
    if (!riskMetrics || !decision) return null;
    return calculateAdjustedLot(
      riskMetrics,
      riskPercent,
      stopPips,
      decision.score,
      decision.isEnvironmentOk,
      indicatorStatus?.status || "normal",
      executionProfile?.status || "ideal",
      decision.structure.completionScore,
      decision.orderBook.liquidityScore,
      tuningConfig
    );
  }, [riskMetrics, riskPercent, stopPips, decision, tuningConfig, indicatorStatus, executionProfile]);

  const finalLot = useAutoLot ? (lotResult?.adjustedLot || 0.01) : manualLot;

  const permission: TradePermissionResult = React.useMemo(() => {
    return checkTradePermission(
      riskMetrics || { 
        userId: user?.uid || "", 
        currentBalance: 1000000, 
        maxBalance: 1000000, 
        drawdownPercent: 0, 
        consecutiveLosses: 0, 
        winRate: 0, 
        totalFinishedTrades: 0, 
        violationCount: 0,
        dailyTradeCount: 0,
        dailyPnlPercent: 0,
        lastEntryTimestamp: new Date(0).toISOString(),
        lastExitTimestamp: new Date(0).toISOString(),
        lastTradeTimestamp: new Date().toISOString(),
        ruleComplianceRate: 100,
        operationStatus: "normal"
      },
      decision,
      activeSims.length > 0
    );
  }, [riskMetrics, decision, activeSims, user]);

  const fetchSims = React.useCallback(async () => {
    if (!user) return;
    try {
      const active = await FXSimulationService.getActiveSimulations(user.uid, "EUR/USD");
      setActiveSims(active);
    } catch (err) {
      console.error("Failed to fetch simulations:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchSims();
  }, [fetchSims]);

  const handleEntry = async () => {
    if (!user || !decision) return;
    setIsSubmitting(true);
    try {
      // EURUSD: 1 Pip = 0.0001
      const stopPrice = side === "buy" ? currentPrice - (stopPips * 0.0001) : currentPrice + (stopPips * 0.0001);
      const tpPrice = side === "buy" ? currentPrice + (tpPips * 0.0001) : currentPrice - (tpPips * 0.0001);

      await FXSimulationService.createSimulation(user.uid, {
        userId: user.uid,
        pairCode: "EUR/USD",
        side,
        entryPrice: currentPrice,
        entryTimestamp: new Date().toISOString(),
        takeProfit: tpPrice,
        stopLoss: stopPrice,
        quantity: finalLot,
        entryReason: decision.reasons.join(", ") + (useAutoLot ? ` [Auto-Lot: ${lotResult?.reason}]` : ""),
        status: "open",
        context: {
          timestamp: new Date().toISOString(),
          timezone: decision.session.name,
          price: currentPrice,
          trends: {
            "1m": (decision?.trends["1m"] || "neutral") as TechnicalTrend,
            "5m": (decision?.trends["5m"] || "neutral") as TechnicalTrend,
            "15m": (decision?.trends["15m"] || "neutral") as TechnicalTrend,
            "1h": (decision?.trends["1h"] || "neutral") as TechnicalTrend,
            alignment: decision?.alignmentLevel || 0
          },
          volatility: {
            atr: decision?.volatilityATR || 0,
            status: (decision?.volatilityATR || 0) > 0.0015 ? "high" : (decision?.volatilityATR || 0) < 0.0005 ? "low" : "normal"
          },
          levels: {
            distToSupport: decision.supportResistance?.support ? (currentPrice - decision.supportResistance.support) * 10000 : 0,
            distToResistance: decision.supportResistance?.resistance ? (decision.supportResistance.resistance - currentPrice) * 10000 : 0,
            isBreakout: decision.isBreakout,
            isFakeoutSuspected: decision.isFakeoutSuspicion
          },
          setup: {
            isPerfectOrder: decision.envDetails.isPerfectOrder,
            isPullback: decision.reasons.some((r: string) => r.includes("Pullback")),
            score: decision.score
          },
          executionQuality: executionProfile?.qualityScore || 100,
          eventStatus: indicatorStatus?.status || "normal",
          structure: decision.structure,
          environment: decision.regime.type
        },
      }, executionProfile);
      fetchSims();
      setShowEntryForm(false);
    } catch (err) {
      console.error(err);
      alert(`注文失敗: ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async (id: string, currentPrice: number) => {
    if (!user) return;
    try {
      await FXSimulationService.closeSimulation(user.uid, id, currentPrice, "Manual Exit", "EUR/USD");
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
            <h3 className="text-xl font-black tracking-tight">シミュレーター / 仮想トレード</h3>
         </div>
         <button 
           onClick={() => setShowEntryForm(true)}
           className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 active:scale-95 transition-all text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/10"
         >
           新規ポジション
         </button>
      </div>

      {/* Active Positions List */}
      <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] sticky top-0 bg-slate-950/80 backdrop-blur pb-2 z-10">保有中のポジション</h4>
        
        {activeSims.length === 0 ? (
          <div className="p-8 bg-slate-900/30 border border-dashed border-slate-800 rounded-[32px] flex flex-col items-center justify-center gap-3 text-slate-600">
             <History size={32} />
             <p className="text-[10px] font-black uppercase tracking-widest">アクティブなシミュレーションはありません</p>
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
                           {sim.side === "buy" ? "買い" : "売り"}
                         </span>
                         <span className="text-xs font-black text-slate-300">{(sim.quantity).toFixed(2)} ロット</span>
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
                        成行決済
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
                        <h3 className="text-2xl font-black tracking-tight">注文パネル</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">仮想ポジションの設定</p>
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
                      <TrendingUp size={18} /> 買い (BUY)
                    </button>
                    <button 
                      onClick={() => setSide("sell")}
                      className={cn(
                        "py-4 rounded-2xl border-2 font-black text-sm uppercase flex items-center justify-center gap-2 transition-all",
                        side === "sell" ? "bg-rose-500 border-rose-400 text-white shadow-2xl shadow-rose-500/20" : "bg-slate-950 border-slate-800 text-slate-600"
                      )}
                    >
                      <TrendingDown size={18} /> 売り (SELL)
                    </button>
                 </div>

                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                          <Settings2 size={12} /> リスク・パラメータ
                       </h4>
                       <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                          <button 
                            onClick={() => setUseAutoLot(true)}
                            className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all", useAutoLot ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/10" : "text-slate-500 hover:text-slate-300")}>
                            自動
                          </button>
                          <button 
                            onClick={() => setUseAutoLot(false)}
                            className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all", !useAutoLot ? "bg-amber-500 text-white shadow-lg shadow-amber-500/10" : "text-slate-500 hover:text-slate-300")}>
                            手動
                          </button>
                       </div>
                    </div>

                    <div className="space-y-3 group/risk relative cursor-help">
                       <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                          <span className="flex items-center gap-1">
                            1トレードあたりの許容リスク (%)
                            <Info size={10} className="opacity-0 group-hover/risk:opacity-40 transition-opacity" />
                          </span>
                          <span className="text-indigo-400 font-black">{riskPercent.toFixed(1)}%</span>
                       </div>
                       <input 
                        type="range" min="0.1" max="2.0" step="0.1"
                        value={riskPercent} onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-full appearance-none accent-indigo-500"
                       />
                       <div className="flex justify-between text-[9px] text-slate-600 font-bold">
                          <span>保守的 (0.1%)</span>
                          <span>制限 (2.0%)</span>
                       </div>
                       <HelpTooltip 
                         text="1回の取引で許容する損失額を、全資金の何%にするか。プロの推奨は1.0%〜2.0%です。" 
                         position="bottom-full left-0"
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-6 pb-2">
                       <div className="space-y-2 group/sl relative cursor-help">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                             <Calculator size={10} /> ストップロス (Pips)
                             <Info size={10} className="opacity-0 group-hover/sl:opacity-40 transition-opacity" />
                          </label>
                          <input 
                            type="number" value={stopPips} onChange={(e) => setStopPips(parseInt(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-black focus:border-indigo-500 outline-none tabular-nums"
                          />
                          <HelpTooltip 
                            text="値動きの単位です。ドル円では20Pips=0.2円となります。ここを指定することで適切なロットを選定します。" 
                            position="bottom-full left-0"
                          />
                       </div>
                       <div className="space-y-2 group/tp relative cursor-help">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                             <TrendingUp size={10} /> ターゲット (Pips)
                             <Info size={10} className="opacity-0 group-hover/tp:opacity-40 transition-opacity" />
                          </label>
                          <input 
                            type="number" value={tpPips} onChange={(e) => setTpPips(parseInt(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-black focus:border-indigo-500 outline-none tabular-nums"
                          />
                          <HelpTooltip 
                            text="利益を確定させたい目標の値幅です。ストップロスの1.5倍〜2倍以上に設定するのが基本です。" 
                            position="bottom-full right-0"
                          />
                       </div>
                    </div>
                 </div>

                 <div className={cn(
                    "p-6 rounded-[32px] border transition-all duration-300",
                    !permission.isAllowed ? "bg-rose-500/5 border-rose-500/20" :
                    useAutoLot ? "bg-indigo-500/5 border-indigo-500/20" : "bg-slate-950 border-slate-800"
                 )}>
                    {!permission.isAllowed ? (
                       <div className="space-y-4">
                          <div className="flex items-center gap-3 text-rose-500">
                             <ShieldX size={24} />
                             <span className="text-sm font-black uppercase tracking-widest">取引禁止</span>
                          </div>
                          <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                             <p className="text-[11px] font-bold text-rose-400 leading-tight">
                                {permission.reason}
                             </p>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 italic">
                             <MessageSquare size={12} />
                             {permission.status === "stop" ? "「規律を守ることが、長期的な利益への唯一の道です」" : "「焦りは禁物です。条件が整うまで待つのがプロの仕事です」"}
                          </div>
                       </div>
                    ) : !useAutoLot ? (
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest">手動ロット入力</label>
                          <input 
                            type="number" step="0.01" value={manualLot} onChange={(e) => setManualLot(parseFloat(e.target.value))}
                            className="w-full bg-slate-900 border border-amber-500/20 rounded-2xl px-5 py-4 text-2xl font-black text-amber-500 outline-none tabular-nums"
                          />
                       </div>
                    ) : (
                       <div className="space-y-4 group/autolot relative cursor-help">
                          <div className="flex items-start justify-between">
                             <div className="space-y-1">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                                  AI推奨ロット
                                  <Info size={10} className="opacity-0 group-hover/autolot:opacity-40 transition-opacity" />
                                </span>
                                <div className="text-4xl font-black text-white tabular-nums tracking-tighter">
                                   {lotResult?.adjustedLot} <span className="text-sm text-indigo-400/50 uppercase ml-1">ロット</span>
                                </div>
                             </div>
                             <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
                                <ShieldCheck size={28} />
                             </div>
                          </div>
                          
                          <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50 space-y-2">
                             <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                <Info size={12} className="text-indigo-500" /> ロット計算ロジック
                             </div>
                             <p className="text-[11px] font-bold text-slate-300 leading-tight">
                                {lotResult?.reason}
                             </p>
                          </div>
                          
                          <div className="flex justify-between items-center px-2">
                             <span className="text-[10px] font-black text-slate-500 uppercase">推定最大損失</span>
                             <span className="text-sm font-black text-rose-400 tabular-nums">-{formatCurrency(lotResult?.maxLossAmount || 0)}</span>
                          </div>
                          <HelpTooltip 
                            text="リスク許容度と分析スコアから算出された、今回の取引に最適な数量です。根拠は下の説明を確認してください。" 
                          />
                       </div>
                    )}
                 </div>

                 <button 
                  disabled={isSubmitting || !decision || !permission.isAllowed || (useAutoLot && !lotResult?.isExecutionAllowed)}
                  onClick={() => {
                    if (useAutoLot && !lotResult?.isExecutionAllowed) {
                      alert("環境条件が整っていないため、エントリーできません。");
                      return;
                    }
                    handleEntry();
                  }}
                  className={cn(
                    "w-full py-5 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl active:scale-[0.98] transition-all",
                    (!permission.isAllowed || (useAutoLot && !lotResult?.isExecutionAllowed)) ? "bg-slate-800 text-slate-500 cursor-not-allowed" :
                    useAutoLot ? "bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/20" : "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                  )}
                 >
                   {!decision ? "分析中..." : 
                    isSubmitting ? "執行中..." : 
                    !permission.isAllowed ? "統制（ガバナンス）によりブロック" : "注文を確定する"}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
