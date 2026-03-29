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
import { USDJPYIndicatorBanner } from "@/components/fx/usdjpy/USDJPYIndicatorBanner";
import { USDJPYExecutionMonitor } from "@/components/fx/usdjpy/USDJPYExecutionMonitor";
import { USDJPYStructureMonitor } from "@/components/fx/usdjpy/USDJPYStructureMonitor";
import { USDJPYPseudoOrderBook } from "@/components/fx/usdjpy/USDJPYPseudoOrderBook";
import { IntegratedCommandCenter } from "@/components/fx/usdjpy/IntegratedCommandCenter";
import { FXLearningService } from "@/services/fxLearningService";
import { FXSimulationService } from "@/services/fxSimulationService";
import { FXIndicatorService } from "@/services/fxIndicatorService";
import { FXExecutionService } from "@/services/fxExecutionService";
import { FXStructureService } from "@/services/fxStructureService";
import { FXLiquidityService } from "@/services/fxLiquidityService";
import { 
  LearningMetric, 
  FXRiskMetrics, 
  FXWeightProfile, 
  FXExecutionProfile,
  FXStructureAnalysis,
  FXPseudoOrderBook
} from "@/types/fx";
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
  const [indicatorStatus, setIndicatorStatus] = React.useState<any>(null);
  const [executionProfile, setExecutionProfile] = React.useState<FXExecutionProfile | null>(null);
  const [structureAnalysis, setStructureAnalysis] = React.useState<FXStructureAnalysis | null>(null);
  const [pseudoOrderBook, setPseudoOrderBook] = React.useState<FXPseudoOrderBook | null>(null);

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
      const status = await FXIndicatorService.getEventStatus();
      setMetrics(m);
      setRiskMetrics(r);
      setWeightProfile(w);
      setAnalysisResult(a);
      setIndicatorStatus(status);
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
    
    // 執行品質の算出
    const profile = FXExecutionService.calculateExecutionProfile(
      quote?.bid || 0, 
      quote?.ask || 0, 
      ohlcData["1m"]
    );
    setExecutionProfile(profile);

    // 相場構造の解析
    const structure = FXStructureService.analyzeStructure(ohlcData);
    setStructureAnalysis(structure);

    // 擬似板情報の生成
    const orderBook = FXLiquidityService.generatePseudoOrderBook(
      quote?.price || 0,
      quote?.bid || 0,
      quote?.ask || 0,
      ohlcData["1m"]
    );
    setPseudoOrderBook(orderBook);

    let res = calculateUSDJPYDecision(
      ohlcData, 
      metrics, 
      isHighProbMode, 
      weightProfile, 
      indicatorStatus || { status: "normal", message: "通常運用" },
      profile,
      structure,
      orderBook
    );
    
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
    <div className="min-h-screen bg-slate-950">
      <IntegratedCommandCenter />
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
