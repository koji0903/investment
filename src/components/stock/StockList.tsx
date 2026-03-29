"use client";

import React from "react";
import { StockJudgment } from "@/types/stock";
import { 
  StockSignalBadge, 
  StockCertaintyIndicator, 
  StockSuitabilityBadge,
  SyncStatusIndicator
} from "./StockUIComponents";
import { ChevronRight, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { useInView } from "react-intersection-observer";

interface StockListProps {
  items: StockJudgment[];
  onSelect: (item: StockJudgment) => void;
  onVisible?: (ticker: string) => void;
}

export const StockList: React.FC<StockListProps> = ({ items, onSelect, onVisible }) => {
  return (
    <div className="w-full">
      {/* Desktop View */}
      <div className="hidden lg:block overflow-hidden rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/30 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100 dark:border-slate-800">
              <th className="px-8 py-5">銘柄 / ステータス</th>
              <th className="px-6 py-5">トレンド (30D)</th>
              <th className="px-6 py-5 text-center">Tech / Fund</th>
              <th className="px-6 py-5 text-center">Val / Div</th>
              <th className="px-6 py-5">総合判定</th>
              <th className="px-6 py-5">確信度/適正</th>
              <th className="px-8 py-5 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <StockRow key={item.ticker} item={item} onSelect={onSelect} onVisible={onVisible} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet View */}
      <div className="lg:hidden space-y-4">
        {items.map((item) => (
          <StockCard key={item.ticker} item={item} onSelect={onSelect} onVisible={onVisible} />
        ))}
      </div>
    </div>
  );
};

// Optimized Row Component
const StockRow = React.memo(({ item, onSelect, onVisible }: { item: StockJudgment, onSelect: (i: StockJudgment) => void, onVisible?: (t: string) => void }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  React.useEffect(() => {
    if (inView && onVisible && (item.syncStatus === "pending" || item.syncStatus === "failed")) {
      onVisible(item.ticker);
    }
  }, [inView, item.ticker, item.syncStatus, onVisible]);

  return (
    <tr 
      ref={ref}
      onClick={() => onSelect(item)}
      className="group border-b border-slate-50 dark:border-slate-800/20 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-all"
    >
      <td className="px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xs border border-slate-800 shadow-sm group-hover:scale-110 transition-transform">
            {item.ticker}
          </div>
          <div className="space-y-1">
            <div className="text-sm font-black text-slate-800 dark:text-white leading-tight">{item.companyName}</div>
            <div className="flex flex-col gap-0.5">
               <div className="flex items-center gap-2">
                 <span className="text-[11px] font-bold text-slate-400 tabular-nums">{item.currentPrice.toLocaleString()}円</span>
                 <SyncStatusIndicator status={item.syncStatus} />
               </div>
               {item.minPurchaseAmount && (
                 <div className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md w-fit">
                    最低：{(item.minPurchaseAmount / 10000).toFixed(1)}万円〜
                 </div>
               )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-6 w-32">
         <div className="h-10 w-24">
           <MiniChart data={item.chartData} trend={item.technicalTrend} />
         </div>
      </td>
      <td className="px-6 py-6">
        <div className="flex items-center justify-center gap-2">
          <ScoreBadge score={item.technicalScore} label="T" />
          <ScoreBadge score={item.fundamentalScore} label="F" />
        </div>
      </td>
      <td className="px-6 py-6">
        <div className="flex items-center justify-center gap-2">
          <ScoreBadge score={item.valuationScore} label="V" />
          <ScoreBadge score={item.shareholderReturnScore} label="D" />
        </div>
      </td>
      <td className="px-6 py-6">
        <StockSignalBadge label={item.signalLabel} />
      </td>
      <td className="px-6 py-6 space-y-3">
        <StockCertaintyIndicator certainty={item.certainty} />
        <StockSuitabilityBadge suitability={item.holdSuitability} />
      </td>
      <td className="px-8 py-6 text-right">
        <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors">
          <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
        </div>
      </td>
    </tr>
  );
});

// Optimized Card Component
const StockCard = React.memo(({ item, onSelect, onVisible }: { item: StockJudgment, onSelect: (i: StockJudgment) => void, onVisible?: (t: string) => void }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  React.useEffect(() => {
    if (inView && onVisible && (item.syncStatus === "pending" || item.syncStatus === "failed")) {
      onVisible(item.ticker);
    }
  }, [inView, item.ticker, item.syncStatus, onVisible]);

  return (
    <motion.div 
      ref={ref}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(item)}
      className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-sm space-y-5"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
            {item.ticker}
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white leading-tight">{item.companyName}</h3>
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-bold text-slate-400 tabular-nums">{item.currentPrice.toLocaleString()}円</p>
                <SyncStatusIndicator status={item.syncStatus} />
              </div>
              {item.minPurchaseAmount && (
                <div className="text-[9px] font-black text-indigo-500/80 bg-indigo-50 dark:bg-indigo-500/5 px-2 py-0.5 rounded-lg w-fit">
                   最低投資額：{(item.minPurchaseAmount / 10000).toFixed(1)}万円
                </div>
              )}
            </div>
          </div>
        </div>
        <StockSignalBadge label={item.signalLabel} />
      </div>

      <div className="flex items-center justify-between py-4 border-y border-slate-50 dark:border-slate-800/50">
         <div className="h-10 w-28">
           <MiniChart data={item.chartData} trend={item.technicalTrend} />
         </div>
         <div className="flex flex-col items-end gap-2">
           <StockCertaintyIndicator certainty={item.certainty} />
           <StockSuitabilityBadge suitability={item.holdSuitability} />
         </div>
      </div>
      
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-1.5">
          <ScoreBadge score={item.technicalScore} label="T" />
          <ScoreBadge score={item.fundamentalScore} label="F" />
          <ScoreBadge score={item.valuationScore} label="V" />
          <ScoreBadge score={item.shareholderReturnScore} label="D" />
        </div>
        <div className="flex items-center gap-1 text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-xl">
           詳細分析を見る <ChevronRight size={12} />
        </div>
      </div>
    </motion.div>
  );
});

StockRow.displayName = "StockRow";
StockCard.displayName = "StockCard";

const MiniChart = ({ data, trend }: { data?: any[], trend: string }) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <BarChart2 size={14} className="text-slate-300 animate-pulse" />
      </div>
    );
  }

  // 直近30日間を抽出
  const recentData = data.slice(-30);
  const color = trend === "bullish" ? "#10b981" : trend === "bearish" ? "#f43f5e" : "#64748b";

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
      <LineChart data={recentData}>
        <YAxis hide domain={['auto', 'auto']} />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={2.5} 
          dot={false} 
          animationDuration={1500}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const ScoreBadge = ({ score, label }: { score: number, label: string }) => {
  const isPositive = score > 10;
  const isNegative = score < -10;
  
  const color = isPositive ? "text-emerald-500 border-emerald-100 bg-emerald-50/50 dark:bg-emerald-500/10 dark:border-emerald-500/20" : 
                isNegative ? "text-rose-500 border-rose-100 bg-rose-50/50 dark:bg-rose-500/10 dark:border-rose-500/20" :
                "text-slate-400 border-slate-100 bg-slate-50 dark:bg-slate-800/50 dark:border-slate-800";
  
  return (
    <div className={cn("inline-flex flex-col items-center justify-center w-8 h-8 rounded-lg border font-black text-[9px]", color)}>
      <span className="opacity-40 leading-none mb-0.5">{label}</span>
      <span className="leading-none">{score > 0 ? `+${score}` : score}</span>
    </div>
  );
};

export default StockList;
