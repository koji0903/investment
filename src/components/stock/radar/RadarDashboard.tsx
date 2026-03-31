"use client";

import React, { useState, useEffect } from "react";
import { executeRadar } from "@/lib/actions/radar";
import { RadarDashboardData, RadarFilter } from "@/types/radar";
import { RadarMarketOverview } from "./RadarMarketOverview";
import { RadarRecommendations } from "./RadarRecommendations";
import { RadarRankings } from "./RadarRankings";
import { RadarFilterUI } from "./RadarFilterUI";
import { 
  Filter, 
  RefreshCw, 
  Trophy, 
  Sparkles, 
  PieChart, 
  LayoutDashboard, 
  Clock 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AppPersistence } from "@/utils/common/persistence";

const DEFAULT_FILTER: RadarFilter = {
  minMarketCap: 500, minVolume: 50000, perRange: [0, 20], pbrRange: [0, 1.5], minRoe: 8, minRevenueGrowth: 5, minDividendYield: 2.5, sectors: [], maxInvestment: undefined
};

export const RadarDashboard: React.FC = () => {
  const [data, setData] = useState<RadarDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<RadarFilter>(DEFAULT_FILTER);
  const [activeTab, setActiveTab] = useState<"overview" | "recommendations" | "rankings">("overview");

  const loadData = async (f: RadarFilter, force = false) => {
    setLoading(true);
    try { 
      // 1. 初回かつキャッシュがあればそれを使用
      if (!force) {
        const cached = AppPersistence.load<RadarDashboardData>("radar_data", 60 * 60 * 1000); // 1時間キャッシュ
        if (cached) {
          console.log("[Radar] Loading from local cache");
          setData(cached);
          setLoading(false);
          return;
        }
      }

      const res = await executeRadar(f, force); 
      setData(res);
      if (res) {
        AppPersistence.save("radar_data", res);
      }
    } catch (e) {
      console.error("Failed to load radar data", e);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    loadData(filter, false); 
  }, []);

  const handleApplyFilter = (f: RadarFilter) => { 
    setFilter(f); 
    loadData(f); 
    setShowFilter(false); 
  };

  const tabs = [
    { id: "overview", label: "市場概況", icon: <LayoutDashboard size={14} /> },
    { id: "recommendations", label: "AI 提案", icon: <Sparkles size={14} /> },
    { id: "rankings", label: "ランキング", icon: <Trophy size={14} /> },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="relative overflow-hidden bg-slate-900 rounded-[40px] p-8 md:p-12 text-white shadow-2xl">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-emerald-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 rounded-full text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-4 border border-indigo-500/30">
              <Sparkles size={12} /> AI Market Intelligence
            </div>
            <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tighter leading-tight italic">
              MARKET RADAR <span className="text-slate-500 not-italic text-2xl md:text-4xl">/ 02</span><br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-emerald-400 not-italic">市場の歪みを捕捉。</span>
            </h1>
            <div className="flex items-center gap-4 mt-6">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">Status</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE SCANNING ACTIVE
                  </span>
               </div>
               <div className="w-px h-8 bg-slate-800" />
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">Last Scanned</span>
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mt-0.5">
                    <Clock size={12} />
                    {data?.lastScannedAt ? new Date(data.lastScannedAt).toLocaleTimeString() : "--:--:--"}
                  </span>
               </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
             <button onClick={() => setShowFilter(true)} className="px-6 py-3 bg-white text-slate-900 rounded-2xl text-[11px] font-black transition-all hover:scale-105 shadow-xl shadow-white/10 flex items-center gap-2 uppercase tracking-widest"><Filter size={16} /> Filter</button>
             <button onClick={() => loadData(filter, true)} disabled={loading} className="px-6 py-3 bg-slate-800 text-white border border-slate-700 rounded-2xl text-[11px] font-black transition-all hover:bg-slate-700 flex items-center gap-2 uppercase tracking-widest"><RefreshCw size={16} className={cn(loading && "animate-spin")} /> Re-Scan</button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex gap-8">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={cn(
                  "flex items-center gap-2 pb-4 px-1 text-[11px] font-black uppercase tracking-widest transition-all relative",
                  activeTab === tab.id ? "text-indigo-500" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                )}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[600px]">
          {loading ? (
            <div className="py-40 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-20 h-20 relative">
                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin" />
              </div>
              <div>
                <div className="font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">Analyzing Market...</div>
                <p className="text-[10px] font-bold text-slate-400 mt-2">東証1,600銘柄のリアルタイム・フィルタリングを実行中</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === "overview" && <RadarMarketOverview data={data} />}
                {activeTab === "recommendations" && <RadarRecommendations data={data?.recommendations} />}
                {activeTab === "rankings" && <RadarRankings rankings={data?.rankings} />}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {showFilter && <RadarFilterUI initialFilter={filter} onApply={handleApplyFilter} onClose={() => setShowFilter(false)} />}
    </div>
  );
};
