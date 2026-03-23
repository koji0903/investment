"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { NisaAccumulationSetting, NisaAccountType } from "@/types/nisa";
import { formatCurrency, cn } from "@/lib/utils";
import { Calendar, DollarSign, Tag, Briefcase, Plus, X, Loader2, Search, Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePortfolio } from "@/context/PortfolioContext";

interface NisaAccumulationFormProps {
  onSave: (setting: Omit<NisaAccumulationSetting, "createdAt" | "updatedAt">) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  initialData?: NisaAccumulationSetting;
}

export const NisaAccumulationForm = ({ onSave, onCancel, initialData }: NisaAccumulationFormProps) => {
  const { calculatedAssets } = usePortfolio();
  const [loading, setLoading] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(!initialData?.assetId);
  const [formData, setFormData] = useState({
    accountType: initialData?.accountType || "accumulation" as NisaAccountType,
    name: initialData?.name || "",
    symbol: initialData?.symbol || "",
    amount: initialData?.amount?.toString() || "33333",
    dayOfMonth: initialData?.dayOfMonth || 1,
    status: initialData?.status || "active" as const,
    assetId: initialData?.assetId || "",
    lastProcessedMonth: initialData?.lastProcessedMonth || ""
  });

  const generateId = () => {
    try {
      return crypto.randomUUID();
    } catch (e) {
      return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
  };

  const nameInputRef = React.useRef<HTMLInputElement>(null);

  // 投資信託の資産のみを抽出
  const trustAssets = useMemo(() => {
    return calculatedAssets.filter(a => a.category === "投資信託");
  }, [calculatedAssets]);

  // 初回表示時にフォーカスを当てる
  React.useEffect(() => {
    if (nameInputRef.current && isManualEntry) {
      nameInputRef.current.focus();
    }
  }, [isManualEntry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (!formData.name) {
      alert("銘柄名を選択または入力してください。");
      return;
    }
    
    const amountNum = Number(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("有効な積立額を入力してください。");
      return;
    }

    setLoading(true);
    console.log("Submitting NISA Setting:", formData);
    
    try {
      const result = await onSave({
        id: initialData?.id || generateId(),
        userId: initialData?.userId || "",
        ...formData,
        amount: amountNum
      });
      
      if (!result.success) {
        alert(`保存に失敗しました: ${result.error || "詳細不明なエラー"}`);
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      alert(`通信エラーが発生しました: ${error.message || "サーバーとの通信に失敗しました"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAsset = (asset: any) => {
    setFormData(prev => ({
      ...prev,
      name: asset.name,
      symbol: asset.symbol,
      assetId: asset.id
    }));
    setIsManualEntry(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full mx-auto relative z-50 max-h-[90vh] overflow-y-auto custom-scrollbar"
    >
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">積立設定の{initialData ? '編集' : '追加'}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">NISA Accumulation Settings</p>
        </div>
        <button 
          onClick={onCancel}
          className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Entry Mode Toggle */}
        <div className="space-y-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Search size={14} /> 銘柄の選択方法
          </label>
          <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full">
            <button
              type="button"
              onClick={() => setIsManualEntry(false)}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2",
                !isManualEntry 
                  ? "bg-white dark:bg-slate-700 text-indigo-500 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              )}
            >
              <Briefcase size={14} /> 保有資産から選択
            </button>
            <button
              type="button"
              onClick={() => {
                setIsManualEntry(true);
                setFormData(prev => ({ ...prev, assetId: "" }));
              }}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2",
                isManualEntry 
                  ? "bg-white dark:bg-slate-700 text-indigo-500 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              )}
            >
              <Plus size={14} /> 手動で入力
            </button>
          </div>
        </div>

        {/* Name & Symbol Area */}
        <div className="space-y-6">
          {!isManualEntry ? (
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Tag size={14} /> 対象の投資信託を選択
              </label>
              <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {trustAssets.length > 0 ? (
                  trustAssets.map(asset => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => handleSelectAsset(asset)}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group",
                        formData.assetId === asset.id
                          ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/30"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50"
                      )}
                    >
                      <div>
                        <p className={cn(
                          "text-sm font-black",
                          formData.assetId === asset.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-200"
                        )}>
                          {asset.name}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">{asset.symbol}</p>
                      </div>
                      {formData.assetId === asset.id && (
                        <Check size={18} className="text-indigo-500" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-400">対象の投資信託が見つかりません</p>
                    <button 
                      type="button"
                      onClick={() => setIsManualEntry(true)}
                      className="text-[10px] font-black text-indigo-500 mt-2 hover:underline"
                    >
                      手動入力に切り替える
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Tag size={14} /> 銘柄名
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="eMAXIS Slim 全世界株式"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Tag size={14} /> シンボル（任意）
                </label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={e => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                  placeholder="0331418C"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Account Type Toggle */}
        <div className="space-y-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Briefcase size={14} /> 口座区分
          </label>
          <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, accountType: "accumulation" }))}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-black transition-all",
                formData.accountType === "accumulation" 
                  ? "bg-white dark:bg-slate-700 text-emerald-500 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              )}
            >
              つみたて投資枠
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, accountType: "growth" }))}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-black transition-all",
                formData.accountType === "growth" 
                  ? "bg-white dark:bg-slate-700 text-indigo-500 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              )}
            >
              成長投資枠
            </button>
          </div>
        </div>
 
        {/* Amount & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <DollarSign size={14} /> 毎月の積立額
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                required
                value={formData.amount}
                onChange={e => {
                  const val = e.target.value.replace(/[^\d]/g, "");
                  setFormData(prev => ({ ...prev, amount: val }));
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pr-12"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase">円</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold px-1">
              {formatCurrency(Number(formData.amount) || 0)} / 月
            </p>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={14} /> 積立日
            </label>
            <select
              value={formData.dayOfMonth}
              onChange={e => setFormData(prev => ({ ...prev, dayOfMonth: Number(e.target.value) }))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>毎月 {day} 日</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-[1.5rem] font-black tracking-tight hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : <Plus size={24} />}
            {initialData ? '設定を保存する' : '積立設定を確定する'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-5 rounded-[1.5rem] font-black text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all underline decoration-2 underline-offset-8"
          >
            キャンセル
          </button>
        </div>
      </form>
    </motion.div>
  );
};
