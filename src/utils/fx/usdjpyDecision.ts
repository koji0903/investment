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
  calculateATR,
  calculateRSI,
  calculateMACD,
  calculateEMA
} from "@/lib/technicalAnalysis";
import { FXRegimeService } from "@/services/fxRegimeService";

/**
 * USD/JPY専用 高度なエントリー判断エンジン (V3: 多層シグナル合流型)
 * - マルチタイムフレーム モメンタム確認
 * - 市場構造ベース ブレイクアウト判定
 * - ATR適応型 動的リスク/リワード最適化
 * - 統計的 シグナル合流スコアリング
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
  const closes1m = ohlcData["1m"].map(d => d.close);
  const closes5m = ohlcData["5m"].map(d => d.close);
  const closes15m = ohlcData["15m"].map(d => d.close);
  const closes1h = ohlcData["1h"].map(d => d.close);
  const currentPrice = closes1m[closes1m.length - 1];
  const session = checkMarketSession();
  const regime = FXRegimeService.detectMarketRegime(ohlcData);

  // 1. 高度なモメンタム確認 (マルチタイムフレーム)
  const momentumScores = analyzeMultiFrameMomentum(
    { closes1m, closes5m, closes15m, closes1h }
  );

  // 2. 市場構造分析 & ブレイクアウト判定
  const structureAnalysis = analyzeMarketStructure(
    ohlcData["5m"],
    ohlcData["1h"],
    momentumScores.primaryDirection
  );

  // 3. 動的ボラティリティ分析
  const volatilityAnalysis = analyzeVolatility(ohlcData["5m"], currentPrice);

  // 4. だまし検知 (高度)
  const fakeoutAnalysis = advancedFakeoutDetection(
    ohlcData["5m"],
    momentumScores.primaryDirection,
    momentumScores.rsiValues,
    tuningConfig?.fakeoutStrictness || 1.0
  );

  // 5. シグナル合流スコアリング
  const confluenceScore = calculateConfluenceScore(
    momentumScores,
    structureAnalysis,
    volatilityAnalysis,
    fakeoutAnalysis,
    regime,
    session
  );

  // 6. 動的リスク/リワード計算
  const riskReward = calculateDynamicRiskReward(
    currentPrice,
    momentumScores.primaryDirection,
    volatilityAnalysis.currentATR,
    structureAnalysis
  );

  const reasons: string[] = [];
  buildReasonString(
    reasons,
    momentumScores,
    structureAnalysis,
    volatilityAnalysis,
    fakeoutAnalysis,
    confluenceScore,
    indicatorStatus,
    regime
  );

  // 7. 学習メトリクス補正
  let learningCorrection = 0;
  learningMetrics.forEach(m => {
    if (m.reliabilityCorrection !== 0) learningCorrection += m.reliabilityCorrection;
  });

  const finalScore = Math.max(0, Math.min(100, confluenceScore.total + learningCorrection + (weightProfile?.bias || 0)));
  const confidenceThreshold = tuningConfig?.confidenceThreshold || 70;

  const isRiskOk = !riskMetrics || (
    riskMetrics.consecutiveLosses < (tuningConfig?.maxDailyDrawdownAllowed ? 5 : 3) &&
    riskMetrics.drawdownPercent < (tuningConfig?.maxDailyDrawdownAllowed || 10)
  );

  const isEntryAllowed =
    momentumScores.primaryDirection !== "none" &&
    confluenceScore.total >= confidenceThreshold &&
    volatilityAnalysis.isVolatileOk &&
    session.isOk &&
    !fakeoutAnalysis.isFakeout &&
    isRiskOk &&
    (isHighProbMode ? structureAnalysis.isPullback : true) &&
    (indicatorStatus?.status !== "prohibited") &&
    (executionProfile?.status !== "critical") &&
    (structure ? structure.isEntryTiming : true);

  // ロット調整
  const baseLot = 1.0;
  let adjustedLot = baseLot * (tuningConfig?.riskMultiplier || 1.0);
  adjustedLot *= (finalScore / 100); // 信頼度に応じて調整
  if (indicatorStatus.status === "caution") adjustedLot *= 0.5;
  if (riskMetrics && riskMetrics.consecutiveLosses >= 1) adjustedLot *= 0.7;

  if (isEntryAllowed) reasons.push("✓ マルチシグナル合流 - エントリー許可");
  if (!isRiskOk) reasons.push("⚠ リスク制限により停止中");

  const recommendationAction: "BUY" | "SELL" | "WAIT" | "CAUTION_LOT_REDUCTION" | "PROHIBITED" =
    !isEntryAllowed ? (indicatorStatus.status === "prohibited" ? "PROHIBITED" : "WAIT") :
    (indicatorStatus.status === "caution" ? "CAUTION_LOT_REDUCTION" : (momentumScores.primaryDirection === "buy" ? "BUY" : "SELL"));

  return {
    confidence: Math.round(finalScore),
    isEntryAllowed,
    reasons,
    trends: momentumScores.trends,
    alignmentLevel: confluenceScore.total,
    volatilityATR: volatilityAnalysis.currentATR,
    session,
    isBreakout: structureAnalysis.isBreakout,
    isFakeoutSuspicion: fakeoutAnalysis.isFakeout,
    regime,
    isEnvironmentOk: volatilityAnalysis.isVolatileOk && session.isOk,
    envDetails: {
      isPerfectOrder: confluenceScore.total >= 85,
      isHighVol: volatilityAnalysis.currentATR > 0.15
    },
    score: finalScore,
    structure: structure || { type: "UNKNOWN", completionScore: 0, label: "解析中", reasons: [], isEntryTiming: false, energyLevel: 0 },
    orderBook: orderBook || { bids: [], asks: [], imbalance: 0, liquidityScore: 0, walls: { resistance: [], support: [] } },
    recommendation: {
      action: recommendationAction,
      lot: Number(adjustedLot.toFixed(2)),
      tp: riskReward.tp,
      sl: riskReward.sl,
      rr: riskReward.rr,
      reason: reasons[reasons.length - 1] || "条件待機中"
    }
  };
}

// ============================================================================
// 高度なテクニカル分析関数群
// ============================================================================

interface MomentumScores {
  primaryDirection: "buy" | "sell" | "none";
  confidence: number;
  trends: Record<string, TechnicalTrend>;
  rsiValues: { tf1m: number; tf5m: number; tf15m: number; tf1h: number };
  macdValues: { tf5m: { histogram: number; signal: number }; tf1h: { histogram: number; signal: number } };
}

interface StructureAnalysis {
  isBreakout: boolean;
  isPullback: boolean;
  supportLevel: number;
  resistanceLevel: number;
  isBrokenLevel: boolean;
  pullbackDepth: number;
}

interface VolatilityAnalysis {
  currentATR: number;
  volatilityLevel: "low" | "normal" | "high";
  isVolatileOk: boolean;
}

interface FakeoutAnalysis {
  isFakeout: boolean;
  reason: string;
  wickRatio: number;
}

interface ConfluenceScore {
  total: number;
  momentum: number;
  structure: number;
  volatility: number;
  rsi: number;
  macd: number;
}

function analyzeMultiFrameMomentum(
  closeData: { closes1m: number[]; closes5m: number[]; closes15m: number[]; closes1h: number[] }
): MomentumScores {
  const rsi1m = calculateRSI(closeData.closes1m, 14);
  const rsi5m = calculateRSI(closeData.closes5m, 14);
  const rsi15m = calculateRSI(closeData.closes15m, 14);
  const rsi1h = calculateRSI(closeData.closes1h, 14);

  const macd5m = calculateMACD(closeData.closes5m, 12, 26, 9);
  const macd1h = calculateMACD(closeData.closes1h, 12, 26, 9);

  const rsiVals = {
    tf1m: rsi1m[rsi1m.length - 1] || 50,
    tf5m: rsi5m[rsi5m.length - 1] || 50,
    tf15m: rsi15m[rsi15m.length - 1] || 50,
    tf1h: rsi1h[rsi1h.length - 1] || 50
  };

  const macdVals = {
    tf5m: {
      histogram: macd5m.histogram[macd5m.histogram.length - 1] || 0,
      signal: macd5m.signalLine[macd5m.signalLine.length - 1] || 0
    },
    tf1h: {
      histogram: macd1h.histogram[macd1h.histogram.length - 1] || 0,
      signal: macd1h.signalLine[macd1h.signalLine.length - 1] || 0
    }
  };

  // トレンド判定 (MA + RSI確認)
  const ema21_5m = calculateEMA(closeData.closes5m, 21);
  const ema21_1h = calculateEMA(closeData.closes1h, 21);
  const last5m = closeData.closes5m[closeData.closes5m.length - 1];
  const last1h = closeData.closes1h[closeData.closes1h.length - 1];

  const bullish5m = last5m > ema21_5m[ema21_5m.length - 1] && rsiVals.tf5m > 45;
  const bearish5m = last5m < ema21_5m[ema21_5m.length - 1] && rsiVals.tf5m < 55;
  const bullish1h = last1h > ema21_1h[ema21_1h.length - 1] && rsiVals.tf1h > 45;
  const bearish1h = last1h < ema21_1h[ema21_1h.length - 1] && rsiVals.tf1h < 55;

  const bullishCount = [bullish5m, bullish1h].filter(Boolean).length;
  const bearishCount = [bearish5m, bearish1h].filter(Boolean).length;

  const primaryDirection: "buy" | "sell" | "none" =
    bullishCount >= 1 && !bearish5m && macdVals.tf5m.histogram > 0 ? "buy" :
    bearishCount >= 1 && !bullish5m && macdVals.tf5m.histogram < 0 ? "sell" :
    "none";

  const trends: Record<string, TechnicalTrend> = {
    "1m": rsiVals.tf1m > 55 ? "bullish" : rsiVals.tf1m < 45 ? "bearish" : "neutral",
    "5m": bullish5m ? "bullish" : bearish5m ? "bearish" : "neutral",
    "15m": rsiVals.tf15m > 55 ? "bullish" : rsiVals.tf15m < 45 ? "bearish" : "neutral",
    "1h": bullish1h ? "bullish" : bearish1h ? "bearish" : "neutral"
  };

  const confidence = primaryDirection !== "none" ? 75 : 30;

  return {
    primaryDirection,
    confidence,
    trends,
    rsiValues: rsiVals,
    macdValues: macdVals
  };
}

function analyzeMarketStructure(ohlc5m: any[], _ohlc1h: any[], direction: "buy" | "sell" | "none"): StructureAnalysis {
  const data5m = ohlc5m.slice(-50);

  // サポート/レジスタンス検出
  const resistance = Math.max(...data5m.map(d => d.high));
  const support = Math.min(...data5m.map(d => d.low));
  const currentPrice = data5m[data5m.length - 1].close;

  // ブレイクアウト判定
  const isResistanceBreak = currentPrice > resistance * 1.002;
  const isSupportBreak = currentPrice < support * 0.998;
  const isBreakout = (direction === "buy" && isResistanceBreak) || (direction === "sell" && isSupportBreak);

  // 押し目/戻り目検知 (EMA21確認)
  const ema21 = calculateEMA(data5m.map(d => d.close), 21);
  const lastPrice = data5m[data5m.length - 1].close;
  const ma21Value = ema21[ema21.length - 1];

  let isPullback = false;
  if (direction === "buy") {
    isPullback = lastPrice < ma21Value && lastPrice > support;
  } else if (direction === "sell") {
    isPullback = lastPrice > ma21Value && lastPrice < resistance;
  }

  // 高値安値の連続性確認 (市場構造)
  let pullbackDepth = 0;
  if (direction === "buy" && data5m.length >= 3) {
    const highs = data5m.slice(-3).map(d => d.high);
    pullbackDepth = Math.max(...highs) - currentPrice;
  }

  return {
    isBreakout,
    isPullback,
    supportLevel: support,
    resistanceLevel: resistance,
    isBrokenLevel: isBreakout,
    pullbackDepth
  };
}

function analyzeVolatility(ohlc5m: any[], currentPrice: number): VolatilityAnalysis {
  const atr = calculateATR(
    {
      high: ohlc5m.map(d => d.high),
      low: ohlc5m.map(d => d.low),
      close: ohlc5m.map(d => d.close)
    },
    14
  );
  const currentATR = atr[atr.length - 1] || 0.05;
  const atrPercent = (currentATR / currentPrice) * 100;

  const volatilityLevel: "low" | "normal" | "high" =
    atrPercent < 0.15 ? "low" : atrPercent > 0.35 ? "high" : "normal";

  const isVolatileOk = volatilityLevel !== "low" && atrPercent < 0.50;

  return {
    currentATR,
    volatilityLevel,
    isVolatileOk
  };
}

function advancedFakeoutDetection(
  ohlc5m: any[],
  direction: "buy" | "sell" | "none",
  rsiValues: { tf1m: number; tf5m: number; tf15m: number; tf1h: number },
  strictness: number
): FakeoutAnalysis {
  if (ohlc5m.length < 5) return { isFakeout: false, reason: "データ不足", wickRatio: 0 };

  const last = ohlc5m[ohlc5m.length - 1];
  const prev = ohlc5m[ohlc5m.length - 2];
  const body = Math.abs(last.open - last.close);
  const upperWick = last.high - Math.max(last.open, last.close);
  const lowerWick = Math.min(last.open, last.close) - last.low;

  let isFakeout = false;
  let reason = "正常";
  let wickRatio = 0;

  if (direction === "buy") {
    wickRatio = upperWick / Math.max(body, 0.0001);
    const isLargeUpperWick = wickRatio > 1.5 * strictness;
    const isRSIOverbought = rsiValues.tf5m > 75;
    const isPrevBar = prev.close < last.open;
    isFakeout = isLargeUpperWick && (isRSIOverbought || isPrevBar);
    if (isFakeout) reason = `上ヒゲだまし (比率: ${wickRatio.toFixed(2)})`;
  } else if (direction === "sell") {
    wickRatio = lowerWick / Math.max(body, 0.0001);
    const isLargeLowerWick = wickRatio > 1.5 * strictness;
    const isRSIOversold = rsiValues.tf5m < 25;
    const isPrevBar = prev.close > last.open;
    isFakeout = isLargeLowerWick && (isRSIOversold || isPrevBar);
    if (isFakeout) reason = `下ヒゲだまし (比率: ${wickRatio.toFixed(2)})`;
  }

  return { isFakeout, reason, wickRatio };
}

function calculateConfluenceScore(
  momentum: MomentumScores,
  structure: StructureAnalysis,
  volatility: VolatilityAnalysis,
  fakeout: FakeoutAnalysis,
  regime: FXMarketRegime,
  session: { name: string; isOk: boolean; score: number }
): ConfluenceScore {
  // モメンタムスコア (0-30)
  const momentumScore =
    momentum.primaryDirection !== "none"
      ? 20 +
        (Math.abs(momentum.rsiValues.tf5m - 50) > 10 ? 10 : 5)
      : 0;

  // 構造スコア (0-25)
  let structureScore = 0;
  if (structure.isPullback) structureScore += 15;
  if (structure.isBreakout) structureScore += 10;
  structureScore = Math.min(25, structureScore);

  // ボラティリティスコア (0-20)
  const volatilityScore =
    volatility.volatilityLevel === "normal" ? 15 : volatility.volatilityLevel === "high" ? 20 : 5;

  // RSIスコア (0-15)
  const rsiAvg = (momentum.rsiValues.tf5m + momentum.rsiValues.tf1h) / 2;
  let rsiScore = 0;
  if (momentum.primaryDirection === "buy" && rsiAvg > 50 && rsiAvg < 75) rsiScore = 15;
  else if (momentum.primaryDirection === "sell" && rsiAvg < 50 && rsiAvg > 25) rsiScore = 15;
  else if (rsiAvg > 40 && rsiAvg < 60) rsiScore = 8;

  // MACDスコア (0-10)
  let macdScore = 0;
  const macd5mOk = momentum.primaryDirection === "buy" ? momentum.macdValues.tf5m.histogram > 0 : momentum.macdValues.tf5m.histogram < 0;
  const macd1hOk = momentum.primaryDirection === "buy" ? momentum.macdValues.tf1h.histogram > 0 : momentum.macdValues.tf1h.histogram < 0;
  if (macd5mOk && macd1hOk) macdScore = 10;
  else if (macd5mOk || macd1hOk) macdScore = 6;

  // 罰点 (だまし、セッション外など)
  let penalty = 0;
  if (fakeout.isFakeout) penalty += 20;
  if (!session.isOk) penalty += 10;
  if (!volatility.isVolatileOk) penalty += 5;

  const total = Math.max(0, momentumScore + structureScore + volatilityScore + rsiScore + macdScore + session.score / 10 - penalty);

  return {
    total: Math.min(100, total),
    momentum: momentumScore,
    structure: structureScore,
    volatility: volatilityScore,
    rsi: rsiScore,
    macd: macdScore
  };
}

function calculateDynamicRiskReward(
  currentPrice: number,
  direction: "buy" | "sell" | "none",
  atr: number,
  structure: StructureAnalysis
): { tp: number; sl: number; rr: number } {
  // ATRベースのSL計算 (1.5倍ATR)
  const slDistance = atr * 1.5;
  // 市場構造からのTP計算
  const tpDistance = structure.pullbackDepth > 0 ? structure.pullbackDepth * 2.5 : atr * 3.0;

  if (direction === "buy") {
    return {
      sl: Number((currentPrice - slDistance).toFixed(4)),
      tp: Number((currentPrice + tpDistance).toFixed(4)),
      rr: Number((tpDistance / slDistance).toFixed(2))
    };
  } else if (direction === "sell") {
    return {
      sl: Number((currentPrice + slDistance).toFixed(4)),
      tp: Number((currentPrice - tpDistance).toFixed(4)),
      rr: Number((tpDistance / slDistance).toFixed(2))
    };
  }

  return { tp: currentPrice, sl: currentPrice, rr: 1.0 };
}

function buildReasonString(
  reasons: string[],
  momentum: MomentumScores,
  structure: StructureAnalysis,
  volatility: VolatilityAnalysis,
  fakeout: FakeoutAnalysis,
  confluence: ConfluenceScore,
  indicatorStatus: { status: "normal" | "caution" | "prohibited"; message: string },
  _regime: FXMarketRegime
): void {
  if (momentum.primaryDirection === "buy") reasons.push("📈 買いシグナル");
  else if (momentum.primaryDirection === "sell") reasons.push("📉 売りシグナル");

  if (momentum.rsiValues.tf5m > 60) reasons.push(`RSI強気 (${momentum.rsiValues.tf5m.toFixed(0)})`);
  else if (momentum.rsiValues.tf5m < 40) reasons.push(`RSI弱気 (${momentum.rsiValues.tf5m.toFixed(0)})`);

  if (momentum.macdValues.tf5m.histogram > 0) reasons.push("MACD正転");
  else if (momentum.macdValues.tf5m.histogram < 0) reasons.push("MACD逆転");

  if (structure.isPullback) reasons.push("✓ 押し目/戻り目確認");
  if (structure.isBreakout) reasons.push("🔓 レベルブレイク");

  if (volatility.volatilityLevel === "high") reasons.push("⚡ 高ボラ環境");
  if (!fakeout.isFakeout && fakeout.wickRatio < 1.0) reasons.push("✓ だまし懸念なし");
  else if (fakeout.isFakeout) reasons.push(`⚠ ${fakeout.reason}`);

  if (confluence.total >= 80) reasons.push("🎯 高信頼度シグナル合流");
  else if (confluence.total >= 60) reasons.push("◎ 複数条件合致");

  if (indicatorStatus.status === "caution") reasons.push(`⚠️ 警戒: ${indicatorStatus.message}`);
  else if (indicatorStatus.status === "prohibited") reasons.push(`🛑 禁止: ${indicatorStatus.message}`);
}

function checkMarketSession() {
  const hour = new Date().getHours();
  if (hour >= 9 && hour <= 15) return { name: "東京市場 (Tokyo)", isOk: true, score: 80 };
  if (hour >= 16 && hour <= 20) return { name: "ロンドン市場 (London)", isOk: true, score: 100 };
  if (hour >= 21 || hour <= 2) return { name: "NY市場 (New York)", isOk: true, score: 100 };
  return { name: "セッション外 (Inter-session)", isOk: false, score: 50 };
}
