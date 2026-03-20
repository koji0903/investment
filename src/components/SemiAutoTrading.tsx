"use client";

import React, { useState, useEffect } from "react";
import { TradeProposal } from "@/types";
import { subscribeTradeProposals, executeTradeProposal, rejectTradeProposal, addDemoProposal } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, X, TrendingUp, AlertCircle, ArrowRight, Loader2, Play } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { AlertToast } from "./AlertToast";

export function SemiAutoTrading() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<TradeProposal[]>([]);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeTradeProposals(user.uid, (data) => {
      setProposals(data);
    });
    return () => unsubscribe();
  }, [user]);

  const handleExecute = async (proposal: TradeProposal) => {
    if (!user) return;
    setExecutingId(proposal.id);
    try {
      await executeTradeProposal(user.uid, proposal);
      setMessage({ text: `${proposal.assetName} の発注を完了しました。`, type: 'success' });
    } catch (error) {
      console.error(error);
      setMessage({ text: "発注に失敗しました。もう一度お試しください。", type: 'error' });
    } finally {
      setExecutingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleReject = async (proposalId: string) => {
    if (!user) return;
    try {
      await rejectTradeProposal(user.uid, proposalId);
    } catch (error) {
      console.error(error);
    }
  };

  const generateDemo = async () => {
    if (!user) return;
    await addDemoProposal(user.uid);
  };

  if (proposals.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="text-indigo-500" size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">現在、新しいAI提案はありません</h3>
        <p className="text-sm font-bold text-slate-500 mb-6">市場の動きを監視し、最適なエントリーポイントを見つけ次第お知らせします。</p>
        <button 
          onClick={generateDemo}
          className="flex items-center gap-2 mx-auto bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black px-6 py-2 rounded-full transition-all active:scale-95 text-xs"
        >
          <Play size={14} />
          デモ提案を生成
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
          AI投資提案（半自動売買）
        </h2>
        <span className="bg-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse">
          {proposals.length} 件の提案
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="popLayout">
          {proposals.map((proposal) => (
            <motion.div
              key={proposal.id}
              layout
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -50 }}
              className="bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group"
            >
              {/* 背景の装飾 */}
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500 pointer-events-none">
                <Sparkles className="w-48 h-48 rotate-12" />
              </div>

              <div className="p-8 md:p-10 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-16 h-16 rounded-[24px] flex items-center justify-center text-white shadow-lg",
                      proposal.type === 'buy' ? "bg-emerald-500 shadow-emerald-500/20" : "bg-rose-500 shadow-rose-500/20"
                    )}>
                      {proposal.type === 'buy' ? <TrendingUp size={32} /> : <ArrowRight size={32} className="rotate-90" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                          proposal.type === 'buy' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                        )}>
                          {proposal.type === 'buy' ? '買い推奨' : '売り推奨'}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {proposal.assetSymbol}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                        {proposal.assetName}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">数量</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white">{proposal.quantity}</p>
                    </div>
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">予想価格</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums">{formatCurrency(proposal.price)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3 bg-indigo-50/50 dark:bg-indigo-500/5 p-5 rounded-2xl border border-indigo-100/50 dark:border-indigo-500/10">
                    <Sparkles className="text-indigo-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed italic">
                      「{proposal.reason}」
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button
                    onClick={() => handleExecute(proposal)}
                    disabled={executingId === proposal.id}
                    className="w-full sm:flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 relative overflow-hidden"
                  >
                    {executingId === proposal.id ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        <Check size={20} />
                        <span>承認して今すぐ発注</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleReject(proposal.id)}
                    className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black px-8 py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <X size={20} />
                    <span>見送る</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 border backdrop-blur-md",
              message.type === 'success' 
                ? "bg-emerald-500/90 text-white border-emerald-400" 
                : "bg-rose-500/90 text-white border-rose-400"
            )}
          >
            {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            <span className="font-black tracking-tight">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
