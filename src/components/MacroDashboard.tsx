"use client";

import { useEffect, useState } from "react";
import { 
  getMacroMetadata, 
  generateMacroInsight, 
  getInflationData,
  MacroIndicator 
} from "@/lib/macroUtils";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Globe, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export const MacroDashboard = () => {
  const [indicators, setIndicators] = useState<MacroIndicator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMacroData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/market-data");
      const data = await res.json();
      
      const yahooData: any[] = data.macro ?? [];
      
      // Yahoo FinanceからのデータをMacroIndicator型に変換
      const baseIndicators: MacroIndicator[] = yahooData.map(item => {
        const meta = getMacroMetadata(item.symbol);
        const trend = item.changePercent > 0.05 ? "up" : item.changePercent < -0.05 ? "down" : "flat";
        
        const indicatorBase = {
          id: item.symbol,
          name: meta.name,
          symbol: item.symbol,
          category: meta.category as any,
          value: item.price,
          change: item.changePercent,
          unit: meta.unit,
          trend: trend as any,
        };

        return {
          ...indicatorBase,
          insight: generateMacroInsight(indicatorBase)
        };
      });

      // インフレデータ（静的）と結合
      setIndicators([...baseIndicators, ...getInflationData()]);
    } catch (error) {
      console.error("Failed to fetch macro data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMacroData();
    const interval = setInterval(fetchMacroData, 60 * 1000); // 1分ごと
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-indigo-500" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">マクロ経済情勢</h2>
        </div>
        <button 
          onClick={fetchMacroData}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          disabled={isLoading}
        >
          <RefreshCw className={cn("w-4 h-4 text-slate-400", isLoading && "animate-spin")} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {indicators.map((indicator) => (
          <div 
            key={indicator.id}
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-all duration-300 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {indicator.category === "equity" ? "株価指数" : 
                 indicator.category === "rate" ? "金利" : 
                 indicator.category === "forex" ? "為替" : "インフレ"}
              </span>
              <div className={cn(
                "p-1 rounded-md",
                indicator.trend === "up" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500" :
                indicator.trend === "down" ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500" :
                "bg-slate-50 dark:bg-slate-500/10 text-slate-400"
              )}>
                {indicator.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> :
                 indicator.trend === "down" ? <ArrowDownRight className="w-3 h-3" /> :
                 <Minus className="w-3 h-3" />}
              </div>
            </div>

            <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 truncate">
              {indicator.name}
            </h3>

            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-100">
                {indicator.category === "equity" || indicator.category === "forex" 
                  ? indicator.value?.toLocaleString(undefined, { minimumFractionDigits: indicator.category === "forex" ? 2 : 0 })
                  : indicator.value?.toFixed(2)}
              </span>
              <span className="text-[10px] font-bold text-slate-400">{indicator.unit}</span>
            </div>

            <div className={cn(
              "text-[10px] font-bold flex items-center gap-0.5",
              indicator.change > 0 ? "text-emerald-500" : indicator.change < 0 ? "text-rose-500" : "text-slate-400"
            )}>
              {indicator.change > 0 ? "+" : ""}{indicator.change.toFixed(2)}%
              <span className="text-[9px] opacity-60 font-normal"> (前日比)</span>
            </div>

            {/* ホバー時にインサイトを表示 */}
            <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-[9px] leading-relaxed text-slate-500 dark:text-slate-400 italic">
                {indicator.insight}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
