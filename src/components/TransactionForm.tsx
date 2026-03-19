"use client";

import { useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { TransactionType } from "@/types";
import { PlusCircle } from "lucide-react";

export const TransactionForm = () => {
  const { assets, addTransaction } = usePortfolio();
  
  const [assetId, setAssetId] = useState<string>(assets[0]?.id || "");
  const [type, setType] = useState<TransactionType>("buy");
  const [quantity, setQuantity] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || quantity <= 0 || price <= 0) return;
    
    addTransaction({
      assetId,
      type,
      quantity,
      price,
    });
    
    // Reset form
    setQuantity(0);
    setPrice(0);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[var(--radius-card)] p-6 shadow-sm">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
        <PlusCircle className="w-5 h-5 text-[var(--color-primary-500)]" />
        新しい取引を登録
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-500 dark:text-slate-400">銘柄</label>
          <select 
            value={assetId} onChange={(e) => setAssetId(e.target.value)}
            className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent outline-none"
          >
            {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-500 dark:text-slate-400">売買区分</label>
          <select 
            value={type} onChange={(e) => setType(e.target.value as TransactionType)}
            className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent outline-none"
            style={{ color: type === "buy" ? "var(--color-success-600)" : "var(--color-danger-600)" }}
          >
            <option value="buy">買付</option>
            <option value="sell">売却</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-500 dark:text-slate-400">数量</label>
          <input 
            type="number" step="any" min="0" value={quantity || ""} onChange={(e) => setQuantity(Number(e.target.value))}
            placeholder="0"
            className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-500 dark:text-slate-400">単価 (¥)</label>
          <input 
            type="number" step="any" min="0" value={price || ""} onChange={(e) => setPrice(Number(e.target.value))}
            placeholder="0"
            className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent outline-none"
          />
        </div>
        <button type="submit" className="p-2.5 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-500)] text-white font-bold transition-colors">
          登録する
        </button>
      </div>
    </form>
  );
};
