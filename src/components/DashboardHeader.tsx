"use client";

import { formatCurrency, cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { TrendingUp, TrendingDown, Wallet, RefreshCw, LogOut, User, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface DashboardHeaderProps {
  totalAssets: number;
  totalProfitAndLoss: number;
  lastUpdated?: string | null;
  isFetching?: boolean;
  hideAuth?: boolean;
  variant?: 'default' | 'minimal';
}

export const DashboardHeader = ({ 
  totalAssets, 
  totalProfitAndLoss, 
  lastUpdated, 
  isFetching,
  hideAuth = false,
  variant = 'default'
}: DashboardHeaderProps) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const isProfit = totalProfitAndLoss >= 0;

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-between px-6 py-4 bg-white/5 backdrop-blur-md border-b border-white/10 text-white">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/")}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight">マーケット・レーダー</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Market Scanning</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">総資産</span>
            <span className="text-xl font-black">{formatCurrency(totalAssets)}</span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">評価損益</span>
            <span className={cn("text-xl font-black", isProfit ? "text-emerald-400" : "text-rose-400")}>
              {isProfit ? "+" : ""}{formatCurrency(totalProfitAndLoss)}
            </span>
          </div>
          {!hideAuth && user && (
            <>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <User size={16} />
                </div>
                <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all">
                  <LogOut size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 md:p-10 shadow-xl border border-white/10">
      <div className="absolute top-0 left-0 -translate-y-12 -translate-x-1/4 opacity-[0.03] pointer-events-none mix-blend-overlay">
        <Wallet className="w-[32rem] h-[32rem]" />
      </div>

      {/* ホームに戻る・ナビゲーション (左上) */}
      <div className="absolute top-6 left-8 z-20 flex items-center gap-3">
        <button 
          onClick={() => router.push("/")}
          className="flex items-center gap-2.5 px-5 py-2.5 rounded-[1.25rem] bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 backdrop-blur-xl text-white text-sm font-black transition-all hover:scale-105 active:scale-95 group shadow-2xl shadow-indigo-500/10"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          <span className="flex items-center">
            ホーム
          </span>
        </button>
      </div>

      {!hideAuth && user && (
        <div className="absolute top-6 right-8 z-20 flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-bold text-slate-400">ログイン中</span>
            <span className="text-sm font-black text-white">{(user as any).displayName || (user as any).email?.split('@')[0]}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <button 
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-all group"
              title="ログアウト"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8 mt-4 md:mt-0">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-slate-400 font-medium tracking-wide text-sm md:text-base flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-400" />
              総資産額
            </h2>
            {lastUpdated && (
              <div className="w-fit flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-800/80 backdrop-blur-sm px-2.5 py-1.5 rounded-full border border-slate-700/50 hidden sm:flex">
                <RefreshCw className={cn("w-3 h-3 text-indigo-400", isFetching && "animate-spin")} />
                {new Date(lastUpdated as string).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
            )}
          </div>
          <div className="text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 pb-1 flex flex-col sm:flex-row gap-4 sm:items-end">
            {formatCurrency(totalAssets)}
            {lastUpdated && (
              <div className="sm:hidden flex items-center gap-1.5 text-[0.7rem] font-medium text-slate-400 bg-slate-800/80 backdrop-blur-sm px-2 py-1 rounded-full border border-slate-700/50 w-fit leading-none mb-1">
                <RefreshCw className={cn("w-3 h-3 text-indigo-400", isFetching && "animate-spin")} />
                {new Date(lastUpdated as string).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
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
