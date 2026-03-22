"use client";

import React from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardHeader } from "@/components/DashboardHeader";
import { StockJudgmentDashboard } from "@/components/stock/StockJudgmentDashboard";
import { usePortfolio } from "@/context/PortfolioContext";

export default function StockJudgmentPage() {
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
          
          <div className="mt-12">
            <StockJudgmentDashboard />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
