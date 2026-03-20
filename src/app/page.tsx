"use client";

import React from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { AuthGuard } from "@/components/AuthGuard";
import { DemoDataLoader } from "@/components/DemoDataLoader";
import { DemoStory } from "@/components/DemoStory";
import { AlertToast } from "@/components/AlertToast";
import { AssetCard } from "@/components/AssetCard";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { AssetTrendChart } from "@/components/AssetTrendChart";
import { PortfolioComposition } from "@/components/PortfolioComposition";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { InvestmentAdvice } from "@/components/InvestmentAdvice";
import { RiskAnalysis } from "@/components/RiskAnalysis";
import { PortfolioOptimization } from "@/components/PortfolioOptimization";
import { MarketSentiment } from "@/components/MarketSentiment";
import { MacroDashboard } from "@/components/MacroDashboard";
import { AlertSettings } from "@/components/AlertSettings";
import { UserRiskSettings } from "@/components/UserRiskSettings";
import { EconomicCalendar } from "@/components/EconomicCalendar";
import { NewsPanel } from "@/components/NewsPanel";
import { BehaviorInsight } from "@/components/BehaviorInsight";
import { InvestmentStrategyCard } from "@/components/InvestmentStrategyCard";
import { formatCurrency, cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, Clock, RefreshCw, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { calculatedAssets, totalAssetsValue, totalProfitAndLoss, lastUpdated, isFetching } = usePortfolio();
  const { isDemo } = useAuth();

  return (
    <AuthGuard>
      <AlertToast />
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 lg:p-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          
          {isDemo && (
            <div className="bg-indigo-600 text-white px-4 py-3 md:px-6 md:py-3 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3 text-center md:text-left">
                <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
                <span className="font-bold text-xs md:text-sm">閲覧専用デモモード実行中</span>
              </div>
              <button 
                onClick={() => window.location.href = "/login"}
                className="bg-white/20 hover:bg-white/30 text-white text-[10px] md:text-xs font-black px-4 py-1.5 rounded-full transition-all w-full md:w-auto"
              >
                ログインして始める
              </button>
            </div>
          )}

          {isDemo && <DemoStory />}

          <div className="flex justify-center md:justify-end">
            {!isDemo && <DemoDataLoader />}
          </div>

          <header className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2 italic">
                INVESTMENT <span className="text-indigo-500 not-italic">PORTFOLIO</span>
              </h1>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                <Clock className="w-4 h-4" />
                <span className="text-xs md:text-sm">最終更新: {lastUpdated || "取得中..."}</span>
                {isFetching && <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />}
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="flex flex-col items-end">
                 <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Market Status</span>
                 <div className="flex items-center gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-200">LIVE DATA</span>
                 </div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[var(--radius-card)] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <DollarSign className="w-12 h-12" />
              </div>
              <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">総資産額</p>
              <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white">
                {formatCurrency(totalAssetsValue)}
              </h2>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[var(--radius-card)] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                {totalProfitAndLoss >= 0 ? <TrendingUp className="w-12 h-12" /> : <TrendingDown className="w-12 h-12" />}
              </div>
              <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">通算損益</p>
              <h2 className={cn(
                "text-xl md:text-3xl font-black",
                totalProfitAndLoss >= 0 ? "text-emerald-500" : "text-rose-500"
              )}>
                {totalProfitAndLoss >= 0 ? "+" : ""}{formatCurrency(totalProfitAndLoss)}
              </h2>
            </div>
            
            <PerformanceMetrics />
            
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-4 md:p-6 rounded-[var(--radius-card)] shadow-lg shadow-indigo-500/20 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-20">
                 <Sparkles className="w-12 h-12 text-white" />
               </div>
               <p className="text-xs md:text-sm font-bold text-indigo-100 mb-1">AI 投資スコア</p>
               <h2 className="text-xl md:text-3xl font-black text-white">84<span className="text-sm md:text-lg opacity-60 ml-1">/100</span></h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 min-h-[300px] md:min-h-[400px]">
            <AssetTrendChart />
            <PortfolioComposition />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {calculatedAssets.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} />
                ))}
              </div>
              <MarketSentiment />
              <BehaviorInsight />
              <InvestmentStrategyCard />
              <TransactionForm />
              <TransactionList />
            </div>
            <div className="space-y-6 md:space-y-8">
              <InvestmentAdvice />
              <RiskAnalysis />
              <PortfolioOptimization />
              <AlertSettings />
              <UserRiskSettings />
              <EconomicCalendar />
              <NewsPanel />
              <MacroDashboard />
            </div>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
