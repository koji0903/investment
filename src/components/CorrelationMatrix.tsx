"use client";

import React, { useMemo } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { generateDemoCorrelations, CorrelationResult } from "@/lib/analyticsUtils";
import { cn } from "@/lib/utils";
import { Grid3X3, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export const CorrelationMatrix = () => {
  const { calculatedAssets } = usePortfolio();
  
  const correlations = useMemo(() => {
    return generateDemoCorrelations(calculatedAssets);
  }, [calculatedAssets]);

  const uniqueAssets = useMemo(() => {
    const assets = [];
    const seen = new Set();
    for (const c of correlations) {
      if (!seen.has(c.assetId1)) {
        seen.add(c.assetId1);
        assets.push({ id: c.assetId1, name: c.assetName1 });
      }
    }
    return assets;
  }, [correlations]);

  const getCellColor = (val: number) => {
    if (val >= 0.8) return "bg-rose-500/80 text-white";
    if (val >= 0.5) return "bg-rose-300 dark:bg-rose-900/40 text-rose-900 dark:text-rose-100";
    if (val <= -0.5) return "bg-emerald-500/80 text-white";
    if (val <= -0.2) return "bg-emerald-300 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100";
    return "bg-slate-100 dark:bg-slate-800 text-slate-400";
  };

  const getCorrelationAt = (id1: string, id2: string) => {
    return correlations.find(c => c.assetId1 === id1 && c.assetId2 === id2)?.correlation ?? 0;
  };

  if (calculatedAssets.length < 2) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <Grid3X3 size={32} />
        </div>
        <p className="text-slate-500 font-bold">相関分析を行うには、2つ以上の資産が必要です</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 md:p-8 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
          <Grid3X3 size={20} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">資産相関マトリクス</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset Correlation</p>
        </div>
      </div>

      <div className="overflow-x-auto pb-4 no-scrollbar">
        <div 
          className="grid gap-2 min-w-[600px]"
          style={{ gridTemplateColumns: `120px repeat(${uniqueAssets.length}, 1fr)` }}
        >
          {/* Header row */}
          <div className="h-10" />
          {uniqueAssets.map(a => (
            <div key={a.id} className="h-10 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-tighter text-center px-1">
              {a.name}
            </div>
          ))}

          {/* Data rows */}
          {uniqueAssets.map(a1 => (
            <React.Fragment key={a1.id}>
              <div className="h-16 flex items-center pr-4 text-xs font-black text-slate-600 dark:text-slate-300 truncate">
                {a1.name}
              </div>
              {uniqueAssets.map(a2 => {
                const val = getCorrelationAt(a1.id, a2.id);
                return (
                  <motion.div 
                    key={`${a1.id}-${a2.id}`}
                    whileHover={{ scale: 1.05, zIndex: 10 }}
                    className={cn(
                      "h-16 rounded-xl flex flex-col items-center justify-center font-black transition-all cursor-help",
                      getCellColor(val)
                    )}
                    title={`${a1.name} と ${a2.name} の相関: ${val}`}
                  >
                    <span className="text-sm tabular-nums">{val}</span>
                  </motion.div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-[28px] border border-slate-100 dark:border-slate-800/60">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Info size={14} className="text-indigo-500" />
            相関の見方
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-bold">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="text-slate-600 dark:text-slate-300">1.0に近い（正の相関）: 同方向に動く</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold">
              <div className="w-3 h-3 rounded-full bg-slate-100 dark:bg-slate-800" />
              <span className="text-slate-600 dark:text-slate-300">0に近い（無相関）: 独立して動く（分散に最適）</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold">
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-slate-600 dark:text-slate-300">-1.0に近い（負の相関）: 逆方向に動く</span>
            </div>
          </div>
        </div>

        <div className="p-5 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-[28px] border border-indigo-100 dark:border-indigo-500/10">
          <h4 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <CheckCircle2 size={14} />
            AIアドバイス
          </h4>
          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            相関係数が0.8を超えるアセット対は、市場急落時に同時に下落するリスクが高いです。
            理想的な分散投資では、相関が0に近いアセット、または負の相関を持つアセットを組み合わせることで、
            ポートフォリオ全体のボラティリティを効果的に抑制できます。
          </p>
        </div>
      </div>
    </div>
  );
};
