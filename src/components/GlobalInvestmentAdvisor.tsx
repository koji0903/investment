"use client";

import React, { useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { generateProfessionalAdvice } from "@/lib/advisorUtils";
import { AdvisorRecommendation, RecommendedAsset } from "@/types/advisor";
import { 
  Sparkles, 
  Target, 
  TrendingUp, 
  ShieldAlert, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  LineChart,
  Lightbulb,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export const GlobalInvestmentAdvisor = () => {
  const { totalAssetsValue } = usePortfolio();
  const [budget, setBudget] = useState<number>(100000);
  const [riskPreference, setRiskPreference] = useState<"積極" | "安定" | "バランス">("バランス");
  const [recommendation, setRecommendation] = useState<AdvisorRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);

  const handleAnalize = () => {
    setLoading(true);
    // AI分析をシミュレート
    setTimeout(() => {
      const result = generateProfessionalAdvice(budget, riskPreference);
      setRecommendation(result);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white relative">
        <div className="absolute top-0 right-0 p-8 opacity-20">
          <Sparkles size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Sparkles size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">グローバル投資アドバイザー</h2>
              <p className="text-sm font-medium text-white/80 mt-1 uppercase tracking-widest">Multi-Asset Intelligent Analysis</p>
            </div>
          </div>
          <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/10">
            {(["安定", "バランス", "積極"] as const).map(pref => (
              <button
                key={pref}
                onClick={() => setRiskPreference(pref)}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                  riskPreference === pref ? "bg-white text-indigo-600 shadow-lg" : "text-white/70 hover:text-white"
                )}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Target size={14} /> 投資可能予算 (現在の余力)
            </label>
            <div className="relative">
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 text-xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                placeholder="100,000"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-slate-400">円</span>
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAnalize}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black py-4 px-8 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all h-[62px]"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" /> <span>プロのAIが分析中...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} /> <span>最適な投資先を診断する</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Area */}
        <AnimatePresence mode="wait">
          {recommendation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Market Context */}
              <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-4">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-indigo-600 shadow-sm border border-indigo-50 dark:border-indigo-900/50">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-300 mb-1">現在のマーケット環境と戦略</h4>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                    {recommendation.marketContext}
                  </p>
                </div>
              </div>

              {/* Asset List */}
              <div className="space-y-6">
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <TrendingUp size={20} className="text-emerald-500" /> AIが提案するポートフォリオ構成
                </h3>
                
                <div className="grid grid-cols-1 gap-6">
                  {recommendation.assets.map((asset, idx) => (
                    <div 
                      key={asset.symbol}
                      className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden hover:shadow-2xl hover:border-indigo-500/30 transition-all duration-300"
                    >
                      {/* Basic Info Header */}
                      <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white shadow-lg",
                            asset.category === "日本株" ? "bg-red-500" :
                            asset.category === "外国株" ? "bg-blue-500" :
                            asset.category === "FX" ? "bg-indigo-500" : "bg-amber-500"
                          )}>
                            {asset.category[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">{asset.category}</span>
                              <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full">信頼度 {asset.confidence}%</span>
                            </div>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white">{asset.name}</h4>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{asset.symbol}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">現在価格</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white">
                              {asset.category === "外国株" || asset.category === "FX" ? "$" : "¥"}
                              {asset.price.toLocaleString()}
                            </p>
                            <p className={cn("text-xs font-bold", asset.change24h >= 0 ? "text-emerald-500" : "text-rose-500")}>
                              {asset.change24h >= 0 ? "+" : ""}{asset.change24h}%
                            </p>
                          </div>
                          <button 
                            onClick={() => setExpandedAsset(expandedAsset === asset.symbol ? null : asset.symbol)}
                            className="p-4 bg-slate-50 dark:bg-slate-950 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-2xl transition-all"
                          >
                            {expandedAsset === asset.symbol ? <ChevronUp size={24} className="text-indigo-600" /> : <ChevronDown size={24} className="text-slate-400" />}
                          </button>
                        </div>
                      </div>

                      {/* Detailed Analysis Section */}
                      <AnimatePresence>
                        {expandedAsset === asset.symbol && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30"
                          >
                            <div className="p-6 md:p-8 space-y-8">
                              {/* Professional Judgement Card */}
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                                  <div className="flex items-center gap-3 text-indigo-600 mb-4">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg"><Lightbulb size={20} /></div>
                                    <h5 className="font-black text-sm uppercase">プロの判断根拠</h5>
                                  </div>
                                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                    「{asset.rationale}」
                                  </p>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                                  <div className="flex items-center gap-3 text-emerald-600 mb-4">
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg"><LineChart size={20} /></div>
                                    <h5 className="font-black text-sm uppercase">今後の成長見込み</h5>
                                  </div>
                                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {asset.expectedGrowth}
                                  </p>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                                  <div className="flex items-center gap-3 text-rose-500 mb-4">
                                    <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-lg"><ShieldAlert size={20} /></div>
                                    <h5 className="font-black text-sm uppercase">出口・撤退戦略</h5>
                                  </div>
                                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {asset.exitStrategy}
                                  </p>
                                </div>
                              </div>

                              {/* Indicators & Explanations */}
                              <div className="space-y-4">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                                  <Target size={12} /> 分析に使用した基準指標と用語解説
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {Object.entries(asset.indicators).map(([key, val]) => (
                                    <div key={key} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 group/indicator">
                                      <div className="flex items-start justify-between mb-2">
                                        <p className="text-[10px] font-black text-indigo-500 uppercase">{key}</p>
                                        <div className="relative group/tooltip">
                                          <HelpCircle size={14} className="text-slate-300 hover:text-indigo-400 transition-colors cursor-help" />
                                          {asset.indicatorExplanations?.[key] && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3 bg-slate-900 text-white text-[10px] leading-relaxed rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl border border-white/10">
                                              {asset.indicatorExplanations[key]}
                                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-xl font-black text-slate-800 dark:text-white">
                                        {key === "technicalSignal" || key === "trend" ? (
                                          <span className="text-sm md:text-base">{val as string}</span>
                                        ) : (
                                          <span>{val as number}</span>
                                        )}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="flex justify-end">
                                <button className="flex items-center gap-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:gap-3 transition-all">
                                  この銘柄をトレードプランに追加する <ArrowUpRight size={14} />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Initial Empty State */}
        {!recommendation && !loading && (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-950 rounded-[40px] flex items-center justify-center text-slate-300">
              <Sparkles size={48} />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-xl font-black text-slate-800 dark:text-white">あなたのための最適解をAIが導きます</h3>
              <p className="text-sm font-bold text-slate-400 leading-relaxed">
                予算とリスク嗜好を入力して分析を開始してください。世界の市場データに基づいたプロフェッショナルな推奨構成を提案します。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
