"use client";

import React, { useState, useEffect, useMemo } from "react";
import { InvestmentReport } from "@/types";
import { subscribeReports, saveReport } from "@/lib/db";
import { generateReportData } from "@/lib/reportUtils";
import { getPerformanceMetrics } from "@/lib/analyticsUtils";
import { generateTrendData } from "@/lib/chartUtils";
import { useAuth } from "@/context/AuthContext";
import { usePortfolio } from "@/context/PortfolioContext";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Calendar, TrendingUp, TrendingDown, Sparkles, ChevronRight, Download, Plus, Clock, PieChart } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

export function InvestmentReportComponent() {
  const { user, isDemo } = useAuth();
  const { calculatedAssets, totalAssetsValue } = usePortfolio();
  const [reports, setReports] = useState<InvestmentReport[]>([]);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeReports(user.uid, (data) => {
      setReports(data);
      if (data.length > 0 && !activeReportId) {
        setActiveReportId(data[0].id);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const activeReport = useMemo(() => 
    reports.find(r => r.id === activeReportId) || reports[0], 
    [reports, activeReportId]
  );

  const handleGenerateReport = async (type: "weekly" | "monthly") => {
    if (!user || isDemo) return;
    setIsGenerating(true);
    try {
      const mockTrend = generateTrendData(totalAssetsValue, 30);
      const metrics = getPerformanceMetrics(calculatedAssets, mockTrend);
      const reportData = generateReportData(type, calculatedAssets, metrics);
      await saveReport(user.uid, reportData);
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (reports.length === 0 && !isGenerating) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[32px] p-12 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-6">
        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto text-indigo-500">
          <FileText size={40} />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">運用レポートはまだありません</h3>
          <p className="text-sm font-bold text-slate-500">
            あなたの資産状況を分析し、改善提案を含む詳細なレポートを生成しましょう。
          </p>
        </div>
        {!isDemo && (
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => handleGenerateReport("weekly")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-3 rounded-full shadow-lg transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus size={18} />
              週次レポートを作成
            </button>
            <button
              onClick={() => handleGenerateReport("monthly")}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black px-8 py-3 rounded-full transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus size={18} />
              月次レポートを作成
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Generation Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
          資産運用レポート
        </h2>
        {!isDemo && (
          <div className="flex gap-3">
            <button
              onClick={() => handleGenerateReport("weekly")}
              disabled={isGenerating}
              className="text-xs font-black bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
            >
              <Calendar size={14} className="text-indigo-500" />
              週次生成
            </button>
            <button
              onClick={() => handleGenerateReport("monthly")}
              disabled={isGenerating}
              className="text-xs font-black bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
            >
              <PieChart size={14} className="text-emerald-500" />
              月次生成
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Report List */}
        <div className="lg:col-span-1 space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 mb-4">過去のレポート</p>
          <div className="max-h-[600px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => setActiveReportId(report.id)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group",
                  activeReportId === report.id
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-500/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    activeReportId === report.id ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800"
                  )}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black">{report.type === "weekly" ? "週次" : "月次"}レポート</p>
                    <p className="text-[10px] opacity-70 font-bold">{new Date(report.date).toLocaleDateString('ja-JP')}</p>
                  </div>
                </div>
                <ChevronRight size={16} className={cn("opacity-0 group-hover:opacity-100 transition-all", activeReportId === report.id && "opacity-100")} />
              </button>
            ))}
          </div>
        </div>

        {/* Main Content: Active Report Details */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeReport && (
              <motion.div
                key={activeReport.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                <div className="p-8 md:p-12 space-y-10">
                  {/* Report Hero */}
                  <div className="flex flex-col md:flex-row justify-between gap-8 border-b border-slate-100 dark:border-slate-800 pb-10">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          activeReport.type === "weekly" ? "bg-indigo-500 text-white" : "bg-emerald-500 text-white"
                        )}>
                          {activeReport.type === "weekly" ? "Weekly" : "Monthly"} Report
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          生成日: {new Date(activeReport.createdAt).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                        {new Date(activeReport.date).getMonth() + 1}月 {activeReport.type === "weekly" ? "第" + Math.ceil(new Date(activeReport.date).getDate() / 7) + "週" : ""} 運用報告書
                      </h3>
                    </div>
                    <div className="flex flex-col items-end justify-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">総資産額 (集計時)</p>
                      <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(activeReport.totalValue)}
                      </p>
                    </div>
                  </div>

                  {/* Key Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <TrendingUp size={14} className="text-indigo-500" />
                        パフォーマンス
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className={cn(
                          "text-4xl font-black tabular-nums",
                          activeReport.performancePct >= 0 ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {activeReport.performancePct >= 0 ? "+" : ""}{activeReport.performancePct}%
                        </span>
                        <span className="text-sm font-bold text-slate-400">期間中</span>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-bold text-slate-500">
                          純利益: <span className={cn("font-black ml-1", activeReport.profitAndLoss >= 0 ? "text-emerald-500" : "text-rose-500")}>
                            {activeReport.profitAndLoss >= 0 ? "+" : ""}{formatCurrency(activeReport.profitAndLoss)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Sparkles size={14} className="text-amber-500" />
                        AI サマリー
                      </p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-normal italic break-words">
                        「{activeReport.summary}」
                      </p>
                    </div>
                  </div>

                  {/* Advice Section */}
                  <div className="space-y-6">
                    <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                      <Plus size={16} className="text-indigo-500" />
                      今後の改善提案
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeReport.advice.map((item, idx) => (
                        <div key={idx} className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                          <h5 className="text-sm font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                            <ChevronRight size={14} className="text-indigo-500" />
                            {item.title}
                          </h5>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-normal break-words">
                            {item.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Asset Snapshot */}
                  <div className="space-y-6">
                    <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                      <PieChart size={16} className="text-indigo-500" />
                      主要資産の状況
                    </h4>
                    <div className="space-y-3">
                      {activeReport.assetDistribution.map((asset, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <div className="w-24 text-xs font-bold text-slate-500 truncate">{asset.name}</div>
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(asset.value / activeReport.totalValue) * 100}%` }}
                              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                            />
                          </div>
                          <div className="w-24 text-right text-xs font-black text-slate-700 dark:text-slate-200 tabular-nums">
                            {((asset.value / activeReport.totalValue) * 100).toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 flex justify-end gap-4 border-t border-slate-100 dark:border-slate-800">
                    <button className="text-xs font-black text-slate-400 hover:text-indigo-500 transition-colors flex items-center gap-2">
                      <Download size={14} />
                      PDFをエクスポート
                    </button>
                    <button className="text-xs font-black text-slate-400 hover:text-indigo-500 transition-colors flex items-center gap-2">
                      <Clock size={14} />
                      過去の記録と照合
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
