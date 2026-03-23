"use client";

import React, { useMemo, useEffect, useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { getCompositionData, CompositionData } from "@/lib/chartUtils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const PortfolioComposition = () => {
  const { calculatedAssets } = usePortfolio();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const data = getCompositionData(calculatedAssets);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as CompositionData;
      const percent = total > 0 ? ((data.value / total) * 100).toFixed(1) : "0";
      return (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-lg">
          <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></span>
            {data.name}
          </p>
          <p className="text-slate-600 dark:text-slate-400 font-medium mt-1">
            {formatCurrency(data.value)} <span className="text-slate-400 text-sm ml-1">({percent}%)</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-[400px] w-full">
      {!hasMounted || data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 font-medium">
          {hasMounted ? "データがありません" : "読み込み中..."}
        </div>
      ) : (
        <div className="flex-1 w-full relative">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                paddingAngle={6}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    className="hover:opacity-80 transition-opacity duration-300 outline-none" 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              <Legend 
                verticalAlign="bottom" 
                height={48}
                iconType="circle"
                iconSize={10}
                formatter={(value) => <span className="text-slate-600 dark:text-slate-400 font-bold ml-2 text-[10px] md:text-xs uppercase tracking-wider">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-[48px]">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Portfolio</span>
            <span className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
