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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-5 md:p-8 shadow-sm overflow-hidden relative group text-left transition-all hover:shadow-md">
      <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-700">
        <Sparkles className="w-64 h-64 text-indigo-500" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <span className="w-1.5 h-6 bg-amber-400 rounded-full"></span>
            AI アドバイス
          </h2>
          <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-full border border-indigo-100 dark:border-indigo-500/20">
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Powered by AI</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* 市場・資産状況 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                <TrendingUp size={18} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">市場概況</span>
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed break-words">
              {advice.marketStatus}
            </p>
          </div>

          {/* ポートフォリオ評価 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                <ShieldCheck size={18} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">リスク評価</span>
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed break-words">
              {advice.portfolioEvaluation}
            </p>
          </div>

          {/* 改善アクション */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
                <Flag size={18} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">推奨アクション</span>
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed break-words">
              {advice.actionProposal}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
