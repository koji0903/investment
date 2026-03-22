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
    { id: "total", label: "総合" }, { id: "growth", label: "グロース" }, { id: "value", label: "割安" }, { id: "dividend", label: "高配当" }, { id: "trend", label: "モメンタム" },
  ];
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xl">
      <div className="flex items-center gap-1 p-4 bg-slate-50 dark:bg-slate-800 border-b">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("px-5 py-2 rounded-xl text-xs font-black transition-all", activeTab === tab.id ? "bg-slate-900 text-white" : "text-slate-400")}>{tab.label}</button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">順位</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">銘柄</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">スコア</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">PER/PBR</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rankings[activeTab].map((stk, idx) => (
              <tr key={stk.ticker} className="group hover:bg-slate-50 dark:hover:bg-slate-800">
                <td className="px-6 py-4 font-black text-slate-400">{idx + 1}</td>
                <td className="px-6 py-4"><span className="text-xs font-black bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded mr-2">{stk.ticker}</span><span className="text-sm font-black dark:text-white">{stk.companyName}</span></td>
                <td className="px-6 py-4 text-right font-black text-indigo-500">+{stk.totalScore}</td>
                <td className="px-6 py-4 text-right text-xs font-bold text-slate-500">{stk.per}倍 / {stk.pbr}倍</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
