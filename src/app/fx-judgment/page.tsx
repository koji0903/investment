"use client";

import { FXJudgmentDashboard } from "@/components/fx/FXJudgmentDashboard";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Footer } from "@/components/Footer";
import { usePortfolio } from "@/context/PortfolioContext";
import { AuthGuard } from "@/components/AuthGuard";

export default function FXJudgmentPage() {
  const { totalAssetsValue, totalProfitAndLoss, lastUpdated, isFetching } = usePortfolio();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <DashboardHeader
            totalAssets={totalAssetsValue}
            totalProfitAndLoss={totalProfitAndLoss}
            lastUpdated={lastUpdated}
            isFetching={isFetching}
            hideAuth={true}
          />

          <div className="mt-12">
            <FXJudgmentDashboard />
          </div>
        </div>

        <Footer />
      </div>
    </AuthGuard>
  );
}
