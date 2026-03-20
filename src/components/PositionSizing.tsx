"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePortfolio } from "@/context/PortfolioContext";
import { subscribePositionSizing, updatePositionSizing } from "@/lib/db";
import { calculatePositionSize } from "@/lib/positionSizingUtils";
import { useNotify } from "@/context/NotificationContext";
import { 
  Scale, 
  Settings2, 
  Calculator, 
  AlertCircle, 
  ArrowRight,
  Wallet,
  Target,
  Info
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { PositionSizingSettings } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export const PositionSizing = () => {
  const { user, isDemo } = useAuth();
  const { totalAssetsValue } = usePortfolio();
  const { notify } = useNotify();
  const [settings, setSettings] = useState<PositionSizingSettings | null>(null);
  
  // シミュレーション用
  const [entryPrice, setEntryPrice] = useState<number>(1500);
  const [stopLossPrice, setStopLossPrice] = useState<number>(1400);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribePositionSizing(user.uid, (data) => {
      setSettings(data);
    });
    return () => unsubscribe();
  }, [user]);

  const result = useMemo(() => {
    if (!settings) return null;
    return calculatePositionSize(
      totalAssetsValue,
      settings.riskPerTradePct,
      settings.maxCapitalPerTradePct,
      entryPrice,
      stopLossPrice
    );
  }, [totalAssetsValue, settings, entryPrice, stopLossPrice]);

  const handleUpdate = async (update: Partial<PositionSizingSettings>) => {
    if (isDemo || !user || !settings) return;
    try {
      await updatePositionSizing(user.uid, update);
      notify({
        type: "success",
        title: "設定を更新しました",
        message: "資金管理プランを保存しました。",
      });
    } catch (error) {
      notify({
        type: "error",
        title: "保存失敗",
        message: "設定の保存に失敗しました。",
      });
    }
  };

  if (!settings) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-sm overflow-hidden mt-8">
      <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <Scale size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white">ポジションサイズ管理</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Capital & Risk Allocation</p>
          </div>
        </div>
        <button
          onClick={() => handleUpdate({ enabled: !settings.enabled })}
          className={cn(
            "w-12 h-6 rounded-full relative transition-colors",
            settings.enabled ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"
          )}
        >
          <div className={cn(
            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
            settings.enabled ? "left-7" : "left-1"
          )} />
        </button>
      </div>

      <div className="p-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* 設定セクション */}
          <div className="space-y-8">
            <div className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-white">
              <Settings2 size={16} className="text-indigo-500" />
              資金管理ルールの設定
            </div>
            
            <div className="space-y-10">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet size={14} className="text-slate-400" />
                    <label className="text-xs font-black text-slate-800 dark:text-white">1トレードの最大投入資金</label>
                  </div>
                  <span className="text-sm font-black text-indigo-500">{settings.maxCapitalPerTradePct}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={settings.maxCapitalPerTradePct}
                  onChange={(e) => handleUpdate({ maxCapitalPerTradePct: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
                <p className="text-[10px] font-bold text-slate-400">
                  口座残高の何%までを1銘柄に投入して良いか
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target size={14} className="text-slate-400" />
                    <label className="text-xs font-black text-slate-800 dark:text-white">許容リスク率</label>
                  </div>
                  <span className="text-sm font-black text-indigo-500">{settings.riskPerTradePct}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={settings.riskPerTradePct}
                  onChange={(e) => handleUpdate({ riskPerTradePct: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
                <p className="text-[10px] font-bold text-slate-400">
                  1回のトレードで許容する最大損失（損切り額）の比率
                </p>
              </div>
            </div>
          </div>

          {/* シミュレーターセクション */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-white">
              <Calculator size={16} className="text-indigo-500" />
              最適数量シミュレーター
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase">Entry Price</p>
                <input
                  type="number"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-black text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase">Stop Loss</p>
                <input
                  type="number"
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-black text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-500">推奨注文数量</span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-indigo-500">{result.quantity}</span>
                      <span className="text-xs font-black text-slate-400 ml-1">UNITS</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-400 uppercase">Risk Amount</span>
                      <span className="text-rose-500">{formatCurrency(result.riskAmount)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-400 uppercase">Required Capital</span>
                      <span className="text-slate-700 dark:text-slate-300">{formatCurrency(result.capitalRequired)}</span>
                    </div>
                  </div>

                  {result.isLimitedByCapital && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl flex items-center gap-2 mt-4">
                      <AlertCircle size={14} className="text-amber-500 shrink-0" />
                      <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                        投入資金制限により、数量が制限されています。
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-start gap-4 p-5 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-3xl border border-indigo-100 dark:border-indigo-500/20">
          <Info className="text-indigo-500 mt-0.5 shrink-0" size={18} />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
            ポジションサイジングは、長期的に生き残るために最も重要な設定です。
            口座残高（{formatCurrency(totalAssetsValue)}）に基づき、
            1回の失敗で失う額を{settings.riskPerTradePct}%以内に抑えるようシステムが計算をサポートします。
          </p>
        </div>
      </div>
    </div>
  );
};
