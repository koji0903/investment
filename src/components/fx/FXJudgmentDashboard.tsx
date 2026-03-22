"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FXJudgment, SignalLabel } from "@/types/fx";
import { FXService } from "@/services/fxService";
import { FXPairList } from "./FXPairList";
import { FXPairDetailModal } from "./FXPairDetailModal";
import { FXFilterSort } from "./FXFilterSort";
import { SignalBadge } from "./FXUIComponents";
import { Zap, Info, ShieldAlert, Trophy, TrendingUp, TrendingDown, Coins, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const FXJudgmentDashboard = () => {
  const [allJudgments, setAllJudgments] = useState<FXJudgment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJudgment, setSelectedJudgment] = useState<FXJudgment | null>(null);
  
  const [filters, setFilters] = useState({ search: "", label: "all" });
  const [sort, setSort] = useState({ key: "totalScore", order: "desc" as "asc" | "desc" });

  const fetchData = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = forceRefresh 
        ? await FXService.generateAndSaveDummyData()
        : await FXService.getPairs();
      setAllJudgments(data);
    } catch (err) {
      console.error(err);
      setError("データ取得に失敗しました。もう一度お試しください。");
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
    const sellRanking = [...allJudgments].sort((a, b) => a.totalScore - b.totalScore).slice(0, 3);
    const swapRanking = [...allJudgments].sort((a, b) => b.swapScore - a.swapScore).slice(0, 3);
    return { buyRanking, sellRanking, swapRanking };
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
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Advanced Currency Judgment Matrix</p>
            </div>
          </div>
          <p className="max-w-xl text-sm font-bold text-slate-500 leading-relaxed">
            テクニカル・ファンダメンタル・スワップ情報を統合。短期売買と中長期保有の優位性を個別に評価します。
          </p>
        </div>
      </div>

      {/* Rankings Section */}
      {!loading && allJudgments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RankingCard 
            title="買い優勢ランキング" 
            items={rankings.buyRanking} 
            icon={<TrendingUp size={18} className="text-emerald-500" />}
            onSelect={setSelectedJudgment}
          />
          <RankingCard 
            title="売り優勢ランキング" 
            items={rankings.sellRanking} 
            icon={<TrendingDown size={18} className="text-rose-500" />}
            onSelect={setSelectedJudgment}
          />
          <RankingCard 
            title="スワップ妙味ランキング" 
            items={rankings.swapRanking} 
            icon={<Coins size={18} className="text-amber-500" />}
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
            <span className="text-sm font-black text-slate-700 dark:text-slate-200">{item.pairCode}</span>
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
