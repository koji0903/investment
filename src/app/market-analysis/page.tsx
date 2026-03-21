"use client";

import React, { useState } from "react";
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
  Info
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
  Banknote
};

export default function MarketAnalysisPage() {
  const [selectedIndustryId, setSelectedIndustryId] = useState(MARKET_ANALYSIS_DATA[0].id);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const selectedIndustry = MARKET_ANALYSIS_DATA.find(i => i.id === selectedIndustryId)!;
  const selectedCompany = selectedIndustry.companies.find(c => c.id === selectedCompanyId) || selectedIndustry.companies[0];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="p-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:scale-110 transition-transform shadow-sm"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tighter gradient-text">日本市場分析・業界地図</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Japanese Market Insight & Industry Map</p>
          </div>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="銘柄・業界を検索..." 
            className="pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:border-indigo-500 transition-all text-sm font-bold w-full sm:w-64 shadow-sm"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3 space-y-2">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2 italic">Sector Selection</h2>
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
                  "w-full flex items-center justify-between p-4 rounded-3xl border-2 transition-all text-left group",
                  isActive 
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-500/20" 
                    : "bg-white dark:bg-slate-900 border-white dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2.5 rounded-2xl transition-colors",
                    isActive ? "bg-white/20" : "bg-slate-50 dark:bg-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-700"
                  )}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <span className="block font-black text-sm">{industry.name}</span>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-widest",
                      isActive ? "text-white/60" : "text-slate-400"
                    )}>{industry.id}</span>
                  </div>
                </div>
                <ChevronRight size={16} className={cn("transition-transform", isActive ? "rotate-90" : "opacity-20")} />
              </motion.button>
            );
          })}
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
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <IndustryTrendBadge trend={selectedIndustry.trend} />
                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-tighter">Industry Summary</span>
                  </div>
                  
                  <h3 className="text-3xl font-black mb-4 tracking-tight">{selectedIndustry.name}の現状</h3>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                    {selectedIndustry.overview}
                  </p>
                  
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                       <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Trend Insight</span>
                    </div>
                    <p className="text-xs font-bold leading-relaxed">{selectedIndustry.trendReason}</p>
                  </div>
                </div>

                {/* Relationship Map */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                  <h3 className="text-lg font-black mb-6 tracking-tight flex items-center gap-2">
                    <Search size={18} className="text-indigo-500" />
                    業界地図・企業相関
                  </h3>
                  <IndustryRelationshipMap analysis={selectedIndustry} />
                </div>
              </div>

              {/* Company Detail Analysis */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none min-h-full">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black tracking-tight uppercase tracking-[0.1em]">主要企業の分析</h3>
                    <div className="flex gap-1">
                      {selectedIndustry.companies.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCompanyId(c.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-[10px] font-black transition-all",
                            selectedCompany.id === c.id 
                              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 scale-105" 
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200"
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
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Cap</span>
                          <span className="text-xl font-black">{selectedCompany.marketCap}<span className="text-xs ml-1">兆円</span></span>
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
