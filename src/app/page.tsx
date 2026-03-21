"use client";

import React, { useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { AuthGuard } from "@/components/AuthGuard";
import { DemoStory } from "@/components/DemoStory";
import { AlertToast } from "@/components/AlertToast";
import { AssetCardSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { AssetCategoryGroup } from "@/components/AssetCategoryGroup";
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
import { ScenarioComparison } from "@/components/ScenarioComparison";
import { RiskDecomposition } from "@/components/RiskDecomposition";
import { CorrelationMatrix } from "@/components/CorrelationMatrix";
import { MarketCondition } from "@/components/MarketCondition";
import { SkillCoach } from "@/components/SkillCoach";
import { MarketAnalysisDashboard } from "@/components/MarketAnalysisDashboard";
import { StrategyActionPoints } from "@/components/StrategyActionPoints";
import { PortfolioRebalance } from "@/components/PortfolioRebalance";
import { InvestmentStylePortrait } from "@/components/InvestmentStylePortrait";
import { ActionTriggerPanel } from "@/components/ActionTriggerPanel";
import { QuantumOptimizationCard } from "@/components/QuantumOptimizationCard";
import { ScenarioStrategyOptimization } from "@/components/ScenarioStrategyOptimization";
import { BrokerIntegrationPanel } from "@/components/BrokerIntegrationPanel";
import { BacktestSimulator } from "@/components/BacktestSimulator";
import { AlertList } from "@/components/AlertList";
import { SemiAutoTrading } from "@/components/SemiAutoTrading";
import { InvestmentReportComponent } from "@/components/InvestmentReport";
import { NotificationSettingsComponent } from "@/components/NotificationSettings";
import { StrategyTemplates } from "@/components/StrategyTemplates";
import { RiskManagementPanel } from "@/components/RiskManagementPanel";
import { TradingAutomation } from "@/components/TradingAutomation";
import { PositionSizing } from "@/components/PositionSizing";
import { WinPatternAnalysis } from "@/components/WinPatternAnalysis";
import { InvestmentRuleMonitor } from "@/components/InvestmentRuleMonitor";
import { FXMarketAnalysis } from "@/components/FXMarketAnalysis";
import { Footer } from "@/components/Footer";
import { formatCurrency, cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, Clock, RefreshCw, Sparkles, LayoutDashboard, LineChart, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

type TabType = "overview" | "analysis" | "tools";

export default function Home() {
  const { calculatedAssets, totalAssetsValue, totalProfitAndLoss, totalDailyChange, lastUpdated, isFetching } = usePortfolio();
  const { isDemo, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  return (
    <AuthGuard>
      <AlertToast />
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8 md:p-8 lg:p-12 transition-colors duration-300 font-sans">
        <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
          
          {isDemo && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-600 text-white px-4 py-3 md:px-6 md:py-4 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 border border-indigo-400/30"
            >
              <div className="flex items-center gap-3 text-center md:text-left">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <span className="font-black text-sm md:text-base text-white block">閲覧専用デモモード実行中</span>
                  <span className="text-[10px] md:text-xs text-indigo-100 font-medium">データの保存などは行えません。すべての機能を利用するにはログインしてください。</span>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button 
                  onClick={() => window.location.href = "/login"}
                  className="flex-1 md:flex-none bg-white text-indigo-600 hover:bg-indigo-50 text-[11px] md:text-xs font-black px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
                >
                  ログインして始める
                </button>
                <button 
                  onClick={async () => {
                    await logout();
                    window.location.href = "/login";
                  }}
                  className="flex-1 md:flex-none bg-indigo-500/30 hover:bg-indigo-500/50 text-white text-[11px] md:text-xs font-black px-6 py-2.5 rounded-xl transition-all border border-white/20 backdrop-blur-sm active:scale-95"
                >
                  デモを終了
                </button>
              </div>
            </motion.div>
          )}

          {isDemo && <DemoStory />}

          {/* 3-Second awareness Hero Section */}
          <header className="flex flex-col items-center text-center space-y-6 pt-12 pb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h1 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">総資産額</h1>
              <div className="text-5xl sm:text-7xl md:text-9xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums leading-none">
                {isFetching ? <Skeleton className="w-48 sm:w-64 h-16 sm:h-24 mx-auto opacity-20" /> : formatCurrency(totalAssetsValue)}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "px-6 py-4 md:px-10 md:py-5 rounded-[32px] md:rounded-[40px] border-2 flex items-center gap-4 md:gap-6 transition-all duration-500 shadow-xl",
                totalDailyChange >= 0 
                  ? "bg-emerald-50/50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/5 dark:border-emerald-500/20 dark:text-emerald-400 shadow-emerald-500/5" 
                  : "bg-rose-50/50 border-rose-100 text-rose-600 dark:bg-rose-500/5 dark:border-rose-500/20 dark:text-rose-400 shadow-rose-500/5"
              )}
            >
              <div className={cn(
                "w-10 h-10 md:w-14 md:h-14 rounded-[16px] md:rounded-[20px] flex items-center justify-center text-white shadow-lg shrink-0",
                totalDailyChange >= 0 ? "bg-emerald-500 shadow-emerald-500/20" : "bg-rose-500 shadow-rose-500/20"
              )}>
                {totalDailyChange >= 0 ? <TrendingUp size={24} className="md:w-8 md:h-8" /> : <TrendingDown size={24} className="md:w-8 md:h-8" />}
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">本日の損益</p>
                <p className="text-3xl md:text-4xl font-black tabular-nums leading-tight">
                  {totalDailyChange >= 0 ? "+" : ""}{formatCurrency(totalDailyChange)}
                  <span className="text-lg ml-3 opacity-80 font-bold">
                    ({totalDailyChange >= 0 ? "+" : ""}{(totalDailyChange / (totalAssetsValue - totalDailyChange) * 100).toFixed(2)}%)
                  </span>
                </p>
              </div>
            </motion.div>
          </header>

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
                <div className="space-y-12">
                  <MarketAnalysisDashboard />
                  <ActionTriggerPanel />
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Visualization & AI Advice */}
                    <div className="lg:col-span-2 space-y-8">
                      <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative group">
                        <div className="flex items-center justify-between mb-8">
                          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                            ポートフォリオ構成
                          </h2>
                        </div>
                        {isFetching ? (
                          <div className="h-[400px] flex items-center justify-center">
                            <Skeleton className="w-64 h-64 rounded-full opacity-10" />
                          </div>
                        ) : (
                          <PortfolioComposition />
                        )}
                      </div>
                      
                      <InvestmentAdvice />
                    </div>

                    {/* Right Column: Alerts */}
                    <div className="space-y-8">
                      <AlertList />
                    </div>
                  </div>

                  {/* Bottom: Assets Grid */}
                  <div className="space-y-6">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3 px-2">
                      <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                      保有資産一覧
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {isFetching ? (
                        <>
                          <AssetCardSkeleton />
                          <AssetCardSkeleton />
                          <AssetCardSkeleton />
                        </>
                      ) : calculatedAssets.length === 0 ? (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px] space-y-4">
                          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                            <DollarSign size={40} />
                          </div>
                          <div>
                            <p className="text-xl font-black text-slate-800 dark:text-white">資産がまだ登録されていません</p>
                            <p className="text-sm font-bold text-slate-500 mt-2">銘柄を登録して、ポートフォリオ分析を始めましょう。</p>
                          </div>
                          <button 
                            onClick={() => setActiveTab("tools")}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-3 rounded-full shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                          >
                            最初の銘柄を登録する
                          </button>
                        </div>
                      ) : (
                        Object.entries(
                          calculatedAssets.reduce((acc, asset) => {
                            if (!acc[asset.category]) acc[asset.category] = [];
                            acc[asset.category].push(asset);
                            return acc;
                          }, {} as Record<string, typeof calculatedAssets>)
                        ).map(([category, items]) => (
                          <div key={category} className="col-span-full mb-8">
                            <AssetCategoryGroup 
                              category={category} 
                              assets={items} 
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "analysis" && (
                <div className="space-y-8 md:space-y-12">
                  {/* Row 1: High Priority Insights & Risk */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8 items-start">
                    <div className="xl:col-span-8 space-y-6 md:space-y-8">
                      <InvestmentAdvice />
                      <InvestmentRuleMonitor />
                    </div>
                    <div className="xl:col-span-4 space-y-6 md:space-y-8">
                      <div className="bg-indigo-600 rounded-[32px] p-6 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                          <Sparkles size={120} />
                        </div>
                        <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                          <Sparkles size={20} className="text-amber-300" />
                          AI 投資家アシスタント
                        </h3>
                        <p className="text-xs font-bold text-indigo-100 leading-relaxed mb-4">
                          あなたのポートフォリオを24時間監視し、市場動向に合わせた最適なアクションをリアルタイムで提案します。
                        </p>
                        <button className="w-full py-3 bg-white text-indigo-600 rounded-2xl text-xs font-black hover:bg-indigo-50 transition-colors shadow-lg active:scale-95">
                          設定を確認する
                        </button>
                      </div>
                      <RiskAnalysis />
                    </div>
                  </div>

                  {/* Row 2: Optimization & Automation (Middle Priority) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 items-start">
                    <div className="xl:col-span-2">
                      <PortfolioOptimization />
                    </div>
                    <div className="xl:col-span-1">
                      <TradingAutomation />
                    </div>
                  </div>

                  {/* Row 3: Simulations & Advanced Logic (Bento Grid Style) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 auto-rows-min">
                    <div className="md:col-span-2 lg:col-span-1 xl:col-span-1">
                      <ScenarioComparison />
                    </div>
                    <div className="md:col-span-1 lg:col-span-1 xl:col-span-1">
                      <ScenarioStrategyOptimization />
                    </div>
                    <div className="md:col-span-2 lg:col-span-1 xl:col-span-2">
                      <BacktestSimulator />
                    </div>
                    <div className="md:col-span-1 lg:col-span-1 xl:col-span-1">
                      <QuantumOptimizationCard />
                    </div>
                    <div className="md:col-span-1 lg:col-span-1 xl:col-span-1">
                      <StrategyActionPoints />
                    </div>
                    <div className="md:col-span-1 lg:col-span-1 xl:col-span-1">
                      <SemiAutoTrading />
                    </div>
                    <div className="md:col-span-1 lg:col-span-1 xl:col-span-1">
                      <PortfolioRebalance />
                    </div>
                    <div className="md:col-span-2 lg:col-span-1 xl:col-span-2">
                      <FXMarketAnalysis />
                    </div>
                  </div>

                  {/* Row 4: Secondary Context & Style Analysis */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                    <MarketCondition />
                    <MarketSentiment />
                    <WinPatternAnalysis />
                    <InvestmentStylePortrait />
                    <InvestmentStrategyCard />
                    <StrategyTemplates />
                    <RiskDecomposition />
                    <CorrelationMatrix />
                    <BehaviorInsight />
                    <SkillCoach />
                    <div className="md:col-span-2 lg:col-span-1 xl:col-span-1">
                      <InvestmentReportComponent />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "tools" && (
                <div className="space-y-8 md:space-y-12">
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8 items-start">
                    {/* Data Management & Integration */}
                    <div className="xl:col-span-8 space-y-6 md:space-y-8">
                      <BrokerIntegrationPanel />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <RiskManagementPanel />
                        <PositionSizing />
                      </div>
                      <NotificationSettingsComponent />
                    </div>

                    {/* Settings & External Data Sidebar */}
                    <div className="xl:col-span-4 space-y-6 md:space-y-8">
                      <AlertSettings />
                      <UserRiskSettings />
                      <EconomicCalendar />
                      <NewsPanel />
                      <MacroDashboard />
                    </div>
                  </div>

                  {/* Transactions Section */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8 items-start">
                    <div className="xl:col-span-4">
                      <TransactionForm />
                    </div>
                    <div className="xl:col-span-8">
                      <TransactionList />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <Footer />
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
