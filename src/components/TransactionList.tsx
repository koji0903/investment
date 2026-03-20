"use client";

import { usePortfolio } from "@/context/PortfolioContext";
import { formatCurrency, cn } from "@/lib/utils";
import { History, ArrowRightLeft } from "lucide-react";

export const TransactionList = ({ filterAssetId, hideHeader = false }: { filterAssetId?: string, hideHeader?: boolean }) => {
  const { transactions, assets } = usePortfolio();

  const filteredTransactions = filterAssetId 
    ? transactions.filter(t => t.assetId === filterAssetId || (assets.find(a => a.id === filterAssetId)?.symbol === t.assetId))
    : transactions;

  return (
    <div className={cn(
      "overflow-hidden flex flex-col",
      !hideHeader && "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[var(--radius-card)] p-6 shadow-sm"
    )}>
      {!hideHeader && (
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100 shrink-0">
          <History className="w-5 h-5 text-indigo-500" />
          最近の取引履歴
        </h3>
      )}
      
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-10 text-slate-500 flex flex-col items-center justify-center gap-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
          <ArrowRightLeft className="w-8 h-8 opacity-20" />
          <p className="font-medium text-sm">まだ取引履歴がありません</p>
        </div>
      ) : (
        <div className="overflow-x-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 tracking-wider hidden sm:table-row">
                <th className="pb-4 font-bold pr-4">日時 / 銘柄</th>
                <th className="pb-4 font-bold px-4">区分</th>
                <th className="pb-4 font-bold px-4 text-right">単価・数量</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredTransactions.map((t) => {
                const asset = assets.find((a) => a.id === t.assetId);
                const isBuy = t.type === "buy";
                
                return (
                  <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all flex flex-col sm:table-row py-4 sm:py-0">
                    <td className="py-2 sm:py-4 sm:pr-4 flex justify-between items-start sm:table-cell">
                      <div className="flex flex-col gap-1">
                        <span className="font-black text-slate-900 dark:text-slate-100 text-base sm:text-sm">
                          {asset?.name || "不明な銘柄"}
                        </span>
                        <span className="text-[10px] md:text-xs text-slate-400 font-medium">
                          {new Date(t.date).toLocaleDateString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <span className={cn(
                        "sm:hidden px-3 py-1 rounded-full text-xs font-black shadow-sm",
                        isBuy ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" 
                              : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                      )}>
                        {isBuy ? "買付" : "売却"}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell py-4 px-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                        isBuy ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20" 
                              : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20"
                      )}>
                        {isBuy ? "BUY" : "SELL"}
                      </span>
                    </td>
                    <td className="py-2 sm:py-4 sm:px-4 sm:text-right">
                      <div className="flex flex-row justify-between sm:flex-col gap-1 sm:items-end bg-slate-50 dark:bg-slate-800/50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 sm:hidden">取引単価</span>
                          <span className="font-black text-slate-900 dark:text-white text-lg sm:text-sm">
                            {formatCurrency(t.price)}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-slate-400 sm:hidden">取引数量</span>
                          <span className="text-xs font-black text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 sm:bg-transparent px-2 py-0.5 sm:p-0 rounded-lg sm:rounded-none">
                            x {t.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                          </span>
                        </div>
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
