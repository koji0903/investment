"use client";

import { FXJudgmentDashboard } from "@/components/fx/FXJudgmentDashboard";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Footer } from "@/components/Footer";
import { usePortfolio } from "@/context/PortfolioContext";
import { AuthGuard } from "@/components/AuthGuard";
import { Zap, ArrowRight, Loader2, ShieldCheck, ShieldAlert, Activity } from "lucide-react";
import { useIntegratedCommandCenter } from "@/hooks/useIntegratedCommandCenter";
import { cn } from "@/lib/utils";

/**
 * 意思決定エンジンの判定をカード内に表示する高度なナビゲーションコンポーネント
 */
function TradingProCard({ 
  pairCode, 
  title, 
  href, 
  themeColor, 
  iconColor 
}: { 
  pairCode: string, 
  title: string, 
  href: string, 
  themeColor: string, 
  iconColor: string 
}) {
  const { decision, quote, isLoading } = useIntegratedCommandCenter(pairCode);
  const action = decision?.recommendation?.action || "WAIT";
  
  return (
    <a 
      href={href} 
      className={cn(
        "group relative px-8 py-8 bg-slate-900 hover:bg-slate-800 text-white rounded-[40px] border border-slate-800 transition-all flex flex-col md:flex-row items-center justify-between gap-6 active:scale-[0.98] shadow-2xl",
        themeColor === "indigo" ? "hover:border-indigo-500/50" : "hover:border-emerald-500/50"
      )}
    >
      <div className="flex items-center gap-5 w-full md:w-auto">
        <div className={cn(
          "p-4 rounded-2xl transition-colors",
          iconColor === "indigo" ? "bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white" : 
          "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white"
        )}>
          <Zap size={24} fill="currentColor" />
        </div>
        <div>
          <div className="text-[10px] text-slate-500 mb-1 font-black uppercase tracking-[0.3em]">{pairCode}</div>
          <h3 className="text-xl font-black italic">{title}</h3>
        </div>
      </div>

      <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
        {/* Market Status & Decision Overlay */}
        <div className="flex flex-col items-end gap-1">
          {isLoading ? (
            <div className="flex items-center gap-2 text-slate-600 animate-pulse">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest">分析中...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                {/* Price Display */}
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Price</span>
                  <span className="text-sm font-black tabular-nums text-slate-300">
                    {quote?.price.toFixed(3) || "---"}
                  </span>
                </div>
                
                {/* Decision Badge */}
                <div className={cn(
                  "px-6 py-2 rounded-2xl flex items-center gap-2 border shadow-lg transition-transform group-hover:scale-110 duration-500",
                  action === "BUY" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-emerald-500/10" :
                  action === "SELL" ? "bg-rose-500/20 border-rose-400 text-rose-400 shadow-rose-500/10" :
                  "bg-slate-800/50 border-slate-700 text-slate-500"
                )}>
                  {action === "BUY" ? <ShieldCheck size={14} /> : 
                   action === "SELL" ? <ShieldAlert size={14} /> : 
                   <Activity size={14} />}
                  <span className="text-sm font-black uppercase tracking-[0.1em]">
                    {action === "BUY" ? "買" : action === "SELL" ? "売" : "静観"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 mr-1">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Confidence</span>
                <span className="text-[10px] font-black text-indigo-400">{decision?.confidence || 0}%</span>
              </div>
            </>
          )}
        </div>

        <div className="hidden md:flex w-10 h-10 rounded-full bg-slate-800 items-center justify-center text-slate-600 group-hover:bg-white group-hover:text-slate-900 transition-all">
          <ArrowRight size={20} />
        </div>
      </div>

      {/* Decorative Glow Effect */}
      <div className={cn(
        "absolute -inset-px rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity blur-xl z-[-1]",
        themeColor === "indigo" ? "bg-indigo-500/5" : "bg-emerald-500/5"
      )} />
    </a>
  );
}

export default function FXJudgmentPage() {
  const { totalAssetsValue, totalProfitAndLoss, lastUpdated, isFetching, refreshPrices } = usePortfolio();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <DashboardHeader
            totalAssets={totalAssetsValue}
            totalProfitAndLoss={totalProfitAndLoss}
            lastUpdated={lastUpdated}
            isFetching={isFetching}
            onRefresh={refreshPrices}
            hideAuth={true}
          />

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <TradingProCard 
              pairCode="USD/JPY"
              title="Day Trading Pro"
              href="/fx/usdjpy"
              themeColor="indigo"
              iconColor="indigo"
            />
            <TradingProCard 
              pairCode="EUR/USD"
              title="Day Trading Pro"
              href="/fx/eurusd"
              themeColor="emerald"
              iconColor="emerald"
            />
          </div>

          <div className="mt-16 pt-16 border-t border-slate-100 dark:border-slate-900">
            <FXJudgmentDashboard />
          </div>
        </div>

        <Footer />
      </div>
    </AuthGuard>
  );
}
