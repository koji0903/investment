"use client";

import React, { useSyncExternalStore } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CompanyInfo } from "@/types/market";

interface CompanyPerformanceChartProps {
  company: CompanyInfo;
}

const emptySubscribe = () => () => {};

export const CompanyPerformanceChart: React.FC<CompanyPerformanceChartProps> = ({ company }) => {
  const hasMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const data = company.revenue.map((rev, i) => ({
    year: `${new Date().getFullYear() - (company.revenue.length - 1 - i)}年度`,
    revenue: rev,
    profit: company.profit[i] || 0,
  }));

  return (
    <div className="w-full h-48 sm:h-64 mt-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/50 overflow-hidden">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">業績推移 (兆円)</h4>
      {!hasMounted ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 font-medium">読み込み中...</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
            <XAxis 
              dataKey="year" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fontWeight: 700, fill: "#94A3B8" }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fontWeight: 700, fill: "#94A3B8" }} 
            />
            <Tooltip 
              cursor={{ fill: "rgba(226, 232, 240, 0.4)" }}
              contentStyle={{ 
                backgroundColor: "rgba(15, 23, 42, 0.9)", 
                border: "none", 
                borderRadius: "12px",
                color: "#fff",
                fontSize: "10px",
                fontWeight: 900
              }}
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle" 
              wrapperStyle={{ fontSize: "9px", fontWeight: 900, paddingBottom: "10px" }}
            />
            <Bar 
              name="売上高" 
              dataKey="revenue" 
              fill="#6366f1" 
              radius={[4, 4, 0, 0]} 
              barSize={16}
            />
            <Bar 
              name="営業利益" 
              dataKey="profit" 
              fill="#10b981" 
              radius={[4, 4, 0, 0]} 
              barSize={16}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
