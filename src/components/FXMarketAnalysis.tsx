"use client";

import React, { useState, useEffect } from "react";
import { Globe, Calendar, Zap, TrendingUp, TrendingDown, Info, ArrowRight, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  ReferenceLine,
  LineChart,
  Line
} from "recharts";
import { cn } from "@/lib/utils";
import { getEconomicCalendar, calculateCurrencyStrengthFromAnalysis, generateFXAdviceFromData, EconomicIndicator } from "@/lib/fxUtils";

export const FXMarketAnalysis = () => {
  const [indicators, setIndicators] = useState<EconomicIndicator[]>([]);
  const [fxAnalysis, setFxAnalysis] = useState<any[]>([]);
  const [strengths, setStrengths] = useState<any[]>([]);
  const [advice, setAdvice] = useState("データを取得しています...");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/market-data");
      const data = await res.json();
      
      if (data.fxAnalysis) {
        setFxAnalysis(data.fxAnalysis);
        const str = calculateCurrencyStrengthFromAnalysis(data.fxAnalysis);
        setStrengths(str);
        
        const econ = getEconomicCalendar();
        setIndicators(econ);
        setAdvice(generateFXAdviceFromData(econ, data.fxAnalysis));
      }
    } catch (error) {
      console.error("FX data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // 1分ごとに更新
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm transition-all hover:shadow-md">
      <div className="p-5 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-500 rounded-[20px] text-white shadow-lg shadow-rose-500/20 shrink-0">
              <Globe size={24} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">FX 高度マーケット分析</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mt-1">Advanced Currency Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-full border border-rose-100 dark:border-rose-500/20">
            <Zap size={14} className={cn("text-rose-500", loading && "animate-pulse")} />
            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider whitespace-nowrap">
              {loading ? "データ取得中..." : "LIVE分析中"}
            </span>
          </div>
        </div>

        {/* Main Content Grid - Break to 1 column earlier for more space */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-12">
          
          {/* 通貨強弱チャート */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" />
                通貨強弱（相対騰落率）
              </h3>
              <span className="text-[10px] font-bold text-slate-400 leading-none">主要5通貨の相対的な勢い</span>
            </div>
            
            <div className="h-[280px] w-full bg-slate-50/50 dark:bg-slate-800/30 rounded-[28px] p-5 border border-slate-100 dark:border-slate-800 transition-colors hover:border-indigo-500/20">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart
                  data={strengths}
                  layout="vertical"
                  margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#CBD5E133" />
                  <XAxis type="number" hide domain={['auto', 'auto']} />
                  <YAxis 
                    dataKey="currency" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 13, fontWeight: 900, fill: "currentColor" }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const val = payload[0].value as number;
                        return (
                          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 text-sm font-black font-sans">
                            <span className={val >= 0 ? "text-emerald-500" : "text-rose-500"}>
                              {val >= 0 ? "+" : ""}{val}%
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine x={0} stroke="#94A3B8" strokeWidth={1} />
                  <Bar dataKey="strength" radius={[0, 6, 6, 0]} barSize={24}>
                    {strengths.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.strength >= 0 ? "#10B981" : "#F43F5E"} 
                        fillOpacity={0.9}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* テクニカルシグナル一覧 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Activity size={16} className="text-indigo-500" />
                主要ペア テクニカルシグナル
              </h3>
              <span className="text-[10px] font-bold text-slate-400 leading-none">RSI & 移動平均判定</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar lg:max-h-none">
              {fxAnalysis.map((item) => (
                <div 
                  key={item.pair}
                  className="group flex flex-col sm:flex-row xl:flex-row items-center gap-4 p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:border-indigo-500/20"
                >
                  <Link 
                    href={item.pair.includes("USDJPY") ? "/fx/usdjpy" : item.pair.includes("EURUSD") ? "/fx/eurusd" : "#"}
                    className="flex-shrink-0 w-full sm:w-16 h-10 rounded-xl flex items-center justify-center text-xs font-black bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 shadow-sm group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500 transition-colors cursor-pointer"
                  >
                    {item.pair.replace("=X", "")}
                  </Link>
                  <div className="flex-1 w-full min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                        {item.price?.toFixed(3)}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm",
                          item.technical?.signal === "strong_buy" ? "bg-emerald-600 text-white shadow-emerald-500/40" :
                          item.technical?.signal === "buy" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
                          item.technical?.signal === "strong_sell" ? "bg-rose-600 text-white shadow-rose-500/40" :
                          item.technical?.signal === "sell" ? "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400" :
                          "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                        )}>
                          {item.technical?.signal === "strong_buy" ? "強い買い" :
                           item.technical?.signal === "buy" ? "買い" :
                           item.technical?.signal === "strong_sell" ? "強い売り" :
                           item.technical?.signal === "sell" ? "売り" : "中立"}
                        </div>
                        {item.technical?.signal !== "neutral" && (
                          <button 
                            className={cn(
                              "p-1.5 rounded-lg text-white transition-all transform active:scale-95",
                              (item.technical?.signal === "buy" || item.technical?.signal === "strong_buy") ? "bg-emerald-500 hover:bg-emerald-600" : "bg-rose-500 hover:bg-rose-600"
                            )}
                            title="トレード提案を作成"
                            onClick={() => {
                              alert(`${item.pair.replace("=X", "")} の ${item.technical.signal.includes("buy") ? "買い" : "売り"} 提案を作成しました`);
                            }}
                          >
                            <Zap size={12} fill="currentColor" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Swap Points Info */}
                    {item.swap && (
                      <div className="flex items-center gap-4 py-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Swap 買</span>
                          <span className={cn("text-[11px] font-black tabular-nums", item.swap.buy >= 0 ? "text-emerald-500" : "text-rose-500")}>
                            {item.swap.buy > 0 ? "+" : ""}{item.swap.buy}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Swap 売</span>
                          <span className={cn("text-[11px] font-black tabular-nums", item.swap.sell >= 0 ? "text-emerald-500" : "text-rose-500")}>
                            {item.swap.sell > 0 ? "+" : ""}{item.swap.sell}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 tabular-nums w-12 shrink-0">RSI: {item.technical?.rsi?.toFixed(1)}</span>
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full transition-all duration-500", 
                              item.technical?.rsi > 70 ? "bg-rose-500" : 
                              item.technical?.rsi < 30 ? "bg-emerald-500" : "bg-indigo-500"
                            )} 
                            style={{ width: `${item.technical?.rsi}%` }}
                          />
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] font-black tabular-nums shrink-0",
                        item.change >= 0 ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {item.change >= 0 ? "+" : ""}{item.change?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {fxAnalysis.length === 0 && Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-16 bg-slate-50 dark:bg-slate-800/30 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        {/* AIアドバイスセクション - Text Optimization */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/5 dark:to-orange-500/5 border border-amber-100 dark:border-amber-500/20 rounded-[32px] p-6 md:p-8 relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:scale-110 group-hover:-rotate-12 transition-all duration-1000">
            <Zap size={180} className="text-amber-500" />
          </div>
          <div className="flex flex-col md:flex-row gap-6 relative z-10">
            <div className="flex-shrink-0 w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-md text-amber-500 ring-4 ring-amber-100/50 dark:ring-amber-500/10">
              <Info size={28} />
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-amber-500 text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-amber-500/20">Market Insight</span>
                <span className="text-sm font-black text-slate-800 dark:text-white">AI による投資判断アシスト</span>
              </div>
              <p className="text-base font-bold text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                {advice}
              </p>
            </div>
          </div>
        </div>

        {/* 経済指標クイックビュー - Improved Readability */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
           <div className="flex items-center justify-between mb-5">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Calendar size={14} />
                今週の重要経済指標
              </h3>
              <button className="text-xs font-black text-indigo-500 hover:text-indigo-600 flex items-center gap-1.5 group transition-colors">
                全体を表示 <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {indicators.filter(i => i.impact === "high").slice(0, 4).map(item => (
                <div 
                   key={item.id} 
                   className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-[20px] border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm"
                >
                   <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-lg shadow-sm border border-slate-50 dark:border-slate-700">
                      {item.country === "USD" ? "🇺🇸" : item.country === "JPY" ? "🇯🇵" : "🇪🇺"}
                   </div>
                   <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-slate-800 dark:text-white truncate" title={item.name}>
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-500 tabular-nums">
                          {new Date(item.date).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}
                        </span>
                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                        <span className="text-[10px] font-bold text-slate-400">予: {item.forecast}</span>
                      </div>
                   </div>
                </div>
              ))}
              {indicators.filter(i => i.impact === "high").length === 0 && (
                <p className="col-span-full py-4 text-center text-xs font-bold text-slate-400 italic">直近の重要指標はありません</p>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
