import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFXData } from "@/hooks/useFXData";
import { FXSimulationService } from "@/services/fxSimulationService";
import { FXLearningService } from "@/services/fxLearningService";
import { FXIndicatorService } from "@/services/fxIndicatorService";
import { getMarketSentimentAction } from "@/lib/actions/fxSentiment";
import { getFXReviewsAction } from "@/lib/actions/fxReview";
import { calculateUSDJPYDecision } from "@/utils/fx/usdjpyDecision";
import { calculateEURUSDDecision } from "@/utils/fx/eurusdDecision";
import { FXTuningService } from "@/services/fxTuningService";
import { 
  FXTuningConfig,
  FXDriftAnalysis,
  FXTuningLog
} from "@/types/fxTuning";
import { 
  FXSimulation, 
  FXMarketSentiment, 
  FXTradingReview, 
  FXRiskMetrics, 
  FXWeightProfile,
  FXConditionAnalysis,
  FXBacktestComparison
} from "@/types/fx";
import { FXExecutionService } from "@/services/fxExecutionService";
import { FXStructureService } from "@/services/fxStructureService";
import { FXLiquidityService } from "@/services/fxLiquidityService";
import { AppPersistence } from "@/utils/common/persistence";

export function useIntegratedCommandCenter(pairCode: string = "USD/JPY") {
  const { user } = useAuth();
  const { quote, ohlcData, isLoading: isMarketLoading } = useFXData(pairCode, 3000);

  const cacheKey = (key: string) => `${pairCode}_${key}`;

  // States
  const [sentiment, setSentiment] = useState<FXMarketSentiment | null>(() => AppPersistence.load(cacheKey("sentiment")));
  const [reviews, setReviews] = useState<FXTradingReview[]>(() => AppPersistence.load(cacheKey("reviews")) || []);
  const [riskMetrics, setRiskMetrics] = useState<FXRiskMetrics | null>(() => AppPersistence.load(cacheKey("riskMetrics")));
  const [activePositions, setActivePositions] = useState<FXSimulation[]>(() => AppPersistence.load(cacheKey("activePositions")) || []);
  const [performance, setPerformance] = useState<any>(() => AppPersistence.load(cacheKey("performance"))); 
  const [weightProfile, setWeightProfile] = useState<FXWeightProfile | null>(() => AppPersistence.load(cacheKey("weightProfile")));
  const [indicatorStatus, setIndicatorStatus] = useState<{ status: "normal" | "caution" | "prohibited", message: string } | null>(() => AppPersistence.load(cacheKey("indicatorStatus")));
  const [conditionAnalysis, setConditionAnalysis] = useState<FXConditionAnalysis | null>(() => AppPersistence.load(cacheKey("conditionAnalysis")));
  const [backtestComparisons, setBacktestComparisons] = useState<FXBacktestComparison[]>(() => AppPersistence.load(cacheKey("backtestComparisons")) || []);
  const [violationLogs, setViolationLogs] = useState<any[]>(() => AppPersistence.load(cacheKey("violationLogs")) || []);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>(() => AppPersistence.load(cacheKey("upcomingEvents")) || []);
  const [tuningConfig, setTuningConfig] = useState<FXTuningConfig | null>(() => AppPersistence.load(cacheKey("tuningConfig")));
  const [driftAnalysis, setDriftAnalysis] = useState<FXDriftAnalysis | null>(() => AppPersistence.load(cacheKey("driftAnalysis")));
  const [tuningLogs, setTuningLogs] = useState<FXTuningLog[]>(() => AppPersistence.load(cacheKey("tuningLogs")) || []);
  
  const [isDataLoading, setIsDataLoading] = useState(!AppPersistence.load(cacheKey("riskMetrics")));

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
        getFXReviewsAction(user.uid, 10, pairCode),
        FXSimulationService.getRiskMetrics(user.uid, pairCode),
        FXSimulationService.getActiveSimulations(user.uid, pairCode),
        FXSimulationService.getAggregatedPerformance(user.uid, pairCode),
        FXLearningService.getWeightProfile(user.uid, pairCode),
        FXIndicatorService.getEventStatus(pairCode),
        FXSimulationService.getConditionAnalysis(user.uid, pairCode),
        FXSimulationService.getBacktestComparisons(pairCode),
        FXSimulationService.getViolationLogs(user.uid, pairCode),
        FXIndicatorService.getUpcomingEvents(pairCode),
        FXTuningService.getTuningConfig(user.uid, pairCode),
        FXTuningService.getTuningLogs(user.uid, pairCode)
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
      AppPersistence.save(cacheKey("sentiment"), s);
      AppPersistence.save(cacheKey("reviews"), r);
      AppPersistence.save(cacheKey("riskMetrics"), rm);
      AppPersistence.save(cacheKey("activePositions"), ap);
      AppPersistence.save(cacheKey("performance"), perf);
      AppPersistence.save(cacheKey("weightProfile"), wp);
      AppPersistence.save(cacheKey("indicatorStatus"), inst);
      AppPersistence.save(cacheKey("conditionAnalysis"), cond);
      AppPersistence.save(cacheKey("backtestComparisons"), btest);
      AppPersistence.save(cacheKey("violationLogs"), logs);
      AppPersistence.save(cacheKey("upcomingEvents"), evts);
      AppPersistence.save(cacheKey("tuningConfig"), tConfig);
      AppPersistence.save(cacheKey("tuningLogs"), tLogs);
    } catch (e) {
      console.error(`Error fetching integrated data for ${pairCode}`, e);
    } finally {
      setIsDataLoading(false);
    }
  }, [user, pairCode]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 300000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const triggerDriftAnalysis = useCallback(async () => {
    if (!user) return;
    try {
      const d = await FXTuningService.analyzeDrift(user.uid, pairCode);
      setDriftAnalysis(d);
      AppPersistence.save(cacheKey("driftAnalysis"), d);
    } catch (e) {
      console.error(`Manual drift analysis failed for ${pairCode}`, e);
    }
  }, [user, pairCode]);

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

    const structure = FXStructureService.analyzeStructure(ohlcData, pairCode);

    const orderBook = FXLiquidityService.generatePseudoOrderBook(
      quote?.price || 0,
      quote?.bid || 0,
      quote?.ask || 0,
      ohlcData["1m"],
      pairCode
    );

    const decisionFunc = pairCode === "EUR/USD" ? calculateEURUSDDecision : calculateUSDJPYDecision;

    const decision = decisionFunc(
      ohlcData as any, 
      [], 
      true, 
      weightProfile, 
      indicatorStatus || { status: "normal", message: "通常運用" },
      profile,
      structure,
      orderBook,
      riskMetrics,
      tuningConfig
    );

    return { profile, structure, orderBook, decision };
  }, [ohlcData, quote, weightProfile, indicatorStatus, riskMetrics, tuningConfig, pairCode]);

  // Actions
  const closePosition = useCallback(async (id: string, price: number, reason: string) => {
    if (!user) return;
    try {
      await FXSimulationService.closeSimulation(user.uid, id, price, reason, pairCode);
      await refreshData();
    } catch (e) {
      console.error("Failed to close position", e);
    }
  }, [user, refreshData, pairCode]);

  const deletePosition = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await FXSimulationService.deleteSimulation(user.uid, id, pairCode);
      await refreshData();
    } catch (e) {
      console.error("Failed to delete position", e);
    }
  }, [user, refreshData, pairCode]);

  const updatePosition = useCallback(async (id: string, updates: Partial<FXSimulation>) => {
    if (!user) return;
    try {
      await FXSimulationService.updateSimulation(user.uid, id, updates, pairCode);
      await refreshData();
    } catch (e) {
      console.error("Failed to update position", e);
    }
  }, [user, refreshData, pairCode]);

  // Periodic position management
  useEffect(() => {
    if (user && quote && quote.price && activePositions.length > 0) {
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
      await FXTuningService.updateTuningConfig(user.uid, u, r, pairCode);
      await refreshData();
    },
    deletePosition,
    updatePosition,
    closePosition
  };
}
