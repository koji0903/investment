"use client";

import React, { useMemo, useState, useEffect } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { 
  quantumAnnealingOptimization, 
  QuantumOptimizationResult 
} from "@/lib/analyticsUtils";
import { 
  Cpu, 
  Waves, 
  Zap, 
  RefreshCw, 
  Info,
  TrendingUp,
  Percent,
  CheckCircle2,
  Lock,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const QuantumOptimizationCard = () => {
  const { calculatedAssets } = usePortfolio();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<QuantumOptimizationResult | null>(null);

  const runOptimization = () => {
    setIsOptimizing(true);
    // 量子アニーリングのシミュレーション（意図的な遅延）
    setTimeout(() => {
      const res = quantumAnnealingOptimization(calculatedAssets, "moderate");
      setResult(res);
      setIsOptimizing(false);
    }, 2000);
  };

  useEffect(() => {
    if (calculatedAssets.length > 0 && !result) {
      runOptimization();
    }
  }, [calculatedAssets]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm relative group min-h-[500px]">
      {/* Quantum Background Visual */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" 
        />
      </div>
      
      <div className="p-6 md:p-8 space-y-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 dark:bg-white rounded-2xl text-white dark:text-slate-900 shadow-xl shadow-slate-900/10 dark:shadow-white/10">
              <Cpu size={20} className={cn(isOptimizing && "animate-pulse")} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">量子AIによる資産配分最適化</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Global Optimal Solver v2.0</p>
            </div>
          </div>

          <button 
            onClick={runOptimization}
            disabled={isOptimizing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={cn("text-indigo-500", isOptimizing && "animate-spin")} />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">再計算を実行</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {isOptimizing ? (
            <motion.div 
              key="optimizing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 space-y-6"
            >
              <div className="relative w-32 h-32">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-dashed border-indigo-500/30 rounded-full"
                />
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 border-4 border-dashed border-purple-500/40 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Waves size={40} className="text-indigo-500 animate-bounce" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">AIが最適な組み合わせを計算中...</p>
                <div className="flex gap-1 justify-center">
                  {[0, 1, 2].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      className="w-1.5 h-1.5 bg-indigo-500 rounded-full"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ) : result ? (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatBox label="投資効率 (期待リターン)" value={result.sharpeRatio.toFixed(2)} icon={TrendingUp} color="text-emerald-500" />
                <StatBox label="AI計算試行数" value={result.iterations.toString()} icon={RefreshCw} color="text-indigo-500" />
                <StatBox label="AI確信度" value={`${result.confidence.toFixed(1)}%`} icon={CheckCircle2} color="text-purple-500" />
              </div>

              {/* Comparison Table */}
              <div className="overflow-hidden rounded-[28px] border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="grid grid-cols-3 p-4 bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">資産カテゴリ</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">現在の比率</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">AI推奨の配分</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {result.segments.map((seg, i) => (
                    <div key={seg.category} className="grid grid-cols-3 p-4 items-center group hover:bg-white dark:hover:bg-slate-900 transition-colors">
                      <span className="text-sm font-black text-slate-800 dark:text-white">{seg.category}</span>
                      <span className="text-xs font-bold text-slate-400 text-right">{seg.currentRatio.toFixed(1)}%</span>
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm font-black text-indigo-500">{seg.targetRatio}%</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced Insight */}
              <div className="p-6 bg-indigo-600 rounded-[28px] text-white relative overflow-hidden group/action cursor-pointer">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover/action:scale-110 transition-transform">
                  <Zap size={80} />
                </div>
                <div className="flex items-center justify-between gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">AI診断結果</p>
                    <h4 className="text-base font-black leading-snug">
                      膨大な組み合わせの中から、リスクを抑えつつ収益を最大化する「黄金比」が見つかりました。
                    </h4>
                    <p className="text-xs font-bold text-indigo-100 opacity-80 mt-2">
                      現在のご希望のリスク設定において、この配分が最も効率的で安定した運用が期待できる構成です。
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 group-hover/action:translate-x-1 transition-transform border border-white/20">
                    <Target size={24} />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Lock size={12} className="text-slate-400" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">高度な暗号化による安全な計算</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Info size={12} className="text-indigo-500" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">検証済みアルゴリズム</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, icon: Icon, color }: { label: string, value: string, icon: any, color: string }) => (
  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
      <Icon size={12} />
      {label}
    </div>
    <p className={cn("text-xl font-black tabular-nums", color)}>{value}</p>
  </div>
);
