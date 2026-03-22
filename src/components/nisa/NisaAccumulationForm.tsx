"use client";

import React, { useState } from "react";
import { NisaAccumulationSetting, NisaAccountType } from "@/types/nisa";
import { formatCurrency, cn } from "@/lib/utils";
import { Calendar, DollarSign, Tag, Briefcase, Plus, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NisaAccumulationFormProps {
  onSave: (setting: Omit<NisaAccumulationSetting, "createdAt" | "updatedAt">) => Promise<void>;
  onCancel: () => void;
  initialData?: NisaAccumulationSetting;
}

export const NisaAccumulationForm = ({ onSave, onCancel, initialData }: NisaAccumulationFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    accountType: initialData?.accountType || "accumulation" as NisaAccountType,
    name: initialData?.name || "",
    symbol: initialData?.symbol || "",
    amount: initialData?.amount || 33333,
    dayOfMonth: initialData?.dayOfMonth || 1,
    status: initialData?.status || "active" as const
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        id: initialData?.id || crypto.randomUUID(),
        userId: initialData?.userId || "", // Parent should handle userId or useAuth inside action
        ...formData
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full mx-auto"
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

        {/* Name & Symbol */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Tag size={14} /> 銘柄名
            </label>
            <input
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

        {/* Amount & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <DollarSign size={14} /> 毎月の積立額
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min="100"
                value={formData.amount}
                onChange={e => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pr-12"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase">円</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold px-1">
              {formatCurrency(formData.amount)} / 月
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
