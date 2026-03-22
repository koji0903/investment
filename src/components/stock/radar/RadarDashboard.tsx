"use client";

import React, { useState, useEffect } from "react";
import { executeRadar } from "@/lib/actions/radar";
import { RadarDashboardData, RadarFilter } from "@/types/radar";
import { RadarRecommendations } from "./RadarRecommendations";
import { RadarRankings } from "./RadarRankings";
import { RadarFilterUI } from "./RadarFilterUI";
import { Filter, RefreshCw, Trophy, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const DEFAULT_FILTER: RadarFilter = {
  minMarketCap: 500, minVolume: 50000, perRange: [0, 20], pbrRange: [0, 1.5], minRoe: 8, minRevenueGrowth: 5, minDividendYield: 2.5, sectors: []
};

export const RadarDashboard: React.FC = () => {
  const [data, setData] = useState<RadarDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<RadarFilter>(DEFAULT_FILTER);
  const [activeTab, setActiveTab] = useState<"recommendations" | "rankings">("recommendations");

  const loadData = async (f: RadarFilter) => {
    setLoading(true);
    try { const res = await executeRadar(f); setData(res); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(filter); }, []);

  const handleApplyFilter = (f: RadarFilter) => { setFilter(f); loadData(f); setShowFilter(false); };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="relative overflow-hidden bg-slate-900 rounded-[40px] p-8 md:p-12 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 rounded-full text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-4">
              <Sparkles size={12} /> AI Insight
            </div>
            <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
              未来の有望銘柄を<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">自動で抽出・捕捉</span>
            </h1>
          </div>
          <div className="flex flex-col gap-3">
             <button onClick={() => setShowFilter(true)} className="px-8 py-4 bg-white text-slate-900 rounded-2xl text-sm font-black transition-all hover:scale-105 shadow-xl shadow-white/10 flex items-center gap-2"><Filter size={18} /> 範囲指定</button>
             <button onClick={() => loadData(filter)} disabled={loading} className="px-8 py-4 bg-slate-800 text-white rounded-2xl text-sm font-black transition-all hover:bg-slate-700 flex items-center gap-2"><RefreshCw size={18} className={cn(loading && "animate-spin")} /> 再計測</button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit">
          <button onClick={() => setActiveTab("recommendations")} className={cn("px-6 py-2 rounded-xl text-xs font-black transition-all", activeTab === "recommendations" ? "bg-white dark:bg-slate-800 shadow" : "text-slate-400")}>AI提案</button>
          <button onClick={() => setActiveTab("rankings")} className={cn("px-6 py-2 rounded-xl text-xs font-black transition-all", activeTab === "rankings" ? "bg-white dark:bg-slate-800 shadow" : "text-slate-400")}>ランキング</button>
        </div>
        <div className="min-h-[400px]">
          {loading ? <div className="py-20 text-center font-black text-slate-400 uppercase tracking-widest">市場をスキャン中...</div> : (
            <AnimatePresence mode="wait">
              {activeTab === "recommendations" ? 
                <motion.div key="recs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><RadarRecommendations data={data?.recommendations} /></motion.div> : 
                <motion.div key="ranks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><RadarRankings rankings={data?.rankings} /></motion.div>
              }
            </AnimatePresence>
          )}
        </div>
      </div>

      {showFilter && <RadarFilterUI initialFilter={filter} onApply={handleApplyFilter} onClose={() => setShowFilter(false)} />}
    </div>
  );
};
