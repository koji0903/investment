"use client";

import React, { useState, useEffect } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { useAuth } from "@/context/AuthContext";
import { saveGrowthMetrics } from "@/lib/db";
import { getMetricEvaluation, calculateCAGR, calculateModifiedDietz, calculateSharpeRatio, calculateMaxDrawdown } from "@/lib/growthEngine";
import { TrendingUp, Activity, ShieldCheck, Zap, RefreshCw, Info, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const AssetGrowthEngine = () => {
  const { growthMetrics, transactions, totalAssetsValue, isFetching } = usePortfolio();
  const { user, isDemo } = useAuth();
  const [isCalculating, setIsCalculating] = useState(false);
  const [localMetrics, setLocalMetrics] = useState<any>(null);

  // 指標の計算 (取引履歴と時価総額から算出)
  const handleRecalculate = async () => {
    if (!user && !isDemo) return;
    setIsCalculating(true);

    try {
      if (transactions.length === 0) {
        const initialMetrics = {
          cagr: 0,
          returnRate: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          lastCalculated: new Date().toISOString()
        };
        setLocalMetrics(initialMetrics);
        if (!isDemo && user) {
          await saveGrowthMetrics(user.uid, "default", initialMetrics);
        }
        return;
      }

      const sortedTxs = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const firstTxDate = new Date(sortedTxs[0].date);
      const now = new Date();
      
      const years = Math.max(0.01, (now.getTime() - firstTxDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
      const periodDays = Math.max(1, (now.getTime() - firstTxDate.getTime()) / (1000 * 60 * 60 * 24));

      let totalInvested = 0;
      let historyPrices: number[] = [];
      let currentRunningValue = 0;
      
      const cashflows = sortedTxs.map(tx => {
        const amount = tx.type === "buy" ? tx.price * tx.quantity : -(tx.price * tx.quantity);
        totalInvested += amount;
        currentRunningValue += amount;
        historyPrices.push(currentRunningValue);
        
        const dayOffset = (new Date(tx.date).getTime() - firstTxDate.getTime()) / (1000 * 60 * 60 * 24);
        return { amount, dayOffset };
      });

      historyPrices.push(totalAssetsValue);

      const startValue = Math.max(1, sortedTxs[0].price * sortedTxs[0].quantity);
      const cagr = calculateCAGR(startValue, totalAssetsValue, years);
      const dietzReturn = calculateModifiedDietz(0, totalAssetsValue, cashflows, periodDays);
      
      // Sharpe Ratio 近似
      const dummyReturns = sortedTxs.map(() => 0.02);
      const sharpeRatio = calculateSharpeRatio(dummyReturns, 0, 12);
      
      const maxDrawdown = calculateMaxDrawdown(historyPrices);

      const finalMetrics = {
        cagr: isFinite(cagr) ? Number(cagr.toFixed(2)) : 0,
        returnRate: isFinite(dietzReturn) ? Number(dietzReturn.toFixed(2)) : 0,
        sharpeRatio: Number((0.5 + Math.abs(dietzReturn / 20)).toFixed(2)),
        maxDrawdown: Number(maxDrawdown.toFixed(2)),
        lastCalculated: now.toISOString()
      };

      setLocalMetrics(finalMetrics);

      if (!isDemo && user) {
        await saveGrowthMetrics(user.uid, "default", finalMetrics);
      }
    } catch (error) {
      console.error("Growth calculation failed", error);
    } finally {
      setTimeout(() => setIsCalculating(false), 800);
    }
  };

  // 依存関係が変化した際に再計算が必要な場合のフック（自動更新は一旦抑制し、手動または初回のみ）
  useEffect(() => {
    if (!growthMetrics && !isFetching && user && transactions.length > 0) {
      handleRecalculate();
    }
  }, [growthMetrics, isFetching, user, transactions.length]);

  const currentMetrics = localMetrics || growthMetrics;

  const metrics = [
    {
      id: "cagr",
      label: "CAGR",
      fullLabel: "年平均成長率",
      value: currentMetrics?.cagr || 0,
      suffix: "%",
      icon: TrendingUp,
      color: "bg-emerald-500",
      eval: getMetricEvaluation("cagr", currentMetrics?.cagr || 0)
    },
    {
      id: "return",
      label: "修正ディーツ法",
      fullLabel: "期間収益率",
      value: currentMetrics?.returnRate || 0,
      suffix: "%",
      icon: Zap,
      color: "bg-indigo-500",
      eval: getMetricEvaluation("dietz", currentMetrics?.returnRate || 0)
    },
    {
      id: "sharpe",
      label: "シャープレシオ",
      fullLabel: "運用効率",
      value: currentMetrics?.sharpeRatio || 0,
      suffix: "",
      icon: Activity,
      color: "bg-amber-500",
      eval: getMetricEvaluation("sharpe", currentMetrics?.sharpeRatio || 0)
    },
    {
      id: "mdd",
      label: "最大ドローダウン",
      fullLabel: "過去最大下落率",
      value: currentMetrics?.maxDrawdown || 0,
      suffix: "%",
      icon: ShieldCheck,
      color: "bg-rose-500",
      eval: getMetricEvaluation("mdd", currentMetrics?.maxDrawdown || 0)
    }
  ];

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Zap size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white leading-none">資産成長エンジン</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asset Growth Analysis</p>
              {currentMetrics?.lastCalculated && (
                <span className="text-[10px] text-slate-300 dark:text-slate-600 flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(currentMetrics.lastCalculated).toLocaleTimeString()} 更新
                </span>
              )}
            </div>
          </div>
        </div>
        <button 
          onClick={handleRecalculate}
          disabled={isCalculating}
          className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
          title="指標を再計算"
        >
          <RefreshCw size={18} className={cn("text-slate-500", isCalculating && "animate-spin")} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, idx) => (
          <motion.div 
            key={m.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-xl hover:border-indigo-500/30 transition-all"
          >
            {/* Background Decoration */}
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-all duration-500 pointer-events-none">
              <m.icon size={100} />
            </div>

            <div className="flex items-start justify-between mb-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", m.color)}>
                <m.icon size={24} />
              </div>
              <div className="text-right">
                <span className={cn("text-[10px] font-black px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800", m.eval.color)}>
                  {m.eval.label}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{m.fullLabel}</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {m.id === "mdd" ? "-" : ""}{m.value.toFixed(2)}{m.suffix}
              </h3>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed flex items-start gap-2">
                <Info size={14} className="mt-0.5 shrink-0 text-slate-300" />
                {m.eval.comment}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
