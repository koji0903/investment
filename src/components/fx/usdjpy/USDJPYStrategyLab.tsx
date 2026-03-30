"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Beaker, 
  Play, 
  BarChart3, 
  TrendingUp, 
  Target, 
  AlertCircle,
  CheckCircle2,
  Settings2,
  History,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FXBacktestResult } from "@/types/fx";
import { FXBacktestService } from "@/services/fxBacktestService";

/**
 * ストラテジー・ラボ (バックテスト & 最適化)
 */
export const USDJPYStrategyLab = ({ 
  userId, 
  ohlcData,
  onApplyParameters 
}: { 
  userId: string, 
  ohlcData: Record<string, any[]>,
  onApplyParameters: (params: any) => void
}) => {
  const [isRunning, setIsRunning] = React.useState(false);
  const [result, setResult] = React.useState<FXBacktestResult | null>(null);
  
  const [params, setParams] = React.useState({
    maPeriod: 200,
    confidenceThreshold: 70,
    tpPips: 20,
    slPips: 15
  });

  const runTest = async () => {
    setIsRunning(true);
    try {
      const res = await FXBacktestService.runBacktest(userId, ohlcData, params);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-800 rounded-xl text-indigo-400">
               <Beaker size={18} />
            </div>
            <div>
               <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest leading-none mb-1">ストラテジー・ラボ</h3>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">バックテスト・最適化エンジン</p>
            </div>
         </div>
         <button 
           onClick={runTest}
           disabled={isRunning || !ohlcData["1m"].length}
           className={cn(
             "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
             isRunning ? "bg-slate-800 text-slate-500" : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 active:scale-95"
           )}
         >
           {isRunning ? <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" /> : <Play size={12} fill="currentColor" />}
           {isRunning ? "テスト中..." : "バックテスト開始"}
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Parameters */}
         <div className="p-6 bg-slate-900/50 border border-slate-900 rounded-[32px] space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
               <Settings2 size={16} />
               <h4 className="text-[10px] font-black uppercase tracking-widest">テストパラメータ</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-slate-500 uppercase px-1">信頼度しきい値</span>
                  <input 
                    type="number" value={params.confidenceThreshold} 
                    onChange={e => setParams({...params, confidenceThreshold: Number(e.target.value)})}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-xs font-black text-indigo-400 focus:outline-none focus:border-indigo-500/50"
                  />
               </div>
               <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-slate-500 uppercase px-1">利確 / 損切り (Pips)</span>
                  <div className="flex gap-2">
                    <input 
                      type="number" value={params.tpPips} 
                      onChange={e => setParams({...params, tpPips: Number(e.target.value)})}
                      className="w-1/2 bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-xs font-black text-emerald-400 focus:outline-none focus:border-emerald-500/50 text-center"
                    />
                    <input 
                      type="number" value={params.slPips} 
                      onChange={e => setParams({...params, slPips: Number(e.target.value)})}
                      className="w-1/2 bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-xs font-black text-rose-400 focus:outline-none focus:border-rose-500/50 text-center"
                    />
                  </div>
               </div>
            </div>
            <p className="text-[9px] text-slate-600 font-bold flex items-center gap-1.5 p-2 bg-slate-950/30 rounded-lg italic font-sans">
               <Info size={10} className="text-indigo-500/50 shrink-0" />
               OHLCデータの過去1000件のスライディングウィンドウを用いてシミュレートします。
            </p>
         </div>

         {/* Results */}
         <div className="p-6 bg-slate-900/50 border border-slate-900 rounded-[32px] space-y-4 shadow-xl relative min-h-[160px]">
            <AnimatePresence mode="wait">
               {result ? (
                 <motion.div 
                   key="result"
                   initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                   className="space-y-4 h-full"
                 >
                    <div className="flex items-center gap-2 text-indigo-400 mb-2">
                       <BarChart3 size={16} />
                       <h4 className="text-[10px] font-black uppercase tracking-widest">バックテスト結果</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div className="text-center p-3 bg-slate-950/50 rounded-2xl border border-slate-800/30">
                          <span className="text-[8px] font-black text-slate-500 uppercase block">勝率</span>
                          <span className="text-lg font-black text-indigo-400 tabular-nums">{(result.metrics.winRate * 100).toFixed(1)}%</span>
                       </div>
                       <div className="text-center p-3 bg-slate-950/50 rounded-2xl border border-slate-800/30">
                          <span className="text-[8px] font-black text-slate-500 uppercase block">プロフィットファクター</span>
                          <span className="text-lg font-black text-amber-500 tabular-nums">{result.metrics.profitFactor.toFixed(2)}</span>
                       </div>
                       <div className="text-center p-3 bg-slate-950/50 rounded-2xl border border-slate-800/30">
                          <span className="text-[8px] font-black text-slate-500 uppercase block">合計純損益</span>
                          <span className="text-lg font-black text-emerald-400 tabular-nums">+{result.metrics.netProfit.toFixed(1)}</span>
                       </div>
                       <div className="text-center p-3 bg-slate-950/50 rounded-2xl border border-slate-800/30">
                          <span className="text-[8px] font-black text-slate-500 uppercase block">合計取引数</span>
                          <span className="text-lg font-black text-slate-300 tabular-nums">{result.metrics.totalTrades}</span>
                       </div>
                    </div>

                    <div className="flex gap-4">
                       <button 
                         onClick={() => onApplyParameters(params)}
                         className="flex-1 bg-emerald-600/10 border border-emerald-600/20 py-2 rounded-xl text-emerald-500 text-[9px] font-black uppercase hover:bg-emerald-600/20 transition-all flex items-center justify-center gap-2"
                       >
                          <Target size={12} /> 最適化設定を適用
                       </button>
                    </div>
                 </motion.div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-30 gap-3 py-4">
                    <BarChart3 size={40} className="text-slate-600" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">バックテストの実行を待機中...</span>
                 </div>
               )}
            </AnimatePresence>
         </div>
      </div>

      {/* Regime Performance */}
      {result && (
        <div className="p-6 bg-slate-950 border border-slate-900 rounded-[32px] space-y-4">
           <div className="flex items-center gap-2 text-slate-500 mb-2">
              <History size={16} />
              <h4 className="text-[10px] font-black uppercase tracking-widest">レジーム別パフォーマンス分析</h4>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {Object.entries(result.regimePerformance).map(([type, winRate], i) => (
                <div key={i} className="p-3 bg-slate-900/50 rounded-2xl border border-slate-800/20 text-center space-y-1">
                   <p className="text-[8px] font-black text-slate-500 uppercase truncate leading-none">{type === "TREND_UP" ? "トレンド上昇" : type === "TREND_DOWN" ? "トレンド下降" : type === "RANGE" ? "レンジ" : type === "HIGH_VOLATILITY" ? "高ボラ" : type === "LOW_VOLATILITY" ? "低ボラ" : "不安定"}</p>
                   <p className={cn(
                     "text-sm font-black tabular-nums",
                     winRate > 0.6 ? "text-emerald-400" : winRate > 0.4 ? "text-amber-400" : "text-rose-400"
                   )}>
                     {(winRate * 100).toFixed(0)}%
                   </p>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};
