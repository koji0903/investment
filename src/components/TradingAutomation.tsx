"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePortfolio } from "@/context/PortfolioContext";
import { subscribeTradingRules, updateTradingRule } from "@/lib/db";
import { checkSMACrossover, TradingSignal } from "@/lib/tradingMonitor";
import { useNotify } from "@/context/NotificationContext";
import { 
  Cpu, 
  Settings2, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Activity, 
  History,
  Info,
  Play,
  Pause
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TradingRule } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export const TradingAutomation = () => {
  const { user, isDemo } = useAuth();
  const { calculatedAssets } = usePortfolio();
  const { notify } = useNotify();
  const [rules, setRules] = useState<TradingRule[]>([]);
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeTradingRules(user.uid, (data) => {
      setRules(data);
      if (data.length > 0 && !activeRuleId) {
        setActiveRuleId(data[0].id);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const activeRule = useMemo(() => 
    rules.find(r => r.id === activeRuleId) || rules[0]
  , [rules, activeRuleId]);

  // モック用の価格データ (直近30日分)
  const mockPrices = useMemo(() => {
    const base = 150;
    return Array.from({ length: 50 }, (_, i) => ({
      date: `Day ${i + 1}`,
      price: base + Math.sin(i * 0.3) * 10 + i * 0.5 + Math.random() * 2
    }));
  }, []);

  const signal = useMemo(() => {
    if (!activeRule) return null;
    const prices = mockPrices.map(p => p.price);
    return checkSMACrossover("MOCK", prices, activeRule.shortPeriod, activeRule.longPeriod);
  }, [mockPrices, activeRule]);

  const handleUpdate = async (update: Partial<TradingRule>) => {
    if (isDemo || !user || !activeRule) return;
    try {
      await updateTradingRule(user.uid, activeRule.id, update);
      notify({
        type: "success",
        title: "設定を更新しました",
        message: "売買ルールを保存しました。",
      });
    } catch (error) {
      notify({
        type: "error",
        title: "保存失敗",
        message: "設定の保存に失敗しました。",
      });
    }
  };

  if (!activeRule) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-sm overflow-hidden mb-8">
      <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <Cpu size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white">売買オートメーション</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Machine-Learning Trading Signals</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => handleUpdate({ enabled: true })}
              className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5",
                activeRule.enabled ? "bg-white dark:bg-slate-900 text-indigo-500 shadow-sm" : "text-slate-400"
              )}
            >
              <Play size={10} fill="currentColor" />
              ACTIVE
            </button>
            <button
              onClick={() => handleUpdate({ enabled: false })}
              className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5",
                !activeRule.enabled ? "bg-white dark:bg-slate-900 text-rose-500 shadow-sm" : "text-slate-400"
              )}
            >
              <Pause size={10} fill="currentColor" />
              PAUSE
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-10">
        {/* シグナルステータス */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Current Trend</h4>
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5",
                signal?.type === "buy" ? "bg-emerald-500/10 text-emerald-500" :
                signal?.type === "sell" ? "bg-rose-500/10 text-rose-500" :
                "bg-slate-100 dark:bg-slate-800 text-slate-400"
              )}>
                {signal?.type === "buy" ? <TrendingUp size={12} /> : 
                 signal?.type === "sell" ? <TrendingDown size={12} /> : <Activity size={12} />}
                {signal?.type === "buy" ? "Bullish (Buy Signal)" :
                 signal?.type === "sell" ? "Bearish (Sell Signal)" : "Sideways (Hold)"}
              </span>
            </div>

            <div className={cn(
              "p-6 rounded-[28px] border-2 space-y-4",
              signal?.type === "buy" ? "border-emerald-500/20 bg-emerald-500/5 shadow-xl shadow-emerald-500/10" :
              signal?.type === "sell" ? "border-rose-500/20 bg-rose-500/5 shadow-xl shadow-rose-500/10" :
              "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/5"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
                  signal?.type === "buy" ? "bg-emerald-500" :
                  signal?.type === "sell" ? "bg-rose-500" : "bg-slate-400"
                )}>
                  <Zap size={24} fill="currentColor" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Last Action Signal</p>
                  <p className="text-lg font-black text-slate-800 dark:text-white leading-none">
                    {signal?.type === "buy" ? "買いシグナル発生" :
                     signal?.type === "sell" ? "売りシグナル発生" : "待機中"}
                  </p>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-200/50 dark:border-slate-700/50 pt-4">
                {signal?.reason}. 指標は機械的に計算されており、感情を介さない客観的な判断を提供します。
              </p>
            </div>
          </div>

          <div className="h-48 md:h-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockPrices}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                  dot={false}
                />
                <XAxis dataKey="date" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderRadius: '16px', 
                    border: 'none', 
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800" />

        {/* 設定エリア */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-white">
              <Settings2 size={16} className="text-indigo-500" />
              戦略アルゴリズム設定
            </div>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Short Period (SMA)</label>
                  <span className="text-sm font-black text-indigo-500">{activeRule.shortPeriod} days</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="20"
                  step="1"
                  value={activeRule.shortPeriod}
                  onChange={(e) => handleUpdate({ shortPeriod: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Long Period (SMA)</label>
                  <span className="text-sm font-black text-indigo-500">{activeRule.longPeriod} days</span>
                </div>
                <input
                  type="range"
                  min="21"
                  max="100"
                  step="1"
                  value={activeRule.longPeriod}
                  onChange={(e) => handleUpdate({ longPeriod: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-white">
                <History size={16} className="text-indigo-500" />
                提案アクション
              </div>
              <button
                onClick={() => handleUpdate({ autoPropose: !activeRule.autoPropose })}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeRule.autoPropose 
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                )}
              >
                {activeRule.autoPropose ? "AUTO PROPOSE ON" : "MANUAL ONLY"}
              </button>
            </div>

            <div className="flex items-start gap-4 p-5 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-3xl border border-indigo-100 dark:border-indigo-500/20">
              <Info className="text-indigo-500 mt-0.5 shrink-0" size={18} />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                移動平均交差法（SMA Crossover）を用いています。
                短期線が長期線を上抜けると「買い」、下抜けると「売り」のシグナルを生成します。
                これにより、トレンドの転換点を客観的に捉え、感情的な判断ミスを防ぎます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
