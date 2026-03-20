"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePortfolio } from "@/context/PortfolioContext";
import { subscribeRiskRules, updateRiskRules } from "@/lib/db";
import { checkRiskStatus, RiskStatus } from "@/lib/riskMonitor";
import { useNotify } from "@/context/NotificationContext";
import { ShieldAlert, ShieldCheck, AlertTriangle, Settings2, Info, ArrowRight, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { RiskRule } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export const RiskManagementPanel = () => {
  const { user, isDemo } = useAuth();
  const { calculatedAssets, totalAssetsValue } = usePortfolio();
  const { notify } = useNotify();
  const [rules, setRules] = useState<RiskRule | null>(null);
  
  // モック的な過去最高値 (本来はDBから取得)
  const historicalMax = totalAssetsValue * 1.05; 

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeRiskRules(user.uid, (data) => {
      setRules(data);
    });
    return () => unsubscribe();
  }, [user]);

  const riskStatus = useMemo(() => {
    if (!rules || !calculatedAssets.length) return null;
    return checkRiskStatus(calculatedAssets, totalAssetsValue, rules, historicalMax);
  }, [calculatedAssets, totalAssetsValue, rules, historicalMax]);

  const handleUpdate = async (update: Partial<RiskRule>) => {
    if (isDemo || !user || !rules) return;
    try {
      await updateRiskRules(user.uid, update);
      notify({
        type: "success",
        title: "ルールを更新しました",
        message: "リスク管理設定を保存しました。",
      });
    } catch (error) {
      notify({
        type: "error",
        title: "保存失敗",
        message: "設定の保存に失敗しました。",
      });
    }
  };

  if (!rules) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-sm overflow-hidden mt-8">
      <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-xl text-white shadow-lg",
            riskStatus?.isViolated ? "bg-rose-500 shadow-rose-500/20" : "bg-emerald-500 shadow-emerald-500/20"
          )}>
            {riskStatus?.isViolated ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white">リスク管理オートメーション</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Automated Portfolio Protection</p>
          </div>
        </div>
        <button
          onClick={() => handleUpdate({ enabled: !rules.enabled })}
          className={cn(
            "w-12 h-6 rounded-full relative transition-colors",
            rules.enabled ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"
          )}
        >
          <div className={cn(
            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
            rules.enabled ? "left-7" : "left-1"
          )} />
        </button>
      </div>

      <div className="p-8 space-y-10">
        {/* ステータスサマリー */}
        <AnimatePresence mode="wait">
          {riskStatus?.isViolated ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-3xl space-y-3"
            >
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-sm">
                <AlertTriangle size={18} />
                リスクルール違反を検知
              </div>
              <ul className="space-y-1">
                {riskStatus.violations.map((v, i) => (
                  <li key={i} className="text-xs font-bold text-rose-500/80 flex items-center gap-2">
                    <div className="w-1 h-1 bg-rose-400 rounded-full" />
                    {v}
                  </li>
                ))}
              </ul>
              <button className="text-xs font-black text-rose-600 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-rose-100 dark:border-rose-500/20 flex items-center gap-2 mt-2">
                推奨アクションを確認
                <ArrowRight size={14} />
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-3xl"
            >
              <div className="flex items-center gap-3">
                <Shield className="text-emerald-500" size={20} />
                <div>
                  <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">ポートフォリオは安全です</p>
                  <p className="text-[10px] font-bold text-emerald-600/60 leading-none mt-0.5">すべてのリスクルールが遵守されています</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 設定エリア */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              id: "maxLossPct" as const, 
              label: "全体損失制限", 
              desc: "ポートフォリオ合計の含み損", 
              current: Math.abs(riskStatus?.totalLossPct || 0).toFixed(1),
              target: rules.maxLossPct,
              unit: "%"
            },
            { 
              id: "stopLossPct" as const, 
              label: "個別損切りライン", 
              desc: "銘柄ごとの最大許容マイナス", 
              current: Math.abs(riskStatus?.maxIndividualLossPct || 0).toFixed(1),
              target: rules.stopLossPct,
              unit: "%"
            },
            { 
              id: "maxDrawdownPct" as const, 
              label: "最大ドローダウン", 
              desc: "最高値から現在の落差", 
              current: Math.abs(riskStatus?.currentDrawdownPct || 0).toFixed(1),
              target: rules.maxDrawdownPct,
              unit: "%"
            },
          ].map((item) => (
            <div key={item.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 dark:text-white">{item.label}</label>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black text-indigo-500">{item.target}</span>
                  <span className="text-[10px] font-bold text-slate-400">{item.unit}</span>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={item.target}
                onChange={(e) => handleUpdate({ [item.id]: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex flex-col gap-1 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400">CURRENT STATUS</span>
                  <span className={cn(
                    "text-[10px] font-black",
                    Number(item.current) > item.target ? "text-rose-500" : "text-emerald-500"
                  )}>
                    {item.current}{item.unit}
                  </span>
                </div>
                <div className="h-1 w-full bg-white dark:bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000",
                      Number(item.current) > item.target ? "bg-rose-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${Math.min(100, (Number(item.current) / item.target) * 100)}%` }}
                  />
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 px-1 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800" />

        {/* アクション設定 */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-white">
            <Settings2 size={16} className="text-indigo-500" />
            ルール超過時のアクション
          </div>
          <div className="flex gap-4">
            {[
              { id: "alert" as const, label: "警告のみを表示", desc: "アラートリストに表示されます" },
              { id: "suggest_sell" as const, label: "売却を提案", desc: "トレード提案として作成されます" },
            ].map((action) => (
              <button
                key={action.id}
                onClick={() => handleUpdate({ actionType: action.id })}
                className={cn(
                  "flex-1 p-4 rounded-3xl border-2 text-left transition-all",
                  rules.actionType === action.id
                    ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/10"
                    : "border-slate-100 dark:border-slate-800 bg-transparent opacity-60"
                )}
              >
                <p className="text-xs font-black text-slate-800 dark:text-white mb-1">{action.label}</p>
                <p className="text-[10px] font-bold text-slate-400">{action.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-4 p-5 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-3xl border border-indigo-100 dark:border-indigo-500/20">
          <Info className="text-indigo-500 mt-0.5 shrink-0" size={18} />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
            設定されたルールは、AIによって常時監視されます。条件を超過した場合、
            LINEやメールでの即時通知と連携し、迅速な資産保全アクションを支援します。
          </p>
        </div>
      </div>
    </div>
  );
};
