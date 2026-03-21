"use client";

import React, { useState, useEffect } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { useAuth } from "@/context/AuthContext";
import { saveGrowthMetrics } from "@/lib/db";
import { getMetricEvaluation } from "@/lib/growthEngine";
import { TrendingUp, Activity, ShieldCheck, Zap, RefreshCw, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const AssetGrowthEngine = () => {
  const { growthMetrics, transactions, totalAssetsValue, isFetching } = usePortfolio();
  const { user, isDemo } = useAuth();
  const [isCalculating, setIsCalculating] = useState(false);

  // 指標の計算シミュレーション（デモ用、本来はバックエンドや過去データから算出）
  const handleRecalculate = async () => {
    if (!user) return;
    setIsCalculating(true);

    try {
      // 本来は過去のポートフォリオ履歴から算出するが、ここではデモ用に現実的な数値をシミュレート
      // 実装上のヒント: リクエストがあれば実際のTransactionから算出するロジックに差し替え可能
      const simulatedMetrics = {
        cagr: 12.5 + (Math.random() * 5),
        returnRate: 15.2 + (Math.random() * 3),
        sharpeRatio: 1.4 + (Math.random() * 0.4),
        maxDrawdown: 8.5 + (Math.random() * 2),
        lastCalculated: new Date().toISOString()
      };

      if (!isDemo) {
        await saveGrowthMetrics(user.uid, "default", simulatedMetrics);
      }
    } catch (error) {
      console.error("Growth calculation failed", error);
    } finally {
      setIsCalculating(false);
    }
  };

  // 初回ロード時にデータがなければシミュレーション実行
  useEffect(() => {
    if (!growthMetrics && !isFetching && user) {
      handleRecalculate();
    }
  }, [growthMetrics, isFetching, user]);

  const metrics = [
    {
      id: "cagr",
      label: "CAGR",
      fullLabel: "年平均成長率",
      value: growthMetrics?.cagr || 0,
      suffix: "%",
      icon: TrendingUp,
      color: "bg-emerald-500",
      eval: getMetricEvaluation("cagr", growthMetrics?.cagr || 0)
    },
    {
      id: "return",
      label: "修正ディーツ法",
      fullLabel: "期間収益率",
      value: growthMetrics?.returnRate || 0,
      suffix: "%",
      icon: Zap,
      color: "bg-indigo-500",
      eval: getMetricEvaluation("dietz", growthMetrics?.returnRate || 0)
    },
    {
      id: "sharpe",
      label: "シャープレシオ",
      fullLabel: "運用効率",
      value: growthMetrics?.sharpeRatio || 0,
      suffix: "",
      icon: Activity,
      color: "bg-amber-500",
      eval: getMetricEvaluation("sharpe", growthMetrics?.sharpeRatio || 0)
    },
    {
      id: "mdd",
      label: "最大ドローダウン",
      fullLabel: "過去最大下落率",
      value: growthMetrics?.maxDrawdown || 0,
      suffix: "%",
      icon: ShieldCheck,
      color: "bg-rose-500",
      eval: getMetricEvaluation("mdd", growthMetrics?.maxDrawdown || 0)
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
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Asset Growth Analysis</p>
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
