import { formatCurrency, cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, RefreshCw } from "lucide-react";

interface DashboardHeaderProps {
  totalAssets: number;
  totalProfitAndLoss: number;
  lastUpdated?: string | null;
  isFetching?: boolean;
}

export const DashboardHeader = ({ totalAssets, totalProfitAndLoss, lastUpdated, isFetching }: DashboardHeaderProps) => {
  const isProfit = totalProfitAndLoss >= 0;

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 md:p-10 shadow-xl border border-white/10">
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-[0.03] pointer-events-none mix-blend-overlay">
        <Wallet className="w-[32rem] h-[32rem]" />
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-slate-400 font-medium tracking-wide text-sm md:text-base flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-400" />
              総資産額
            </h2>
            {lastUpdated && (
              <div className="w-fit flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-800/80 backdrop-blur-sm px-2.5 py-1.5 rounded-full border border-slate-700/50 hidden sm:flex">
                <RefreshCw className={cn("w-3 h-3 text-indigo-400", isFetching && "animate-spin")} />
                {new Date(lastUpdated).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
            )}
          </div>
          <div className="text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 pb-1 flex flex-col sm:flex-row gap-4 sm:items-end">
            {formatCurrency(totalAssets)}
            {lastUpdated && (
              <div className="sm:hidden flex items-center gap-1.5 text-[0.7rem] font-medium text-slate-400 bg-slate-800/80 backdrop-blur-sm px-2 py-1 rounded-full border border-slate-700/50 w-fit leading-none mb-1">
                <RefreshCw className={cn("w-3 h-3 text-indigo-400", isFetching && "animate-spin")} />
                {new Date(lastUpdated).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col gap-1.5 bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 w-full md:w-auto shadow-inner hover:bg-white/10 transition-colors duration-300">
          <div className="text-slate-400 text-sm font-medium flex items-center gap-2">
            合計損益
          </div>
          <div className={cn(
            "flex items-center gap-2 text-3xl font-extrabold tracking-tight",
            isProfit ? "text-[var(--color-success-500)]" : "text-[var(--color-danger-500)]"
          )}>
            {isProfit ? <TrendingUp className="w-7 h-7" /> : <TrendingDown className="w-7 h-7" />}
            {isProfit ? "+" : ""}{formatCurrency(totalProfitAndLoss)}
          </div>
        </div>
      </div>
    </div>
  );
};
