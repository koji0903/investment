"use client";

import { useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { useAuth } from "@/context/AuthContext";
import { TransactionType } from "@/types";
import { PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const TransactionForm = () => {
  const { assets, addTransaction } = usePortfolio();
  const { isDemo } = useAuth();
  
  const [assetId, setAssetId] = useState<string>("");
  const [type, setType] = useState<TransactionType>("buy");
  const [quantity, setQuantity] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || quantity <= 0 || price <= 0) return;
    
    addTransaction({
      assetId: assetId.trim().toUpperCase(),
      type,
      quantity,
      price,
    });
    
    // Reset form
    setAssetId("");
    setQuantity(0);
    setPrice(0);
  };

  return (
    <form onSubmit={handleSubmit} className={cn(
      "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[var(--radius-card)] p-6 shadow-sm relative overflow-hidden",
      isDemo && "opacity-75"
    )}>
      <h3 className="text-xl font-bold mb-4 flex items-center justify-between text-slate-800 dark:text-slate-100">
        <div className="flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-indigo-500" />
          取引を登録
        </div>
        {isDemo && (
          <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2.5 py-1 rounded-full border border-indigo-500/20 font-bold">
            閲覧専用モード
          </span>
        )}
      </h3>
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end", isDemo && "pointer-events-none")}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-500 ml-1">銘柄 / シンボル</label>
          <input 
            list="assets-list"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            disabled={isDemo}
            placeholder="AAPL, 7203.T等"
            className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 dark:disabled:bg-slate-900 transition-all font-medium"
          />
          <datalist id="assets-list">
            {assets.map(a => <option key={a.id} value={a.symbol || a.id}>{a.name}</option>)}
          </datalist>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-500 ml-1">売買区分</label>
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value as TransactionType)}
            disabled={isDemo}
            className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none disabled:bg-slate-100 dark:disabled:bg-slate-900 transition-all font-bold"
            style={{ color: type === "buy" ? "var(--color-success-600)" : "var(--color-danger-600)" }}
          >
            <option value="buy">買付</option>
            <option value="sell">売却</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-500 ml-1">数量</label>
          <input 
            type="number" step="any" min="0" value={quantity || ""} onChange={(e) => setQuantity(Number(e.target.value))}
            placeholder="0"
            disabled={isDemo}
            className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none disabled:bg-slate-100 dark:disabled:bg-slate-900 transition-all font-medium"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-500 ml-1">単価 (¥)</label>
          <input 
            type="number" step="any" min="0" value={price || ""} onChange={(e) => setPrice(Number(e.target.value))}
            placeholder="0"
            disabled={isDemo}
            className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none disabled:bg-slate-100 dark:disabled:bg-slate-900 transition-all font-medium"
          />
        </div>
        <button 
          type="submit" 
          disabled={isDemo}
          className={cn(
            "p-3 rounded-xl text-white font-black text-sm transition-all sm:col-span-2 lg:col-span-1 shadow-md",
            isDemo ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700" : "bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98]"
          )}
        >
          {isDemo ? "閲覧制限中" : "登録する"}
        </button>
      </div>
    </form>
  );
};
