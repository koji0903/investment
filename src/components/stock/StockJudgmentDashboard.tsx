"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { StockJudgment, StockPairMaster } from "@/types/stock";
import { StockService } from "@/services/stockService";
import { StockList } from "./StockList";
import { StockDetailModal } from "./StockDetailModal";
import { StockFilterSort } from "./StockFilterSort";
import { StockSignalBadge } from "./StockUIComponents";
import { useAuth } from "@/context/AuthContext";
import { 
  Zap, 
  ShieldAlert, 
  Trophy, 
  TrendingUp, 
  Coins, 
  ChevronRight, 
  BarChart, 
  Search,
  ShieldCheck, 
  Target,
  Plus,
  AlertCircle,
  RefreshCw,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const SYNC_CONCURRENCY = 2; // レート制限回避のため 2 並列に抑制
const SYNC_TIMEOUT_MS = 60000; // 60秒に延長（Yahoo Financeの遅延対策）
const MAX_RETRIES = 2; // リトライを2回に増強

export const StockJudgmentDashboard = () => {
  const [masterList, setMasterList] = useState<StockPairMaster[]>([]);
  const [allJudgments, setAllJudgments] = useState<StockJudgment[]>([] as StockJudgment[]);
  const [loading, setLoading] = useState(true);
  const [masterLoading, setMasterLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<StockJudgment | null>(null);
  
  const [filters, setFilters] = useState({ search: "", label: "all", sector: "all" });
  const [sort, setSort] = useState({ key: "totalScore", order: "desc" as "asc" | "desc" });
  
  const [displayLimit, setDisplayLimit] = useState(60);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  
  const [newTicker, setNewTicker] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { user } = useAuth();
  const portfolioId = "default";

  const syncInProgressRef = useRef(false);
  const [syncStats, setSyncStats] = useState({ 
    total: 0, 
    completed: 0, 
    syncing: 0, 
    pending: 0, 
    progress: 0,
    currentNames: [] as string[],
    failedStocks: [] as { ticker: string, name: string, error?: string }[],
    warningStocks: [] as { ticker: string, name: string, error?: string }[]
  });
  const [detailLoading, setDetailLoading] = useState(false);
  const isMountedRef = useRef(true);
  const priorityQueueRef = useRef<Set<string>>(new Set());
  const backgroundQueueRef = useRef<string[]>([]);
  const workerRunningRef = useRef(false);
  const initialSyncTriggeredRef = useRef(false);

  // マーケット統計 (Market Pulse)
  const marketPulse = useMemo(() => {
    const completed = allJudgments.filter(j => j.syncStatus === "completed");
    const totalCount = masterList.length || 1;
    if (completed.length === 0) return { avgScore: 0, bullishCount: 0, bearishCount: 0, highDivCount: 0, pct: 0 };
    const avgScore = Math.round(completed.reduce((acc, curr) => acc + curr.totalScore, 0) / completed.length);
    const bullishCount = completed.filter(j => j.totalScore >= 70).length;
    const bearishCount = completed.filter(j => j.totalScore <= 30).length;
    const highDivCount = completed.filter(j => (j.valuationMetrics?.dividendYield || 0) >= 4).length;
    return { avgScore, bullishCount, bearishCount, highDivCount, pct: Math.round((completed.length / totalCount) * 100) };
  }, [allJudgments, masterList]);

  const createEmptyJudgment = (ticker: string, name: string, sector: string = "読み込み中"): StockJudgment => ({
    ticker, companyName: name, sector, currentPrice: 0,
    technicalScore: 0, technicalTrend: "neutral", technicalReasons: [],
    fundamentalScore: 0, growthProfile: "stable", financialHealth: "medium", fundamentalReasons: [],
    valuationScore: 0, valuationLabel: "fair", valuationReasons: [],
    shareholderReturnScore: 0, dividendProfile: "stable_dividend", holdSuitability: "neutral", shareholderReasons: [],
    totalScore: 0, signalLabel: "中立", certainty: 0, summaryComment: "現在データを同期しています...",
    updatedAt: new Date().toISOString(), syncStatus: "pending", chartData: [],
    minPurchaseAmount: 0,
    valuationMetrics: { per: 0, pbr: 0, dividendYield: 0, roe: 0, equityRatio: 0 }
  });

  const syncWithRetry = async (ticker: string, retryCount = 0): Promise<boolean> => {
    if (!isMountedRef.current) return false;

    try {
      // 1. クライアント側の状態を即座に「同期中」に更新
      setAllJudgments(prev => {
        const map = new Map(prev.map(d => [d.ticker, d]));
        const ex = map.get(ticker);
        if (ex) map.set(ticker, { ...ex, syncStatus: "syncing", syncError: undefined });
        return Array.from(map.values());
      });

      // 2. サーバ側の同期中フラグ設定
      if (user?.uid) {
        StockService.setSyncing(user.uid, portfolioId, ticker).catch(e => console.warn("setSyncing failed", e));
      }

      // 3. 同期実行 (タイムアウト付き)
      const syncPromise = user?.uid ? StockService.syncStock(user.uid, portfolioId, ticker) : Promise.resolve({ success: false, message: "No Auth" });
      const timeoutPromise = new Promise<{ success: false, message: string }>((_, reject) => 
        setTimeout(() => reject(new Error("Request Timeout")), SYNC_TIMEOUT_MS)
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
        throw new Error(result?.message || "Sync Failed");
      }
    } catch (err: any) {
      if (retryCount < MAX_RETRIES && isMountedRef.current) {
        await new Promise(r => setTimeout(r, 3000)); 
        return syncWithRetry(ticker, retryCount + 1);
      }

      setAllJudgments(prev => {
        const map = new Map(prev.map(d => [d.ticker, d]));
        const ex = map.get(ticker);
        if (ex) map.set(ticker, { ...ex, syncStatus: "failed", syncError: err.message });
        return Array.from(map.values());
      });
      return false;
    }
  };

  /**
   * 銘柄詳細のオンデマンド取得
   */
  const handleSelectStock = async (stock: StockJudgment) => {
    if (!user) return;
    
    // すでに詳細データ（チャート等）がある場合は即表示
    if (stock.chartData && stock.chartData.length > 0) {
      setSelectedStock(stock);
      return;
    }

    setDetailLoading(true);
    setSelectedStock(stock); // まずは暫定データ（サマリー）を表示

    try {
      const detail = await StockService.getStockDetail(user.uid, portfolioId, stock.ticker);
      if (detail) {
        setSelectedStock(detail);
        // メモリ上の judgmental リストも更新して次回以降の高速化を図る
        setAllJudgments(prev => prev.map(j => j.ticker === detail.ticker ? detail : j));
      }
    } catch (e) {
      console.warn("Failed to fetch stock details", e);
    } finally {
      setDetailLoading(false);
    }
  };

  const startSyncWorker = async () => {
    if (workerRunningRef.current) return;
    workerRunningRef.current = true;
    
    console.log("[Sync] Worker started");
    
    try {
      while (isMountedRef.current) {
        // 1. 優先キューをチェック
        let targetTicker: string | null = null;
        
        if (priorityQueueRef.current.size > 0) {
          const first = Array.from(priorityQueueRef.current)[0];
          priorityQueueRef.current.delete(first);
          targetTicker = first;
        } else if (backgroundQueueRef.current.length > 0) {
          targetTicker = backgroundQueueRef.current.shift() || null;
        }

        if (targetTicker) {
          // 2重処理防止: バックグラウンドキューから削除
          backgroundQueueRef.current = backgroundQueueRef.current.filter(t => t !== targetTicker);
          
          // 指定銘柄の同期を実行 (同期済みなら飛ばす)
          const stock = allJudgments.find(j => j.ticker === targetTicker);
          const isStale = stock ? (Date.now() - new Date(stock.updatedAt).getTime()) > 24 * 60 * 60 * 1000 : true;
          
          if (!stock || stock.syncStatus !== "completed" || isStale) {
            await syncWithRetry(targetTicker);
            // 連続リクエストを避けるための短いインターバル
            await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
          }
        } else {
          // キューが空なら少し待機
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    } catch (err) {
      console.error("[Sync] Worker critical error:", err);
    } finally {
      workerRunningRef.current = false;
      console.log("[Sync] Worker stopped");
    }
  };

  const addToPriorityQueue = (ticker: string) => {
    priorityQueueRef.current.add(ticker);
    startSyncWorker();
  };

  const processSyncQueue = (tickers: string[]) => {
    tickers.forEach(t => {
      if (!backgroundQueueRef.current.includes(t)) {
        backgroundQueueRef.current.push(t);
      }
    });
    startSyncWorker();
  };

  const fetchData = async () => {
    if (!user?.uid) return;
    setLoading(true);
    setMasterLoading(true);
    setError(null);
    try {
      // 1. 銘柄マスタを取得 (24h Cache)
      const masters = await StockService.getMasterList();
      if (isMountedRef.current) {
        setMasterList(masters);
        setMasterLoading(false);
      }

      // 2. 既存の「サマリー判定データ」を O(1) で取得
      const data = await StockService.getJudgments(user.uid, portfolioId);
      if (isMountedRef.current) {
        const masterMap = new Map(masters.map(s => [s.ticker, s]));
        const judgmentMap = new Map(data.map(d => [d.ticker, d]));
        
        const merged: StockJudgment[] = Array.from(masterMap.values()).map(m => {
          const ex = judgmentMap.get(m.ticker);
          return ex || createEmptyJudgment(m.ticker, m.name, m.sector);
        });

        setAllJudgments(merged);
        
        // バックグラウンド同期対象の判定 (未完了 または 24時間以上経過)
        const staleOrUncompleted = merged.filter(d => {
          const isStale = (Date.now() - new Date(d.updatedAt).getTime()) > 24 * 60 * 60 * 1000;
          return d.syncStatus !== "completed" || isStale;
        });

        // 全件のバックグラウンド同期を開始 (ただしバックグラウンドなので低頻度)
        if (!initialSyncTriggeredRef.current && staleOrUncompleted.length > 0) {
          initialSyncTriggeredRef.current = true;
          // サマリー表示ができているので、バックグラウンド同期は少し遅延させて開始
          setTimeout(() => {
            processSyncQueue(staleOrUncompleted.map(d => d.ticker));
          }, 5000);
        }

        setLoading(false);
      }
    } catch (err) {
      if (isMountedRef.current) { 
        setError("データ取得に失敗しました。"); 
        setLoading(false);
        setMasterLoading(false);
      }
    }
  };

  const sectors = useMemo(() => ["all", ...Array.from(new Set(allJudgments.map(j => j.sector)))].sort(), [allJudgments]);

  const filteredItems = useMemo(() => {
    // 1. まず検索ワードとセクターで絞り込む（これは pending 銘柄にも適用）
    let base = [...allJudgments];
    if (filters.search) {
      const s = filters.search.toLowerCase();
      base = base.filter(j => j.companyName.includes(s) || j.ticker.includes(s));
    }
    if (filters.sector !== "all") {
      base = base.filter(j => j.sector === filters.sector);
    }

    // 2. ラベルフィルタ（テクニカル・ファンダメンタル指標）の適用
    if (filters.label === "all") return base;

    // 確定済みの銘柄で条件に合うもの
    const matched = base.filter(j => {
      if (j.syncStatus !== "completed" && j.syncStatus !== "warning") return false;
      
      if (filters.label === "high_dividend") return (j.valuationMetrics?.dividendYield || 0) >= 3.5;
      if (filters.label === "undervalued") return j.valuationLabel === "undervalued";
      if (filters.label === "growth") return j.growthProfile === "growth";
      return j.signalLabel === filters.label;
    });

    // 解析候補：まだ結果が出ていない銘柄を一定数混ぜる
    // これにより、フィルタ適用中もこれらが表示され、優先同期（useEffect経由）が走る
    const candidates = base.filter(j => j.syncStatus === "pending" || j.syncStatus === "syncing");
    
    // 確定済み銘柄を優先し、枠が余っていれば候補を追加（最大20件程度に制限してノイズを抑える）
    const combined = [...matched, ...candidates.slice(0, Math.max(0, 20 - matched.length))];

    // ソート適用
    combined.sort((a,b) => {
      const aV = (a as any)[sort.key] || 0;
      const bV = (b as any)[sort.key] || 0;
      return sort.order === "desc" ? bV - aV : aV - bV;
    });
    
    return combined;
  }, [allJudgments, filters, sort]);

  const displayedItems = useMemo(() => filteredItems.slice(0, displayLimit), [filteredItems, displayLimit]);

  const isScanning = useMemo(() => {
    return filters.label !== "all" && 
           syncStats.progress < 100 &&
           filteredItems.some(j => j.syncStatus === "pending" || j.syncStatus === "syncing");
  }, [filters.label, syncStats.progress, filteredItems]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();
    return () => { isMountedRef.current = false; };
  }, []);

  // フィルタやソートが変更された際、表示されている上位銘柄を優先同期
  useEffect(() => {
    if (loading || filteredItems.length === 0) return;
    
    const staleOnes = filteredItems.slice(0, 10).filter(d => {
      const isStale = (Date.now() - new Date(d.updatedAt).getTime()) > 24 * 60 * 60 * 1000;
      return d.syncStatus !== "completed" || isStale;
    });

    if (staleOnes.length > 0) {
      // 既存のバックグラウンドキューを整理し、現在見えているものを最優先にする
      const tickers = staleOnes.map(d => d.ticker);
      tickers.reverse().forEach(t => addToPriorityQueue(t));
    }
  }, [filters, sort, loading]); // フィルタ・ソート変更時に発火

  // Infinite Scroll Implementation
  useEffect(() => {
    if (loading || !loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && filteredItems.length > displayLimit) {
          setDisplayLimit(prev => prev + 60);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loading, filteredItems.length, displayLimit]);

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
        setAllJudgments(prev => prev.some(j => j.ticker === ticker) ? prev : [createEmptyJudgment(ticker, name, sector), ...prev]);
        setNewTicker("");
        processSyncQueue([ticker]);
      } else { alert(res.message || "銘柄が見つかりませんでした。"); }
    } catch (err) { alert("エラーが発生しました。"); } finally { setIsAdding(false); }
  };

  useEffect(() => {
    if (allJudgments.length === 0) return;
    const total = allJudgments.length;
    const completed = allJudgments.filter(j => j.syncStatus === "completed").length;
    const syncing = allJudgments.filter(j => j.syncStatus === "syncing").length;
    const failed = allJudgments.filter(j => j.syncStatus === "failed").length;
    const warning = allJudgments.filter(j => j.syncStatus === "warning").length;
    
    let progress = Math.round(((completed + failed + warning) / total) * 100);
    if (progress === 0 && syncing > 0) progress = 5;
    
    const currentNames = allJudgments.filter(j => j.syncStatus === "syncing").map(j => j.companyName);
    const failedStocks = allJudgments.filter(j => j.syncStatus === "failed").map(j => ({ ticker: j.ticker, name: j.companyName, error: j.syncError }));
    const warningStocks = allJudgments.filter(j => j.syncStatus === "warning").map(j => ({ ticker: j.ticker, name: j.companyName, error: j.syncError }));

    setSyncStats(prev => ({ ...prev, total, completed, syncing, progress, currentNames, failedStocks, warningStocks }));
  }, [allJudgments]);

  return (
    <div className="space-y-12 pb-20 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-slate-900 rounded-[22px] text-white shadow-2xl shadow-indigo-500/10 transition-transform hover:scale-105 active:scale-95">
              <BarChart size={32} />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight">日本株投資判断エンジン</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 bg-indigo-600 rounded text-[9px] font-black text-white uppercase tracking-widest shadow-lg shadow-indigo-600/20">Market Full V3</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">TSE Prime Intelligence</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <form onSubmit={handleAddTicker} className="relative flex items-center group">
            <input 
              type="text" placeholder="銘柄コード(4桁)" value={newTicker} onChange={(e) => setNewTicker(e.target.value)}
              className="pl-5 pr-14 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] text-sm font-black focus:ring-8 focus:ring-indigo-500/5 transition-all outline-none w-52 shadow-sm"
              maxLength={4}
            />
            <button type="submit" disabled={isAdding || newTicker.length < 4} className="absolute right-2 p-2 bg-slate-900 text-white rounded-2xl disabled:opacity-50 hover:bg-indigo-600 transition-all active:scale-90">
              {isAdding ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={20} />}
            </button>
          </form>
          <Link href="/market-radar" className="px-10 py-4 bg-indigo-600 text-white rounded-[24px] text-sm font-black shadow-2xl shadow-indigo-600/30 transition-all hover:translate-y-[-4px] active:scale-95 hover:bg-indigo-700">
            マーケットレーダー
          </Link>
        </div>
      </div>

      {/* Market Pulse (Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <PulseCard label="平均市場スコア" value={marketPulse.avgScore} icon={<Target className="text-indigo-500" />} suffix="pts" />
        <PulseCard label="強気・超強気" value={marketPulse.bullishCount} icon={<TrendingUp className="text-emerald-500" />} suffix="銘柄" />
        <PulseCard label="高配当 (4%超)" value={marketPulse.highDivCount} icon={<Coins className="text-amber-500" />} suffix="銘柄" />
        <PulseCard label="解析進捗" value={marketPulse.pct} icon={<RefreshCw className="text-blue-500" />} suffix="%" progress />
      </div>

      <AnimatePresence>
        {!loading && syncStats.total > 0 && syncStats.progress < 100 && (
          <motion.div initial={{ opacity: 0, y: -20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="p-10 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-[40px] space-y-8 shadow-[0_32px_64px_-16px_rgba(79,70,229,0.1)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <RefreshCw size={120} className="animate-[spin_10s_linear_infinite]" />
            </div>

            <div className="flex justify-between items-end relative z-10">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-4">
                      <div className="p-2 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/20"><Zap className="animate-pulse" size={24} /></div>
                      <div className="flex flex-col">
                        <span className="text-lg font-black text-slate-800 dark:text-white leading-tight">市場データ同期中</span>
                        <span className="text-xs font-bold text-slate-400">東証プライム {syncStats.total} 銘柄の深層解析を実行しています (2並列)</span>
                      </div>
                  </div>
                  {syncStats.currentNames.length > 0 && (
                    <p className="text-xs font-bold text-indigo-500 animate-pulse ml-14 flex items-center gap-2">
                      <Clock size={14} /> 実行中: <span className="font-black text-slate-600 dark:text-slate-300">{syncStats.currentNames.join(" / ")}</span>
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-indigo-600">{syncStats.progress}</span>
                    <span className="text-lg font-black text-slate-300">%</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">{syncStats.completed} / {syncStats.total} SUCCESSFUL</span>
                </div>
            </div>

            <div className="relative h-4 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800 shadow-inner">
                <motion.div initial={{ width: 0 }} animate={{ width: `${syncStats.progress}%` }} transition={{ type: "spring", stiffness: 20, damping: 15 }}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-400 z-10" 
                />
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:40px_40px] animate-slide opacity-30 z-20" />
            </div>
            
            {syncStats.warningStocks.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className="flex flex-col gap-4 p-6 bg-amber-50/50 dark:bg-amber-950/20 rounded-[28px] border border-amber-100 dark:border-amber-900/30 backdrop-blur-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-2xl text-amber-600"><Plus size={24} className="rotate-45" /></div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-amber-700 dark:text-amber-400">
                        {syncStats.warningStocks.length}銘柄でデータ不整合を通知
                      </p>
                      <p className="text-[11px] font-bold text-amber-600/80 leading-relaxed">
                        一部の市場データ（財務情報等）が制限されていますが、テクニカル分析による自動判定は継続しています。
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4 border-t border-amber-100 dark:border-amber-900/20">
                  {syncStats.warningStocks.map(s => (
                    <div key={s.ticker} className="flex flex-col p-3 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-amber-100/50 dark:border-amber-900/10">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 truncate">{s.name}</span>
                        <span className="text-[9px] font-bold text-slate-400 tracking-tighter">{s.ticker}</span>
                      </div>
                      <p className="text-[9px] font-medium text-amber-600 line-clamp-2 italic">
                        "{s.error || "データ制限あり"}"
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {syncStats.failedStocks.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className="flex flex-col gap-4 p-6 bg-rose-50/50 dark:bg-rose-950/20 rounded-[28px] border border-rose-100 dark:border-rose-900/30 backdrop-blur-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-rose-100 dark:bg-rose-900/50 rounded-2xl text-rose-600"><AlertCircle size={24} /></div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-rose-700 dark:text-rose-400">
                        {syncStats.failedStocks.length}銘柄で致命的な解析エラーを検知しました
                      </p>
                      <p className="text-[11px] font-bold text-rose-500/80 leading-relaxed">
                        APIのレート制限や通信エラーにより、データの取得が完全に中断されました。
                      </p>
                    </div>
                  </div>
                  <button onClick={handleRetryFailed} disabled={syncInProgressRef.current}
                    className="flex items-center gap-3 px-8 py-3.5 bg-rose-600 text-white rounded-[20px] text-xs font-black hover:bg-rose-700 disabled:opacity-50 transition-all shadow-xl shadow-rose-600/20 active:scale-90 shrink-0"
                  >
                    <RefreshCw size={16} className={cn(syncInProgressRef.current && "animate-spin")} />
                    再同期を実行
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4 border-t border-rose-100 dark:border-rose-900/20">
                  {syncStats.failedStocks.map(s => (
                    <div key={s.ticker} className="flex flex-col p-3 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-rose-100/50 dark:border-rose-900/10">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 truncate">{s.name}</span>
                        <span className="text-[9px] font-bold text-slate-400 tracking-tighter">{s.ticker}</span>
                      </div>
                      <p className="text-[9px] font-medium text-rose-500 line-clamp-2 italic">
                        "{s.error || "接続エラー"}"
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <RankingCard title="総合スコア" items={[...allJudgments].sort((a,b)=>b.totalScore-a.totalScore).slice(0,3)} icon={<Trophy className="text-amber-500" />} onSelect={handleSelectStock} />
        <RankingCard title="高配当利回り" items={[...allJudgments].sort((a,b)=> (b.valuationMetrics?.dividendYield || 0) - (a.valuationMetrics?.dividendYield || 0)).slice(0,3)} icon={<Coins className="text-rose-500" />} onSelect={handleSelectStock} />
        <RankingCard title="割安バリュエーション" items={[...allJudgments].sort((a,b)=>b.valuationScore-a.valuationScore).slice(0,3)} icon={<TrendingUp className="text-indigo-500" />} onSelect={handleSelectStock} />
      </div>

      <div className="space-y-10">
        <div className="flex flex-col gap-8">
          <StockFilterSort loading={loading} filters={filters} onFilterChange={setFilters} onSortChange={setSort} onRefresh={fetchData} />
          <div className="flex items-center gap-3 overflow-x-auto pb-6 scrollbar-hide px-1">
            {sectors.map(s => (
              <button key={s} onClick={() => setFilters(prev => ({ ...prev, sector: s }))}
                className={cn(
                  "px-6 py-3 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border-2",
                  filters.sector === s ? "bg-slate-900 border-slate-900 text-white shadow-2xl shadow-indigo-500/20 -translate-y-1.5" : "bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-indigo-200 hover:text-indigo-500"
                )}
              > {s === "all" ? "All Markets" : s} </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="p-24 bg-rose-50 text-rose-500 rounded-[60px] border border-rose-100 text-center font-black flex flex-col items-center gap-6 shadow-sm">
            <ShieldAlert size={64} className="animate-bounce opacity-20" /> 
            <div className="space-y-2">
              <p className="text-xl">SYSTEM ERROR</p>
              <p className="text-sm font-bold opacity-60">{error}</p>
            </div>
          </div>
        ) : loading && allJudgments.length === 0 ? (
          <div className="p-40 text-center text-slate-400 font-bold flex flex-col items-center gap-10">
            <div className="relative">
              <div className="w-20 h-20 border-8 border-indigo-500/5 border-t-indigo-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center"><BarChart size={24} className="text-indigo-500/30" /></div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-black text-slate-600 dark:text-slate-400 tracking-tight">AI 分析エンジンを初期化中</p>
              <p className="text-[10px] uppercase font-bold text-slate-300 tracking-[0.4em]">Optimizing local cache & market data</p>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {isScanning && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className="p-6 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-[32px] border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between gap-6 overflow-hidden relative group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Zap size={60} className="animate-pulse" />
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                    <Search size={20} className="animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
                      「{filters.label === "high_dividend" ? "高配当" : filters.label === "undervalued" ? "割安" : filters.label === "growth" ? "成長" : filters.label}」銘柄をスキャン中...
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">市場の全銘柄から条件に合致する対象を順次抽出しています</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm relative z-10">
                   <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping" />
                   <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">Scanning Engine Active</span>
                </div>
              </motion.div>
            )}
            <div className="relative">
              <StockList items={displayedItems} onSelect={handleSelectStock} onVisible={addToPriorityQueue} />
              {detailLoading && (
                 <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-3xl flex items-center gap-4 border border-indigo-100 dark:border-indigo-900/30 animate-in zoom-in duration-300">
                       <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                       <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Detail Mining...</span>
                    </div>
                 </div>
              )}
            </div>
            
            <div ref={loadMoreRef} className="h-20 w-full flex items-center justify-center pt-8">
              {filteredItems.length > displayLimit ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading More Intelligence...</span>
                </div>
              ) : filteredItems.length > 0 ? (
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">--- End of Market Data ---</span>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <div className="p-14 bg-slate-900 text-white rounded-[60px] shadow-3xl shadow-slate-950/20 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] transition-transform group-hover:scale-125" />
         <h3 className="text-2xl font-black mb-10 flex items-center gap-4 relative z-10">
           <div className="p-2.5 bg-indigo-500 rounded-2xl shadow-xl shadow-indigo-500/30"><ShieldCheck size={24} /></div>
           市場分析アルゴリズムの透明性
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10 relative z-10">
            <LogicBoxDark title="テクニカル / 25%" reasons={["RSI(14) 20以下で極度の割安判断","SMA25/75/200のゴールデンクロス","短期・中期・長期のトレンド動機"]} />
            <LogicBoxDark title="財務成長 / 35%" reasons={["直近3年の売上高・利益成長率","ROE 10.0%以上の効率的資本運用","フリーキャッシュフローの創出力"]} />
            <LogicBoxDark title="割安判定 / 25%" reasons={["過去10年平均とのPER乖離率","PBR 1.0倍等の解散価値基準","EV/EBITDAによる事業価値評価"]} />
            <LogicBoxDark title="株主還元 / 15%" reasons={["累進性のある配当政策の有無","配当性向 40%以下の持続可能性","機動的な自社株買いの履歴"]} />
         </div>
      </div>

      <StockDetailModal judgment={selectedStock} onClose={() => setSelectedStock(null)} />
    </div>
  );
};

const RankingCard = ({ title, items, icon, onSelect }: { title: string, items: StockJudgment[], icon: React.ReactNode, onSelect: (j: StockJudgment) => void }) => (
  <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-[44px] p-10 shadow-sm hover:shadow-3xl transition-all hover:translate-y-[-8px] group relative overflow-hidden">
    <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity translate-x-4 -translate-y-4">
      {icon}
    </div>
    <div className="flex items-center gap-4 mb-8">
      <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors shadow-inner">{icon}</div>
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] leading-none">{title}</h3>
    </div>
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={item.ticker} onClick={() => onSelect(item)} className="flex items-center justify-between p-5 rounded-[24px] hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30">
          <div className="flex items-center gap-5 overflow-hidden">
            <span className={cn("text-2xl font-black w-8 flex-shrink-0 text-center", i === 0 ? "text-indigo-600 scale-125" : "text-slate-200")}>{i+1}</span>
            <div className="flex flex-col overflow-hidden">
              <span className="text-base font-black text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 transition-colors">{item.companyName}</span>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider">TKR: {item.ticker}</span>
            </div>
          </div>
          <StockSignalBadge label={item.signalLabel} />
        </div>
      ))}
    </div>
  </div>
);

const LogicBoxDark = ({ title, reasons }: { title: string, reasons: string[] }) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)]" />
      <span className="text-sm font-black text-indigo-100 uppercase tracking-widest">{title}</span>
    </div>
    <ul className="space-y-4">
      {reasons.map((r, i) => (
        <li key={i} className="text-[11px] font-bold text-slate-400 flex items-start gap-4 leading-relaxed group/item">
          <ChevronRight size={14} className="text-indigo-500/40 mt-0.5 group-hover/item:translate-x-1 transition-transform" />
          <span>{r}</span>
        </li>
      ))}
    </ul>
  </div>
);

const PulseCard = ({ label, value, icon, suffix, progress }: { label: string, value: number, icon: React.ReactNode, suffix: string, progress?: boolean }) => (
  <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
          {icon}
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-black text-slate-800 dark:text-white tabular-nums">{value}</span>
        <span className="text-xs font-bold text-slate-400">{suffix}</span>
      </div>
      {progress && (
        <div className="w-full h-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden mt-1">
          <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} className="h-full bg-indigo-500" />
        </div>
      )}
    </div>
  </div>
);


