"use client";

import React, { useState, useEffect } from "react";
import { Globe, Calendar, Zap, TrendingUp, TrendingDown, Info, ArrowRight, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
      <div className="p-6 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500 rounded-2xl text-white shadow-lg shadow-rose-500/20">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">FX 高度マーケット分析</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Advanced Currency Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-full border border-rose-100 dark:border-rose-500/20">
            <Zap size={14} className={cn("text-rose-500", loading && "animate-pulse")} />
            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              {loading ? "データ取得中..." : "LIVE分析中"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 通貨強弱チャート */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" />
                通貨強弱（相対指標）
              </h3>
              <span className="text-[10px] font-bold text-slate-400">主要通貨の騰落率に基づく強さ</span>
            </div>
            
            <div className="h-[240px] w-full bg-slate-50 dark:bg-slate-800/50 rounded-[24px] p-4 border border-slate-100 dark:border-slate-700">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={strengths}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#CBD5E133" />
                  <XAxis type="number" hide domain={['auto', 'auto']} />
                  <YAxis 
                    dataKey="currency" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fontWeight: 900, fill: "currentColor" }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const val = payload[0].value as number;
                        return (
                          <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 text-xs font-bold font-sans">
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
                  <Bar dataKey="strength" radius={[0, 4, 4, 0]}>
                    {strengths.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.strength >= 0 ? "#10B981" : "#F43F5E"} 
                        fillOpacity={0.8}
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
              <span className="text-[10px] font-bold text-slate-400">RSI & 移動平均線による判定</span>
            </div>

            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
              {fxAnalysis.map((item) => (
                <div 
                  key={item.pair}
                  className="group flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div className="flex-shrink-0 w-12 h-8 rounded-lg flex items-center justify-center text-[10px] font-black bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {item.pair.replace("=X", "")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 dark:text-white tabular-nums">
                        {item.price?.toFixed(3)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
                          item.technical?.signal === "buy" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
                          item.technical?.signal === "sell" ? "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400" :
                          "bg-slate-200 dark:bg-slate-700 text-slate-500"
                        )}>
                          {item.technical?.signal === "buy" ? "強気" :
                           item.technical?.signal === "sell" ? "弱気" : "中立"}
                        </div>
                        {(item.technical?.signal === "buy" || item.technical?.signal === "sell") && (
                          <button 
                            className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg text-indigo-500 transition-colors"
                            title="トレード提案を作成"
                            onClick={() => {
                              // 将来的にはここでFirestoreにプロポーザルを作成する
                              alert(`${item.pair.replace("=X", "")} の ${item.technical.signal === "buy" ? "買い" : "売り"} 提案を作成しました（デモ）`);
                            }}
                          >
                            <Zap size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2 text-[8px] font-bold text-slate-400 uppercase">
                        <span>RSI: {item.technical?.rsi?.toFixed(1)}</span>
                        <div className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full", item.technical?.rsi > 70 ? "bg-rose-500" : item.technical?.rsi < 30 ? "bg-emerald-500" : "bg-indigo-500")} 
                            style={{ width: `${item.technical?.rsi}%` }}
                          />
                        </div>
                      </div>
                      <span className={cn(
                        "text-[9px] font-black tabular-nums",
                        item.change >= 0 ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {item.change >= 0 ? "+" : ""}{item.change?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {fxAnalysis.length === 0 && Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-14 bg-slate-50 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        {/* AIアドバイスセクション */}
        <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 rounded-[28px] p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-[0.05] group-hover:scale-110 transition-transform duration-700">
            <Zap size={100} className="text-amber-500" />
          </div>
          <div className="flex gap-4 relative z-10">
            <div className="flex-shrink-0 w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm text-amber-500 ring-4 ring-amber-100/50 dark:ring-amber-500/10">
              <Info size={24} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-200 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-black rounded-lg uppercase tracking-wider">AI Market Insight</span>
                <span className="text-xs font-black text-slate-800 dark:text-white">為替相場の投資判断支援</span>
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                {advice}
              </p>
            </div>
          </div>
        </div>

        {/* 経済指標クイックビュー */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Calendar size={12} />
                今週の重要経済指標
              </h3>
              <button className="text-[10px] font-black text-indigo-500 hover:text-indigo-600 flex items-center gap-1 group">
                カレンダー詳細を表示 <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
           <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {indicators.filter(i => i.importance === "high").map(item => (
                <div key={item.id} className="flex-shrink-0 min-w-[200px] p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-[10px] shadow-sm font-black">
                      {item.country === "USD" ? "🇺🇸" : item.country === "JPY" ? "🇯🇵" : "🇪🇺"}
                   </div>
                   <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-800 dark:text-white truncate">{item.name}</p>
                      <p className="text-[8px] font-bold text-slate-400 mt-0.5">
                        {new Date(item.date).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })} • 予想: {item.forecast}
                      </p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
