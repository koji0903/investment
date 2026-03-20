"use client";

import { useMemo } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { calculatePortfolioRisk } from "@/lib/analyticsUtils";
import { ShieldAlert, ShieldCheck, AlertOctagon, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export const RiskAnalysis = () => {
  const { calculatedAssets } = usePortfolio();
  
  const riskData = useMemo(() => calculatePortfolioRisk(calculatedAssets), [calculatedAssets]);
  const score = Math.round(riskData.overallScore);
  
  // 円形プログレス用SVGプロパティ
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let ColorClass = "text-emerald-500 fill-emerald-500/10";
  let StrokeClass = "stroke-emerald-500";
  let BgClass = "bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20";
  let Icon = ShieldCheck;
  let summaryText = "安全な状態です";

  if (riskData.overallLevel === "Critical") {
    ColorClass = "text-rose-500 fill-rose-500/10";
    StrokeClass = "stroke-rose-500";
    BgClass = "bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20";
    Icon = AlertOctagon;
    summaryText = "非常に危険な状態です";
  } else if (riskData.overallLevel === "HighRisk") {
    ColorClass = "text-amber-500 fill-amber-500/10";
    StrokeClass = "stroke-amber-500";
    BgClass = "bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20";
    Icon = ShieldAlert;
    summaryText = "リスクが高まっています";
  } else if (riskData.overallLevel === "Moderate") {
    ColorClass = "text-blue-500 fill-blue-500/10";
    StrokeClass = "stroke-blue-500";
    BgClass = "bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20";
    Icon = Info;
    summaryText = "標準的なリスクです";
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[var(--radius-card)] p-4 md:p-6 shadow-sm flex flex-col md:flex-row gap-6 md:gap-8">
      
      {/* メーターエリア */}
      <div className={cn("flex-shrink-0 flex flex-col items-center justify-center p-6 rounded-3xl border w-full md:w-auto md:min-w-[200px]", BgClass)}>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Icon className={cn("w-5 h-5", ColorClass.split(" ")[0])} />
          総合リスクスコア
        </h3>
        
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              className="stroke-slate-200 dark:stroke-slate-700"
              strokeWidth="8"
              fill="transparent"
              r={radius}
              cx="50%"
              cy="50%"
            />
            <circle
              className={cn("transition-all duration-1000 ease-out", StrokeClass)}
              strokeWidth="8"
              strokeLinecap="round"
              fill="transparent"
              r={radius}
              cx="50%"
              cy="50%"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className={cn("text-3xl font-black", ColorClass.split(" ")[0])}>{score}</span>
            <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">/ 100</span>
          </div>
        </div>
        
        <p className={cn("mt-4 text-sm font-bold", ColorClass.split(" ")[0])}>
          {summaryText}
        </p>
      </div>

      {/* 警告アセットリスト */}
      <div className="flex-1 flex flex-col">
        <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
          ハイリスク資産のアラート
        </h4>
        
        {riskData.highRiskAssets.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <ShieldCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              現在、過度にリスクが高い資産はありません。<br className="hidden sm:block"/>安全な運用が保たれています。
            </p>
          </div>
        ) : (
          <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {riskData.highRiskAssets.map(asset => (
              <div key={asset.assetId} className="flex items-center justify-between p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
                <div className="flex flex-col ml-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{asset.name}</span>
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                    ポートフォリオの {(asset.contribution * 100).toFixed(1)}% を占有
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-sm">
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                      スコア {Math.round(asset.riskScore)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
