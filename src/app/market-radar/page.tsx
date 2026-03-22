"use client";

import { DashboardHeader } from "@/components/DashboardHeader";
import { RadarDashboard } from "@/components/stock/radar/RadarDashboard";
import { usePortfolio } from "@/context/PortfolioContext";
import { AuthGuard } from "@/components/AuthGuard";

export default function StockRadarPage() {
  const { totalAssetsValue, totalProfitAndLoss, lastUpdated, isFetching, refreshPrices } = usePortfolio();

  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-50 dark:bg-[#0a0c10] pb-20 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 mt-8 md:mt-12">
          <DashboardHeader 
            totalAssets={totalAssetsValue} 
            totalProfitAndLoss={totalProfitAndLoss} 
            lastUpdated={lastUpdated}
            isFetching={isFetching}
            onRefresh={refreshPrices}
            hideAuth={true}
          />
          <div className="mt-12">
            <RadarDashboard />
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
