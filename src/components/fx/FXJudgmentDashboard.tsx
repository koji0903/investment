"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FXJudgment, SignalLabel } from "@/types/fx";
import { FXService } from "@/services/fxService";
import { FXPairList } from "./FXPairList";
import { FXPairDetailModal } from "./FXPairDetailModal";
import { FXFilterSort } from "./FXFilterSort";
import { Zap, Info, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  const filteredAndSortedJudgments = useMemo(() => {
    let result = [...allJudgments];

    // Search
    if (filters.search) {
      result = result.filter(j => 
        j.pairCode.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Filter
    if (filters.label !== "all") {
      if (filters.label === "confidence_high") {
        result = result.filter(j => j.confidence === "高");
      } else if (filters.label === "medium_term") {
        result = result.filter(j => j.holdingStyle.includes("medium"));
      } else {
        result = result.filter(j => j.signalLabel === filters.label);
      }
    }

    // Sort
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
    <div className="space-y-10">
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
            テクニカル・ファンダメンタル・スワップ情報を統合し、全主要通貨ペアの投資優位性をリアルタイム（デモ）で算出します。
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 px-6 py-4 rounded-[24px] border border-slate-100 dark:border-slate-800">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">分析ステータス</p>
            <p className="text-sm font-black text-emerald-500 leading-none">
              {loading ? "更新中..." : "正常稼働中"}
            </p>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">判定ペア数</p>
            <p className="text-sm font-black text-slate-800 dark:text-white leading-none">
              {allJudgments.length}
            </p>
          </div>
        </div>
      </div>

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
            <button 
              onClick={() => fetchData()}
              className="px-6 py-3 bg-rose-500 text-white rounded-2xl text-sm font-black"
            >
              再試行する
            </button>
          </div>
        ) : loading && allJudgments.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-[32px] animate-pulse" />
            ))}
          </div>
        ) : (
          <FXPairList 
            judgments={filteredAndSortedJudgments} 
            onSelect={setSelectedJudgment} 
          />
        )}
      </div>

      {/* Analysis Logic Info Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 md:p-10 space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-500 rounded-xl text-white">
            <Info size={20} />
          </div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">分析判定ロジックについて</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="space-y-3">
             <h3 className="text-sm font-black text-emerald-500 uppercase tracking-wider">テクニカル (50%)</h3>
             <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
               SMA20/50/200のトレンド方向、RSIの過熱感、MACDのクロス、ボリンジャーバンドの乖離を統合評価。直近高値・安値のブレイクも加点要素。
             </p>
           </div>
           <div className="space-y-3">
             <h3 className="text-sm font-black text-blue-500 uppercase tracking-wider">ファンダメンタル (35%)</h3>
             <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
               政策金利差（キャリー）、中央銀行のバイアス(タカ/ハト)、景気強弱、安全通貨・資源国通貨の特性をベース対クォートで比較算出。
             </p>
           </div>
           <div className="space-y-3">
             <h3 className="text-sm font-black text-amber-500 uppercase tracking-wider">スワップ評価 (15%)</h3>
             <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
               保有コストと利益への影響を評価。金利差が大きく、かつトレンドが順方向の場合に中長期保有の信頼度を上方修正します。
             </p>
           </div>
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
           <p className="text-[11px] font-bold text-slate-400 italic text-center">
             ※ 本エンジンは定期的なデータ同期とAIロジックによって構築されており、投資助言を目的としたものではありません。
           </p>
        </div>
      </div>

      {/* Detail Modal */}
      <FXPairDetailModal 
        judgment={selectedJudgment} 
        onClose={() => setSelectedJudgment(null)} 
      />
    </div>
  );
};
