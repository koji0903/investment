"use client";

import React from "react";
import { AssetCalculated } from "@/types";
import { AssetCard } from "./AssetCard";
import { Landmark, Building2, Globe, Banknote, Coins, LineChart, ChevronRight } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AssetCategoryGroupProps {
  category: string;
  assets: AssetCalculated[];
}

const CATEGORY_INFO: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  "銀行": { label: "銀行・預金", icon: Landmark, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  "日本株": { label: "日本株", icon: Building2, color: "text-red-500", bg: "bg-red-500/10" },
  "外国株": { label: "外国株", icon: Globe, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  "投資信託": { label: "投資信託", icon: Banknote, color: "text-amber-500", bg: "bg-amber-500/10" },
  "仮想通貨": { label: "仮想通貨", icon: Coins, color: "text-purple-500", bg: "bg-purple-500/10" },
  "FX": { label: "FX", icon: LineChart, color: "text-blue-500", bg: "bg-blue-500/10" },
};

export const AssetCategoryGroup = ({ category, assets }: AssetCategoryGroupProps) => {
  const info = CATEGORY_INFO[category] || { label: category, icon: Building2, color: "text-slate-500", bg: "bg-slate-500/10" };
  const Icon = info.icon;
  
  const totalValue = assets.reduce((sum, a) => sum + a.evaluatedValue, 0);
  const totalProfit = assets.reduce((sum, a) => sum + a.profitAndLoss, 0);
  const profitPercentage = assets.reduce((sum, a) => sum + (a.averageCost * a.quantity), 0) > 0 
    ? (totalProfit / assets.reduce((sum, a) => sum + (a.averageCost * a.quantity), 0)) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-2xl shadow-sm", info.bg, info.color)}>
            <Icon size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              {info.label}
              <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                {assets.length}銘柄
              </span>
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {formatCurrency(totalValue)}
              </span>
              <span className={cn(
                "text-sm font-bold flex items-center gap-1",
                totalProfit >= 0 ? "text-emerald-500" : "text-rose-500"
              )}>
                {totalProfit >= 0 ? "+" : ""}{formatCurrency(totalProfit)} 
                ({totalProfit >= 0 ? "+" : ""}{profitPercentage.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {assets.map((asset) => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </div>
    </div>
  );
};
