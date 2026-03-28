import React, { useState, useEffect } from "react";
import { AssetCalculated } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { usePortfolio } from "@/context/PortfolioContext";
import { 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Building2, 
  Landmark, 
  CircleDollarSign,
  Flame,
  Snowflake,
  Minus,
  Globe,
  Edit3,
  Trash2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { getAssetSentiment, SentimentResult } from "@/lib/sentimentUtils";
import { NewsItem } from "@/app/api/news/route";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ManualAssetForm } from "./ManualAssetForm";

interface AssetCardProps {
  asset: AssetCalculated;
}

const CategoryIcon = ({ category, className }: { category: string; className?: string }) => {
  switch (category) {
    case "株":
    case "日本株":
      return <Building2 className={className} />;
    case "外国株":
      return <Globe className={className} />;
    case "銀行":
      return <Landmark className={className} />;
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

export const AssetCard = React.memo(({ asset }: AssetCardProps) => {
  const { isDemo, user } = useAuth();
  const { refreshPrices, isFetching: globalFetching } = usePortfolio();
  const isProfit = asset.profitAndLoss >= 0;
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [localFetching, setLocalFetching] = useState(false);

  // このアセットが更新の対象かどうか
  const isUpdating = (globalFetching || localFetching) && !!asset.symbol;

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

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!asset.symbol || isUpdating) return;
    
    setLocalFetching(true);
    try {
      await refreshPrices();
    } finally {
      setLocalFetching(false);
    }
  };

  return (
    <div className="relative isolate">
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
        onClick={() => window.location.href = `/asset/${asset.symbol}`}
        className="premium-card group relative p-4 md:p-6 cursor-pointer overflow-hidden"
      >
        {/* 背景の薄いアイコン */}
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500 group-hover:scale-125 group-hover:-rotate-12 pointer-events-none">
          <CategoryIcon category={asset.category} className="w-24 h-24 text-slate-900 dark:text-slate-100" />
        </div>

        {/* 手動入力バッジ & 編集ボタン */}
        {asset.isManual && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <span className="bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20 uppercase tracking-tighter">
              Manual
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowEditForm(true);
              }}
              className="p-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-500 transition-colors shadow-sm"
            >
              <Edit3 size={14} />
            </button>
          </div>
        )}

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
            <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-800 dark:text-white leading-tight">
                {asset.name}
              </h3>
              {asset.symbol && (
                <button 
                  onClick={handleRefresh}
                  disabled={isUpdating}
                  className="p-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
                  title="最新価格に更新"
                >
                  <RefreshCw size={12} className={cn(isUpdating && "animate-spin")} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                {asset.symbol || "MANUAL"}
              </p>
              {asset.brokerName && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="flex items-center gap-1">
                    <Building2 size={10} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500">{asset.brokerName}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] mb-1">
              {asset.category === "FX" ? "口座評価額" : "評価額"}
            </span>
            <span className={cn(
              "text-2xl font-black",
              "gradient-text"
            )}>
              {formatCurrency(asset.evaluatedValue || 0)}
            </span>
          </div>
 
          <div className="flex flex-col p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.1em] mb-1">損益</span>
            <div className={cn(
              "flex items-center gap-2 font-black",
              isProfit ? "text-emerald-500" : "text-rose-500"
            )}>
              {isProfit ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span className="text-lg">{isProfit ? "+" : ""}{formatCurrency(asset.profitAndLoss || 0)}</span>
              <span className="text-xs font-bold opacity-80 bg-current/10 px-2 py-0.5 rounded-full">
                {isProfit ? "+" : ""}{(asset.profitPercentage || 0).toFixed(2)}%
              </span>
            </div>
            {asset.depositMargin !== undefined && asset.depositMargin !== 0 && (
              <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 uppercase tracking-tighter">Deposit</span>
                <span>{formatCurrency(asset.depositMargin || 0)}</span>
              </div>
            )}
            {asset.swapPoints !== undefined && asset.swapPoints !== 0 && (
              <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-tighter">Swap</span>
                <span>{asset.swapPoints > 0 ? "+" : ""}{formatCurrency(asset.swapPoints || 0)}</span>
              </div>
            )}
          </div>
        </div>
 
        <div className="pt-4 flex justify-between items-center text-[11px] border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col gap-0.5">
            <span className="text-slate-400 dark:text-slate-500 font-bold">現在価格</span>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-slate-700 dark:text-slate-300">
                {asset.category === "FX" 
                  ? (asset.currentPrice || 0).toFixed(4) 
                  : formatCurrency(asset.currentPrice || 0, asset.currency)}
              </span>
              {asset.category === "FX" && (
                <span className="text-[10px] font-bold text-slate-400">
                  {asset.symbol.substring(3, 6)} {/* 対価通貨を表示 */}
                </span>
              )}
              {asset.exchangeRate && (
                <span className="text-[9px] font-black text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded-md border border-indigo-500/20">
                  1 USD = {asset.exchangeRate.toFixed(1)} JPY
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-slate-400 dark:text-slate-500 font-bold">
              {asset.category === "FX" ? "保有数量 (Lot)" : "保有数量"}
            </span>
            <span className="font-black text-slate-700 dark:text-slate-300">
              {asset.quantity?.toLocaleString(undefined, { maximumFractionDigits: 4 }) ?? "0"}
            </span>
          </div>
        </div>
      </div>
      </motion.div>

      {/* 編集用モダル */}
      <AnimatePresence>
        {showEditForm && (
          <ManualAssetForm 
            asset={asset} 
            onClose={() => setShowEditForm(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
});
