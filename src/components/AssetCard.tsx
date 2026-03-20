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
import { motion } from "framer-motion";

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
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
      onClick={() => window.location.href = `/asset/${asset.symbol}`}
      className="premium-card group relative p-6 cursor-pointer"
    >
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500 group-hover:scale-125 group-hover:-rotate-12 pointer-events-none">
        <CategoryIcon category={asset.category} className="w-24 h-24 text-slate-900 dark:text-slate-100" />
      </div>

      <div className="relative z-10 flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-0.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20">
                {asset.category}
              </span>
              {sentiment && (
                <div 
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider",
                    sentiment.type === "bullish" ? "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400" :
                    sentiment.type === "bearish" ? "bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400" :
                    "bg-slate-50 border-slate-100 text-slate-600 dark:bg-slate-500/10 dark:border-slate-500/20 dark:text-slate-400"
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
            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {asset.name}
            </h3>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] mb-1">評価額</span>
            <span className="text-2xl font-black gradient-text">
              {formatCurrency(asset.evaluatedValue)}
            </span>
          </div>

          <div className="flex flex-col p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.1em] mb-1">損益</span>
            <div className={cn(
              "flex items-center gap-2 font-black",
              isProfit ? "text-emerald-500" : "text-rose-500"
            )}>
              {isProfit ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span className="text-lg">{isProfit ? "+" : ""}{formatCurrency(asset.profitAndLoss)}</span>
              <span className="text-xs font-bold opacity-80 bg-current/10 px-2 py-0.5 rounded-full">
                {isProfit ? "+" : ""}{asset.profitPercentage.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-between items-center text-[11px] border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col gap-0.5">
            <span className="text-slate-400 dark:text-slate-500 font-bold">現在価格</span>
            <span className="font-black text-slate-700 dark:text-slate-300">{formatCurrency(asset.currentPrice)}</span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-slate-400 dark:text-slate-500 font-bold">保有数量</span>
            <span className="font-black text-slate-700 dark:text-slate-300">{asset.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
