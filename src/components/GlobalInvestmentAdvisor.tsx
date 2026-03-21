"use client";

import React, { useState, useMemo } from "react";
import { 
  AdvisorRecommendation, 
  RecommendedAsset, 
  StockIndicator, 
  FXIndicator, 
  CryptoIndicator 
} from "@/types/advisor";
import { generateProfessionalAdvice } from "@/lib/advisorUtils";
import { 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle, 
  Search, 
  ArrowRight, 
  Wallet, 
  BarChart4, 
  Globe2, 
  Zap, 
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatCurrency } from "@/lib/utils";

export const GlobalInvestmentAdvisor = () => {
  const [budget, setBudget] = useState<number>(1000000);
  const [riskPreference, setRiskPreference] = useState<"aggressive" | "conservative" | "balanced">("balanced");
  const [recommendation, setRecommendation] = useState<AdvisorRecommendation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    // 演出としての遅延
    setTimeout(() => {
      const res = generateProfessionalAdvice(budget, riskPreference);
      setRecommendation(res);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm relative group">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
        <Globe2 size={200} />
      </div>

      <div className="p-6 md:p-10 space-y-10 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-left">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-xl shadow-indigo-500/20">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white">グローバル投資アドバイザー</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Multi-Asset Intelligent Analysis</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            {(["balanced", "aggressive", "conservative"] as const).map((pref) => (
              <button
                key={pref}
                onClick={() => setRiskPreference(pref)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                  riskPreference === pref 
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-900/50" 
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                )}
              >
                {pref === "balanced" ? "バランス" : pref === "aggressive" ? "積極" : "安定"}
              </button>
            ))}
          </div>
        </div>

        {/* Setup Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-8 space-y-3">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
              <Wallet size={14} className="text-indigo-500" />
              投資可能予算 (現在の余力)
            </label>
            <div className="relative">
              <input 
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-4 text-xl font-black text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-400"
                placeholder="金額を入力してください..."
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">円</span>
            </div>
          </div>
          <div className="md:col-span-4">
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-[18px] bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isGenerating ? (
                <Zap size={20} className="animate-spin text-amber-300" />
              ) : (
                <Search size={20} />
              )}
              {isGenerating ? "分析中..." : "最適な投資先を探す"}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {recommendation && !isGenerating ? (
            <motion.div 
              key="recommendation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              {/* Market Context Banner */}
              <div className="p-6 bg-indigo-50 dark:bg-indigo-500/5 rounded-[32px] border border-indigo-100 dark:border-indigo-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none">
                  <BarChart4 size={80} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-indigo-500 border border-indigo-100 dark:border-indigo-900 border-b-2">
                    <Globe2 size={24} />
                  </div>
                  <div className="space-y-2 text-left">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white">現在のマーケット環境</h3>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed break-words">
                      {recommendation.marketContext}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommendation Summary */}
              <div className="text-left space-y-3 px-2">
                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                  <TrendingUp size={20} className="text-emerald-500" />
                  AIが提案するポートフォリオ構成
                </h3>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 break-words">
                  {recommendation.summary}
                </p>
              </div>

              {/* Assets Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {recommendation.assets.map((asset, idx) => (
                  <AssetRecommendCard key={asset.symbol} asset={asset} index={idx} />
                ))}
              </div>

              {/* Budget Footnote */}
              <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-start px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">提案の総投資見込額</span>
                    <span className="text-sm font-black text-slate-700 dark:text-slate-200">{formatCurrency(recommendation.budgetUsed)}</span>
                  </div>
                  <div className="flex flex-col items-start px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">投資余力の残り</span>
                    <span className="text-sm font-black text-emerald-500">{formatCurrency(recommendation.remainingBudget)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <ShieldCheck size={12} className="text-indigo-500" />
                  AIによる総合判断に基づいた提案です
                </div>
              </div>
            </motion.div>
          ) : isGenerating ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-6">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-900 rounded-full" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-t-indigo-600 rounded-full"
                />
              </div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">分析アルゴリズムを実行中</p>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
              <BarChart4 size={64} className="text-slate-300 dark:text-slate-700 mb-6" />
              <p className="text-sm font-bold text-slate-500 max-w-xs">予算に合わせて、株・FX・仮想通貨から最適な投資先を選定します。</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const AssetRecommendCard = ({ asset, index }: { asset: RecommendedAsset, index: number }) => {
  const isStock = asset.category === "日本株" || asset.category === "外国株";
  const isFX = asset.category === "FX";
  const isCrypto = asset.category === "仮想通貨";

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[28px] p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all text-left relative overflow-hidden group/card"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border",
              isStock ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" :
              isFX ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" :
              "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20"
            )}>
              {asset.category}
            </span>
            {asset.priority === "high" && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black rounded-lg border border-amber-100 dark:border-amber-500/20">
                ★ 優先度:高
              </span>
            )}
          </div>
          <h4 className="text-xl font-black text-slate-800 dark:text-white mt-2 group-hover/card:text-indigo-600 dark:group-hover/card:text-indigo-400 transition-colors">
            {asset.name}
            <span className="text-xs font-bold text-slate-400 ml-2">({asset.symbol})</span>
          </h4>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
           <ArrowRight size={18} className="text-slate-400 group-hover/card:translate-x-1 transition-transform" />
        </div>
      </div>

      <div className="space-y-6">
        {/* Indicators Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {isStock && (
            <>
              <IndicatorBox label="PER" value={(asset.indicators as StockIndicator).per?.toString() || "-"} sub="倍" />
              <IndicatorBox label="PBR" value={(asset.indicators as StockIndicator).pbr?.toString() || "-"} sub="倍" />
              <IndicatorBox label="ROE" value={(asset.indicators as StockIndicator).roe?.toString() || "-"} sub="%" />
              <IndicatorBox label="配当利回" value={(asset.indicators as StockIndicator).dividendYield?.toString() || "-"} sub="%" highlight />
            </>
          )}
          {isFX && (
            <>
              <IndicatorBox label="RSI" value={(asset.indicators as FXIndicator).rsi?.toString() || "-"} />
              <IndicatorBox label="スワップ" value={(asset.indicators as FXIndicator).swapPoint?.toString() || "-"} sub="pt" highlight />
              <IndicatorBox label="シグナル" value={(asset.indicators as FXIndicator).technicalSignal === "buy" ? "買い" : "中立"} highlight />
            </>
          )}
          {isCrypto && (
            <>
              <IndicatorBox label="RSI" value={(asset.indicators as CryptoIndicator).rsi?.toString() || "-"} />
              <IndicatorBox label="ドミナンス" value={(asset.indicators as CryptoIndicator).dominance?.toString() || "-"} sub="%" />
              <IndicatorBox label="トレンド" value={(asset.indicators as CryptoIndicator).trend === "bullish" ? "強気" : "レンジ"} highlight />
            </>
          )}
        </div>

        {/* Action / Detail Section */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
            <span>AI分析・推奨理由</span>
            <span className="text-indigo-500 flex items-center gap-1">
              <Zap size={12} />
              AI INSIGHT
            </span>
          </div>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed break-words">
            {asset.reason}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">最小投資目安額</span>
            <span className="text-lg font-black text-slate-800 dark:text-white tabular-nums">
              {formatCurrency(asset.minPurchaseAmount)}
            </span>
          </div>
          <button className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all">
            詳細を詳しく見る
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const IndicatorBox = ({ label, value, sub, highlight }: { label: string, value: string, sub?: string, highlight?: boolean }) => (
  <div className={cn(
    "px-3 py-2 rounded-xl border flex flex-col items-center justify-center transition-all",
    highlight 
      ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20" 
      : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
  )}>
    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">{label}</span>
    <div className="flex items-baseline gap-0.5">
      <span className={cn(
        "text-xs font-black tabular-nums",
        highlight ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300"
      )}>
        {value}
      </span>
      {sub && <span className="text-[8px] font-bold text-slate-400">{sub}</span>}
    </div>
  </div>
);
