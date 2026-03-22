"use client";

import React, { useState } from "react";
import { Search, Filter, ArrowUpDown, RefreshCw, Star, BarChart, Zap, Building, TrendingUp, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockFilterSortProps {
  onFilterChange: (filters: any) => void;
  onSortChange: (sortConfig: any) => void;
  onRefresh: () => void;
  loading: boolean;
}

export const StockFilterSort: React.FC<StockFilterSortProps> = ({ 
  onFilterChange, 
  onSortChange, 
  onRefresh,
  loading 
}) => {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortKey, setSortKey] = useState("totalScore");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSearch = (val: string) => {
    setSearch(val);
    onFilterChange({ search: val, label: activeFilter });
  };

  const handleFilter = (label: string) => {
    setActiveFilter(label);
    onFilterChange({ search, label });
  };

  const handleSort = (key: string) => {
    const newOrder = sortKey === key && sortOrder === "desc" ? "asc" : "desc";
    setSortKey(key);
    setSortOrder(newOrder);
    onSortChange({ key, order: newOrder });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="銘柄名・コードを検索"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <button 
             onClick={onRefresh}
             disabled={loading}
             className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-slate-900/10"
          >
             <RefreshCw size={14} className={cn(loading && "animate-spin")} />
             データ再同期
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterButton active={activeFilter === "all"} onClick={() => handleFilter("all")} label="すべて"><Star size={12} /></FilterButton>
        <FilterButton active={activeFilter === "買い優勢"} onClick={() => handleFilter("買い優勢")} label="買い優勢"><TrendingUp size={12} /></FilterButton>
        <FilterButton active={activeFilter === "high_dividend"} onClick={() => handleFilter("high_dividend")} label="高配当銘柄"><Coins size={12} /></FilterButton>
        <FilterButton active={activeFilter === "undervalued"} onClick={() => handleFilter("undervalued")} label="割安株"><BarChart size={12} /></FilterButton>
        <FilterButton active={activeFilter === "growth"} onClick={() => handleFilter("growth")} label="成長株"><Zap size={12} /></FilterButton>
      </div>
    </div>
  );
};

const FilterButton = ({ active, onClick, label, children }: { active: boolean, onClick: () => void, label: string, children: React.ReactNode }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all border",
      active 
        ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900 shadow-md scale-105" 
        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700"
    )}
  >
    {children}
    {label}
  </button>
);
