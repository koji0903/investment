"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { StockJudgment } from "@/types/stock";
import { StockService } from "@/services/stockService";
import { StockList } from "./StockList";
import { StockDetailModal } from "./StockDetailModal";
import { StockFilterSort } from "./StockFilterSort";
import { StockSignalBadge } from "./StockUIComponents";
import { Zap, Info, ShieldAlert, Trophy, TrendingUp, TrendingDown, Coins, ChevronRight, BarChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { RadarLinkCard } from "@/components/RadarLinkCard";

export const StockJudgmentDashboard = () => {
  const [allJudgments, setAllJudgments] = useState<StockJudgment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<StockJudgment | null>(null);
  
  const [filters, setFilters] = useState({ search: "", label: "all" });
  const [sort, setSort] = useState({ key: "totalScore", order: "desc" as "asc" | "desc" });

  const fetchData = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = forceRefresh 
        ? await StockService.syncRealData()
        : await StockService.getJudgments();
      setAllJudgments(data);
    } catch (err) {
      console.error(err);
      setError("日本株データの取得に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ランキングデータの作成
  const rankings = useMemo(() => {
    const buyRanking = [...allJudgments].sort((a, b) => b.totalScore - a.totalScore).slice(0, 3);
    const dividendRanking = [...allJudgments].sort((a, b) => b.shareholderReturnScore - a.shareholderReturnScore).slice(0, 3);
    const valuationRanking = [...allJudgments].sort((a, b) => b.valuationScore - a.valuationScore).slice(0, 3);
    return { buyRanking, dividendRanking, valuationRanking };
  }, [allJudgments]);

  const filteredAndSortedItems = useMemo(() => {
    let result = [...allJudgments];
    
    // Search
    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(j => j.companyName.includes(s) || j.ticker.includes(s) || j.sector.includes(s));
    }
    
    // Category Filter
    if (filters.label !== "all") {
      if (filters.label === "high_dividend") {
        result = result.filter(j => j.dividendProfile === "high_dividend");
      } else if (filters.label === "undervalued") {
        result = result.filter(j => j.valuationLabel === "undervalued");
      } else if (filters.label === "growth") {
        result = result.filter(j => j.growthProfile === "growth");
      } else {
        result = result.filter(j => j.signalLabel === filters.label);
      }
    }

    // Sort
    result.sort((a: any, b: any) => {
      const aVal = a[sort.key] || 0;
      const bVal = b[sort.key] || 0;
      return sort.order === "desc" ? bVal - aVal : aVal - bVal;
    });

    return result;
  }, [allJudgments, filters, sort]);

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-900/20 dark:bg-white dark:text-slate-900">
              <BarChart size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">日本株投資判断エンジン</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Japanese Equities Judgment Matrix</p>
            </div>
          </div>
          <div className="flex-shrink-0">
             <Link href="/market-radar" className="flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black transition-all hover:bg-indigo-700 shadow-xl shadow-indigo-600/20">
               <Zap size={18} />
               マーケットレーダーで銘柄を探す
               <ChevronRight size={16} />
             </Link>
          </div>
        </div>
      </div>

      {/* Rankings Section */}
      {!loading && allJudgments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RankingCard 
            title="総合スコア順" 
            items={rankings.buyRanking} 
            icon={<Trophy size={18} className="text-amber-500" />}
            onSelect={setSelectedStock}
          />
          <RankingCard 
            title="配当・還元妙味" 
            items={rankings.dividendRanking} 
            icon={<Coins size={18} className="text-rose-500" />}
            onSelect={setSelectedStock}
          />
          <RankingCard 
            title="割安度・修正期待" 
            items={rankings.valuationRanking} 
            icon={<TrendingUp size={18} className="text-indigo-500" />}
            onSelect={setSelectedStock}
          />
        </div>
      )}

      {/* Main Dashboard Content */}
      <div className="space-y-8">
        <StockFilterSort 
          loading={loading}
          onFilterChange={setFilters}
          onSortChange={setSort}
          onRefresh={() => fetchData(true)}
        />

        {error ? (
          <div className="p-12 text-center bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 rounded-[32px] space-y-4">
            <ShieldAlert size={48} className="mx-auto text-rose-500" />
            <p className="text-lg font-black text-rose-600 dark:text-rose-400">{error}</p>
          </div>
        ) : loading && allJudgments.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-[32px] animate-pulse" />
            ))}
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px] space-y-4">
             <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
               <Zap size={32} />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800 dark:text-white">表示できる銘柄がありません</p>
              <p className="text-xs font-bold text-slate-400">検索条件を変更するか、最新データに同期してください。</p>
            </div>
          </div>
        ) : (
          <StockList items={filteredAndSortedItems} onSelect={setSelectedStock} />
        )}
      </div>

      {/* Analysis Logic Info Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 md:p-10 space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-slate-900 rounded-xl text-white dark:bg-white dark:text-slate-900">
            <Info size={20} />
          </div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">分析判定ロジックの詳細</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           <LogicCard title="テクニカル" color="border-indigo-500" reasons={["移動平均乖離率","RSI過熱感","ボリンジャーバンド"]} />
           <LogicCard title="ファンダ" color="border-emerald-500" reasons={["EPS成長率","ROEの推移","自己資本比率"]} />
           <LogicCard title="バリュエーション" color="border-amber-500" reasons={["過去5年平均PER","PBR 1倍割れ","業界平均比較"]} />
           <LogicCard title="配当・還元" color="border-rose-500" reasons={["配当利回り水準","配当性向の健全性","自社株買い方針"]} />
        </div>
      </div>

      <StockDetailModal judgment={selectedStock} onClose={() => setSelectedStock(null)} />
    </div>
  );
};

const RankingCard = ({ title, items, icon, onSelect }: { title: string, items: StockJudgment[], icon: React.ReactNode, onSelect: (j: StockJudgment) => void }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 shadow-sm overflow-hidden relative">
    <div className="flex items-center gap-3 mb-5 relative z-10">
      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">{icon}</div>
      <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter">{title}</h3>
    </div>
    <div className="space-y-2 relative z-10">
      {items.map((item, i) => (
        <div 
          key={item.ticker} 
          onClick={() => onSelect(item)}
          className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-slate-300 w-4">{i + 1}</span>
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-700 dark:text-slate-200 leading-tight">{item.companyName}</span>
              <span className="text-xs font-bold text-slate-400">{item.ticker}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StockSignalBadge label={item.signalLabel} />
            <ChevronRight size={14} className="text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const LogicCard = ({ title, color, reasons }: { title: string, color: string, reasons: string[] }) => (
  <div className={cn("p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border-l-4", color)}>
    <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 mb-3">{title}</h4>
    <ul className="space-y-1.5">
      {reasons.map((r, i) => (
        <li key={i} className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-slate-300" />
          {r}
        </li>
      ))}
    </ul>
  </div>
);
