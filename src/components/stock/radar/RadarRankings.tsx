"use client";

import { RadarResult } from "@/types/radar";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface RadarRankingsProps {
  rankings?: { total: RadarResult[]; growth: RadarResult[]; value: RadarResult[]; dividend: RadarResult[]; trend: RadarResult[]; };
}

export const RadarRankings: React.FC<RadarRankingsProps> = ({ rankings }) => {
  const [activeTab, setActiveTab] = useState<keyof NonNullable<RadarRankingsProps['rankings']>>("total");
  if (!rankings) return null;
  const tabs: { id: keyof typeof rankings; label: string }[] = [
    { id: "total", label: "総合評価" }, 
    { id: "growth", label: "成長性" }, 
    { id: "value", label: "割安性" }, 
    { id: "dividend", label: "配当利回り" }, 
    { id: "trend", label: "モメンタム" },
  ];
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="flex flex-wrap items-center gap-2 p-6 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
        {tabs.map((tab) => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={cn(
              "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", 
              activeTab === tab.id 
                ? "bg-slate-900 text-white shadow-lg shadow-black/20" 
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left bg-slate-50/20 dark:bg-slate-800/20">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Rank</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Stock</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 text-right">Score</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 text-right">Metrics</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rankings[activeTab].map((stk, idx) => (
              <tr key={stk.ticker} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-8 py-6">
                   <span className={cn(
                     "flex items-center justify-center w-8 h-8 rounded-full text-xs font-black",
                     idx === 0 ? "bg-amber-100 text-amber-600" : idx === 1 ? "bg-slate-100 text-slate-600" : idx === 2 ? "bg-orange-100 text-orange-600" : "text-slate-400"
                   )}>
                     {idx + 1}
                   </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-1 rounded shadow-sm">{stk.ticker}</span>
                    <div>
                      <div className="text-sm font-black text-slate-800 dark:text-white leading-tight">{stk.companyName}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{stk.sector}</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border",
                    stk.totalScore > 50 ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-indigo-50 border-indigo-100 text-indigo-600"
                  )}>
                    {stk.totalScore > 0 ? "+" : ""}{stk.totalScore.toFixed(0)}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                   <div className="text-xs font-black text-slate-700 dark:text-slate-300">
                     PER {stk.per.toFixed(1)} / PBR {stk.pbr.toFixed(1)}
                   </div>
                   <div className="text-[10px] font-bold text-slate-400 mt-1">
                     Yield {stk.dividendYield.toFixed(2)}%
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
