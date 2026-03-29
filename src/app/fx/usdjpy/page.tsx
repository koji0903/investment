"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUSDJPYData } from "@/hooks/useUSDJPYData";
import { calculateUSDJPYDecision } from "@/utils/fx/usdjpyDecision";
import { 
  USDJPYPriceBoard, 
  USDJPYTrendMonitor, 
  USDJPYDecisionMonitor,
  USDJPYFilterStatus
} from "@/components/fx/usdjpy/USDJPYComponents";
import { USDJPYSimulationPanel } from "@/components/fx/usdjpy/USDJPYSimulationPanel";
import { USDJPYRiskMonitor } from "@/components/fx/usdjpy/USDJPYRiskMonitor";
import { USDJPYAIInsights } from "@/components/fx/usdjpy/USDJPYAIInsights";
import { USDJPYRegimeMonitor } from "@/components/fx/usdjpy/USDJPYRegimeMonitor";
import { USDJPYStrategyLab } from "@/components/fx/usdjpy/USDJPYStrategyLab";
import { FXLearningService } from "@/services/fxLearningService";
import { FXSimulationService } from "@/services/fxSimulationService";
import { LearningMetric, FXRiskMetrics, FXWeightProfile } from "@/types/fx";
import { checkTradePermission } from "@/utils/fx/tradeGovernance";
import { FXPatternAnalyzer, AnalysisResult } from "@/utils/fx/FXPatternAnalyzer";
import { FXWeightOptimizer } from "@/utils/fx/FXWeightOptimizer";
import { 
  Activity, 
  Zap, 
  Target, 
  LineChart as ChartIcon, 
  BrainCircuit, 
  Settings2,
  AlertCircle,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function USDJPYDashboardPage() {
  const { user } = useAuth();
  const { quote, ohlcData, isLoading, error } = useUSDJPYData(3000); // 3秒間隔
  const [activeTab, setActiveTab] = React.useState("analysis");
  const [metrics, setMetrics] = React.useState<LearningMetric[]>([]);
  const [showEntryModal, setShowEntryModal] = React.useState(false);
  const [isHighProbMode, setIsHighProbMode] = React.useState(true);
  const [riskMetrics, setRiskMetrics] = React.useState<FXRiskMetrics | null>(null);
  const [weightProfile, setWeightProfile] = React.useState<FXWeightProfile | null>(null);
  const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(null);
  const [customParams, setCustomParams] = React.useState<any>(null);

  // 1. 学習データ・AIモデル・リスクメトリクスの取得
  const fetchEssentialData = React.useCallback(async () => {
    if (!user) return;
    try {
      const [m, r, w, a] = await Promise.all([
        FXLearningService.getAllMetrics(user.uid),
        FXSimulationService.getRiskMetrics(user.uid),
        FXLearningService.getWeightProfile(user.uid),
        FXPatternAnalyzer.analyzeTradePatterns(user.uid)
      ]);
      setMetrics(m);
      setRiskMetrics(r);
      setWeightProfile(w);
      setAnalysisResult(a);
    } catch (e) {
      console.error("Failed to fetch essential data", e);
    }
  }, [user]);

  // 定期的な自己最適化の実行 (例: 5分ごと)
  const runAutoOptimization = React.useCallback(async () => {
    if (!user || !weightProfile || !analysisResult) return;
    try {
      const { profile } = await FXWeightOptimizer.optimizeWeights(user.uid, analysisResult, weightProfile);
      setWeightProfile(profile);
    } catch (e) {
      console.error("Optimization skip/fail", e);
    }
  }, [user, weightProfile, analysisResult]);

  React.useEffect(() => {
    fetchEssentialData();
    const interval = setInterval(fetchEssentialData, 10000); // 10秒おき
    const optInterval = setInterval(runAutoOptimization, 300000); // 5分おき
    return () => {
      clearInterval(interval);
      clearInterval(optInterval);
    };
  }, [fetchEssentialData, runAutoOptimization]);

  // 2. 意思決定データの算出
  const decision = useMemo(() => {
    if (!ohlcData["1m"].length) return null;
    let res = calculateUSDJPYDecision(ohlcData, metrics, isHighProbMode, weightProfile);
    
    // カスタムパラメータが適用されている場合は補正
    if (customParams && res) {
      if (res.confidence < customParams.confidenceThreshold && res.isEntryAllowed) {
        res.isEntryAllowed = false;
        res.reasons.push(`AI Optimization: Below custom threshold (${customParams.confidenceThreshold}%)`);
      }
    }
    return res;
  }, [ohlcData, metrics, isHighProbMode, weightProfile, customParams]);

  // 3. 運用許可の判定
  const permission = useMemo(() => {
    if (!riskMetrics) return null;
    return checkTradePermission(riskMetrics, decision, false); // hasActivePositionはPanel側で別途評価
  }, [riskMetrics, decision]);

  // 4. ポジションの自動管理（オートクローズ、トレーリングストップ）
  React.useEffect(() => {
    if (user && quote && quote.price) {
      FXSimulationService.manageOpenPositions(user.uid, quote.price);
    }
  }, [user, quote?.price]);

  if (isLoading && !quote) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="text-indigo-500"
        >
          <BrainCircuit size={48} />
        </motion.div>
        <p className="text-slate-400 font-black tracking-widest text-xs uppercase animate-pulse">Initializing USD/JPY Neural Engine...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      {/* Top Header Row */}
      <header className="h-16 border-b border-slate-900 bg-slate-950/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Zap size={20} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
              USD/JPY <span className="text-indigo-500 text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 uppercase tracking-tighter">Day Trading Pro</span>
            </h1>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Real-time Decision Support System</p>
          </div>
        </div>

        {quote && (
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-500 uppercase">Live Price</span>
              <span className={cn(
                "text-xl font-black tabular-nums transition-colors duration-200",
                (quote.changePercent || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                {quote.price.toFixed(3)}
              </span>
            </div>
            
            <div className="h-10 w-px bg-slate-900 mx-2" />

            <div className="flex items-center gap-3">
               <span className={cn(
                 "text-[9px] font-black uppercase tracking-widest",
                 isHighProbMode ? "text-indigo-400" : "text-slate-600"
               )}>Win Rate Focus</span>
               <button 
                onClick={() => setIsHighProbMode(!isHighProbMode)}
                className={cn(
                  "w-12 h-6 rounded-full relative transition-colors duration-300 border",
                  isHighProbMode ? "bg-indigo-500 border-indigo-400" : "bg-slate-800 border-slate-700"
                )}>
                  <motion.div 
                    animate={{ x: isHighProbMode ? 24 : 0 }}
                    className="absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white rounded-full shadow-lg"
                  />
               </button>
            </div>

            <button className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-all">
              <Settings2 size={18} className="text-slate-400" />
            </button>
          </div>
        )}
      </header>

      <main className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 max-w-[1920px] mx-auto">
        
        {/* Left Column: Market pulse & Trends (Col 3) */}
        <div className="xl:col-span-3 space-y-6">
          <USDJPYPriceBoard quote={quote} />
          <USDJPYRegimeMonitor regime={decision?.regime || null} />
          <USDJPYRiskMonitor metrics={riskMetrics} permission={permission} />
          {weightProfile && <USDJPYAIInsights analysis={analysisResult} weightProfile={weightProfile} />}
          <USDJPYTrendMonitor trends={decision?.trends} alignmentLevel={decision?.alignmentLevel} />
          <USDJPYFilterStatus decision={decision} />
          
          <div className="p-6 bg-slate-900/50 border border-slate-900 rounded-[32px] space-y-4">
             <div className="flex items-center gap-2 mb-2">
               <div className="p-1.5 bg-blue-500 rounded-lg text-white">
                 <Activity size={14} />
               </div>
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Market Volatility</h3>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">ATR (15M)</span>
                   <span className="text-lg font-black tabular-nums text-slate-200">{decision?.volatilityATR.toFixed(3)}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                     animate={{ width: `${Math.min((decision?.volatilityATR || 0) * 500, 100)}%` }}
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                       decision?.regime.metrics.volatilityStatus === "high" ? "bg-rose-500" : 
                       decision?.regime.metrics.volatilityStatus === "low" ? "bg-blue-500" : "bg-indigo-500"
                    )}
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-widest">
                   Status: <span className="text-slate-300">{decision?.regime.metrics.volatilityStatus}</span>
                </p>
             </div>
          </div>
        </div>

        {/* Center Column: Analysis & Decision (Col 6) */}
        <div className="xl:col-span-6 space-y-6">
          <USDJPYDecisionMonitor decision={decision} />
          
          {/* Chart Placeholder (Future improvement) */}
          <div className="h-[400px] bg-slate-950 border border-slate-900 rounded-[40px] flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent pointer-events-none" />
            <div className="flex flex-col items-center gap-3">
               <div className="p-4 bg-slate-900 rounded-2xl text-slate-700">
                 <ChartIcon size={32} />
               </div>
               <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">TradingView Integration Point</p>
            </div>
          </div>
        </div>

        {/* Right Column: Sim & Risk & Scenarios (Col 3) */}
        <div className="xl:col-span-3 space-y-6 flex flex-col">
          <div className="h-[500px] p-8 bg-slate-900/50 border border-slate-900 rounded-[40px] shadow-2xl overflow-hidden relative group">
             {quote && (
               <USDJPYSimulationPanel 
                 currentPrice={quote?.ask || 0} 
                 decision={decision} 
                 showEntryForm={showEntryModal}
                 setShowEntryForm={setShowEntryModal}
                 riskMetrics={riskMetrics}
               />
             )}
          </div>
          
          <div className="p-8 bg-slate-900/50 border border-slate-900 rounded-[48px] shadow-2xl">
             <USDJPYStrategyLab 
                userId={user?.uid || ""} 
                ohlcData={ohlcData} 
                onApplyParameters={(p) => setCustomParams(p)}
             />
          </div>
          
          <USDJPYNeuralMessage permission={permission} />

          <div className="bg-indigo-500 rounded-[32px] p-8 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
            <div className="absolute right-0 top-0 opacity-10 group-hover:scale-110 transition-transform duration-700">
               <BrainCircuit size={160} />
            </div>
            <div className="relative z-10 space-y-4">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                   <Target size={20} />
                 </div>
                 <h3 className="text-lg font-black tracking-tight">AI 意思決定モデル</h3>
               </div>
               <p className="text-[11px] font-bold text-white/70 leading-relaxed">
                 {isHighProbMode ? "高確度（勝率70%目標）モード稼働中。" : "標準モード稼働中。"}
                 過去のトレードデータを分析し、現在のセットアップの信頼度を自動補正しています。
               </p>
               <div className="pt-2">
                 <button 
                  onClick={() => setShowEntryModal(true)}
                  className="w-full py-3 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-950/10 hover:scale-[1.02] transition-transform active:scale-95">
                   シミュレーションを開始
                 </button>
               </div>
            </div>
          </div>

          <div className="p-6 bg-slate-900/50 border border-slate-900 rounded-[32px] space-y-4">
             <div className="flex items-center gap-2 mb-2">
               <div className="p-1.5 bg-amber-500 rounded-lg text-white">
                 <AlertCircle size={14} />
               </div>
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Trading Scenarios</h3>
             </div>
             <div className="space-y-4">
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                   <h4 className="text-[10px] font-black text-emerald-500 uppercase mb-1">Bullish Scenario</h4>
                   <p className="text-xs font-bold text-slate-300">1H足の押し目買い継続。直近高値151.80へのブレイク期待。</p>
                </div>
                <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
                   <h4 className="text-[10px] font-black text-rose-500 uppercase mb-1">Bearish Scenario</h4>
                   <p className="text-xs font-bold text-slate-300">15m足三尊形成による短期調整局面。150.50付近まで。</p>
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 bg-rose-500 text-white rounded-2xl font-black text-xs shadow-2xl flex items-center gap-3 z-[100]"
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

/**
 * 心理誘導メッセージ・ガイダンス
 */
function USDJPYNeuralMessage({ permission }: { permission: any }) {
  const messages = [
    "「待つこと」は、エントリーすることと同じくらい重要なトレード技術です。",
    "マーケットは逃げません。条件が整うまで虎視眈々と待ちましょう。",
    "規律を守ることは、手法よりもはるかに大きな資産を守ります。",
    "1回の負けに感情を支配されてはいけません。それは統計の一部に過ぎません。",
    "プロのトレーダーは、自分の感情ではなく、自分のルールに従います。"
  ];

  const [index, setIndex] = React.useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => setIndex(i => (i + 1) % messages.length), 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-6 rounded-[32px] border flex items-center gap-4",
        permission?.status === "stop" ? "bg-rose-500/10 border-rose-500/20" : "bg-slate-900 border-slate-900"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
        permission?.status === "stop" ? "bg-rose-500 text-white" : "bg-indigo-500 text-white"
      )}>
        <MessageSquare size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Neural Guidance</p>
        <p className="text-xs font-bold text-slate-300 leading-relaxed italic">
           {permission?.status === "stop" ? permission.reason : `"${messages[index]}"`}
        </p>
      </div>
    </motion.div>
  );
}
