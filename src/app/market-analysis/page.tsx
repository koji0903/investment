"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight, 
  Car, 
  Cpu, 
  Banknote,
  Search,
  Info,
  Flame,
  ShoppingBag,
  Building,
  MonitorPlay,
  Settings2,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { MARKET_ANALYSIS_DATA } from "@/lib/marketData";
import { IndustryTrendBadge } from "@/components/IndustryTrendBadge";
import { IndustryRelationshipMap } from "@/components/IndustryRelationshipMap";
import { CompanyPerformanceChart } from "@/components/CompanyPerformanceChart";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, any> = {
  Car,
  Cpu,
  Banknote,
  Flame,
  ShoppingBag,
  Building,
  MonitorPlay
};

export default function MarketAnalysisPage() {
  const [selectedIndustryId, setSelectedIndustryId] = useState(MARKET_ANALYSIS_DATA[0].id);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [maxCompanyCount, setMaxCompanyCount] = useState(5);
  const [liveData, setLiveData] = useState<Record<string, any>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const rawIndustry = MARKET_ANALYSIS_DATA.find(i => i.id === selectedIndustryId)!;
  
  // 表示件数でスライス
  const selectedIndustry = useMemo(() => ({
    ...rawIndustry,
    companies: rawIndustry.companies.slice(0, maxCompanyCount)
  }), [rawIndustry, maxCompanyCount]);

  const selectedCompany = selectedIndustry.companies.find(c => c.id === selectedCompanyId) || selectedIndustry.companies[0];

  const fetchLivePrices = async () => {
    setIsRefreshing(true);
    try {
      const symbols = selectedIndustry.companies.map(c => c.symbol);
      const res = await fetch("/api/market-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols })
      });
      const result = await res.json();
      if (result.success && result.data) {
        setLiveData(prev => ({ ...prev, ...result.data }));
        setLastUpdated(new Date().toISOString());
      }
    } catch (err) {
      console.error("Market Analysis Live Data Fetch Error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLivePrices();
  }, [selectedIndustryId]);

  const currentLiveData = liveData[selectedCompany.symbol];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:scale-110 transition-transform shadow-sm"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter gradient-text">日本市場分析・業界地図</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Japanese Market Insight & Industry Map</p>
              {lastUpdated && (
                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-200/50">
                  最終更新: {new Date(lastUpdated).toLocaleTimeString("ja-JP")}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* 表示企業数設定スライダー */}
          <div className="bg-white dark:bg-slate-900 px-6 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
            <div className="flex flex-col">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Display Count</span>
               <div className="flex items-center gap-3">
                 <input 
                   type="range" 
                   min="3" 
                   max="10" 
                   value={maxCompanyCount}
                   onChange={(e) => setMaxCompanyCount(parseInt(e.target.value))}
                   className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                 />
                 <span className="text-xs font-black text-indigo-500 min-w-[3ch]">{maxCompanyCount}社</span>
               </div>
            </div>
          </div>

          <button 
            onClick={fetchLivePrices}
            disabled={isRefreshing}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-500 transition-colors"
          >
             <RefreshCw size={20} className={cn(isRefreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Industry Quick Overview */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex items-center justify-between mb-4 px-2">
           <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
             <div className="w-1 h-3 bg-indigo-500 rounded-full" />
             Sector Quick Overview
           </h2>
           <span className="text-[9px] font-bold text-slate-400 italic">直近の業界動向一覧</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          {MARKET_ANALYSIS_DATA.map((industry) => {
            const Icon = ICON_MAP[industry.iconName] || Info;
            const isActive = selectedIndustryId === industry.id;
            return (
              <motion.button
                key={industry.id}
                whileHover={{ y: -2 }}
                onClick={() => {
                  setSelectedIndustryId(industry.id);
                  setSelectedCompanyId(null);
                }}
                className={cn(
                  "p-3 sm:p-4 rounded-[2rem] border-2 transition-all text-center flex flex-col items-center gap-2 group",
                  isActive 
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/50 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:shadow-xl hover:shadow-slate-200/50"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-colors",
                  isActive ? "bg-white/20 text-white" : "bg-slate-50 dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/30 text-slate-400 group-hover:text-indigo-500"
                )}>
                  <Icon size={18} />
                </div>
                <span className="text-[11px] font-black leading-tight max-w-full truncate">{industry.name.split("・")[0]}</span>
                <div className="mt-1">
                   <IndustryTrendBadge trend={industry.trend} showText={false} />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3 space-y-2">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2 italic">Detailed Selection</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {MARKET_ANALYSIS_DATA.map((industry) => {
              const Icon = ICON_MAP[industry.iconName] || Info;
              const isActive = selectedIndustryId === industry.id;
              
              return (
                <motion.button
                  key={industry.id}
                  whileHover={{ x: 5 }}
                  onClick={() => {
                    setSelectedIndustryId(industry.id);
                    setSelectedCompanyId(null);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-3.5 rounded-[1.5rem] border-2 transition-all text-left group",
                    isActive 
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xl" 
                      : "bg-white dark:bg-slate-900 border-transparent hover:border-slate-200 dark:hover:border-slate-800 shadow-sm"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-xl transition-colors",
                      isActive ? "bg-white/20 dark:bg-slate-900/10" : "bg-slate-50 dark:bg-slate-800 group-hover:bg-slate-100"
                    )}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <span className="block font-black text-[13px]">{industry.name}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                         <span className={cn(
                          "text-[8px] font-bold uppercase tracking-widest",
                          isActive ? "opacity-60" : "text-slate-400"
                        )}>{industry.companies.length} Companies</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={14} className={cn("transition-transform opacity-40", isActive ? "rotate-90 opacity-100" : "")} />
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedIndustryId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 xl:grid-cols-2 gap-8"
            >
              {/* Industry Summary Card */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 sm:p-10 border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-all duration-700 pointer-events-none">
                     {React.createElement(ICON_MAP[selectedIndustry.iconName] || Info, { size: 160 })}
                  </div>
                  
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <IndustryTrendBadge trend={selectedIndustry.trend} />
                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em] italic">Sector Insight</span>
                  </div>
                  
                  <h3 className="text-3xl font-black mb-6 tracking-tight relative z-10">{selectedIndustry.name}</h3>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed mb-8 relative z-10">
                    {selectedIndustry.overview}
                  </p>
                  
                  <div className="p-5 rounded-[1.75rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                       <span className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.15em]">Climate Reason</span>
                    </div>
                    <p className="text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300 italic">
                      「{selectedIndustry.trendReason}」
                    </p>
                  </div>
                </div>

                {/* Relationship Map */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden hover:shadow-2xl transition-all">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black tracking-tight flex items-center gap-2 italic uppercase">
                      <Search size={18} className="text-indigo-500" />
                      Map Analysis
                    </h3>
                    <span className="text-[9px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full uppercase tracking-tighter">Enterprise correlation</span>
                  </div>
                  <IndustryRelationshipMap analysis={selectedIndustry} />
                  <p className="mt-6 text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest italic">Inter-company dynamics visualizer</p>
                </div>
              </div>

              {/* Company Detail Analysis */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 sm:p-10 border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none min-h-full">
                  <div className="flex items-center justify-between mb-10 overflow-x-auto pb-2 scrollbar-hide">
                    <h3 className="text-lg font-black tracking-tight uppercase tracking-[0.15em] shrink-0 italic">Players</h3>
                    <div className="flex gap-1.5 ml-4">
                      {selectedIndustry.companies.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCompanyId(c.id)}
                          className={cn(
                            "px-3.5 py-2 rounded-2xl text-[10px] font-black transition-all whitespace-nowrap",
                            selectedCompany.id === c.id 
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-105" 
                              : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100"
                          )}
                        >
                          {c.name.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedCompany.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full">{selectedCompany.symbol}</span>
                            <span className={cn(
                              "text-[10px] font-black flex items-center gap-1",
                              selectedCompany.sentiment === "bullish" ? "text-emerald-500" : "text-rose-500"
                            )}>
                              {selectedCompany.sentiment === "bullish" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              AI分析: {selectedCompany.sentiment === "bullish" ? "強気" : "弱気"}
                            </span>
                          </div>
                          <h4 className="text-2xl font-black tracking-tighter">{selectedCompany.name}</h4>
                          {currentLiveData && (
                             <div className="flex items-center gap-2 mt-1">
                               <span className="text-sm font-black text-slate-800 dark:text-white">
                                 {currentLiveData.price.toLocaleString("ja-JP")} <span className="text-[10px] font-bold">円</span>
                               </span>
                               <span className={cn(
                                 "text-[10px] font-bold",
                                 currentLiveData.change >= 0 ? "text-emerald-500" : "text-rose-500"
                               )}>
                                 {currentLiveData.change >= 0 ? "+" : ""}{currentLiveData.change.toLocaleString("ja-JP")} ({currentLiveData.changePercent.toFixed(2)}%)
                               </span>
                             </div>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Cap</span>
                          <span className="text-xl font-black">
                             {currentLiveData?.marketCap 
                               ? (currentLiveData.marketCap / 1000000000000).toFixed(1) 
                               : selectedCompany.marketCap}
                             <span className="text-xs ml-1">兆円</span>
                          </span>
                        </div>
                      </div>

                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed border-l-4 border-indigo-500/30 pl-4 py-1 italic">
                        「{selectedCompany.description}」
                      </p>

                      <CompanyPerformanceChart company={selectedCompany} />

                      <div className="grid grid-cols-2 gap-4 pt-4">
                         <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10">
                            <span className="block text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-1">直近売上成長率</span>
                            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">+{( (selectedCompany.revenue[3] - selectedCompany.revenue[2]) / selectedCompany.revenue[2] * 100).toFixed(1)}%</span>
                         </div>
                         <div className="p-4 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10">
                            <span className="block text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase mb-1">営業利益率</span>
                            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{(selectedCompany.profit[3] / selectedCompany.revenue[3] * 100).toFixed(1)}%</span>
                         </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
