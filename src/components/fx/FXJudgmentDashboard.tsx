"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FXJudgment, SignalLabel } from "@/types/fx";
import { FXService } from "@/services/fxService";
import { FXPairList } from "./FXPairList";
import { FXPairDetailModal } from "./FXPairDetailModal";
import { FXEnergyBento } from "./FXEnergyBento";
import { FXFilterSort } from "./FXFilterSort";
import { SignalBadge } from "./FXUIComponents";
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

  const fetchData = async (forceRefresh = false) => {
    if (forceRefresh) {
      setError(null);
      await FXService.syncRealData().catch(err => {
        console.error(err);
        setError("データの同期に失敗しました。時間をおいて再度お試しください。");
      });
    }
  };

  useEffect(() => {
    let isMounted = true;

    // 初期データの取得
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const initialData = await FXService.getPairs();
        if (isMounted) {
          setAllJudgments(initialData);
          setLoading(false);
          if (initialData.length > 0) {
            const latest = [...initialData].sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            )[0]?.updatedAt;
            setLastUpdated(latest);

            // 取得したデータのうち、未完了(pending/syncing)のものをクライアント側から順次同期
            const uncompleted = initialData.filter(d => d.syncStatus !== "completed");
            if (uncompleted.length > 0) {
              syncPairsOneByOne(uncompleted.map(d => d.pairCode));
            }
          }
        }
      } catch (err) {
        console.error("Initial data load failed:", err);
        if (isMounted) setLoading(false);
      }
    };

    // クライアント主導の個別同期
    const syncPairsOneByOne = async (pairCodes: string[]) => {
      for (const code of pairCodes) {
        if (!isMounted) break;
        console.log(`[FX] Client-side sync for ${code} starting...`);
        await FXService.syncPair(code);
        // 次の同期まで少し待機 (API負荷軽減)
        await new Promise(r => setTimeout(r, 800));
      }
    };

    loadInitialData();

    // リアルタイム購読の開始
    const unsubscribe = FXService.subscribePairs((realtimeData) => {
      if (!isMounted) return;
      
      setAllJudgments(prev => {
        // 初期データ（プレースホルダーを含む21件）があるはずなので、
        // リアルタイムで届いたデータ（一部かもしれない）で上書きする。
        if (realtimeData.length === 0) return prev;
        
        const dataMap = new Map(prev.map(d => [d.pairCode, d]));
        realtimeData.forEach(d => {
          dataMap.set(d.pairCode, d);
        });

        const merged = Array.from(dataMap.values());
        return merged.sort((a, b) => b.totalScore - a.totalScore);
      });

      if (realtimeData.length > 0) {
        setLoading(false);
        const latest = [...realtimeData].sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0]?.updatedAt;
        setLastUpdated(latest);
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // エネルギーハイライトの作成
  const energyHighlights = useMemo(() => {
    return [...allJudgments]
      .filter(j => j.energyAnalysis)
      .sort((a, b) => (b.energyAnalysis?.energyScore || 0) - (a.energyAnalysis?.energyScore || 0))
      .slice(0, 3);
  }, [allJudgments]);

  // ランキングデータの作成
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

  // 同期状況の集計
  const syncStats = useMemo(() => {
    const total = allJudgments.length;
    if (total === 0) return { total: 0, completed: 0, syncing: 0, pending: 0, progress: 0 };
    
    const completed = allJudgments.filter(j => j.syncStatus === "completed").length;
    const syncing = allJudgments.filter(j => j.syncStatus === "syncing").length;
    const pending = allJudgments.filter(j => j.syncStatus === "pending" || !j.syncStatus).length;
    const progress = Math.round((completed / total) * 100);
    
    return { total, completed, syncing, pending, progress };
  }, [allJudgments]);

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
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">待機中</p>
                <p className="text-lg font-black text-slate-300 dark:text-slate-600 tabular-nums">{syncStats.pending}</p>
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
            {syncStats.progress < 100 && (
              <motion.div 
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
              />
            )}
          </div>

          <div className="flex items-start gap-3 pt-1">
             <div className={cn(
               "p-1.5 rounded-lg mt-0.5",
               syncStats.progress === 100 ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-indigo-50 dark:bg-indigo-500/10"
             )}>
               {syncStats.progress === 100 ? <ShieldCheck size={14} className="text-emerald-500" /> : <Info size={14} className="text-indigo-500" />}
             </div>
             <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
               {syncStats.progress < 100 
                 ? "現在、Yahoo Financeからのヒストリカルデータ取得およびAI判定エンジンが順次稼働中です。リストに表示されているデータは最新の分析結果にリアルタイムで更新されます。" 
                 : "すべての通貨ペアの最新データの同期と分析が完了しました。現在のマーケット環境に基づいた高精度な投資判断情報が表示されています。"}
             </p>
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
                  <div className="h-px flex-1 bg-slate-200/60 dark:bg-slate-800/60 ml-4" />
                </div>
                <FXEnergyBento analysis={j.energyAnalysis!} pairCode={j.pairCode} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Stats Summary */}
      {!loading && allJudgments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox 
            label="分析対象" 
            value={`${allJudgments.length} ペア`} 
            color="indigo" 
            sub="主要・資源国・高金利"
          />
          <StatBox 
            label="買いサイン" 
            value={`${allJudgments.filter(j => j.signalLabel.includes("買い")).length}`} 
            color="emerald" 
            sub="買い優勢・やや買い"
          />
          <StatBox 
            label="売りサイン" 
            value={`${allJudgments.filter(j => j.signalLabel.includes("売り")).length}`} 
            color="rose" 
            sub="売り優勢・やや売り"
          />
          <StatBox 
            label="高信頼度" 
            value={`${allJudgments.filter(j => j.confidence === "高").length}`} 
            color="amber" 
            sub="分析精度：高"
          />
        </div>
      )}

      {!loading && allJudgments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <RankingCard 
            title="買い優勢" 
            items={rankings.buyRanking} 
            icon={<TrendingUp size={18} className="text-emerald-500" />}
            onSelect={setSelectedJudgment}
          />
          <RankingCard 
            title="売り優勢" 
            items={rankings.sellRanking} 
            icon={<TrendingDown size={18} className="text-rose-500" />}
            onSelect={setSelectedJudgment}
          />
          <RankingCard 
            title="スワップ妙味" 
            items={rankings.swapRanking} 
            icon={<Coins size={18} className="text-amber-500" />}
            onSelect={setSelectedJudgment}
          />
          <RankingCard 
            title="安全性重視 (Loss Control)" 
            items={rankings.safetyRanking} 
            icon={<ShieldCheck size={18} className="text-blue-500" />}
            onSelect={setSelectedJudgment}
          />
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
        ) : filteredAndSortedJudgments.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px] space-y-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
               <Zap size={32} />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800 dark:text-white">表示できる判断情報がありません</p>
              <p className="text-xs font-bold text-slate-400">検索条件を変更するか、右上の「データ再生成」をクリックしてください。</p>
            </div>
          </div>
        ) : (
          <FXPairList judgments={filteredAndSortedJudgments} onSelect={setSelectedJudgment} />
        )}
      </div>

      {/* Analysis Logic Info Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 md:p-10 space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-500 rounded-xl text-white">
            <Info size={20} />
          </div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">分析判定ロジックの詳細</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           <div className="space-y-4">
             <h3 className="text-sm font-black text-indigo-500 uppercase tracking-wider flex items-center gap-2">
               <Zap size={16} /> 短期判定 (主にテクニカル)
             </h3>
             <ul className="text-xs font-bold text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed">
               <li>・移動平均線のパーフェクトオーダーによるトレンド追随</li>
               <li>・RSI 30/70 による売られすぎ・買われすぎの転換点</li>
               <li>・MACDクロスによるモメンタム加速の判定</li>
               <li className="text-amber-500">・強気相場でもRSI過熱時は「押し目待ち」として警告</li>
             </ul>
           </div>
           <div className="space-y-4">
             <h3 className="text-sm font-black text-emerald-500 uppercase tracking-wider flex items-center gap-2">
               <Target size={16} /> 中長期判定 (基礎 & スワップ)
             </h3>
             <ul className="text-xs font-bold text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed">
               <li>・通貨ペア間の政策金利差（キャリートレードの優位性）</li>
               <li>・中央銀行のタカ派・ハト派スタンスの乖離</li>
               <li>・景気指標およびインフレ傾向の相対評価</li>
               <li className="text-rose-500">・スワップが大幅マイナス（-200/日超）の場合は長期保有不向きと判定</li>
             </ul>
           </div>
        </div>

        {/* Certainty & Feedback Logic Info */}
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-black text-indigo-500 uppercase tracking-wider flex items-center gap-2 mb-4">
            <ShieldCheck size={16} /> 分析精度と自己フィードバック・アルゴリズム
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 mb-2">① データ充足性 (信頼の基礎)</p>
              <p className="text-[10px] font-bold text-slate-500 leading-relaxed">過去20日間のヒストリカルデータ取得状況に基づき、分析の母集団が十分かを判定。未収集データが多いほど精度は低下します。</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 mb-2">② インジケーター収束 (不一致検知)</p>
              <p className="text-[10px] font-bold text-slate-500 leading-relaxed">テクニカル、ファンダメンタル、相場エネルギーの方向性が一致しているかを自己分析。不一致時は精度を下方修正し「慎重」シグナルを出します。</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 mb-2">③ ボラティリティ適合 (環境分析)</p>
              <p className="text-[10px] font-bold text-slate-500 leading-relaxed">現在の価格がボリンジャーバンド内に収まっているか、ATRが極端に拡大していないかをチェック。異常値検出時は精度を自動調整します。</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 mb-2">④ セーフティ・スコア (損失最小化)</p>
              <p className="text-[10px] font-bold text-slate-500 leading-relaxed">損切幅のタイトさ、ボラティリティの安定性、リスクリワード比から「低リスクな運用が可能か」を評価。損失額の抑制を最優先する指標です。</p>
            </div>
          </div>
        </div>
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
