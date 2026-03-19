"use client";

import { useMemo } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { generateTrendData } from "@/lib/chartUtils";
import { 
  getPerformanceMetrics, 
  calculatePortfolioRisk, 
  calculateOptimization, 
  generateInvestmentAdvice 
} from "@/lib/analyticsUtils";
import { Sparkles, TrendingUp, ShieldCheck, Flag } from "lucide-react";

export const InvestmentAdvice = () => {
  const { calculatedAssets, totalAssetsValue } = usePortfolio();

  // 計算に必要な各種分析データを算出してアドバイスを生成
  const advice = useMemo(() => {
    if (calculatedAssets.length === 0) return null;

    const mockTrend = generateTrendData(totalAssetsValue, 30);
    const performance = getPerformanceMetrics(calculatedAssets, mockTrend);
    const risk = calculatePortfolioRisk(calculatedAssets);
    const opts = calculateOptimization(calculatedAssets);

    return generateInvestmentAdvice(performance, risk, opts);
  }, [calculatedAssets, totalAssetsValue]);

  if (!advice) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50/80 to-blue-50/80 dark:from-indigo-950/30 dark:to-blue-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-[var(--radius-card)] p-6 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-[0.03] pointer-events-none mix-blend-overlay">
        <Sparkles className="w-48 h-48" />
      </div>

      <div className="relative z-10 block">
        <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 mb-6 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          AI インサイト＆アドバイス
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 市場・資産状況 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-white/60 dark:bg-slate-800/60 p-1.5 rounded-lg shadow-sm border border-indigo-100/50 dark:border-slate-700/50">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-bold text-indigo-800/70 dark:text-indigo-200/70 uppercase tracking-widest">市場・資産状況</span>
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed bg-white/40 dark:bg-slate-800/40 p-3 rounded-xl border border-white/50 dark:border-slate-700/30 flex-1">
              {advice.marketStatus}
            </p>
          </div>

          {/* ポートフォリオ評価 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-white/60 dark:bg-slate-800/60 p-1.5 rounded-lg shadow-sm border border-indigo-100/50 dark:border-slate-700/50">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-bold text-indigo-800/70 dark:text-indigo-200/70 uppercase tracking-widest">ポートフォリオ評価</span>
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed bg-white/40 dark:bg-slate-800/40 p-3 rounded-xl border border-white/50 dark:border-slate-700/30 flex-1">
              {advice.portfolioEvaluation}
            </p>
          </div>

          {/* 改善アクション */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-white/60 dark:bg-slate-800/60 p-1.5 rounded-lg shadow-sm border border-indigo-100/50 dark:border-slate-700/50">
                <Flag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs font-bold text-indigo-800/70 dark:text-indigo-200/70 uppercase tracking-widest">改善アクション提案</span>
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed bg-white/40 dark:bg-slate-800/40 p-3 rounded-xl border border-white/50 dark:border-slate-700/30 flex-1">
              {advice.actionProposal}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
