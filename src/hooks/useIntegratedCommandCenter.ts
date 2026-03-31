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
  FXBacktestComparison,
  FXPerformanceResult,
  FXViolationLog,
  FXEconomicEvent
} from "@/types/fx";
import { FXExecutionService } from "@/services/fxExecutionService";
import { FXStructureService } from "@/services/fxStructureService";
import { FXLiquidityService } from "@/services/fxLiquidityService";
import { AppPersistence } from "@/utils/common/persistence";
import { onSnapshot, doc, collection, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

const SYSTEM_VERSION = "2.6.0"; // 2026-03-31 リアル指標・正確なキャッシュ同期対応

export function useIntegratedCommandCenter(pairCode: string = "USD/JPY") {
  const { user } = useAuth();
  const { quote, ohlcData, isLoading: isMarketLoading } = useFXData(pairCode, 3000);

  const cacheKey = (key: string) => `${pairCode}_${key}`;

  // States (ハイドレーション不整合を防ぐため、初期値は null/空配列に固定)
  const [sentiment, setSentiment] = useState<FXMarketSentiment | null>(null);
  const [reviews, setReviews] = useState<FXTradingReview[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<FXRiskMetrics | null>(null);
  const [activePositions, setActivePositions] = useState<FXSimulation[]>([]);
  const [performance, setPerformance] = useState<FXPerformanceResult | null>(null); 
  const [weightProfile, setWeightProfile] = useState<FXWeightProfile | null>(null);
  const [indicatorStatus, setIndicatorStatus] = useState<{ status: "normal" | "caution" | "prohibited", message: string } | null>(null);
  const [conditionAnalysis, setConditionAnalysis] = useState<FXConditionAnalysis | null>(null);
  const [backtestComparisons, setBacktestComparisons] = useState<FXBacktestComparison[]>([]);
  const [violationLogs, setViolationLogs] = useState<FXViolationLog[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<FXEconomicEvent[]>([]);
  const [tuningConfig, setTuningConfig] = useState<FXTuningConfig | null>(null);
  const [driftAnalysis, setDriftAnalysis] = useState<FXDriftAnalysis | null>(null);
  const [tuningLogs, setTuningLogs] = useState<FXTuningLog[]>([]);
  
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  // --- 1. System Version & Cache Management ---
  useEffect(() => {
    const currentVer = AppPersistence.load<string>("system_version") || "0.0.0";
    
    // システムバージョンチェック
    if (currentVer !== SYSTEM_VERSION) {
      console.log(`[Integrated] System Version Mismatch (${currentVer} -> ${SYSTEM_VERSION}). Clearing old cache...`);
      const keysToClear = [
        "sentiment", "reviews", "riskMetrics", "activePositions", 
        "performance", "weightProfile", "indicatorStatus", "conditionAnalysis", 
        "backtestComparisons", "violationLogs", "upcomingEvents", 
        "last_highfreq_fetch", "last_metadata_fetch"
      ];
      keysToClear.forEach(k => AppPersistence.clear(cacheKey(k)));
      AppPersistence.save("system_version", SYSTEM_VERSION);
      refreshData(true);
    } else {
      // バージョンが一致している場合のみ、キャッシュからデータを復元 (ハイドレーション完了後)
      console.log(`[Integrated] Hydrating cache for ${pairCode}`);
      const s = AppPersistence.load<FXMarketSentiment>(cacheKey("sentiment"));
      const r = AppPersistence.load<FXTradingReview[]>(cacheKey("reviews")) || [];
      const rm = AppPersistence.load<FXRiskMetrics>(cacheKey("riskMetrics"));
      const ap = AppPersistence.load<FXSimulation[]>(cacheKey("activePositions")) || [];
      const pf = AppPersistence.load<FXPerformanceResult>(cacheKey("performance"));
      const wp = AppPersistence.load<FXWeightProfile>(cacheKey("weightProfile"));
      const istat = AppPersistence.load<{ status: "normal" | "caution" | "prohibited", message: string }>(cacheKey("indicatorStatus"));
      const cond = AppPersistence.load<FXConditionAnalysis>(cacheKey("conditionAnalysis"));
      const btest = AppPersistence.load<FXBacktestComparison[]>(cacheKey("backtestComparisons")) || [];
      const vlogs = AppPersistence.load<FXViolationLog[]>(cacheKey("violationLogs")) || [];
      const evts = AppPersistence.load<FXEconomicEvent[]>(cacheKey("upcomingEvents")) || [];
      const tcfg = AppPersistence.load<FXTuningConfig>(cacheKey("tuningConfig"));
      const tlogs = AppPersistence.load<FXTuningLog[]>(cacheKey("tuningLogs")) || [];

      if (s) setSentiment(s);
      setReviews(r);
      if (rm) setRiskMetrics(rm);
      setActivePositions(ap);
      if (pf) setPerformance(pf);
      if (wp) setWeightProfile(wp);
      if (istat) setIndicatorStatus(istat);
      if (cond) setConditionAnalysis(cond || { timeOfDay: {}, dayOfWeek: {}, regime: {}, sentiment: {}, liquidity: {} });
      setBacktestComparisons(btest);
      setViolationLogs(vlogs);
      setUpcomingEvents(evts);
      if (tcfg) setTuningConfig(tcfg);
      setTuningLogs(tlogs);

      refreshData(false);
    }
  }, [user, pairCode]);

  // --- 2. Real-time Clock ---
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // --- 2. リアルタイム購読 (onSnapshot) ---
  // 有効なポジションとリスクメトリクスはポーリングではなくストリームで取得し読み取り回数を削減
  useEffect(() => {
    if (!user) return;
    const prefix = pairCode.toLowerCase().replace("/", "_");
    
    // リスクメトリクス購読
    const metricsUnsub = onSnapshot(doc(db, `users/${user.uid}/fx_${prefix}_risk_metrics/current`), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as FXRiskMetrics;
        setRiskMetrics(data);
        AppPersistence.save(cacheKey("riskMetrics"), data);
      }
    });

    // アクティブポジション購読
    const positionsQuery = query(
      collection(db, `users/${user.uid}/fx_${prefix}_simulations`),
      where("status", "==", "open"),
      limit(50)
    );
    const positionsUnsub = onSnapshot(positionsQuery, (snap) => {
      const ap = snap.docs.map(d => ({ id: d.id, ...d.data() } as FXSimulation));
      setActivePositions(ap.sort((a, b) => new Date(b.entryTimestamp).getTime() - new Date(a.entryTimestamp).getTime()));
      AppPersistence.save(cacheKey("activePositions"), ap);
    });

    return () => {
      metricsUnsub();
      positionsUnsub();
    };
  }, [user, pairCode]);

  // --- 3. データ取得 (Granular Fetching) ---
  const refreshData = useCallback(async (forceMetadata = false) => {
    if (!user) {
      setIsDataLoading(false);
      return;
    }
    try {
      const HIGH_FREQ_TTL = 3 * 60 * 1000;  // 3分
      const METADATA_TTL = 20 * 60 * 1000; // 20分 (低頻度データ用)
      const lastHighFreqKey = cacheKey("last_highfreq_fetch");
      const lastMetaKey = cacheKey("last_metadata_fetch");
      
      const nowTime = Date.now();
      const lastHighFreq = AppPersistence.load<number>(lastHighFreqKey) || 0;
      const lastMeta = AppPersistence.load<number>(lastMetaKey) || 0;

      // a. 高頻度・中頻度データの取得 (経済指標等)
      if (nowTime - lastHighFreq > HIGH_FREQ_TTL) {
        console.log(`[Integrated] Fetching High-Freq data for ${pairCode}`);
        const [inst, evts, perf] = await Promise.all([
          FXIndicatorService.getEventStatus(pairCode),
          FXIndicatorService.getUpcomingEvents(pairCode),
          FXSimulationService.getAggregatedPerformance(user.uid, pairCode)
        ]);
        setIndicatorStatus(inst);
        setUpcomingEvents(evts);
        setPerformance(perf);
        
        AppPersistence.save(cacheKey("indicatorStatus"), inst);
        AppPersistence.save(cacheKey("upcomingEvents"), evts);
        AppPersistence.save(cacheKey("performance"), perf);
        AppPersistence.save(lastHighFreqKey, nowTime);
      }

      // b. 低頻度データの取得 (分析、過去ログ、設定。TTL 20分)
      if (forceMetadata || nowTime - lastMeta > METADATA_TTL || !sentiment) {
        console.log(`[Integrated] Fetching Metadata for ${pairCode}`);
        const [s, r, wp, cond, btest, logs, tConfig, tLogs] = await Promise.all([
          getMarketSentimentAction(),
          getFXReviewsAction(user.uid, 20, pairCode),
          FXLearningService.getWeightProfile(user.uid, pairCode),
          FXSimulationService.getConditionAnalysis(user.uid, pairCode),
          FXSimulationService.getBacktestComparisons(pairCode),
          FXSimulationService.getViolationLogs(user.uid, pairCode),
          FXTuningService.getTuningConfig(user.uid, pairCode),
          FXTuningService.getTuningLogs(user.uid, pairCode)
        ]);

        setSentiment(s);
        setReviews(r);
        setWeightProfile(wp);
        setConditionAnalysis(cond || { timeOfDay: {}, dayOfWeek: {}, regime: {}, sentiment: {}, liquidity: {} });
        setBacktestComparisons(btest);
        setViolationLogs(logs);
        setTuningConfig(tConfig);
        setTuningLogs(tLogs);

        AppPersistence.save(cacheKey("sentiment"), s);
        AppPersistence.save(cacheKey("reviews"), r);
        AppPersistence.save(cacheKey("weightProfile"), wp);
        AppPersistence.save(cacheKey("conditionAnalysis"), cond);
        AppPersistence.save(cacheKey("backtestComparisons"), btest);
        AppPersistence.save(cacheKey("violationLogs"), logs);
        AppPersistence.save(cacheKey("tuningConfig"), tConfig);
        AppPersistence.save(cacheKey("tuningLogs"), tLogs);
        AppPersistence.save(lastMetaKey, nowTime);
      }

    } catch (e) {
      console.error(`Error refreshing integrated data for ${pairCode}`, e);
    } finally {
      setIsDataLoading(false);
    }
  }, [user, pairCode, sentiment]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(() => refreshData(), 120000); // 2分チェックに短縮 (TTLフィルタリングがあるため負荷は減少)
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

  // Status Calculation based on real-time clock
  const realTimeStatus = useMemo(() => {
    if (!upcomingEvents || upcomingEvents.length === 0) {
      return { status: "normal" as const, message: "対象通貨に関連する制限はありません", minutesToEvent: undefined, nextEvent: undefined };
    }

    const currentTime = now.getTime();
    const currencies = pairCode.split("/");
    const relevantEvents = upcomingEvents.filter(e => 
      currencies.includes(e.currency) || e.currency === "USD"
    );

    const futureEvents = relevantEvents
      .filter(e => new Date(e.timestamp).getTime() > currentTime - 1000 * 60 * 30) 
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (futureEvents.length === 0) {
      return { status: "normal" as const, message: "対象通貨に関連する制限はありません", minutesToEvent: undefined, nextEvent: undefined };
    }

    const nextEvt = futureEvents[0];
    const eventTime = new Date(nextEvt.timestamp).getTime();
    const diffMin = (eventTime - currentTime) / (1000 * 60);

    if (nextEvt.importance === "high" && diffMin <= 30 && diffMin >= -30) {
      return { 
        status: "prohibited" as const, 
        message: `【禁止】${nextEvt.name} の発表直前・直後です`, 
        nextEvent: nextEvt,
        minutesToEvent: Math.round(diffMin)
      };
    }

    if (
      (nextEvt.importance === "medium" && diffMin <= 15 && diffMin >= -15) ||
      (nextEvt.importance === "high" && diffMin <= 60)
    ) {
      return { 
        status: "caution" as const, 
        message: `【警戒】${nextEvt.name} の発表が近づいています`, 
        nextEvent: nextEvt,
        minutesToEvent: Math.round(diffMin)
      };
    }

    return { 
      status: "normal" as const, 
      message: "通常運用", 
      nextEvent: nextEvt,
      minutesToEvent: Math.round(diffMin)
    };
  }, [upcomingEvents, pairCode, now]);

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
      realTimeStatus,
      profile,
      structure,
      orderBook,
      riskMetrics,
      tuningConfig
    );

    return { profile, structure, orderBook, decision };
  }, [ohlcData, quote, weightProfile, realTimeStatus, riskMetrics, tuningConfig, pairCode]);

  // Actions
  const closePosition = useCallback(async (id: string, price: number, reason: string) => {
    if (!user) return;
    try {
      await FXSimulationService.closeSimulation(user.uid, id, price, reason, pairCode);
      // onSnapshotによって、activePositions と riskMetrics は自動更新されるため
      // 全件fetch(refreshData)は不要。集計パフォーマンスのみ必要なら個別に取得or遅延更新。
      setTimeout(() => refreshData(), 3000); 
    } catch (e) {
      console.error("Failed to close position", e);
    }
  }, [user, refreshData, pairCode]);

  const deletePosition = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await FXSimulationService.deleteSimulation(user.uid, id, pairCode);
      setTimeout(() => refreshData(), 3000);
    } catch (e) {
      console.error("Failed to delete position", e);
    }
  }, [user, refreshData, pairCode]);

  const updatePosition = useCallback(async (id: string, updates: Partial<FXSimulation>) => {
    if (!user) return;
    try {
      await FXSimulationService.updateSimulation(user.uid, id, updates, pairCode);
      // 重要でない更新ならrefreshDataすら不要
    } catch (e) {
      console.error("Failed to update position", e);
    }
  }, [user, pairCode]);

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
    indicatorStatus: realTimeStatus,
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
