"use client";

import React, { useMemo, useState, useEffect } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { generateTrendData } from "@/lib/chartUtils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-lg">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">{label}</p>
        <p className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export const AssetTrendChart = () => {
  const { totalAssetsValue } = usePortfolio();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  const data = useMemo(() => {
    return generateTrendData(totalAssetsValue, 30);
  }, [totalAssetsValue]);

  const minVal = data.length > 0 ? Math.min(...data.map(d => d.value)) * 0.95 : 0;
  const maxVal = data.length > 0 ? Math.max(...data.map(d => d.value)) * 1.05 : 100;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[var(--radius-card)] p-6 shadow-sm flex flex-col h-full">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100 shrink-0">
        <TrendingUp className="w-5 h-5 text-indigo-500" />
        資産推移 (過去30日)
      </h3>
      
      {!hasMounted || data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 font-medium">
          {hasMounted ? "データがありません" : "読み込み中..."}
        </div>
      ) : (
        <div className="flex-1 w-full min-h-[300px] mt-2">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-slate-200)" opacity={0.3} className="dark:stroke-slate-700" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} 
                dy={10}
                minTickGap={30}
              />
              <YAxis 
                domain={[minVal, maxVal]} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#6366f1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
