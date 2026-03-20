"use client";

import { useMemo } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { getPerformanceMetrics, getMetricComment } from "@/lib/analyticsUtils";
import { generateTrendData } from "@/lib/chartUtils";
import { Target, TrendingUp, AlertTriangle, Activity, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const PerformanceMetrics = () => {
  const { calculatedAssets, totalAssetsValue, analysis } = usePortfolio();
  
  // 過去データの再生成または再利用
  const trendData = useMemo(() => {
    return generateTrendData(totalAssetsValue, 30);
  }, [totalAssetsValue]);

  const metrics = useMemo(() => {
    const clientMetrics = getPerformanceMetrics(calculatedAssets, trendData);
    
    // Cloud Functions からのデータがあれば優先（オフロード）
    if (analysis) {
      return {
        ...clientMetrics,
        winRate: analysis.winRate ?? clientMetrics.winRate,
        totalTrades: analysis.totalTrades ?? clientMetrics.totalTrades
      };
    }
    
    return clientMetrics;
  }, [calculatedAssets, trendData, analysis]);

  const MetricCard = ({ 
    title, 
    value, 
    unit, 
    icon: Icon, 
    type,
    isGood
  }: { 
    title: string; 
    value: string; 
    unit: string; 
    icon: any; 
    type: keyof typeof metrics;
    isGood: boolean;
  }) => {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex flex-col justify-between gap-3 border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Icon className="w-4 h-4 text-indigo-400" />
            {title}
          </span>
          <CheckCircle2 className={cn("w-4 h-4", isGood ? "text-emerald-500" : "text-slate-300 dark:text-slate-600")} />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100">{value}</span>
          <span className="text-sm font-bold text-slate-400">{unit}</span>
        </div>
        <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1.5 rounded-lg w-fit">
          {getMetricComment(type, metrics[type])}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[var(--radius-card)] p-4 md:p-6 shadow-sm">
      <h3 className="text-lg md:text-xl font-bold mb-5 flex items-center gap-2 text-slate-800 dark:text-slate-100">
        <Activity className="w-5 h-5 text-indigo-500" />
        パフォーマンス分析
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard 
          title="勝率" 
          value={metrics.winRate.toFixed(1)} 
          unit="%" 
          icon={Target} 
          type="winRate"
          isGood={metrics.winRate >= 50}
        />
        <MetricCard 
          title="平均リターン" 
          value={(metrics.averageReturn > 0 ? "+" : "") + metrics.averageReturn.toFixed(1)} 
          unit="%" 
          icon={TrendingUp} 
          type="averageReturn"
          isGood={metrics.averageReturn > 0}
        />
        <MetricCard 
          title="最大ドローダウン" 
          value={"-" + metrics.maxDrawdown.toFixed(1)} 
          unit="%" 
          icon={AlertTriangle} 
          type="maxDrawdown"
          isGood={metrics.maxDrawdown <= 15}
        />
        <MetricCard 
          title="シャープレシオ" 
          value={metrics.sharpeRatio.toFixed(2)} 
          unit="" 
          icon={Activity} 
          type="sharpeRatio"
          isGood={metrics.sharpeRatio >= 1.0}
        />
      </div>
    </div>
  );
};
