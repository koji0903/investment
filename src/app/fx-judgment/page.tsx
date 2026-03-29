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

          <div className="mt-12 space-y-8">
            <div className="flex justify-start">
               <a 
                 href="/fx/usdjpy" 
                 className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-500/30 transition-all flex items-center gap-3 active:scale-95"
               >
                 <div className="p-2 bg-white/20 rounded-xl">
                   <Zap size={18} fill="currentColor" />
                 </div>
                 <span>USD/JPY Day Trading Pro</span>
                 <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
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
