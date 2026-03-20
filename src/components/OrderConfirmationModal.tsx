"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, X, Zap, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActionTrigger } from "@/lib/analyticsUtils";

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (autoExecuteNextTime: boolean) => Promise<void>;
  triggerContext: ActionTrigger | null;
}

export const OrderConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  triggerContext
}: OrderConfirmationModalProps) => {
  const [autoExecute, setAutoExecute] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  if (!triggerContext) return null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm(autoExecute);
      // Wait a moment so the success state is visible before closing
      setTimeout(() => {
        setIsProcessing(false);
        onClose();
      }, 800);
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
    }
  };

  // 買い、売りなどのアクションの日本語表記
  const actionLabel = {
    Buy: "買い注文 (購入)",
    Sell: "売り注文 (売却)",
    Hold: "保有継続 (様子見)",
    Rebalance: "資産の組み換え",
    Review: "状況の確認"
  }[triggerContext.action as string] || triggerContext.action;
  
  // テーマカラー
  const isDanger = triggerContext.action === "Sell" || triggerContext.type === "warning";
  const colorClass = isDanger ? "text-rose-500 bg-rose-50 border-rose-200" : "text-indigo-500 bg-indigo-50 border-indigo-200";
  const btnClass = isDanger ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20";
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className={cn("p-6 flex items-start justify-between border-b", isDanger ? "border-rose-100 bg-rose-50/50 dark:bg-rose-900/10 dark:border-rose-900/20" : "border-indigo-100 bg-indigo-50/50 dark:bg-indigo-900/10 dark:border-indigo-900/20")}>
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl", isDanger ? "bg-rose-100 text-rose-500" : "bg-indigo-100 text-indigo-500")}>
                  {isDanger ? <AlertTriangle size={24} /> : <Zap size={24} />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-white">AI ご注文確認</h2>
                  <p className="text-xs font-bold text-slate-500 mt-1">
                    AIの提案に基づくワンクリック発注
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                disabled={isProcessing}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                  以下の内容で発注してよろしいでしょうか？
                </h3>
              </div>

              {/* Order Details Card */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-[24px] border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-bold text-slate-500">対象銘柄</span>
                  <span className="text-base font-black text-slate-800 dark:text-white">{triggerContext.assetName}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-bold text-slate-500">注文内容</span>
                  <span className={cn("text-base font-black flex items-center gap-2", isDanger ? "text-rose-500" : "text-indigo-500")}>
                    {actionLabel} <ArrowRight size={14} />
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500">AIの判断理由</span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 max-w-[200px] text-right">
                    {triggerContext.reason}
                  </span>
                </div>
              </div>

              {/* Auto Execution Option */}
              <label className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input 
                    type="checkbox" 
                    checked={autoExecute}
                    onChange={(e) => setAutoExecute(e.target.checked)}
                    className="w-5 h-5 appearance-none border-2 border-slate-300 dark:border-slate-600 rounded-md checked:bg-indigo-500 checked:border-transparent transition-colors"
                  />
                  {autoExecute && <CheckCircle2 size={14} className="absolute text-white pointer-events-none" />}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200">次回から同じ条件で【自動実行】する</p>
                  <p className="text-[11px] font-bold text-slate-500 mt-1">※設定は「ツール・設定」からいつでも変更できます</p>
                </div>
              </label>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={onClose}
                  disabled={isProcessing}
                  className="px-6 py-4 rounded-xl text-sm font-black text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors w-full sm:w-auto text-center"
                >
                  キャンセル
                </button>
                <button 
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white text-sm font-black transition-all shadow-lg",
                    btnClass,
                    isProcessing && "opacity-80 cursor-wait"
                  )}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      発注処理中...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      承認して発注する
                    </>
                  )}
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
