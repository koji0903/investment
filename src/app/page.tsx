"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { DashboardHeader } from "@/components/DashboardHeader";
import { AssetCard } from "@/components/AssetCard";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { PortfolioComposition } from "@/components/PortfolioComposition";
import { AssetTrendChart } from "@/components/AssetTrendChart";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { RiskAnalysis } from "@/components/RiskAnalysis";
import { PortfolioOptimization } from "@/components/PortfolioOptimization";
import { InvestmentAdvice } from "@/components/InvestmentAdvice";
import { BehaviorInsight } from "@/components/BehaviorInsight";
import { InvestmentStrategyCard } from "@/components/InvestmentStrategyCard";
import { UserRiskSettings } from "@/components/UserRiskSettings";
import { MarketSentiment } from "@/components/MarketSentiment";
import { NewsPanel } from "@/components/NewsPanel";
import { EconomicCalendar } from "@/components/EconomicCalendar";
import { AlertToast } from "@/components/AlertToast";
import { AlertSettings } from "@/components/AlertSettings";
import { MacroDashboard } from "@/components/MacroDashboard";
import { usePortfolio } from "@/context/PortfolioContext";
import { AuthGuard } from "@/components/AuthGuard";
import { DemoDataLoader } from "@/components/DemoDataLoader";
import { DemoStory } from "@/components/DemoStory";
import { Loader2, Sparkles } from "lucide-react";

export default function Home() {
  const { calculatedAssets, totalAssetsValue, totalProfitAndLoss, lastUpdated, isFetching } = usePortfolio();
  const { isDemo } = useAuth();

  return (
    <AuthGuard>
      <AlertToast />
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 lg:p-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {isDemo && (
            <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span className="font-bold text-sm">閲覧専用デモモード実行中</span>
              </div>
              <button 
                onClick={() => window.location.href = "/login"}
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-black px-4 py-1.5 rounded-full transition-all"
              >
                ログインして始める
              </button>
            </div>
          )}

          {isDemo && <DemoStory />}

          <div className="flex justify-end">
            {!isDemo && <DemoDataLoader />}
          </div>

          <header className="flex flex-col justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                My Portfolio
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                あなたのすべての資産を一つの場所で管理
              </p>
            </div>
          </header>

          <section>
            <DashboardHeader 
              totalAssets={totalAssetsValue} 
              totalProfitAndLoss={totalProfitAndLoss} 
              lastUpdated={lastUpdated}
              isFetching={isFetching}
            />
          </section>

          {/* マクロ経済状況 */}
          <section>
            <MacroDashboard />
          </section>

          {/* AI インサイト & 戦略分析 */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <InvestmentAdvice />
              <BehaviorInsight />
            </div>
            <div className="lg:col-span-1">
              <InvestmentStrategyCard />
            </div>
          </section>

          {/* センチメント分析 */}
          <section>
            <MarketSentiment />
          </section>

          {/* パフォーマンス & リスク 分析 & 最適化 */}
          <section className="space-y-8">
            <PerformanceMetrics />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <RiskAnalysis />
              <PortfolioOptimization />
            </div>
          </section>

          {/* グラフエリア */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AssetTrendChart />
            </div>
            <div className="lg:col-span-1">
              <PortfolioComposition />
            </div>
          </section>

          {/* マーケットニュース & 経済指標カレンダー */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <NewsPanel />
            <EconomicCalendar />
          </section>

          <section className="pt-2 grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
            <div className="xl:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  資産内訳
                </h2>
                <div className="text-sm font-medium text-slate-500 bg-slate-200/50 dark:bg-slate-800/50 px-3 py-1 rounded-full">
                  {calculatedAssets.length} 件の資産
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {calculatedAssets.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} />
                ))}
              </div>
            </div>
            
            <div className="xl:col-span-1 flex flex-col gap-6 sticky top-8">
              <TransactionForm />
              <TransactionList />
            </div>
          </section>

          {/* アラート & 戦略設定 */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <UserRiskSettings />
            <AlertSettings />
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}
