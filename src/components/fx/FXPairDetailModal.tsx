"use client";

import React from "react";
import { FXJudgment } from "@/types/fx";
import { 
  SignalBadge, 
  ConfidenceIndicator, 
  HoldingStyleBadge 
} from "./FXUIComponents";
import { X, Info, TrendingUp, TrendingDown, Target, Zap, Activity, Clock, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FXPairDetailModalProps {
  judgment: FXJudgment | null;
  onClose: () => void;
}

export const FXPairDetailModal: React.FC<FXPairDetailModalProps> = ({ judgment, onClose }) => {
  if (!judgment) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 p-6 md:p-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                  <Activity size={24} />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">{judgment.pairCode} 分析詳細</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Investment Judgment Detail</p>
                </div>
             </div>
             <button 
                onClick={onClose}
                className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
             >
                <X size={20} className="text-slate-400" />
             </button>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {/* Overview Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[24px] border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">現在の判定</p>
                <div className="flex items-center justify-between">
                  <SignalBadge label={judgment.signalLabel} />
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400">総合スコア</p>
                    <p className={cn("text-2xl font-black tabular-nums", 
                      judgment.totalScore > 0 ? "text-emerald-500" : judgment.totalScore < 0 ? "text-rose-500" : "text-slate-400"
                    )}>
                      {judgment.totalScore > 0 ? "+" : ""}{judgment.totalScore}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[24px] border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">保有シミュレーション</p>
                <div className="flex items-center justify-between">
                  <HoldingStyleBadge style={judgment.holdingStyle} />
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400">信頼度</p>
                    <ConfidenceIndicator level={judgment.confidence} />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/50 dark:from-indigo-500/5 dark:to-blue-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-[28px] p-6 relative overflow-hidden">
               <div className="absolute right-0 top-0 opacity-[0.05]">
                 <Zap size={120} className="text-indigo-500" />
               </div>
               <div className="flex gap-4 relative z-10">
                 <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm text-indigo-500">
                   <Info size={20} />
                 </div>
                 <div className="space-y-1 flex-1">
                   <p className="text-sm font-black text-slate-800 dark:text-white">AI 総合コメント</p>
                   <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                     {judgment.summaryComment}
                   </p>
                 </div>
               </div>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Technical Analysis */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-500" />
                  テクニカル分析 ({judgment.technicalScore})
                </h3>
                <ul className="space-y-2">
                  {judgment.technicalReasons.map((reason, i) => (
                    <li key={i} className="flex gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-emerald-50/30 dark:bg-emerald-500/5 p-2 rounded-lg border border-emerald-100/50 dark:border-emerald-500/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Fundamental Analysis */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Target size={16} className="text-blue-500" />
                  ファンダメンタル分析 ({judgment.fundamentalScore})
                </h3>
                <ul className="space-y-2">
                  {judgment.fundamentalReasons.map((reason, i) => (
                    <li key={i} className="flex gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-blue-50/30 dark:bg-blue-500/5 p-2 rounded-lg border border-blue-100/50 dark:border-blue-500/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Swap & Status */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-800 space-y-6">
               <h3 className="text-sm font-black text-slate-800 dark:text-white">スワップ情勢・保有コスト</h3>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase">買いスワップ</p>
                    <p className={cn("text-lg font-black tabular-nums", judgment.buySwap > 0 ? "text-emerald-500" : "text-rose-500")}>
                      {judgment.buySwap > 0 ? "+" : ""}{judgment.buySwap}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase">売りスワップ</p>
                    <p className={cn("text-lg font-black tabular-nums", judgment.sellSwap > 0 ? "text-emerald-500" : "text-rose-500")}>
                      {judgment.sellSwap > 0 ? "+" : ""}{judgment.sellSwap}
                    </p>
                  </div>
                  <div className="hidden sm:block space-y-1 col-span-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase">最終更新時刻</p>
                    <div className="flex items-center gap-1.5 text-slate-500">
                       <Clock size={14} />
                       <span className="text-xs font-bold tabular-nums">
                         {new Date(judgment.updatedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                  </div>
               </div>
               <p className="text-xs font-bold text-slate-500 italic bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                 {judgment.swapComment}
               </p>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-4 p-5 bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 rounded-[24px]">
               <AlertCircle size={20} className="text-rose-500 shrink-0" />
               <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 leading-relaxed">
                 【免責事項】本判定エンジンは提供データに基づくAIによる分析であり、将来の投資成果を保証するものではありません。外国為替取引は元本保証のないリスクを伴う取引であり、最終的な投資判断はご自身の責任で行ってください。
               </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
