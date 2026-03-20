"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { usePortfolio } from "@/context/PortfolioContext";
import { AuthGuard } from "@/components/AuthGuard";
import { AlertToast } from "@/components/AlertToast";
import { AssetDetailHeader } from "@/components/detail/AssetDetailHeader";
import { AssetPriceChart } from "@/components/detail/AssetPriceChart";
import { InvestmentAdvice } from "@/components/InvestmentAdvice";
import { NewsPanel } from "@/components/NewsPanel";
import { TransactionList } from "@/components/TransactionList";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Newspaper, History, Briefcase } from "lucide-react";

type TabType = "overview" | "analysis" | "news";

export default function AssetDetailPage() {
  const params = useParams();
  const symbol = params?.symbol as string;
  const { calculatedAssets } = usePortfolio();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const asset = calculatedAssets.find(a => a.symbol === symbol);

  if (!asset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-4">
          <p className="text-xl font-bold text-slate-500">資産が見つかりませんでした</p>
          <button onClick={() => window.location.href = "/"} className="text-indigo-500 font-bold hover:underline">
            ダッシュボードへ戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <AlertToast />
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 lg:p-12 transition-colors duration-300 font-sans">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <AssetDetailHeader asset={asset} />

          {/* Detailed Tab Navigation */}
          <div className="flex p-1.5 bg-slate-200/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-3xl w-fit sticky top-4 z-40 shadow-lg">
            <DetailTabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} Icon={Briefcase} label="概要" />
            <DetailTabButton active={activeTab === "analysis"} onClick={() => setActiveTab("analysis")} Icon={LineChart} label="分析" />
            <DetailTabButton active={activeTab === "news"} onClick={() => setActiveTab("news")} Icon={Newspaper} label="ニュース" />
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <AssetPriceChart assetSymbol={asset.symbol} basePrice={asset.currentPrice} />
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-3 mb-6">
                        <History className="w-5 h-5 text-indigo-500" />
                        取引・保有履歴
                      </h3>
                      <TransactionList filterAssetId={asset.id} hideHeader />
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                      <h3 className="text-lg font-black text-slate-800 dark:text-white">資産サマリー</h3>
                      <div className="space-y-4">
                        <SummaryItem label="保有数量" value={asset.quantity.toLocaleString()} unit={asset.category === "FX" ? "通貨" : asset.category === "仮想通貨" ? "枚" : "株"} />
                        <SummaryItem label="取得単価(平均)" value={formatCurrency(asset.averageCost)} />
                        <SummaryItem label="投資元本額" value={formatCurrency(asset.averageCost * asset.quantity)} />
                        <SummaryItem label="時価評価" value={formatCurrency(asset.evaluatedValue)} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "analysis" && (
                <div className="space-y-8">
                  <PerformanceMetrics filterAssetId={asset.id} />
                  <InvestmentAdvice />
                </div>
              )}

              {activeTab === "news" && (
                <div className="max-w-4xl mx-auto">
                  <NewsPanel filterKeyword={asset.name} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </AuthGuard>
  );
}

function DetailTabButton({ active, onClick, Icon, label }: { active: boolean, onClick: () => void, Icon: React.ElementType, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-black transition-all duration-300 relative",
        active 
          ? "bg-white dark:bg-slate-800 text-indigo-500 shadow-sm" 
          : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-800/50"
      )}
    >
      <Icon size={18} />
      <span>{label}</span>
      {active && (
        <motion.div 
          layoutId="detail-tab-underline"
          className="absolute inset-0 bg-white dark:bg-slate-800 rounded-2xl -z-10 shadow-md"
        />
      )}
    </button>
  );
}

function SummaryItem({ label, value, unit }: { label: string, value: string, unit?: string }) {
  return (
    <div className="flex justify-between items-end border-b border-slate-50 dark:border-slate-800 pb-2">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-lg font-black text-slate-800 dark:text-white tabular-nums">
        {value}
        {unit && <span className="text-xs ml-1 opacity-60 font-bold">{unit}</span>}
      </span>
    </div>
  );
}
