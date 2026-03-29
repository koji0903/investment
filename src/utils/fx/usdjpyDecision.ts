import { 
  FXWeightProfile,
  FXMarketRegime,
  FXStructureAnalysis,
  FXPseudoOrderBook,
  FXRiskMetrics,
  TechnicalTrend,
  LearningMetric
} from "@/types/fx";
import { FXTuningConfig } from "@/types/fxTuning";
import { 
  calculateATR 
} from "@/lib/technicalAnalysis";
import { FXRegimeService } from "@/services/fxRegimeService";

/**
 * USD/JPY専用 エントリー判断エンジン (V2: 自己進化型)
 * 実戦運用チューニング (Pragmatic Tuning) 統合版
 */

export interface USDJPYDecisionResult {
  confidence: number;
  isEntryAllowed: boolean;
  reasons: string[];
  trends: Record<string, TechnicalTrend>;
  alignmentLevel: number;
  volatilityATR: number;
  session: {
    name: string;
    isOk: boolean;
    score: number;
  };
  supportResistance?: {
    support: number;
    resistance: number;
  };
  isBreakout: boolean;
  isFakeoutSuspicion: boolean;
  regime: FXMarketRegime;
  isEnvironmentOk: boolean;
  envDetails: {
    isPerfectOrder: boolean;
    isHighVol: boolean;
  };
  score: number;
  structure: FXStructureAnalysis;
  orderBook: FXPseudoOrderBook;
  recommendation: {
    action: "BUY" | "SELL" | "WAIT" | "CAUTION_LOT_REDUCTION" | "PROHIBITED";
    lot: number;
    tp: number;
    sl: number;
    rr: number;
    reason: string;
  };
}

export function calculateUSDJPYDecision(
  ohlcData: Record<string, any[]>,
  learningMetrics: LearningMetric[],
  isHighProbMode: boolean = true,
  weightProfile: FXWeightProfile | null = null,
  indicatorStatus: { status: "normal" | "caution" | "prohibited", message: string } = { status: "normal", message: "通常運用" },
  executionProfile: { spreadPips: number, qualityScore: number, status: "ideal" | "caution" | "critical" } = { spreadPips: 0.2, qualityScore: 100, status: "ideal" },
  structure: FXStructureAnalysis | null = null,
  orderBook: FXPseudoOrderBook | null = null,
  riskMetrics: FXRiskMetrics | null = null,
  tuningConfig: FXTuningConfig | null = null
): USDJPYDecisionResult {
  const trends: Record<string, TechnicalTrend> = {
    "1m": getTrend(ohlcData["1m"]),
    "5m": getTrend(ohlcData["5m"]),
    "15m": getTrend(ohlcData["15m"]),
    "1h": getTrend(ohlcData["1h"]),
  };

  const session = checkMarketSession();
  const currentPrice = ohlcData["1m"][ohlcData["1m"].length - 1].close;
  const regime = FXRegimeService.detectMarketRegime(ohlcData);
  
  // トレンド一致度の算出 (0-100)
  const bullishCount = [trends["1m"], trends["5m"], trends["15m"]].filter(v => v === "bullish").length;
  const bearishCount = [trends["1m"], trends["5m"], trends["15m"]].filter(v => v === "bearish").length;
  const primaryDirection: "buy" | "sell" | "none" = bullishCount >= 2 ? "buy" : bearishCount >= 2 ? "sell" : "none";
  const alignmentLevel = Math.max(bullishCount, bearishCount) === 3 ? 100 : Math.max(bullishCount, bearishCount) === 2 ? 66 : 33;

  // ボラティリティ ATR
  const atr = calculateATR({
    high: ohlcData["5m"].map(d => d.high),
    low: ohlcData["5m"].map(d => d.low),
    close: ohlcData["5m"].map(d => d.close)
  }, 14);
  const currentATR = atr[atr.length - 1];
  const isVolOk = currentATR > 0.03 && currentATR < 0.25;

  // 1. だまし検知 (5分足のヒゲや急戻し)
  const fakeout = checkFakeout(ohlcData["5m"], primaryDirection, tuningConfig?.fakeoutStrictness || 1.0);

  // 2. 押し目・戻り目検知
  const pullback = checkPullback(ohlcData["1m"], primaryDirection);

  // 3. 基本スコアリング
  const scores = {
    trend: alignmentLevel * 0.4,
    session: session.score * 0.1,
    volatility: isVolOk ? 10 : 0,
    regimeAdjustment: regime.type === "TREND_UP" || regime.type === "TREND_DOWN" ? 10 : 0,
    structure: structure ? structure.completionScore * 0.2 : 0,
    liquidity: orderBook ? orderBook.liquidityScore * 0.1 : 0
  };

  const reasons: string[] = [];
  if (alignmentLevel >= 66) reasons.push(`トレンド一致 (${alignmentLevel}%)`);
  if (fakeout.isFakeout) reasons.push("だまし懸念あり");
  if (pullback.isPullback) reasons.push("押し目/戻り目圏内");
  if (regime.type.includes("TREND")) reasons.push(`トレンドレジーム: ${regime.name}`);
  if (indicatorStatus.status !== "normal") reasons.push(`指標警戒: ${indicatorStatus.message}`);

  // 5. 学習メトリクスによる補正
  let learningCorrection = 0;
  learningMetrics.forEach(m => {
    if (m.reliabilityCorrection !== 0) {
      learningCorrection += m.reliabilityCorrection;
    }
  });

  // 合計スコア (0-100)
  let totalScore = scores.trend + scores.session + scores.volatility + scores.regimeAdjustment + scores.structure + scores.liquidity + learningCorrection + (weightProfile?.bias || 0);
  totalScore = Math.max(0, Math.min(100, totalScore));

  // 最終トレード許可判定 (メンタル排除 & リスク管理 & チューニング適用)
  const confidenceThreshold = tuningConfig?.confidenceThreshold || 70;
  const minAlignment = tuningConfig?.minAlignmentLevel || 66;

  const isRiskOk = !riskMetrics || (riskMetrics.consecutiveLosses < (tuningConfig?.maxDailyDrawdownAllowed ? 5 : 3) && riskMetrics.drawdownPercent < (tuningConfig?.maxDailyDrawdownAllowed || 10));
  
  const isEntryAllowed = 
    alignmentLevel >= minAlignment && 
    isVolOk && 
    session.isOk && 
    !fakeout.isFakeout &&
    isRiskOk &&
    (isHighProbMode ? pullback.isPullback : true) &&
    ((primaryDirection === "buy" && totalScore >= confidenceThreshold) || (primaryDirection === "sell" && totalScore >= confidenceThreshold)) &&
    (indicatorStatus?.status !== "prohibited") &&
    (executionProfile?.status !== "critical") &&
    (structure ? structure.isEntryTiming : true) &&
    (orderBook ? orderBook.liquidityScore >= 50 : true);

  // 推奨ロットとSL/TPの計算
  const baseLot = 1.0; 
  let adjustedLot = baseLot * (tuningConfig?.riskMultiplier || 1.0);
  if (indicatorStatus.status === "caution") adjustedLot *= 0.5;
  if (riskMetrics && riskMetrics.consecutiveLosses >= 1) adjustedLot *= 0.7;
  
  const slPips = 20;
  const tpPips = tuningConfig?.splitTakeProfitRatio ? slPips * 1.2 : slPips * 1.5;
  const sl = primaryDirection === "buy" ? currentPrice - (slPips / 100) : currentPrice + (slPips / 100);
  const tp = primaryDirection === "buy" ? currentPrice + (tpPips / 100) : currentPrice - (tpPips / 100);

  if (isEntryAllowed) reasons.push("【AI最高評価】全フィルター合致");
  if (!isRiskOk) reasons.push("リスク制限により停止中");
  
  const recommendationAction: "BUY" | "SELL" | "WAIT" | "CAUTION_LOT_REDUCTION" | "PROHIBITED" = 
    !isEntryAllowed ? (indicatorStatus.status === "prohibited" ? "PROHIBITED" : "WAIT") :
    (indicatorStatus.status === "caution" ? "CAUTION_LOT_REDUCTION" : (primaryDirection === "buy" ? "BUY" : "SELL"));

  return {
    confidence: Math.round(totalScore),
    isEntryAllowed,
    reasons,
    trends,
    alignmentLevel,
    volatilityATR: currentATR,
    session,
    isBreakout: false,
    isFakeoutSuspicion: fakeout.isFakeout,
    regime,
    isEnvironmentOk: isVolOk && session.isOk,
    envDetails: {
      isPerfectOrder: alignmentLevel === 100,
      isHighVol: currentATR > 0.15
    },
    score: totalScore,
    structure: structure || { type: "UNKNOWN", completionScore: 0, label: "解析中", reasons: [], isEntryTiming: false, energyLevel: 0 },
    orderBook: orderBook || { bids: [], asks: [], imbalance: 0, liquidityScore: 0, walls: { resistance: [], support: [] } },
    recommendation: {
      action: recommendationAction,
      lot: Number(adjustedLot.toFixed(2)),
      tp,
      sl,
      rr: Number((tpPips / slPips).toFixed(2)),
      reason: reasons[reasons.length -1] || "条件待機中"
    }
  };
}

// Helper functions (Internal use only)

function getTrend(data: any[]): TechnicalTrend {
  if (data.length < 20) return "neutral";
  const last = data[data.length - 1].close;
  const prev = data[data.length - 10].close;
  if (last > prev + 0.01) return "bullish";
  if (last < prev - 0.01) return "bearish";
  return "neutral";
}

function checkMarketSession() {
  const hour = new Date().getHours();
  // 東京: 9-15, ロンドン: 16-24, NY: 21-06
  if (hour >= 9 && hour <= 15) return { name: "Tokyo", isOk: true, score: 80 };
  if (hour >= 16 && hour <= 20) return { name: "London", isOk: true, score: 100 };
  if (hour >= 21 || hour <= 2) return { name: "New York", isOk: true, score: 100 };
  return { name: "Inter-session", isOk: false, score: 50 };
}

function checkFakeout(data: any[], direction: string, strictness: number) {
  if (data.length < 5) return { isFakeout: false };
  const last = data[data.length - 1];
  const body = Math.abs(last.open - last.close);
  const upperWick = last.high - Math.max(last.open, last.close);
  const lowerWick = Math.min(last.open, last.close) - last.low;
  
  if (direction === "buy" && upperWick > body * 1.5 * strictness) return { isFakeout: true };
  if (direction === "sell" && lowerWick > body * 1.5 * strictness) return { isFakeout: true };
  return { isFakeout: false };
}

function checkPullback(data: any[], direction: string) {
  if (data.length < 10) return { isPullback: false };
  const last = data[data.length - 1].close;
  const ma = data.slice(-10).reduce((a, b) => a + b.close, 0) / 10;
  if (direction === "buy" && last < ma + 0.02 && last > ma - 0.01) return { isPullback: true };
  if (direction === "sell" && last > ma - 0.02 && last < ma + 0.01) return { isPullback: true };
  return { isPullback: false };
}
