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
  Target,
  Plus,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const SYNC_CONCURRENCY = 3; 
const SYNC_TIMEOUT_MS = 20000; // 20秒に延長
const MAX_RETRIES = 1;

export const StockJudgmentDashboard = () => {
  const [allJudgments, setAllJudgments] = useState<StockJudgment[]>([] as StockJudgment[]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<StockJudgment | null>(null);
  
  const [filters, setFilters] = useState({ search: "", label: "all", sector: "all" });
  const [sort, setSort] = useState({ key: "totalScore", order: "desc" as "asc" | "desc" });
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  const [newTicker, setNewTicker] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const syncInProgressRef = useRef(false);
  const [syncStats, setSyncStats] = useState({ 
    total: 0, 
    completed: 0, 
    syncing: 0, 
    pending: 0, 
    progress: 0,
    currentName: "" as string | null,
    failedList: [] as { ticker: string, name: string }[]
  });
  const isMountedRef = useRef(true);

  const createEmptyJudgment = (ticker: string, name: string, sector: string = "読み込み中"): StockJudgment => ({
    ticker, companyName: name, sector, currentPrice: 0,
    technicalScore: 0, technicalTrend: "neutral", technicalReasons: [],
    fundamentalScore: 0, growthProfile: "stable", financialHealth: "medium", fundamentalReasons: [],
    valuationScore: 0, valuationLabel: "fair", valuationReasons: [],
    shareholderReturnScore: 0, dividendProfile: "stable_dividend", holdSuitability: "neutral", shareholderReasons: [],
    totalScore: 0, signalLabel: "中立", certainty: 0, summaryComment: "現在データを同期しています...",
    updatedAt: new Date().toISOString(), syncStatus: "pending", chartData: [],
    valuationMetrics: { per: 0, pbr: 0, dividendYield: 0, roe: 0, equityRatio: 0 }
  });

  const syncWithRetry = async (ticker: string, retryCount = 0): Promise<boolean> => {
    if (!isMountedRef.current) return false;

    try {
      await StockService.setSyncing(ticker);
      setAllJudgments(prev => {
        const map = new Map(prev.map(d => [d.ticker, d]));
        const existing = map.get(ticker);
        if (existing) map.set(ticker, { ...existing, syncStatus: "syncing" });
        return Array.from(map.values());
      });

      const syncPromise = StockService.syncStock(ticker);
      const timeoutPromise = new Promise<{ success: false, message: string }>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), SYNC_TIMEOUT_MS)
      );

      const result = await Promise.race([syncPromise, timeoutPromise]) as any;

      if (result && result.success && result.data) {
        setAllJudgments(prev => {
          const map = new Map(prev.map(d => [d.ticker, d]));
          map.set(ticker, result.data as StockJudgment);
          return Array.from(map.values());
        });
        return true;
      } else {
        throw new Error(result?.message || "Failed");
      }
    } catch (err: any) {
      if (retryCount < MAX_RETRIES && isMountedRef.current) {
        await new Promise(r => setTimeout(r, 2000));
        return syncWithRetry(ticker, retryCount + 1);
      }

      setAllJudgments(prev => {
        const map = new Map(prev.map(d => [d.ticker, d]));
        const existing = map.get(ticker);
        if (existing) map.set(ticker, { ...existing, syncStatus: "failed" });
        return Array.from(map.values());
      });
      return false;
    }
  };

  const processSyncQueue = async (tickers: string[]) => {
    if (syncInProgressRef.current || tickers.length === 0) return;
    syncInProgressRef.current = true;

    try {
      const queue = [...tickers];
      while (queue.length > 0 && isMountedRef.current) {
        const chunk = queue.splice(0, SYNC_CONCURRENCY);
        await Promise.all(chunk.map(ticker => syncWithRetry(ticker)));
        if (queue.length > 0) await new Promise(r => setTimeout(r, 1000));
      }
    } finally {
      syncInProgressRef.current = false;
      if (isMountedRef.current) setSyncStats(prev => ({ ...prev, currentName: null }));
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
          const staleOrUncompleted = data.filter(d => {
            const isStale = (Date.now() - new Date(d.updatedAt).getTime()) > 6 * 60 * 60 * 1000;
            return d.syncStatus !== "completed" || isStale;
          });
          if (staleOrUncompleted.length > 0) {
            processSyncQueue(staleOrUncompleted.map(d => d.ticker));
          }
        } else {
          const placeholders = MONITORING_STOCKS.map(s => createEmptyJudgment(s.ticker, s.name, s.sector));
          setAllJudgments(placeholders);
          processSyncQueue(MONITORING_STOCKS.map(s => s.ticker));
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
    const failed = allJudgments.filter(j => j.syncStatus === "failed").length;
    const pending = allJudgments.filter(j => !j.syncStatus || j.syncStatus === "pending").length;
    
    let progress = Math.round(((completed + failed) / total) * 100);
    if (progress === 0 && syncing > 0) progress = 5;
    
    const syncingItems = allJudgments.filter(j => j.syncStatus === "syncing");
    const currentName = syncingItems.length > 0 ? syncingItems.map(j => j.companyName).join(", ") : null;
    const failedList = allJudgments.filter(j => j.syncStatus === "failed").map(j => ({ ticker: j.ticker, name: j.companyName }));

    setSyncStats({ total, completed, syncing, pending, progress, currentName, failedList });
  }, [allJudgments]);

  const handleRetryFailed = () => {
    const failedTickers = allJudgments.filter(j => j.syncStatus === "failed").map(j => j.ticker);
    if (failedTickers.length > 0) {
      processSyncQueue(failedTickers);
    }
  };

  const handleAddTicker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicker || newTicker.length < 4 || isAdding) return;
    setIsAdding(true);
    try {
      const res = await StockService.getBasicInfo(newTicker);
      if (res.success && res.data) {
        const { ticker, name, sector } = res.data;
        const placeholder = createEmptyJudgment(ticker, name, sector);
        setAllJudgments(prev => prev.some(j => j.ticker === ticker) ? prev : [placeholder, ...prev]);
        setNewTicker("");
        processSyncQueue([ticker]);
      } else {
        alert(res.message || "銘柄が見つかりませんでした。");
      }
    } catch (err) { alert("エラーが発生しました。"); } finally { setIsAdding(false); }
  };

  const sectors = useMemo(() => {
    const s = new Set(allJudgments.map(j => j.sector));
    return ["all", ...Array.from(s)].sort();
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
    if (filters.sector !== "all") result = result.filter(j => j.sector === filters.sector);
    result.sort((a, b) => {
      const aVal = (a as any)[sort.key] || 0;
      const bVal = (b as any)[sort.key] || 0;
      return sort.order === "desc" ? bVal - aVal : aVal - bVal;
    });
    return result;
  }, [allJudgments, filters, sort]);

  return (
    <div className="space-y-12 pb-20 font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-slate-900 rounded-[20px] text-white shadow-lg shadow-black/10">
              <BarChart size={28} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white">日本株投資判断エンジン</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Alpha Discovery V2 PRO</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <form onSubmit={handleAddTicker} className="relative flex items-center group">
            <input 
              type="text" placeholder="銘柄コード(4桁)" value={newTicker}
              onChange={(e) => setNewTicker(e.target.value)}
              className="pl-4 pr-12 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-black focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none w-44"
              maxLength={4}
            />
            <button type="submit" disabled={isAdding || newTicker.length < 4} className="absolute right-2 p-1.5 bg-slate-900 text-white rounded-xl disabled:opacity-50 hover:bg-indigo-600 transition-colors">
              {isAdding ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
            </button>
          </form>
          <Link href="/market-radar" className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-indigo-600/20 transition-all hover:translate-y-[-2px] active:scale-95">
            マーケットレーダー
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {!loading && syncStats.total > 0 && syncStats.progress < 100 && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] space-y-6 shadow-2xl shadow-indigo-500/5 overflow-hidden"
          >
            <div className="flex justify-between items-end">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-3">
                      <Zap className="text-indigo-500 animate-pulse" size={20} />
                      <span className="text-sm font-black text-slate-800 dark:text-white">市場データ同期中 ({syncStats.progress}%)</span>
                  </div>
                  {syncStats.currentName && (
                    <p className="text-[11px] font-bold text-indigo-500 animate-pulse ml-8 flex items-center gap-2">
                      <Target size={12} /> 分析中: <span className="font-black truncate max-w-[400px]">{syncStats.currentName}</span>
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</span>
                  <span className="text-xs font-black text-slate-800 dark:text-white mt-1">{syncStats.completed} / {syncStats.total} 完了</span>
                </div>
            </div>
            <div className="relative h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                <motion.div initial={{ width: 0 }} animate={{ width: `${syncStats.progress}%` }} transition={{ type: "spring", stiffness: 30, damping: 15 }}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600 z-10" 
                />
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-slide opacity-50 z-20" />
            </div>
            
            {syncStats.failedList.length > 0 && (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-rose-50 dark:bg-rose-500/10 rounded-2xl border border-rose-100 dark:border-rose-500/20">
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="text-rose-500 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-rose-600 dark:text-rose-400">
                      {syncStats.failedList.length}銘柄でネットワークエラーが発生しました
                    </p>
                    <p className="text-[10px] font-bold text-rose-500/80">
                      不安定な銘柄: {syncStats.failedList.map(f => f.name).join(", ")}
                    </p>
                  </div>
                </div>
                <button onClick={handleRetryFailed} disabled={syncInProgressRef.current}
                  className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl text-[10px] font-black hover:bg-rose-700 disabled:opacity-50 transition-all shadow-lg shadow-rose-600/20 active:scale-95"
                >
                  <RefreshCw size={14} className={cn(syncInProgressRef.current && "animate-spin")} />
                  失敗銘柄を再試行する
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RankingCard title="総合スコア" items={[...allJudgments].sort((a,b)=>b.totalScore-a.totalScore).slice(0,3)} icon={<Trophy className="text-amber-500" />} onSelect={setSelectedStock} />
        <RankingCard title="配当妙味" items={[...allJudgments].sort((a,b)=>b.shareholderReturnScore-a.shareholderReturnScore).slice(0,3)} icon={<Coins className="text-rose-500" />} onSelect={setSelectedStock} />
        <RankingCard title="割安期待" items={[...allJudgments].sort((a,b)=>b.valuationScore-a.valuationScore).slice(0,3)} icon={<TrendingUp className="text-indigo-500" />} onSelect={setSelectedStock} />
      </div>

      <div className="space-y-8">
        <div className="flex flex-col gap-6">
          <StockFilterSort loading={loading} onFilterChange={setFilters} onSortChange={setSort} onRefresh={fetchData} />
          <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {sectors.map(s => (
              <button key={s} onClick={() => setFilters(prev => ({ ...prev, sector: s }))}
                className={cn(
                  "px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap border",
                  filters.sector === s ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/30 -translate-y-1" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-300"
                )}
              > {s === "all" ? "全業種" : s} </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="p-16 bg-rose-50 text-rose-500 rounded-[40px] border border-rose-100 text-center font-black flex flex-col items-center gap-4">
            <ShieldAlert size={48} className="opacity-20" /> {error}
          </div>
        ) : loading && allJudgments.length === 0 ? (
          <div className="p-32 text-center text-slate-400 font-bold flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-sm font-black text-slate-500">市場分析エンジンを起動中...</p>
          </div>
        ) : (
          <StockList items={filteredItems} onSelect={setSelectedStock} />
        )}
      </div>

      <div className="p-10 bg-slate-50/50 dark:bg-slate-900/50 rounded-[40px] border border-slate-100 dark:border-slate-800/80 backdrop-blur-sm">
         <h3 className="text-xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-4">
           <div className="p-2 bg-indigo-500 rounded-xl text-white"><ShieldCheck size={20} /></div>
           市場分析アルゴリズムの透明性
         </h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <LogicBox title="テクニカル" weight="25%" reasons={["RSI(14) オーバーシュート","SMA25/75/200の乖離率","ボラティリティ安定性"]} />
            <LogicBox title="財務成長" weight="35%" reasons={["売上高・利益成長率","ROE 8.0%以上の資本効率","売上高営業利益率"]} />
            <LogicBox title="割安度" weight="25%" reasons={["過去5年平均PERとの乖離","PBR 1.0倍等の清算価値","EV/EBITDA倍率"]} />
            <LogicBox title="株主還元" weight="15%" reasons={["累進配当・非減配銘柄","配当性向 40%以下の健全性","自社株買いの積極性"]} />
         </div>
      </div>

      <StockDetailModal judgment={selectedStock} onClose={() => setSelectedStock(null)} />
    </div>
  );
};

const RankingCard = ({ title, items, icon, onSelect }: { title: string, items: StockJudgment[], icon: React.ReactNode, onSelect: (j: StockJudgment) => void }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-sm hover:shadow-xl transition-all hover:translate-y-[-4px] group">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-indigo-50 transition-colors">{icon}</div>
      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">{title}</h3>
    </div>
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={item.ticker} onClick={() => onSelect(item)} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all">
          <div className="flex items-center gap-4 overflow-hidden">
            <span className={cn("text-lg font-black w-6 flex-shrink-0", i === 0 ? "text-amber-500" : "text-slate-200")}>{i+1}</span>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{item.companyName}</span>
              <span className="text-[10px] font-bold text-slate-400">{item.ticker}</span>
            </div>
          </div>
          <StockSignalBadge label={item.signalLabel} />
        </div>
      ))}
    </div>
  </div>
);

const LogicBox = ({ title, weight, reasons }: { title: string, weight: string, reasons: string[] }) => (
  <div className="p-7 bg-white dark:bg-slate-800/50 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800/80 hover:border-indigo-500/30 transition-colors">
    <div className="flex justify-between items-end mb-4">
      <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">{title}</span>
      <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-[10px] font-black text-indigo-500">{weight}</span>
    </div>
    <ul className="space-y-2.5">
      {reasons.map((r, i) => (
        <li key={i} className="text-[10px] font-bold text-slate-400 flex items-start gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-1 flex-shrink-0" />
          <span className="leading-relaxed">{r}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default StockJudgmentDashboard;
