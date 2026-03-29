"use client";

import React, { useMemo } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { generateTrendData } from "@/lib/chartUtils";

interface AssetPriceChartProps {
  assetSymbol: string;
  basePrice: number;
}

export const AssetPriceChart = ({ assetSymbol, basePrice }: AssetPriceChartProps) => {
  // 実際はAPIから取得するが、ここではデモ用の推移データを生成
  const data = useMemo(() => generateTrendData(basePrice, 30), [basePrice]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-3">
          <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
          価格推移 (30日間)
        </h3>
        <div className="flex gap-2">
          {["1D", "1W", "1M", "3M", "1Y"].map((range) => (
            <button 
              key={range}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-black transition-all",
                range === "1M" 
                  ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" 
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[400px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              hide 
            />
            <YAxis 
              hide 
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '16px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                padding: '12px'
              }}
              formatter={(value: any) => [formatCurrency(Number(value)), "価格"]}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#6366f1" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorValue)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// cn import is missing, let's add it
import { cn } from "@/lib/utils";
