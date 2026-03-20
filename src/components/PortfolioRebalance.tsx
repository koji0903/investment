"use client";

import React, { useMemo } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { 
  calculateOptimalPortfolio, 
  calculateRebalancePlan,
  RebalancePlanItem 
} from "@/lib/analyticsUtils";
import { 
  Calculator, 
  ArrowRight, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  CircleDot,
  Check,
  TrendingUp,
  TrendingDown,
  Info
} from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency, cn } from "@/lib/utils";

export const PortfolioRebalance = () => {
  const { calculatedAssets, totalAssetsValue } = usePortfolio();
  
  // モック用のリスクパラメータ (本来はコンテキストから)
  const rebalancePlan = useMemo(() => {
    const optimization = calculateOptimalPortfolio(calculatedAssets, "aggressive");
    return calculateRebalancePlan(optimization, totalAssetsValue);
  }, [calculatedAssets, totalAssetsValue]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm relative group">
      {/* Detail Grid Style */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
        style={{ backgroundImage: "linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)", backgroundSize: "20px 20px" }} 
      />
      
      <div className="p-6 md:p-8 space-y-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-500/20">
              <Calculator size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">リバランス実行チェックリスト</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Currency-Based Optimization Plan</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="px-4 py-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <CircleDot size={12} className="text-indigo-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Value</span>
              <span className="text-xs font-black text-slate-800 dark:text-white leading-none">{formatCurrency(totalAssetsValue)}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto -mx-6 md:mx-0">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">資産クラス</th>
                <th className="text-right py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">現在地 (%)</th>
                <th className="text-right py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">最適地 (目標)</th>
                <th className="text-right py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">調整概算額</th>
                <th className="text-center py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">アクション</th>
              </tr>
            </thead>
            <tbody>
              {rebalancePlan.map((item, idx) => (
                <RebalanceRow key={item.category} item={item} index={idx} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[28px] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-slate-500">
            <Info size={18} className="shrink-0 text-indigo-500" />
            <p className="text-xs font-bold leading-relaxed">
              調整額はポートフォリオの現在価値に基づいています。取引手数料や税金の影響は含まれていません。
            </p>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-3.5 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-3">
            一括注文をシミュレート
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

const RebalanceRow = ({ item, index }: { item: RebalancePlanItem, index: number }) => {
  const isBuy = item.adjustmentAmount > 0;
  const isNeutral = Math.abs(item.adjustmentAmount) < 1000; // 誤差

  return (
    <motion.tr 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
    >
      <td className="py-5 px-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-indigo-500/20 rounded-full group-hover:bg-indigo-500 transition-colors" />
          <span className="text-sm font-black text-slate-800 dark:text-white uppercase">{item.category}</span>
        </div>
      </td>
      <td className="py-5 px-6 text-right">
        <span className="text-xs font-bold text-slate-500">{item.currentRatio.toFixed(1)}%</span>
      </td>
      <td className="py-5 px-6 text-right">
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs font-black text-slate-800 dark:text-white">{item.targetRatio.toFixed(1)}%</span>
          <ArrowRight size={12} className="text-slate-300" />
        </div>
      </td>
      <td className="py-5 px-6 text-right">
        <div className={cn(
          "inline-flex flex-col items-end",
          isBuy ? "text-emerald-500" : isNeutral ? "text-slate-400" : "text-rose-500"
        )}>
          <span className="text-sm font-black tracking-tight leading-none mb-1">
            {isBuy ? "+" : ""}{formatCurrency(item.adjustmentAmount)}
          </span>
          <span className="text-[10px] font-black uppercase opacity-60">Estimation</span>
        </div>
      </td>
      <td className="py-5 px-6">
        <div className="flex justify-center">
          <div className={cn(
            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border",
            isBuy 
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
              : isNeutral 
                ? "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700"
                : "bg-rose-500/10 text-rose-500 border-rose-500/20"
          )}>
            {isBuy ? <TrendingUp size={12} /> : isNeutral ? <Check size={12} /> : <TrendingDown size={12} />}
            {isBuy ? "BUY" : isNeutral ? "SETTLED" : "SELL"}
          </div>
        </div>
      </td>
    </motion.tr>
  );
};
