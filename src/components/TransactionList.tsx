"use client";

import { usePortfolio } from "@/context/PortfolioContext";
import { formatCurrency, cn } from "@/lib/utils";
import { History, ArrowRightLeft } from "lucide-react";

export const TransactionList = () => {
  const { transactions, assets } = usePortfolio();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[var(--radius-card)] p-6 shadow-sm overflow-hidden flex flex-col">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100 shrink-0">
        <History className="w-5 h-5 text-indigo-500" />
        最近の取引履歴
      </h3>
      
      {transactions.length === 0 ? (
        <div className="text-center py-10 text-slate-500 flex flex-col items-center justify-center gap-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
          <ArrowRightLeft className="w-8 h-8 opacity-20" />
          <p className="font-medium text-sm">まだ取引履歴がありません</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 tracking-wider hidden sm:table-row">
                <th className="pb-3 font-medium pr-4">日時/銘柄</th>
                <th className="pb-3 font-medium px-4">区分</th>
                <th className="pb-3 font-medium px-4 text-right">単価・数量</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {transactions.map((t) => {
                const asset = assets.find((a) => a.id === t.assetId);
                const isBuy = t.type === "buy";
                
                return (
                  <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex flex-col sm:table-row py-3 sm:py-0">
                    <td className="py-2 sm:py-3 sm:pr-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{asset?.name || "不明な銘柄"}</span>
                        <span className="text-xs text-slate-500">
                          {new Date(t.date).toLocaleDateString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 sm:py-3 sm:px-4">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold w-fit",
                        isBuy ? "bg-[var(--color-success-50)] text-[var(--color-success-600)] dark:bg-[var(--color-success-600)]/10 dark:text-[var(--color-success-500)]" 
                              : "bg-[var(--color-danger-50)] text-[var(--color-danger-600)] dark:bg-[var(--color-danger-600)]/10 dark:text-[var(--color-danger-500)]"
                      )}>
                        {isBuy ? "買付" : "売却"}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 sm:px-4 sm:text-right">
                      <div className="flex flex-row justify-between sm:flex-col gap-0.5 items-center sm:items-end">
                        <span className="font-medium text-slate-900 dark:text-slate-300">{formatCurrency(t.price)}</span>
                        <span className="text-xs font-semibold text-slate-500">x {t.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
