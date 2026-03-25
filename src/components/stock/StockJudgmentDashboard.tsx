"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { StockJudgment } from "@/types/stock";
import { StockService, MONITORING_STOCKS } from "@/services/stockService";
import { StockList } from "./StockList";
import { StockDetailModal } from "./StockDetailModal";
import { StockFilterSort } from "./StockFilterSort";
import { StockSignalBadge } from "./StockUIComponents";
import { 
  Zap, 
  Info, 
  ShieldAlert, 
  Trophy, 
  TrendingUp, 
  Coins, 
  ChevronRight, 
  BarChart, 
  ShieldCheck, 
  Target 
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const StockJudgmentDashboard = () => {
  const [allJudgments, setAllJudgments] = useState<StockJudgment[]>([] as StockJudgment[]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<StockJudgment | null>(null);
  
  const [filters, setFilters] = useState({ search: "", label: "all" });
  const [sort, setSort] = useState({ key: "totalScore", order: "desc" as "asc" | "desc" });
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  const syncInProgressRef = useRef(false);
  const [syncStats, setSyncStats] = useState({ 
    total: 0, 
    completed: 0, 
    syncing: 0, 
    pending: 0, 
    progress: 0,
    currentName: "" as string | null
  });
  const isMountedRef = useRef(true);

  // 同期用のプレースホルダー生成
  const createEmptyJudgment = (ticker: string, name: string): StockJudgment => ({
    ticker,
    companyName: name,
    sector: "読み込み中...",
    currentPrice: 0,
    technicalScore: 0,
    technicalTrend: "neutral",
    technicalReasons: [],
    fundamentalScore: 0,
    growthProfile: "stable",
    financialHealth: "medium",
    fundamentalReasons: [],
    valuationScore: 0,
    valuationLabel: "fair",
    valuationReasons: [],
    shareholderReturnScore: 0,
    dividendProfile: "stable_dividend",
    holdSuitability: "neutral",
    shareholderReasons: [],
    totalScore: 0,
    signalLabel: "中立",
    certainty: 0,
    summaryComment: "現在データを同期しています...",
    updatedAt: new Date().toISOString(),
    syncStatus: "pending",
    chartData: [],
    valuationMetrics: {
      per: 0,
      pbr: 0,
      dividendYield: 0,
      roe: 0,
      equityRatio: 0
    }
  });

  // 1銘柄ずつの順次同期ループ
  const syncStocksOneByOne = async (tickers: string[]) => {
    if (syncInProgressRef.current) return;
    syncInProgressRef.current = true;
    
    try {
      for (const ticker of tickers) {
        if (!isMountedRef.current) break;
        try {
          // 同期中ステータスをセット
          await StockService.setSyncing(ticker);
          setAllJudgments(prev => {
            const map = new Map(prev.map(d => [d.ticker, d]));
            const existing = map.get(ticker);
            if (existing) map.set(ticker, { ...existing, syncStatus: "syncing" });
            return Array.from(map.values()).sort((a, b) => b.totalScore - a.totalScore);
          });
          
          // 実際の同期実行
          const result = await StockService.syncStock(ticker);
          
          // 結果反映
          if (result && result.success && result.data) {
            setAllJudgments(prev => {
              const map = new Map(prev.map(d => [d.ticker, d]));
              map.set(ticker, result.data as StockJudgment);
              return Array.from(map.values()).sort((a, b) => b.totalScore - a.totalScore);
            });
          }
        } catch (err) {
          console.error(`[Stock] Sync error for ${ticker}:`, err);
        } finally {
          // 終了時にクリア（必要に応じて）
        }
        await new Promise(r => setTimeout(r, 600));
      }
    } finally {
      syncInProgressRef.current = false;
      setSyncStats(prev => ({ ...prev, currentName: null }));
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await StockService.getJudgments();
      if (isMountedRef.current) {
        if (data && data.length > 0) {
          setAllJudgments(data as StockJudgment[]);
          const latest = [...data].sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )[0]?.updatedAt;
          setLastUpdated(latest);

          const staleOrUncompleted = data.filter(d => {
            const isStale = (Date.now() - new Date(d.updatedAt).getTime()) > 6 * 60 * 60 * 1000;
            return d.syncStatus !== "completed" || isStale;
          });
          
          if (staleOrUncompleted.length > 0) {
            syncStocksOneByOne(staleOrUncompleted.map(d => d.ticker));
          }
        } else {
          // 初期同期用のプレースホルダーを即座に表示
          const placeholders = MONITORING_STOCKS.map(s => createEmptyJudgment(s.ticker, s.name));
          setAllJudgments(placeholders);
          syncStocksOneByOne(MONITORING_STOCKS.map(s => s.ticker));
        }
        setLoading(false);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError("データ取得に失敗しました。");
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (allJudgments.length === 0) return;
    const total = allJudgments.length;
    const completed = allJudgments.filter(j => j.syncStatus === "completed").length;
    const syncing = allJudgments.filter(j => j.syncStatus === "syncing").length;
    const pending = allJudgments.filter(j => !j.syncStatus || j.syncStatus === "pending").length;
    let progress = Math.round((completed / total) * 100);
    if (progress === 0 && syncing > 0) progress = 5; // 最初の一歩を可視化
    
    // 現在解析中の銘柄名を取得
    const currentItem = allJudgments.find(j => j.syncStatus === "syncing");
    const currentName = currentItem ? `${currentItem.companyName} (${currentItem.ticker})` : null;

    setSyncStats({ total, completed, syncing, pending, progress, currentName });
  }, [allJudgments]);

  const rankings = useMemo(() => {
    const buyRanking = [...allJudgments].sort((a, b) => b.totalScore - a.totalScore).slice(0, 3);
    const divRanking = [...allJudgments].sort((a, b) => b.shareholderReturnScore - a.shareholderReturnScore).slice(0, 3);
    const valRanking = [...allJudgments].sort((a, b) => b.valuationScore - a.valuationScore).slice(0, 3);
    return { buyRanking, divRanking, valRanking };
  }, [allJudgments]);

  const filteredItems = useMemo(() => {
    let result = [...allJudgments];
    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(j => j.companyName.includes(s) || j.ticker.includes(s));
    }
    if (filters.label !== "all") {
      if (filters.label === "high_dividend") result = result.filter(j => j.dividendProfile === "high_dividend");
      else if (filters.label === "undervalued") result = result.filter(j => j.valuationLabel === "undervalued");
      else result = result.filter(j => j.signalLabel === filters.label);
    }
    result.sort((a, b) => {
      const aVal = (a as any)[sort.key] || 0;
      const bVal = (b as any)[sort.key] || 0;
      return sort.order === "desc" ? bVal - aVal : aVal - bVal;
    });
    return result;
  }, [allJudgments, filters, sort]);

  return (
    <div className="space-y-12 pb-20 font-sans">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-slate-900 rounded-[20px] text-white">
              <BarChart size={28} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white">日本株投資判断エンジン</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Alpha Discovery V2</p>
            </div>
          </div>
        </div>
        <Link href="/market-radar" className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-indigo-600/20 transition-transform active:scale-95">
          マーケットレーダーを表示
        </Link>
      </div>

      {!loading && syncStats.total > 0 && syncStats.progress < 100 && (
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] space-y-5 shadow-xl shadow-indigo-500/5">
           <div className="flex justify-between items-end">
              <div className="space-y-1">
                 <div className="flex items-center gap-3">
                    <Zap className="text-indigo-500 animate-pulse" size={20} />
                    <span className="text-sm font-black text-slate-800 dark:text-white">市場データ同期中 ({syncStats.progress}%)</span>
                 </div>
                 {syncStats.currentName && (
                   <p className="text-[11px] font-bold text-indigo-500 animate-pulse ml-8">
                     分析中: <span className="font-black">{syncStats.currentName}</span> ...
                   </p>
                 )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                <span className="text-xs font-black text-slate-800 dark:text-white">{syncStats.completed} / {syncStats.total} 完了</span>
              </div>
           </div>
           <div className="relative h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${syncStats.progress}%` }} 
                transition={{ type: "spring", stiffness: 50 }}
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-blue-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
              />
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]" />
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RankingCard title="総合スコア" items={rankings.buyRanking} icon={<Trophy className="text-amber-500" />} onSelect={setSelectedStock} />
        <RankingCard title="配当妙味" items={rankings.divRanking} icon={<Coins className="text-rose-500" />} onSelect={setSelectedStock} />
        <RankingCard title="割安期待" items={rankings.valRanking} icon={<TrendingUp className="text-indigo-500" />} onSelect={setSelectedStock} />
      </div>

      <div className="space-y-8">
        <StockFilterSort loading={loading} onFilterChange={setFilters} onSortChange={setSort} onRefresh={fetchData} />
        {error ? (
          <div className="p-10 bg-rose-50 text-rose-500 rounded-3xl border border-rose-100 text-center font-black">{error}</div>
        ) : loading && allJudgments.length === 0 ? (
          <div className="p-20 text-center text-slate-400 font-bold">データを読み込み中...</div>
        ) : (
          <StockList items={filteredItems} onSelect={setSelectedStock} />
        )}
      </div>

      <div className="p-10 bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border border-slate-100 dark:border-slate-800">
         <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3">
           <Info size={20} className="text-indigo-500" />
           分析アルゴリズム指標
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <LogicBox title="テクニカル" weight="25%" reasons={["RSI(14)","SMA25/75/200","ボラティリティ"]} />
            <LogicBox title="財務成長" weight="35%" reasons={["売上高成長率","ROE 8.0%以上","営業利益率"]} />
            <LogicBox title="割安度" weight="25%" reasons={["予想PER推移","PBR 1.0倍割れ","EV/EBITDA"]} />
            <LogicBox title="株主還元" weight="15%" reasons={["配当利回り推移","配当性向の安定性","自社株買い"]} />
         </div>
      </div>

      <StockDetailModal judgment={selectedStock} onClose={() => setSelectedStock(null)} />
    </div>
  );
};

const RankingCard = ({ title, items, icon, onSelect }: { title: string, items: StockJudgment[], icon: React.ReactNode, onSelect: (j: StockJudgment) => void }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 mb-4">
      {icon}
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{title}</h3>
    </div>
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={item.ticker} onClick={() => onSelect(item)} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all group">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-[10px] font-black text-slate-300 w-3 flex-shrink-0">{i+1}</span>
            <span className="text-xs font-black text-slate-700 dark:text-slate-200 group-hover:text-indigo-500 truncate">{item.companyName}</span>
          </div>
          <StockSignalBadge label={item.signalLabel} />
        </div>
      ))}
    </div>
  </div>
);

const LogicBox = ({ title, weight, reasons }: { title: string, weight: string, reasons: string[] }) => (
  <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/50">
    <div className="flex justify-between items-end mb-4">
      <span className="text-xs font-black text-slate-800 dark:text-white uppercase">{title}</span>
      <span className="text-[10px] font-black text-indigo-500">{weight}</span>
    </div>
    <ul className="space-y-2">
      {reasons.map((r, i) => (
        <li key={i} className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
          <Target size={10} className="text-slate-200 flex-shrink-0" /> {r}
        </li>
      ))}
    </ul>
  </div>
);

export default StockJudgmentDashboard;
