import React, { useState, useEffect } from "react";
import { AssetCalculated } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Building2, 
  Landmark, 
  CircleDollarSign,
  Flame,
  Snowflake,
  Minus
} from "lucide-react";
import { getAssetSentiment, SentimentResult } from "@/lib/sentimentUtils";
import { NewsItem } from "@/app/api/news/route";
import { useAuth } from "@/context/AuthContext";

interface AssetCardProps {
  asset: AssetCalculated;
}

const CategoryIcon = ({ category, className }: { category: string; className?: string }) => {
  switch (category) {
    case "株":
      return <Building2 className={className} />;
    case "FX":
      return <CircleDollarSign className={className} />;
    case "仮想通貨":
      return <Coins className={className} />;
    case "投資信託":
      return <Landmark className={className} />;
    default:
      return <CircleDollarSign className={className} />;
  }
};

export const AssetCard = ({ asset }: AssetCardProps) => {
  const { isDemo } = useAuth();
  const isProfit = asset.profitAndLoss >= 0;
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);

  useEffect(() => {
    const fetchSentiment = async () => {
      try {
        const res = await fetch("/api/news");
        const data = await res.json();
        const news: NewsItem[] = data.news ?? [];
        setSentiment(getAssetSentiment(asset.name, news));
      } catch (e) {
        console.error("Failed to fetch sentiment for asset", e);
      }
    };
    fetchSentiment();
  }, [asset.name]);
  
  return (
    <div className="group relative overflow-hidden rounded-[var(--radius-card)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] dark:hover:border-slate-700">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none">
        <CategoryIcon category={asset.category} className="w-24 h-24 text-slate-900 dark:text-slate-100" />
      </div>

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                {asset.category}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {asset.name}
              </h3>
              {sentiment && (
                <div 
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                    sentiment.type === "bullish" ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" :
                    sentiment.type === "bearish" ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" :
                    "bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400"
                  )}
                  title={`センチメント: ${sentiment.label} (スコア: ${sentiment.score})`}
                >
                  {sentiment.type === "bullish" ? <Flame className="w-2.5 h-2.5" /> :
                   sentiment.type === "bearish" ? <Snowflake className="w-2.5 h-2.5" /> :
                   <Minus className="w-2.5 h-2.5" />}
                  {sentiment.label}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">評価額</span>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
              {formatCurrency(asset.evaluatedValue)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">損益</span>
            <div className={cn(
              "flex items-center gap-1 font-bold",
              isProfit ? "text-[var(--color-success-600)] dark:text-[var(--color-success-500)]" : "text-[var(--color-danger-600)] dark:text-[var(--color-danger-500)]"
            )}>
              {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{isProfit ? "+" : ""}{formatCurrency(asset.profitAndLoss)}</span>
              <span className="text-xs font-semibold opacity-80 backdrop-blur-sm rounded-full px-1.5 py-0.5 bg-current/10">
                ({isProfit ? "+" : ""}{asset.profitPercentage.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-sm">
          <div className="flex flex-col">
            <span className="text-slate-500 dark:text-slate-400">現在価格</span>
            <span className="font-semibold">{formatCurrency(asset.currentPrice)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-slate-500 dark:text-slate-400">保有数量</span>
            <span className="font-semibold">{asset.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
