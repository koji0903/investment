"use client";

import React, { useState, useMemo } from "react";
import { Search, Filter, ArrowUpDown, RefreshCw } from "lucide-react";
import { SignalLabel, FXJudgment } from "@/types/fx";
import { cn } from "@/lib/utils";

interface FXFilterSortProps {
  onFilterChange: (filters: any) => void;
  onSortChange: (sortConfig: any) => void;
  onRefresh: () => void;
  loading: boolean;
}

export const FXFilterSort: React.FC<FXFilterSortProps> = ({ 
  onFilterChange, 
  onSortChange, 
  onRefresh,
  loading 
}) => {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<string>("totalScore");
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
            placeholder="通貨ペアを検索 (例: USD/JPY)"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
          <button 
             onClick={onRefresh}
             disabled={loading}
             className="flex items-center gap-2 px-4 py-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all disabled:opacity-50"
          >
             <RefreshCw size={14} className={cn(loading && "animate-spin")} />
             データ再生成
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterButton 
          active={activeFilter === "all"} 
          onClick={() => handleFilter("all")}
          label="すべて"
        />
        <FilterButton 
          active={activeFilter === "買い優勢"} 
          onClick={() => handleFilter("買い優勢")}
          label="買い優勢"
        />
        <FilterButton 
          active={activeFilter === "売り優勢"} 
          onClick={() => handleFilter("売り優勢")}
          label="売り優勢"
        />
        <FilterButton 
          active={activeFilter === "confidence_high"} 
          onClick={() => handleFilter("confidence_high")}
          label="信頼度：高"
        />
        <FilterButton 
          active={activeFilter === "medium_term"} 
          onClick={() => handleFilter("medium_term")}
          label="中長期保有向き"
        />
        
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2 hidden sm:block" />
        
        <div className="flex items-center gap-2">
           <SortButton 
              active={sortKey === "totalScore"} 
              onClick={() => handleSort("totalScore")}
              label="総合スコア順"
              order={sortKey === "totalScore" ? sortOrder : undefined}
           />
           <SortButton 
              active={sortKey === "currentPrice"} 
              onClick={() => handleSort("currentPrice")}
              label="価格順"
              order={sortKey === "currentPrice" ? sortOrder : undefined}
           />
        </div>
      </div>
    </div>
  );
};

const FilterButton = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "px-4 py-2 rounded-xl text-xs font-black transition-all border",
      active 
        ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900 shadow-md" 
        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700"
    )}
  >
    {label}
  </button>
);

const SortButton = ({ active, onClick, label, order }: { active: boolean, onClick: () => void, label: string, order?: "asc" | "desc" }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all",
      active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
    )}
  >
    {label}
    <ArrowUpDown size={12} className={cn("transition-transform", order === "asc" && "rotate-180")} />
  </button>
);
