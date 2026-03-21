"use client";

import React, { useState, useEffect, useMemo } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { useAuth } from "@/context/AuthContext";
import { savePortfolioMetrics } from "@/lib/db";
import { calculatePortfolioScores, getTotalScoreEvaluation, PortfolioScores } from "@/lib/scoringEngine";
import { 
  Trophy, 
  Target, 
  ShieldCheck, 
  Layers, 
  Zap, 
  RefreshCw, 
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  PieChart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const PortfolioScoreCard = () => {
  const { portfolioMetrics, growthMetrics, calculatedAssets, totalAssetsValue, behavior, isFetching } = usePortfolio();
  const { user, isDemo } = useAuth();
  const [isCalculating, setIsCalculating] = useState(false);

  // キャッシュ比率の算出（デモ用に簡略化、本来は現金アセットから算出）
  const cashRatio = useMemo(() => {
    // "現金" または "銀行" カテゴリの資産をキャッシュとして集計
    const cashAssets = calculatedAssets.filter(a => a.category === "現金" || a.category === "銀行");
    const cashValue = cashAssets.reduce((sum, a) => sum + a.evaluatedValue, 0);
    return totalAssetsValue > 0 ? cashValue / totalAssetsValue : 0.2; // デモ用デフォルト20%
  }, [calculatedAssets, totalAssetsValue]);

  // ルール違反のカウント（behaviorデータから）
  const violationsCount = useMemo(() => {
    return behavior?.ruleViolations?.length || 0;
  }, [behavior]);

  const handleRecalculate = async () => {
    if (!user) return;
    setIsCalculating(true);

    try {
      const scores = calculatePortfolioScores(
        { 
          cagr: growthMetrics?.cagr || 12, 
          maxDrawdown: growthMetrics?.maxDrawdown || 8 
        },
        calculatedAssets,
        cashRatio,
        violationsCount
      );

      if (!isDemo) {
        await savePortfolioMetrics(user.uid, "default", scores);
      }
    } catch (error) {
      console.error("Scoring failed", error);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    if (!portfolioMetrics && !isFetching && user && calculatedAssets.length > 0) {
      handleRecalculate();
    }
  }, [portfolioMetrics, isFetching, user, calculatedAssets.length]);

  const scores: PortfolioScores = portfolioMetrics || {
    growth: 0,
    stability: 0,
    diversification: 0,
    efficiency: 0,
    discipline: 0,
    total: 0
  };

  const evaluation = getTotalScoreEvaluation(scores.total);

  const scoreItems = [
    { label: "成長性", sub: "CAGR", value: scores.growth, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "安定性", sub: "MDD", value: scores.stability, icon: ShieldCheck, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "分散性", sub: "配分", value: scores.diversification, icon: Layers, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "資金効率", sub: "現比", value: scores.efficiency, icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "行動規律", sub: "違反", value: scores.discipline, icon: Target, color: "text-rose-500", bg: "bg-rose-50" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group hover:shadow-xl transition-all">
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Trophy size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">資産運用スコア</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Portfolio Performance Score</p>
            </div>
          </div>
          <button 
            onClick={handleRecalculate}
            disabled={isCalculating}
            className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={18} className={cn("text-slate-500", isCalculating && "animate-spin")} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Main Chart Section */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            <div className="relative w-56 h-56 flex items-center justify-center">
              {/* Custom SVG Donut Chart */}
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
                {/* Score Progress Ring */}
                <motion.circle
                  initial={{ strokeDashoffset: 251.2 }}
                  animate={{ strokeDashoffset: 251.2 - (251.2 * scores.total) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeLinecap="round"
                  stroke="url(#scoreGradient)"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Score Display (Center) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Score</span>
                <span className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">{scores.total}</span>
                <span className="text-xs font-bold text-slate-400">/ 100pts</span>
              </div>
            </div>

            <div className="mt-8 text-center space-y-2">
              <h3 className={cn("text-2xl font-black", evaluation.color)}>{evaluation.label}</h3>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 max-w-[240px] leading-relaxed">
                {evaluation.comment}
              </p>
            </div>
          </div>

          {/* Detailed Breakdown Section */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <PieChart size={14} /> スコア内訳 (各20点満点)
            </h4>
            
            <div className="space-y-3">
              {scoreItems.map((item, idx) => (
                <div key={item.label} className="group/item">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", item.bg, item.color)}>
                        <item.icon size={16} />
                      </div>
                      <div>
                        <span className="text-sm font-black text-slate-700 dark:text-slate-200">{item.label}</span>
                        <span className="text-[10px] font-bold text-slate-400 ml-2 uppercase opacity-0 group-hover/item:opacity-100 transition-opacity">[{item.sub}]</span>
                      </div>
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{item.value}/20</span>
                  </div>
                  <div className="h-2 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.value / 20) * 100}%` }}
                      transition={{ delay: 0.5 + idx * 0.1, duration: 1 }}
                      className={cn("h-full rounded-full bg-current", item.color)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl text-amber-500 border border-amber-100 dark:border-amber-900/30">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-1">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">次へのアドバイス</h5>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                  {scores.growth < 10 ? "成長性が伸び悩んでいます。より期待収益の高い銘柄の組み入れを検討しましょう。" :
                   scores.stability < 10 ? "安定性に課題があります。債券や現金比率を高め、暴落への備えを強化してください。" :
                   scores.diversification < 10 ? "特定の資産に集中しすぎです。カテゴリの分散を徹底してください。" :
                   "非常に良好な状態です。引き続き規律を守り、定期的なリバランスを行いましょう。"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
