"use client";

import React from "react";
import { PositionSizingAnalysis } from "@/types/fx";
import { motion } from "framer-motion";
import { 
  Calculator, 
  ShieldAlert,
  Wallet,
  AlertTriangle,
  Scale,
  Activity,
  Zap,
  LayoutTemplate,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FXPositionSizingBentoProps {
  sizing: PositionSizingAnalysis;
}

export const FXPositionSizingBento: React.FC<FXPositionSizingBentoProps> = ({ sizing }) => {
  const formatJPY = (val: number) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(val);

  const FactorBar = ({ label, value, icon: Icon, color }: { label: string, value: number, icon: any, color: string }) => {
    // 表示用のパーセンテージ化（0.5 = 0%, 1.15 = 100% など大まかなスケール）
    const minScale = 0.50;
    const maxScale = 1.15;
    const percent = Math.max(0, Math.min(100, ((value - minScale) / (maxScale - minScale)) * 100)); 
    const isGood = value >= 1.0;
    
    return (
      <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
        <div className="flex items-center gap-2">
          <Icon size={14} className={color} />
          <span className="font-bold text-slate-600 dark:text-slate-300 text-[11px] uppercase tracking-wider">{label}</span>
        </div>
        <div className="flex items-center gap-2 w-1/2 justify-end">
          <div className="flex-1 max-w-[60px] h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex items-center">
            <div 
              className={cn("h-full rounded-full transition-all", isGood ? "bg-emerald-500" : "bg-orange-400")}
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className={cn("font-black text-xs w-8 text-right tabular-nums", isGood ? "text-emerald-500" : "text-orange-500")}>
            x{value.toFixed(2)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {/* 1. 推奨ロットとコメント (Main) */}
      <div className={cn(
        "md:col-span-1 p-6 rounded-[32px] border shadow-xl flex flex-col justify-between relative overflow-hidden text-white transition-colors",
        sizing.finalPositionSize > 0 
          ? "bg-slate-800 dark:bg-slate-900 border-slate-700 pattern-boxes pattern-white pattern-bg-transparent pattern-size-6 pattern-opacity-10" 
          : "bg-rose-900 dark:bg-rose-950 border-rose-800 pattern-diagonal-lines pattern-white pattern-bg-transparent pattern-size-4 pattern-opacity-10"
      )}>
        <Calculator size={100} className="absolute -top-4 -right-4 opacity-10" />
        <div className="relative z-10 w-full">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2 flex items-center gap-1.5">
            <Target size={12} />
            Recommended Size
          </p>
          <div className="flex items-end gap-2 mb-6">
            <h3 className="text-4xl font-black tabular-nums tracking-tighter text-white">
              {sizing.suggestedLot.replace(" ロット", "")}
            </h3>
            {sizing.finalPositionSize > 0 && <span className="text-sm font-bold text-white/60 mb-1.5 tracking-wider">Lots</span>}
          </div>

          <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm mt-auto">
            <p className="text-[10px] font-black text-white/60 mb-1 uppercase tracking-wider">Adjustment Reason</p>
            <p className="text-xs font-bold text-white/90 leading-relaxed">
              {sizing.sizingComment}
            </p>
          </div>
        </div>
      </div>

      {/* 2. リスク管理 (Risk Management) */}
      <div className="md:col-span-1 bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-orange-50 text-orange-500">
            <Wallet size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Risk Rules</p>
            <h4 className="text-sm font-black text-slate-800 dark:text-white">リスク・資金管理</h4>
          </div>
        </div>

        <div className="space-y-4 flex-1 mt-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-black text-slate-400">基本枠リスク許容額 ({sizing.riskPercent * 100}%)</span>
            <span className="text-sm font-black text-slate-700 dark:text-slate-200 tabular-nums">{formatJPY(sizing.maxRiskAmount)}</span>
          </div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-black text-slate-400">基本計算サイズ (係数1倍)</span>
            <span className="text-sm font-black text-slate-700 dark:text-slate-200 tabular-nums">{sizing.basePositionSize.toFixed(2)} Lot</span>
          </div>
          
          <div className={cn(
            "flex items-center justify-between p-4 rounded-2xl mt-4 border",
            sizing.estimatedLossAmount > sizing.maxRiskAmount 
              ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20" 
              : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
          )}>
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldAlert size={14} className={sizing.estimatedLossAmount > sizing.maxRiskAmount ? "text-rose-500" : "text-slate-400"} />
              調整後 想定損失
            </span>
            <span className={cn(
              "text-lg font-black tabular-nums",
              sizing.estimatedLossAmount > sizing.maxRiskAmount ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-white"
            )}>
              {formatJPY(sizing.estimatedLossAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. サイズ補正要因 (Correction Factors) */}
      <div className="md:col-span-1 bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-500">
              <Activity size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Scale Factors</p>
              <h4 className="text-sm font-black text-slate-800 dark:text-white">相場構造補正</h4>
            </div>
          </div>
        </div>

        <div className="flex-1 mt-1">
          <FactorBar label="ブレイク強度" value={sizing.breakoutFactor} icon={Zap} color="text-yellow-500" />
          <FactorBar label="エネルギー蓄積" value={sizing.energyFactor} icon={Activity} color="text-emerald-500" />
          <FactorBar label="RR比" value={sizing.rrFactor} icon={Scale} color="text-blue-500" />
          <FactorBar label="だまし耐性" value={sizing.fakeFactor} icon={ShieldAlert} color="text-rose-500" />
          <FactorBar label="フェーズ進捗" value={sizing.structureFactor} icon={LayoutTemplate} color="text-indigo-500" />
        </div>

        {sizing.riskWarningMessages.length > 0 && (
          <div className="mt-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 p-3 rounded-2xl">
            {sizing.riskWarningMessages.map((msg, i) => (
              <p key={i} className="text-[10px] font-bold text-orange-600 dark:text-orange-400 flex items-start gap-1.5 mb-1.5 last:mb-0">
                <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                <span className="leading-snug">{msg}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
