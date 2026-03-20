"use client";

import React, { useState, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { FlaskConical, PlayCircle, TrendingUp, TrendingDown, Activity, Trophy, AlertTriangle, ChevronDown, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  runBacktest,
  STRATEGY_PRESETS,
  ASSET_CHOICES,
  type StrategyType,
  type BacktestResult,
  type StrategyConfig
} from "@/lib/backtestUtils";
import { formatCurrency } from "@/lib/utils";

// -------- KPI カードコンポーネント --------
const KpiCard = ({
  label,
  value,
  sub,
  icon: Icon,
  positive,
  neutral
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  positive?: boolean;
  neutral?: boolean;
}) => (
  <div className={cn(
    "flex flex-col p-5 rounded-[24px] border space-y-3 transition-all",
    neutral
      ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
      : positive
        ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20"
        : "bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20"
  )}>
    <div className={cn(
      "w-9 h-9 rounded-xl flex items-center justify-center",
      neutral ? "bg-slate-200 dark:bg-slate-700 text-slate-500" :
      positive ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600" :
      "bg-rose-100 dark:bg-rose-500/20 text-rose-500"
    )}>
      <Icon size={18} />
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className={cn("text-xl font-black mt-1",
        neutral ? "text-slate-800 dark:text-white" :
        positive ? "text-emerald-600 dark:text-emerald-400" :
        "text-rose-500"
      )}>
        {value}
      </p>
      {sub && <p className="text-[11px] font-bold text-slate-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// -------- メインコンポーネント --------
export const BacktestSimulator = () => {
  const [asset, setAsset] = useState(ASSET_CHOICES[0]);
  const [strategyType, setStrategyType] = useState<StrategyType>("trend_follow");
  const [periodDays, setPeriodDays] = useState<90 | 180 | 365 | 730>(365);
  const [shortWindow, setShortWindow] = useState(20);
  const [longWindow, setLongWindow] = useState(60);
  const [takeProfitPct, setTakeProfitPct] = useState(15);
  const [stopLossPct, setStopLossPct] = useState(8);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleRun = useCallback(async () => {
    setIsLoading(true);
    setResult(null);
    // UIのためにちょっとだけ遅延させる（演出）
    await new Promise(r => setTimeout(r, 1200));

    const config: StrategyConfig = {
      asset,
      initialCapital: 1000000,
      strategyType,
      periodDays,
      shortWindow,
      longWindow,
      takeProfitPct,
      stopLossPct
    };

    const res = runBacktest(config);
    setResult(res);
    setIsLoading(false);
  }, [asset, strategyType, periodDays]);

  const selectedPreset = STRATEGY_PRESETS.find(p => p.id === strategyType)!;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm">
      <div className="p-6 md:p-8 space-y-8">
        
        {/* ヘッダー */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-600 rounded-2xl text-white shadow-lg shadow-violet-500/20">
              <FlaskConical size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">過去データによる戦略検証</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">バックテスト・シミュレーター</p>
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 max-w-sm bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
            ※ 過去のデータは将来の成績を保証するものではありません
          </p>
        </div>

        {/* 設定エリア */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[24px] border border-slate-200 dark:border-slate-700 space-y-6">
          <h3 className="text-sm font-black text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <Activity size={16} className="text-violet-500" />
            検証する条件を選んでください
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* アセット選択 */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">対象アセット</label>
              <div className="relative">
                <select
                  value={asset}
                  onChange={e => setAsset(e.target.value)}
                  className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                >
                  {ASSET_CHOICES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 期間選択 */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">検証期間</label>
              <div className="relative">
                <select
                  value={periodDays}
                  onChange={e => setPeriodDays(Number(e.target.value) as any)}
                  className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                >
                  <option value={90}>過去3ヶ月</option>
                  <option value={180}>過去6ヶ月</option>
                  <option value={365}>過去1年</option>
                  <option value={730}>過去2年</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 戦略選択 */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">投資の手法</label>
              <div className="relative">
                <select
                  value={strategyType}
                  onChange={e => setStrategyType(e.target.value as StrategyType)}
                  className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                >
                  {STRATEGY_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">短期移動平均 (日)</label>
                <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{shortWindow}日</span>
              </div>
              <input type="range" min="5" max="50" step="1" value={shortWindow} onChange={e => setShortWindow(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">長期移動平均 (日)</label>
                <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{longWindow}日</span>
              </div>
              <input type="range" min="30" max="200" step="1" value={longWindow} onChange={e => setLongWindow(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">利確ライン (%)</label>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{takeProfitPct}%</span>
              </div>
              <input type="range" min="1" max="50" step="1" value={takeProfitPct} onChange={e => setTakeProfitPct(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">損切りライン (%)</label>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{stopLossPct}%</span>
              </div>
              <input type="range" min="1" max="30" step="1" value={stopLossPct} onChange={e => setStopLossPct(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500" />
            </div>
          </div>

          {/* 選択された戦略の説明 */}
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-violet-50 dark:bg-violet-500/10 px-4 py-3 rounded-xl border border-violet-100 dark:border-violet-500/20">
            <span className="text-violet-600 dark:text-violet-400 font-black mr-1">【{selectedPreset.label}】</span>
            {selectedPreset.description}
          </p>

          <button
            onClick={handleRun}
            disabled={isLoading}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-black text-base transition-all shadow-lg shadow-violet-500/20",
              isLoading ? "bg-violet-400 cursor-wait" : "bg-violet-600 hover:bg-violet-700 active:scale-[0.99]"
            )}
          >
            {isLoading ? (
              <><Loader2 size={20} className="animate-spin" />シミュレーション計算中...</>
            ) : (
              <><PlayCircle size={20} />検証スタート</>
            )}
          </button>
        </div>

        {/* 結果エリア */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h3 className="text-base font-black text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Trophy size={18} className="text-amber-500" />
                「{result.config.asset}」×「{selectedPreset.label}」の検証結果
              </h3>

              {/* KPI カード群 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  label="トータルリターン"
                  value={`${result.totalReturn >= 0 ? "+" : ""}${result.totalReturn}%`}
                  sub={`${result.totalReturn >= 0 ? "+" : ""}${formatCurrency(result.totalProfitJpy)}`}
                  icon={result.totalReturn >= 0 ? TrendingUp : TrendingDown}
                  positive={result.totalReturn >= 0}
                />
                <KpiCard
                  label="勝率"
                  value={`${result.winRate}%`}
                  sub={`${result.winTrades}勝 / ${result.totalTrades}取引`}
                  icon={Trophy}
                  positive={result.winRate >= 50}
                  neutral={result.totalTrades === 0}
                />
                <KpiCard
                  label="最大の一時的な落ち込み"
                  value={`-${result.maxDrawdown}%`}
                  sub={`最大 ${formatCurrency(result.maxDrawdownJpy)} 減少`}
                  icon={AlertTriangle}
                  positive={result.maxDrawdown < 15}
                />
                <KpiCard
                  label="投資効率 (シャープ比)"
                  value={String(result.sharpe)}
                  sub={result.sharpe >= 1 ? "効率よく稼げました" : result.sharpe >= 0 ? "まずまずの効率" : "リスクに見合わず"}
                  icon={Activity}
                  positive={result.sharpe >= 1}
                  neutral={result.sharpe >= 0 && result.sharpe < 1}
                />
              </div>

              {/* 資産推移チャート */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-[24px] border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-700 dark:text-slate-200">資産の推移（円）</h4>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-violet-500 inline-block rounded" />資産額</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-slate-400 border-dashed border inline-block rounded" />初期投資額</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={result.dailyResults} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                      tickLine={false}
                      interval={result ? Math.floor(result.dailyResults.length / 5) : 5}
                    />
                    <YAxis
                      tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`}
                      tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(v: any) => [formatCurrency(v), "評価額"] as [string, string]}
                      labelFormatter={(l) => `日付: ${l}`}
                      contentStyle={{ fontSize: 12, fontWeight: 700, borderRadius: 12, border: "1px solid #e2e8f0" }}
                    />
                    <ReferenceLine y={result.config.initialCapital} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={1.5} />
                    <Line
                      type="monotone"
                      dataKey="equity"
                      stroke="#7c3aed"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, fill: "#7c3aed" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-[10px] font-bold text-slate-400 text-center">
                  初期投資額: {formatCurrency(result.config.initialCapital)}　｜　検証期間: {result.dailyResults.length}日間
                </p>
              </div>

              {/* 取引履歴トグル */}
              <div className="space-y-4">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 text-sm font-black text-slate-600 dark:text-slate-300 hover:text-violet-600 transition-colors"
                >
                  <ChevronDown size={16} className={cn("transition-transform", showHistory && "rotate-180")} />
                  取引履歴を表示 ({result.tradeHistory.length} 件)
                </button>

                <AnimatePresence>
                  {showHistory && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                              <th className="px-4 py-3">日付</th>
                              <th className="px-4 py-3">種別</th>
                              <th className="px-4 py-3 text-right">価格</th>
                              <th className="px-4 py-3 text-right">数量</th>
                              <th className="px-4 py-3 text-right">損益</th>
                            </tr>
                          </thead>
                          <tbody className="font-bold">
                            {result.tradeHistory.map((trade, idx) => (
                              <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                                <td className="px-4 py-3 text-slate-500">{trade.date}</td>
                                <td className="px-4 py-3">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-md text-[9px] font-black uppercase",
                                    trade.type === "buy" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                                  )}>
                                    {trade.type === "buy" ? "買い入" : "売り出"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(trade.price)}</td>
                                <td className="px-4 py-3 text-right tabular-nums">{trade.quantity}</td>
                                <td className={cn(
                                  "px-4 py-3 text-right tabular-nums",
                                  trade.profit && trade.profit > 0 ? "text-emerald-500" : trade.profit ? "text-rose-500" : "text-slate-400"
                                )}>
                                  {trade.profit ? (
                                    <div className="flex flex-col items-end">
                                      <span>{trade.profit > 0 ? "+" : ""}{formatCurrency(trade.profit)}</span>
                                      <span className="text-[9px] opacity-70">({trade.profitPct}%)</span>
                                    </div>
                                  ) : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
