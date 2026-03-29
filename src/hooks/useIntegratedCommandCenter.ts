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

export function useIntegratedCommandCenter() {
  const { user } = useAuth();
  const { quote, ohlcData, isLoading: isMarketLoading } = useUSDJPYData(3000);

  // States
  const [sentiment, setSentiment] = useState<FXMarketSentiment | null>(null);
  const [reviews, setReviews] = useState<FXTradingReview[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<FXRiskMetrics | null>(null);
  const [activePositions, setActivePositions] = useState<FXSimulation[]>([]);
  const [performance, setPerformance] = useState<any>(null); // TODO: Define Full Performance type
  const [weightProfile, setWeightProfile] = useState<FXWeightProfile | null>(null);
  const [indicatorStatus, setIndicatorStatus] = useState<{ status: "normal" | "caution" | "prohibited", message: string } | null>(null);
  const [executionProfile, setExecutionProfile] = useState<FXExecutionProfile | null>(null);
  const [structureAnalysis, setStructureAnalysis] = useState<FXStructureAnalysis | null>(null);
  const [pseudoOrderBook, setPseudoOrderBook] = useState<FXPseudoOrderBook | null>(null);
  const [conditionAnalysis, setConditionAnalysis] = useState<FXConditionAnalysis | null>(null);
  const [backtestComparisons, setBacktestComparisons] = useState<FXBacktestComparison[]>([]);
  const [violationLogs, setViolationLogs] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [tuningConfig, setTuningConfig] = useState<FXTuningConfig | null>(null);
  const [driftAnalysis, setDriftAnalysis] = useState<FXDriftAnalysis | null>(null);
  const [tuningLogs, setTuningLogs] = useState<FXTuningLog[]>([]);
  
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Data Fetching
  const refreshData = useCallback(async () => {
    if (!user) return;
    try {
      const [
        s, r, rm, ap, perf, wp, inst, cond, btest, logs, evts,
        tConfig, drift, tLogs
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
        FXTuningService.analyzeDrift(user.uid),
        FXTuningService.getTuningLogs(user.uid)
      ]);

      setSentiment(s);
      setReviews(r);
      setRiskMetrics(rm);
      setActivePositions(ap);
      setPerformance(perf);
      setWeightProfile(wp);
      setIndicatorStatus(inst);
      setConditionAnalysis(cond);
      setBacktestComparisons(btest);
      setViolationLogs(logs);
      setUpcomingEvents(evts);
      setTuningConfig(tConfig);
      setDriftAnalysis(drift);
      setTuningLogs(tLogs);

      setIsDataLoading(false);
    } catch (e) {
      console.error("Error fetching integrated data", e);
    }
  }, [user]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000); // 10秒おきに最新化
    return () => clearInterval(interval);
  }, [refreshData]);

  // Real-time calculation based on market data
  const decision: USDJPYDecisionResult | null = useMemo(() => {
    if (!ohlcData["1m"].length) return null;

    const profile = FXExecutionService.calculateExecutionProfile(
      quote?.bid || 0, 
      quote?.ask || 0, 
      ohlcData["1m"]
    );
    setExecutionProfile(profile);

    const structure = FXStructureService.analyzeStructure(ohlcData);
    setStructureAnalysis(structure);

    const orderBook = FXLiquidityService.generatePseudoOrderBook(
      quote?.price || 0,
      quote?.bid || 0,
      quote?.ask || 0,
      ohlcData["1m"]
    );
    setPseudoOrderBook(orderBook);

    return calculateUSDJPYDecision(
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
  }, [ohlcData, quote, weightProfile, indicatorStatus, riskMetrics, tuningConfig]);

  // Periodic position management
  useEffect(() => {
    if (user && quote && quote.price) {
      FXSimulationService.manageOpenPositions(user.uid, quote.price);
    }
  }, [user, quote?.price]);

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
    executionProfile,
    structureAnalysis,
    pseudoOrderBook,
    conditionAnalysis,
    backtestComparisons,
    violationLogs,
    upcomingEvents,
    decision,
    tuningConfig,
    driftAnalysis,
    tuningLogs,
    isLoading: isMarketLoading || isDataLoading,
    refreshData,
    updateTuning: (updates: Partial<FXTuningConfig>, reason: string) => 
      FXTuningService.updateTuningConfig(user?.uid || "", updates, reason)
  };
}
