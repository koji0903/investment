"use client";

import React from "react";
import { StockJudgment, TradingSuitability, FinancialHealth } from "@/types/stock";
import { 
  X, 
  Zap, 
  BarChart, 
  Scale, 
  Coins, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldCheck,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  StockSignalBadge, 
  StockCertaintyIndicator, 
  StockSuitabilityBadge,
  FinancialHealthBadge,
  SyncStatusIndicator
} from "./StockUIComponents";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface StockDetailModalProps {
  judgment: StockJudgment | null;
  onClose: () => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({ judgment, onClose }) => {
  if (!judgment) return null;

  const chartColor = judgment.technicalTrend === "bullish" ? "#10b981" : judgment.technicalTrend === "bearish" ? "#f43f5e" : "#6366f1";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden bg-slate-900/70 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          className="relative w-full max-w-5xl bg-white dark:bg-slate-950 rounded-[48px] shadow-2xl overflow-hidden border border-white/20 dark:border-slate-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-8 md:p-10 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-[28px] bg-slate-900 text-white flex items-center justify-center text-2xl font-black shadow-2xl shadow-slate-900/40 border border-slate-800">
                {judgment.ticker}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{judgment.companyName}</h2>
                  <StockSignalBadge label={judgment.signalLabel} />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{judgment.sector}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                  <span className="text-xl font-black text-indigo-500 tabular-nums">{judgment.currentPrice.toLocaleString()}円</span>
                  <SyncStatusIndicator status={judgment.syncStatus} />
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-4 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all text-slate-400 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-8 md:p-10 space-y-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
            
            {/* Analysis Summary Bento */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Score Circle & AI Advice */}
              <div className="lg:col-span-8 bg-slate-900 dark:bg-slate-900 rounded-[40px] p-10 text-white flex flex-col md:flex-row items-center gap-10 shadow-xl shadow-slate-900/20">
                 <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="80" cy="80" r="72" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                      <motion.circle 
                        initial={{ strokeDashoffset: 452.4 }}
                        animate={{ strokeDashoffset: 452.4 - (452.4 * (judgment.totalScore + 100) / 200) }}
                        transition={{ duration: 2, ease: "circOut" }}
                        cx="80" cy="80" r="72" fill="none" stroke={chartColor} strokeWidth="12" strokeDasharray="452.4" strokeLinecap="round" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-white">{judgment.totalScore > 0 ? `+${judgment.totalScore}` : judgment.totalScore}</span>
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">Global Score</span>
                    </div>
                 </div>
                 <div className="flex-1 space-y-6">
                    <div className="space-y-2">
                       <h4 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">AI Investment Protocol</h4>
                       <p className="text-lg font-bold text-white leading-relaxed tracking-tight">
                         「{judgment.summaryComment}」
                       </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                       <StockCertaintyIndicator certainty={judgment.certainty} />
                       <div className="h-6 w-px bg-white/10" />
                       <StockSuitabilityBadge suitability={judgment.holdSuitability} />
                    </div>
                 </div>
              </div>

              {/* Valuation Bento (The Numbers) */}
              <div className="lg:col-span-4 grid grid-rows-3 gap-4">
                 <MetricCard label="PER (予想)" value={`${judgment.valuationMetrics?.per.toFixed(1)}倍`} sub={(judgment.valuationMetrics?.per ?? 15) < 15 ? "割安水準" : "標準水準"} icon={<Activity size={16} />} />
                 <MetricCard label="PBR" value={`${judgment.valuationMetrics?.pbr.toFixed(2)}倍`} sub={(judgment.valuationMetrics?.pbr ?? 1) < 1.0 ? "解散価値割れ" : "資産プレミアム"} icon={<Target size={16} />} />
                 <MetricCard label="配当利回り" value={`${judgment.valuationMetrics?.dividendYield.toFixed(2)}%`} sub={(judgment.valuationMetrics?.dividendYield ?? 0) > 3.5 ? "高配当" : "標準還元"} icon={<Coins size={16} />} />
              </div>
            </div>

            {/* Chart Section */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-8 md:p-10 space-y-6">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500 rounded-xl text-white shadow-xl shadow-indigo-500/20">
                      <TrendingUp size={20} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">株価推移分析 (180日)</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColor }} />
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Adjusted Close</span>
                    </div>
                  </div>
               </div>
               
               <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={judgment.chartData}>
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                          minTickGap={30}
                        />
                        <YAxis 
                          hide={false}
                          domain={['auto', 'auto']}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', color: '#fff' }}
                          itemStyle={{ color: chartColor, fontWeight: 'black' }}
                          labelStyle={{ opacity: 0.5, fontSize: '10px' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke={chartColor} 
                          strokeWidth={4} 
                          fillOpacity={1} 
                          fill="url(#chartGradient)" 
                          animationDuration={2000}
                        />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Detailed Analysis Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <DetailedSection title="テクニカル / 需給" icon={<Zap className="text-indigo-500" />} score={judgment.technicalScore} reasons={judgment.technicalReasons} />
              <DetailedSection title="ファンダメンタル / 成長性" icon={<BarChart className="text-emerald-500" />} score={judgment.fundamentalScore} reasons={judgment.fundamentalReasons} />
              <DetailedSection title="バリュエーション / 割安度" icon={<Scale className="text-amber-500" />} score={judgment.valuationScore} reasons={judgment.valuationReasons} />
              <DetailedSection title="株主還元 / 配当" icon={<Coins className="text-rose-500" />} score={judgment.shareholderReturnScore} reasons={judgment.shareholderReasons} />
            </div>

            {/* Disclaimer */}
            <div className="flex items-center gap-5 p-8 bg-slate-50 dark:bg-slate-900/80 rounded-[32px] border border-slate-100 dark:border-slate-800">
               <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0 border border-slate-100 dark:border-slate-700">
                  <Info size={24} />
               </div>
               <div className="space-y-1">
                  <h5 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Risk Disclosure & Accuracy</h5>
                  <p className="text-[11px] font-bold text-slate-400 leading-normal">
                    本分析は Yahoo Finance の一次データに基づき算出されています。PER/PBR等の指標は市場価格の変動によりリアルタイムに変化するため、最終的な投資判断はご自身の責任で行ってください。
                  </p>
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const MetricCard = ({ label, value, sub, icon }: { label: string, value: string, sub: string, icon: React.ReactNode }) => (
  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between group hover:bg-white dark:hover:bg-slate-800 transition-all cursor-default">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-slate-400 group-hover:text-indigo-500 transition-colors shadow-sm">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">{label}</span>
        <span className="text-sm font-black text-slate-800 dark:text-white leading-none tracking-tight">{value}</span>
      </div>
    </div>
    <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
      {sub}
    </span>
  </div>
);

const DetailedSection = ({ title, icon, score, reasons }: { title: string, icon: React.ReactNode, score: number, reasons: string[] }) => (
  <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[32px] space-y-6">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        {icon}
        <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">{title}</h4>
      </div>
      <div className={cn(
        "px-3 py-1 rounded-full text-sm font-black tabular-nums",
        score > 20 ? "text-emerald-500 bg-emerald-500/10" : 
        score < -20 ? "text-rose-500 bg-rose-500/10" : 
        "text-slate-500 bg-slate-100 dark:bg-slate-800"
      )}>
        {score > 0 ? `+${score}` : score}
      </div>
    </div>
    <ul className="space-y-3">
      {reasons.map((r, i) => (
        <li key={i} className="flex items-start gap-3">
          <CheckCircle2 size={12} className="mt-1 text-slate-300 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">{r}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default StockDetailModal;
