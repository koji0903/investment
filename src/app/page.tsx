"use client";

import React, { useState } from "react";
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
import { TrendingUp, TrendingDown, DollarSign, Clock, RefreshCw, Sparkles, LayoutDashboard, LineChart, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

type TabType = "overview" | "analysis" | "tools";

export default function Home() {
  const { calculatedAssets, totalAssetsValue, totalProfitAndLoss, lastUpdated, isFetching } = usePortfolio();
  const { isDemo } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  return (
    <AuthGuard>
      <AlertToast />
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 lg:p-12 transition-colors duration-300 font-sans">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {isDemo && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-600 text-white px-4 py-3 md:px-6 md:py-3 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 text-center md:text-left">
                <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
                <span className="font-bold text-xs md:text-sm text-indigo-50">閲覧専用デモモード実行中</span>
              </div>
              <button 
                onClick={() => window.location.href = "/login"}
                className="bg-white/20 hover:bg-white/30 text-white text-[10px] md:text-xs font-black px-4 py-1.5 rounded-full transition-all w-full md:w-auto backdrop-blur-sm border border-white/20"
              >
                ログインして始める
              </button>
            </motion.div>
          )}

          {isDemo && <DemoStory />}

          <header className="flex flex-col md:flex-row justify-between gap-6">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-3 italic">
                INVESTMENT <span className="text-indigo-500 not-italic">PORTFOLIO</span>
              </h1>
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-bold bg-white dark:bg-slate-900 px-4 py-2 rounded-full shadow-sm border border-slate-100 dark:border-slate-800">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span className="text-xs md:text-sm uppercase tracking-wider">最終更新: {lastUpdated || "取得中..."}</span>
                {isFetching && <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />}
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-6">
               <div className="flex flex-col items-center md:items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Market Status</span>
                  <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-black uppercase">Live Connection</span>
                  </div>
               </div>
               {!isDemo && <DemoDataLoader />}
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatsCard label="総資産額" value={formatCurrency(totalAssetsValue)} Icon={DollarSign} color="indigo" />
            <StatsCard 
              label="通算損益" 
              value={`${totalProfitAndLoss >= 0 ? "+" : ""}${formatCurrency(totalProfitAndLoss)}`} 
              Icon={totalProfitAndLoss >= 0 ? TrendingUp : TrendingDown} 
              color={totalProfitAndLoss >= 0 ? "emerald" : "rose"} 
              isTrend
            />
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-6 rounded-[32px] shadow-xl shadow-indigo-500/20 relative overflow-hidden group border border-white/10">
               <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
               <div className="relative z-10 flex flex-col h-full justify-between">
                 <div>
                   <div className="p-2 bg-white/20 w-fit rounded-xl mb-3 backdrop-blur-md">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                   </div>
                   <p className="text-xs font-bold text-indigo-100/80 uppercase tracking-widest">AI 投資スコア</p>
                 </div>
                 <h2 className="text-4xl font-black text-white">84<span className="text-lg opacity-60 ml-1">/100</span></h2>
               </div>
            </div>
          </div>

          <div className="w-full">
            <PerformanceMetrics />
          </div>

          {/* Tab Navigation */}
          <div className="flex p-1.5 bg-slate-200/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-3xl w-fit mx-auto md:mx-0 sticky top-4 z-40 shadow-lg">
            <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} Icon={LayoutDashboard} label="概況" />
            <TabButton active={activeTab === "analysis"} onClick={() => setActiveTab("analysis")} Icon={LineChart} label="AI分析" />
            <TabButton active={activeTab === "tools"} onClick={() => setActiveTab("tools")} Icon={Settings} label="ツール・設定" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {activeTab === "overview" && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 min-h-[400px]">
                    <AssetTrendChart />
                    <PortfolioComposition />
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                        保有資産一覧
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                      {calculatedAssets.map((asset) => (
                        <AssetCard key={asset.id} asset={asset} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "analysis" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                  <div className="lg:col-span-2 space-y-6 md:space-y-8">
                    <InvestmentStrategyCard />
                    <MarketSentiment />
                    <BehaviorInsight />
                  </div>
                  <div className="space-y-6 md:space-y-8">
                    <InvestmentAdvice />
                    <RiskAnalysis />
                    <PortfolioOptimization />
                  </div>
                </div>
              )}

              {activeTab === "tools" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                  <div className="lg:col-span-2 space-y-6 md:space-y-8">
                    <TransactionForm />
                    <TransactionList />
                  </div>
                  <div className="space-y-6 md:space-y-8">
                    <AlertSettings />
                    <UserRiskSettings />
                    <EconomicCalendar />
                    <NewsPanel />
                    <MacroDashboard />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </AuthGuard>
  );
}

function StatsCard({ label, value, Icon, color, isTrend = false }: { label: string, value: string, Icon: React.ElementType, color: string, isTrend?: boolean }) {
  const colorMap: any = {
    indigo: "from-indigo-500 to-indigo-600 shadow-indigo-500/20",
    emerald: "from-emerald-500 to-emerald-600 shadow-emerald-500/20",
    rose: "from-rose-500 to-rose-600 shadow-rose-500/20",
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 md:p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group transition-all hover:shadow-xl hover:border-indigo-500/30">
      <div className={cn(
        "absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500 group-hover:scale-150 group-hover:-rotate-12 pointer-events-none",
        isTrend && (value.includes("+") ? "text-emerald-500" : "text-rose-500")
      )}>
        <Icon className="w-24 h-24 md:w-32 md:h-32" />
      </div>
      <div className="relative z-10">
        <div className={cn(
          "w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center mb-3 md:mb-4 text-white shadow-lg bg-gradient-to-br",
          colorMap[color]
        )}>
          <Icon size={20} className="md:w-6 md:h-6" />
        </div>
        <p className="text-[10px] md:text-xs font-black text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">{label}</p>
        <h2 className={cn(
          "text-xl md:text-3xl font-black tracking-tight",
          isTrend ? (value.includes("+") ? "text-emerald-500" : "text-rose-500") : "text-slate-900 dark:text-white"
        )}>
          {value}
        </h2>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, Icon, label }: { active: boolean, onClick: () => void, Icon: React.ElementType, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-2.5 rounded-2xl text-[10px] sm:text-xs md:text-sm font-black transition-all duration-300 relative whitespace-nowrap",
        active 
          ? "bg-white dark:bg-slate-800 text-indigo-500 shadow-sm" 
          : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-800/50"
      )}
    >
      <Icon size={16} className="md:w-[18px] md:h-[18px]" />
      <span>{label}</span>
      {active && (
        <motion.div 
          layoutId="tab-underline"
          className="absolute inset-0 bg-white dark:bg-slate-800 rounded-2xl -z-10 shadow-md"
        />
      )}
    </button>
  );
}
