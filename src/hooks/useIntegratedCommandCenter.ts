import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUSDJPYData } from "@/hooks/useUSDJPYData";
import { FXSimulationService } from "@/services/fxSimulationService";
import { FXLearningService } from "@/services/fxLearningService";
import { FXIndicatorService } from "@/services/fxIndicatorService";
import { getMarketSentimentAction } from "@/lib/actions/fxSentiment";
import { getFXReviewsAction } from "@/lib/actions/fxReview";
import { calculateUSDJPYDecision } from "@/utils/fx/usdjpyDecision";
import { FXTuningService } from "@/services/fxTuningService";
import { 
  FXTuningConfig,
  FXDriftAnalysis,
  FXTuningLog
} from "@/types/fxTuning";
import { 
  FXJudgment, 
  FXMarketSentiment, 
  FXTradingReview, 
  FXRiskMetrics, 
  FXSimulation, 
  FXWeightProfile,
  FXExecutionProfile,
  FXStructureAnalysis,
  FXPseudoOrderBook,
  FXConditionAnalysis,
  FXBacktestComparison
} from "@/types/fx";
import { FXExecutionService } from "@/services/fxExecutionService";
import { FXStructureService } from "@/services/fxStructureService";
import { FXLiquidityService } from "@/services/fxLiquidityService";
import { USDJPYDecisionResult } from "@/utils/fx/usdjpyDecision";
import { AppPersistence } from "@/utils/common/persistence";

export function useIntegratedCommandCenter() {
  const { user } = useAuth();
  const { quote, ohlcData, isLoading: isMarketLoading } = useUSDJPYData(3000);

  // States (Initial logic: Load from cache if available)
  const [sentiment, setSentiment] = useState<FXMarketSentiment | null>(() => AppPersistence.load("sentiment"));
  const [reviews, setReviews] = useState<FXTradingReview[]>(() => AppPersistence.load("reviews") || []);
  const [riskMetrics, setRiskMetrics] = useState<FXRiskMetrics | null>(() => AppPersistence.load("riskMetrics"));
  const [activePositions, setActivePositions] = useState<FXSimulation[]>(() => AppPersistence.load("activePositions") || []);
  const [performance, setPerformance] = useState<any>(() => AppPersistence.load("performance")); 
  const [weightProfile, setWeightProfile] = useState<FXWeightProfile | null>(() => AppPersistence.load("weightProfile"));
  const [indicatorStatus, setIndicatorStatus] = useState<{ status: "normal" | "caution" | "prohibited", message: string } | null>(() => AppPersistence.load("indicatorStatus"));
  const [conditionAnalysis, setConditionAnalysis] = useState<FXConditionAnalysis | null>(() => AppPersistence.load("conditionAnalysis"));
  const [backtestComparisons, setBacktestComparisons] = useState<FXBacktestComparison[]>(() => AppPersistence.load("backtestComparisons") || []);
  const [violationLogs, setViolationLogs] = useState<any[]>(() => AppPersistence.load("violationLogs") || []);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>(() => AppPersistence.load("upcomingEvents") || []);
  const [tuningConfig, setTuningConfig] = useState<FXTuningConfig | null>(() => AppPersistence.load("tuningConfig"));
  const [driftAnalysis, setDriftAnalysis] = useState<FXDriftAnalysis | null>(() => AppPersistence.load("driftAnalysis"));
  const [tuningLogs, setTuningLogs] = useState<FXTuningLog[]>(() => AppPersistence.load("tuningLogs") || []);
  
  const [isDataLoading, setIsDataLoading] = useState(!AppPersistence.load("riskMetrics"));

  // Data Fetching
  const refreshData = useCallback(async () => {
    if (!user) {
      setIsDataLoading(false);
      return;
    }
    try {
      const [
        s, r, rm, ap, perf, wp, inst, cond, btest, logs, evts,
        tConfig, tLogs
      ] = await Promise.all([
        getMarketSentimentAction(),
        getFXReviewsAction(user.uid),
        FXSimulationService.getRiskMetrics(user.uid),
        FXSimulationService.getActiveSimulations(user.uid),
        FXSimulationService.getAggregatedPerformance(user.uid),
        FXLearningService.getWeightProfile(user.uid),
        FXIndicatorService.getEventStatus(),
        FXSimulationService.getConditionAnalysis(user.uid),
        FXSimulationService.getBacktestComparisons(),
        FXSimulationService.getViolationLogs(user.uid),
        FXIndicatorService.getUpcomingEvents(),
        FXTuningService.getTuningConfig(user.uid),
        FXTuningService.getTuningLogs(user.uid)
      ]);

      setSentiment(s);
      setReviews(r);
      setRiskMetrics(rm);
      setActivePositions(ap);
      setPerformance(perf);
      setWeightProfile(wp);
      setIndicatorStatus(inst);
      setConditionAnalysis(cond || { timeOfDay: {}, dayOfWeek: {}, regime: {}, sentiment: {}, liquidity: {} });
      setBacktestComparisons(btest);
      setViolationLogs(logs);
      setUpcomingEvents(evts);
      setTuningConfig(tConfig);
      setTuningLogs(tLogs);

      // Save to cache
      AppPersistence.save("sentiment", s);
      AppPersistence.save("reviews", r);
      AppPersistence.save("riskMetrics", rm);
      AppPersistence.save("activePositions", ap);
      AppPersistence.save("performance", perf);
      AppPersistence.save("weightProfile", wp);
      AppPersistence.save("indicatorStatus", inst);
      AppPersistence.save("conditionAnalysis", cond);
      AppPersistence.save("backtestComparisons", btest);
      AppPersistence.save("violationLogs", logs);
      AppPersistence.save("upcomingEvents", evts);
      AppPersistence.save("tuningConfig", tConfig);
      AppPersistence.save("tuningLogs", tLogs);
    } catch (e) {
      console.error("Error fetching integrated data", e);
    } finally {
      setIsDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 300000); // 300秒おきに最新化 (コスト削減)
    return () => clearInterval(interval);
  }, [refreshData]);

  // analyzeDrift is no longer automatic on mount to save write quota.
  // We rely on manually triggered analysis or cached values.
  const triggerDriftAnalysis = useCallback(async () => {
    if (!user) return;
    try {
      const d = await FXTuningService.analyzeDrift(user.uid);
      setDriftAnalysis(d);
      AppPersistence.save("driftAnalysis", d);
    } catch (e) {
      console.error("Manual drift analysis failed", e);
    }
  }, [user]);

  // Real-time calculation based on market data
  const derivedData = useMemo(() => {
    if (!ohlcData["1m"].length) {
      return { decision: null, profile: null, structure: null, orderBook: null };
    }

    const profile = FXExecutionService.calculateExecutionProfile(
      quote?.bid || 0, 
      quote?.ask || 0, 
      ohlcData["1m"]
    );

    const structure = FXStructureService.analyzeStructure(ohlcData);

    const orderBook = FXLiquidityService.generatePseudoOrderBook(
      quote?.price || 0,
      quote?.bid || 0,
      quote?.ask || 0,
      ohlcData["1m"]
    );

    const decision = calculateUSDJPYDecision(
      ohlcData, 
      [], // metrics are now integrated in reviews/weightProfile mostly
      true, // isHighProbMode
      weightProfile, 
      indicatorStatus || { status: "normal", message: "通常運用" },
      profile,
      structure,
      orderBook,
      riskMetrics,
      tuningConfig
    );

    return { profile, structure, orderBook, decision };
  }, [ohlcData, quote, weightProfile, indicatorStatus, riskMetrics, tuningConfig]);

  // Actions
  const closePosition = useCallback(async (id: string, price: number, reason: string) => {
    if (!user) return;
    try {
      await FXSimulationService.closeSimulation(user.uid, id, price, reason);
      await refreshData();
    } catch (e) {
      console.error("Failed to close position", e);
    }
  }, [user, refreshData]);

  const deletePosition = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await FXSimulationService.deleteSimulation(user.uid, id);
      await refreshData();
    } catch (e) {
      console.error("Failed to delete position", e);
    }
  }, [user, refreshData]);

  const updatePosition = useCallback(async (id: string, updates: Partial<FXSimulation>) => {
    if (!user) return;
    try {
      await FXSimulationService.updateSimulation(user.uid, id, updates);
      await refreshData();
    } catch (e) {
      console.error("Failed to update position", e);
    }
  }, [user, refreshData]);

  // Periodic position management (Monitoring price locally in memory)
  useEffect(() => {
    if (user && quote && quote.price && activePositions.length > 0) {
      // Manage open positions locally. If stop loss or take profit is hit, trigger close.
      activePositions.forEach(pos => {
        let shouldClose = false;
        let reason = "";

        if (pos.side === "buy") {
           if (pos.stopLoss && quote.price <= pos.stopLoss) {
             shouldClose = true; reason = "Auto-Close: SL (Local)";
           } else if (pos.takeProfit && quote.price >= pos.takeProfit) {
             shouldClose = true; reason = "Auto-Close: TP (Local)";
           }
        } else {
           if (pos.stopLoss && quote.price >= pos.stopLoss) {
             shouldClose = true; reason = "Auto-Close: SL (Local)";
           } else if (pos.takeProfit && quote.price <= pos.takeProfit) {
             shouldClose = true; reason = "Auto-Close: TP (Local)";
           }
        }

        if (shouldClose) {
          closePosition(pos.id, quote.price, reason);
        }
      });
    }
  }, [user, quote?.price, activePositions, closePosition]);

  return {
    user,
    quote,
    ohlcData,
    sentiment,
    reviews,
    riskMetrics,
    activePositions,
    performance,
    weightProfile,
    indicatorStatus,
    decision: derivedData.decision,
    executionProfile: derivedData.profile,
    structureAnalysis: derivedData.structure,
    pseudoOrderBook: derivedData.orderBook,
    conditionAnalysis,
    backtestComparisons,
    violationLogs,
    upcomingEvents,
    tuningConfig,
    driftAnalysis,
    tuningLogs,
    isLoading: isMarketLoading || isDataLoading,
    refreshData,
    triggerDriftAnalysis,
    updateTuning: async (u: any, r: string) => {
      if (!user) return;
      await FXTuningService.updateTuningConfig(user.uid, u, r);
      await refreshData();
    },
    deletePosition,
    updatePosition,
    closePosition
  };
}
