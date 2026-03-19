"use client";

import { usePortfolio } from "@/context/PortfolioContext";
import { getCompositionData, CompositionData } from "@/lib/chartUtils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const PortfolioComposition = () => {
  const { calculatedAssets } = usePortfolio();
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[var(--radius-card)] p-6 shadow-sm flex flex-col h-full">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100 shrink-0">
        <PieChartIcon className="w-5 h-5 text-indigo-500" />
        ポートフォリオ比率
      </h3>
      
      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 font-medium">
          データがありません
        </div>
      ) : (
        <div className="flex-1 min-h-[300px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                formatter={(value) => <span className="text-slate-700 dark:text-slate-300 font-medium ml-1.5">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-[36px]">
            <span className="text-xs text-slate-500 font-medium">評価額合計</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{formatCurrency(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
