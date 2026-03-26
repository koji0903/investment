"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { FXJudgment, SignalLabel } from "@/types/fx";
import { FXService } from "@/services/fxService";
import { FXPairList } from "./FXPairList";
import { FXPairDetailModal } from "./FXPairDetailModal";
import { FXEnergyBento } from "./FXEnergyBento";
import { FXFilterSort } from "./FXFilterSort";
import { SignalBadge } from "./FXUIComponents";
import { useAuth } from "@/context/AuthContext";
import { Zap, Info, ShieldAlert, Trophy, TrendingUp, TrendingDown, Coins, ChevronRight, Target, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const FXJudgmentDashboard = () => {
  const [allJudgments, setAllJudgments] = useState<FXJudgment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJudgment, setSelectedJudgment] = useState<FXJudgment | null>(null);
  
  const [filters, setFilters] = useState({ search: "", label: "all" });
  const [sort, setSort] = useState({ key: "totalScore", order: "desc" as "asc" | "desc" });
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { user } = useAuth();
  const portfolioId = "default"; // 必要に応じて拡張可能

  const isMounted = useRef(true);
  const syncInProgressRef = useRef(false);
  const syncingPairsRef = useRef<Set<string>>(new Set());
  const initialSyncTriggered = useRef(false);

  // 同期キュー処理
  const processSyncQueue = async (pairCodes: string[]) => {
    if (syncInProgressRef.current || pairCodes.length === 0 || !isMounted.current) return;
    
    syncInProgressRef.current = true;
    console.log(`[FX] Starting sync for ${pairCodes.length} pairs...`);
    
    const queue = [...pairCodes];
    const CONCURRENCY = 2;

    try {
      while (queue.length > 0 && isMounted.current) {
        const chunk = queue.splice(0, CONCURRENCY);
        await Promise.all(chunk.map(async (code) => {
          if (!isMounted.current) return;
          
          try {
            syncingPairsRef.current.add(code);
            
            setAllJudgments(prev => prev.map(d => 
              d.pairCode === code ? { ...d, syncStatus: "syncing" } : d
            ));

            if (user?.uid) {
              await FXService.setSyncing(user.uid, portfolioId, code);
              const result = await FXService.syncPair(user.uid, portfolioId, code);
              
              if (isMounted.current) {
                setAllJudgments(prev => {
                  const dataMap = new Map(prev.map(d => [d.pairCode, d]));
                  if (result.success && result.data) {
                    dataMap.set(code, { ...result.data, syncStatus: "completed" });
                  } else {
                    const existing = dataMap.get(code);
                    if (existing) {
                      dataMap.set(code, { 
                        ...existing, 
                        syncStatus: "failed", 
                        summaryComment: result.message || "同期に失敗しました" 
                      });
                    }
                  }
                  return Array.from(dataMap.values()).sort((a, b) => b.totalScore - a.totalScore);
                });
              }
            }
          } catch (err) {
            console.error(`[FX] Sync failed for ${code}:`, err);
          } finally {
            syncingPairsRef.current.delete(code);
          }
        }));

        if (queue.length > 0 && isMounted.current) {
          await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000));
        }
      }
    } finally {
      syncInProgressRef.current = false;
      console.log("[FX] Sync cycle finished.");
    }
  };

  // 初期データロード & リアルタイム購読
  useEffect(() => {
    isMounted.current = true;

    const init = async () => {
      if (!user?.uid) return;
      setLoading(true);
      try {
        const data = await FXService.getPairs(user.uid, portfolioId);
        if (isMounted.current) {
          setAllJudgments(data);
          setLoading(false);
          
          // 初回データ取得後、未完了または古いデータがある場合に一度だけ同期を開始
          if (!initialSyncTriggered.current && data.length > 0) {
            initialSyncTriggered.current = true;
            const toSync = data.filter(d => {
              const isStale = (Date.now() - new Date(d.updatedAt).getTime()) > 6 * 60 * 60 * 1000;
              return d.syncStatus !== "completed" || isStale;
            }).map(d => d.pairCode);
            
            if (toSync.length > 0) {
              processSyncQueue(toSync);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load initial data:", err);
        if (isMounted.current) {
          setError("データの読み込みに失敗しました。再試行してください。");
          setLoading(false);
        }
      }
    };

    init();

    if (!user?.uid) return;
    const unsubscribe = FXService.subscribePairs(user.uid, portfolioId, (realtimeData) => {
      if (!isMounted.current) return;
      
      setAllJudgments(prev => {
        const dataMap = new Map(prev.map(d => [d.pairCode, d]));
        realtimeData.forEach(d => {
          // 同期処理中のものはマージしない
          if (!syncingPairsRef.current.has(d.pairCode)) {
            dataMap.set(d.pairCode, d);
          }
        });
        return Array.from(dataMap.values()).sort((a, b) => b.totalScore - a.totalScore);
      });

      if (realtimeData.length > 0) {
        const latest = [...realtimeData].sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0]?.updatedAt;
        setLastUpdated(latest);
      }
    });

    return () => {
      isMounted.current = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 計算値 (useMemo)
  const energyHighlights = useMemo(() => {
    return [...allJudgments]
      .filter(j => j.energyAnalysis)
      .sort((a, b) => (b.energyAnalysis?.energyScore || 0) - (a.energyAnalysis?.energyScore || 0))
      .slice(0, 3);
  }, [allJudgments]);

  const rankings = useMemo(() => {
    const buyRanking = [...allJudgments].sort((a, b) => b.totalScore - a.totalScore).slice(0, 3);
    const sellRanking = [...allJudgments].sort((a, b) => a.totalScore - b.totalScore).slice(0, 3);
    const swapRanking = [...allJudgments].sort((a, b) => b.swapScore - a.swapScore).slice(0, 3);
    const safetyRanking = [...allJudgments].sort((a, b) => b.safetyScore - a.safetyScore).slice(0, 3);
    return { buyRanking, sellRanking, swapRanking, safetyRanking };
  }, [allJudgments]);

  const filteredAndSortedJudgments = useMemo(() => {
    let result = [...allJudgments];
    if (filters.search) {
      result = result.filter(j => j.pairCode.toLowerCase().includes(filters.search.toLowerCase()));
    }
    if (filters.label !== "all") {
      if (filters.label === "confidence_high") {
        result = result.filter(j => j.confidence === "高");
      } else if (filters.label === "medium_term") {
        result = result.filter(j => j.holdingStyle.includes("medium"));
      } else {
        result = result.filter(j => j.signalLabel === filters.label);
      }
    }
    
    result.sort((a: any, b: any) => {
      const aVal = a[sort.key];
      const bVal = b[sort.key];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sort.order === "desc" ? bVal - aVal : aVal - bVal;
      }
      return 0;
    });
    return result;
  }, [allJudgments, filters, sort]);

  const syncStats = useMemo(() => {
    const total = allJudgments.length;
    if (total === 0) return { total: 0, completed: 0, syncing: 0, failed: 0, pending: 0, progress: 0 };
    
    const completed = allJudgments.filter(j => j.syncStatus === "completed").length;
    const syncing = allJudgments.filter(j => j.syncStatus === "syncing").length;
    const failed = allJudgments.filter(j => j.syncStatus === "failed").length;
    const pending = allJudgments.filter(j => j.syncStatus === "pending" || !j.syncStatus).length;
    const progress = Math.round((completed / total) * 100);
    
    return { total, completed, syncing, failed, pending, progress };
  }, [allJudgments]);

  const fetchData = async (forceRefresh = false) => {
    if (forceRefresh && user?.uid) {
      setError(null);
      try {
        await FXService.syncRealData(user.uid, portfolioId);
      } catch (err) {
        console.error(err);
        setError("データの更新に失敗しました。時間をおいて再試行してください。");
      }
    }
  };

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500 rounded-2xl text-white shadow-lg shadow-amber-500/20">
              <Zap size={24} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">FX 投資判断エンジン</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Currency Judgment Matrix</p>
                {lastUpdated && (
                  <span className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200/50">
                    最終更新: {new Date(lastUpdated).toLocaleTimeString("ja-JP")}
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="max-w-xl text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
            テクニカル・ファンダメンタル・スワップ情報を統合。短期売買と中長期保有の優位性を個別に評価します。
          </p>
        </div>
      </div>

      {/* Sync Status Summary Section */}
      {!loading && syncStats.total > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-sm space-y-5"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-2.5 rounded-2xl shadow-sm transition-colors duration-500",
                syncStats.progress === 100 ? "bg-emerald-500 text-white" : "bg-indigo-500 text-white"
              )}>
                {syncStats.progress === 100 ? <ShieldCheck size={20} /> : <Zap size={20} className="animate-pulse" />}
              </div>
              <div>
                <h2 className="text-base font-black text-slate-800 dark:text-white leading-tight">分析・データ同期状況</h2>
                <div className="flex items-center gap-2 mt-1">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sync Progress</p>
                   {syncStats.progress < 100 && (
                     <span className="flex items-center gap-1 text-[9px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full animate-pulse">
                       <Zap size={8} fill="currentColor" />
                       REALTIME UPDATE
                     </span>
                   )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:flex items-center gap-4 md:gap-8">
              <div className="flex flex-col">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">完了数</p>
                <p className="text-lg font-black text-emerald-500 tabular-nums">{syncStats.completed}</p>
              </div>
              <div className="flex flex-col">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">同期中</p>
                <p className="text-lg font-black text-indigo-500 tabular-nums">{syncStats.syncing}</p>
              </div>
              <div className="flex flex-col">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">失敗数</p>
                <p className="text-lg font-black text-rose-500 tabular-nums">{syncStats.failed}</p>
              </div>
              <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 px-5 py-2 rounded-2xl border border-slate-100 dark:border-slate-800 min-w-[90px] items-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">全体の進捗</p>
                <p className="text-xl font-black text-slate-800 dark:text-white tabular-nums">{syncStats.progress}%</p>
              </div>
            </div>
          </div>

          <div className="relative h-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${syncStats.progress}%` }}
              transition={{ duration: 1, ease: "circOut" }}
              className={cn(
                "absolute top-0 left-0 h-full rounded-full transition-colors duration-700",
                syncStats.progress === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-indigo-400"
              )}
            />
          </div>
        </motion.div>
      )}

      {/* Energy Highlights Section */}
      {!loading && energyHighlights.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-yellow-400 rounded-xl text-slate-900 border border-yellow-500/20 shadow-sm">
              <Zap size={20} fill="currentColor" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white leading-none">相場エネルギー・ハイライト</h2>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Top 3 Energy Accumulation Pairs</p>
            </div>
          </div>
          <div className="space-y-12">
            {energyHighlights.map((j, idx) => (
              <div key={j.pairCode} className="p-8 bg-slate-50/50 dark:bg-slate-800/20 rounded-[48px] border border-slate-100 dark:border-slate-800/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] -z-10 pointer-events-none">
                  <Zap size={200} fill="currentColor" className="text-slate-900 dark:text-white" />
                </div>
                <div className="flex items-center gap-4 mb-8">
                  <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 text-xs font-black text-slate-400 border border-slate-200/60 dark:border-slate-800 shadow-sm">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight leading-none">{j.pairCode}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Energy Unit {idx + 1}</p>
                  </div>
                </div>
                <FXEnergyBento analysis={j.energyAnalysis!} pairCode={j.pairCode} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      <div className="space-y-8">
        <FXFilterSort 
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
        ) : (
          <FXPairList judgments={filteredAndSortedJudgments} onSelect={setSelectedJudgment} />
        )}
      </div>

      <FXPairDetailModal judgment={selectedJudgment} onClose={() => setSelectedJudgment(null)} />
    </div>
  );
};

const RankingCard = ({ title, items, icon, onSelect }: { title: string, items: FXJudgment[], icon: React.ReactNode, onSelect: (j: FXJudgment) => void }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 shadow-sm">
    <div className="flex items-center gap-3 mb-5">
      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">{icon}</div>
      <h3 className="text-sm font-black text-slate-800 dark:text-white">{title}</h3>
    </div>
    <div className="space-y-3">
      {items.map((item, i) => (
        <div 
          key={item.pairCode} 
          onClick={() => onSelect(item)}
          className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-slate-300 w-4">{i + 1}</span>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-700 dark:text-slate-200">{item.pairCode}</span>
              <div className="flex items-center gap-1 mt-0.5 text-[8px] font-black text-indigo-500">
                <ShieldCheck size={8} />
                <span>精度 {item.certainty}%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SignalBadge label={item.signalLabel} />
            <ChevronRight size={14} className="text-slate-200 group-hover:text-slate-400 transition-colors" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const StatBox = ({ label, value, color, sub }: { label: string, value: string, color: string, sub?: string }) => (
  <div className={cn(
    "p-6 rounded-[28px] border transition-all shadow-sm",
    color === "indigo" ? "bg-indigo-50/50 border-indigo-100 dark:bg-indigo-500/5 dark:border-indigo-500/20" :
    color === "emerald" ? "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/20" :
    color === "rose" ? "bg-rose-50/50 border-rose-100 dark:bg-rose-500/5 dark:border-rose-500/20" :
    "bg-amber-50/50 border-amber-100 dark:bg-amber-500/5 dark:border-amber-500/20"
  )}>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className={cn(
      "text-2xl font-black",
      color === "indigo" ? "text-indigo-600 dark:text-indigo-400" :
      color === "emerald" ? "text-emerald-600 dark:text-emerald-400" :
      color === "rose" ? "text-rose-600 dark:text-rose-400" :
      "text-amber-600 dark:text-amber-400"
    )}>{value}</p>
    {sub && <p className="text-[10px] font-bold text-slate-400 mt-1">{sub}</p>}
  </div>
);

export default FXJudgmentDashboard;
