"use client";

import { FXJudgmentDashboard } from "@/components/fx/FXJudgmentDashboard";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Footer } from "@/components/Footer";
import { usePortfolio } from "@/context/PortfolioContext";
import { AuthGuard } from "@/components/AuthGuard";
import { Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

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

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <a 
              href="/fx/usdjpy" 
              className="group relative px-8 py-6 bg-slate-900 hover:bg-slate-800 text-white rounded-[32px] border border-slate-800 hover:border-indigo-500/50 font-black text-sm uppercase tracking-widest shadow-2xl transition-all flex items-center justify-between active:scale-95"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <Zap size={20} fill="currentColor" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 mb-0.5 tracking-[0.2em]">USD/JPY</div>
                  <span className="text-base">Day Trading Pro</span>
                </div>
              </div>
              <ArrowRight size={20} className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </a>

            <a 
              href="/fx/eurusd" 
              className="group relative px-8 py-6 bg-slate-900 hover:bg-slate-800 text-white rounded-[32px] border border-slate-800 hover:border-emerald-500/50 font-black text-sm uppercase tracking-widest shadow-2xl transition-all flex items-center justify-between active:scale-95"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Zap size={20} fill="currentColor" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 mb-0.5 tracking-[0.2em]">EUR/USD</div>
                  <span className="text-base">Day Trading Pro</span>
                </div>
              </div>
              <ArrowRight size={20} className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </a>
          </div>
            <FXJudgmentDashboard />
          </div>
        </div>

        <Footer />
      </div>
    </AuthGuard>
  );
}
