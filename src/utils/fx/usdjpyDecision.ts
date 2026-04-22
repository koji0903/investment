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
    action: "BUY" | "SELL" | "WAIT" | "CAUTION_LOT_REDUCTION" | "PROHIBITED" | "BUY_PROBE" | "SELL_PROBE" | "BUY_PARTIAL" | "SELL_PARTIAL";
    lot: number;
    tp: number;
    sl: number;
    rr: number;
    reason: string;
    aggressiveness?: "conservative" | "moderate" | "aggressive";
  };
  // 詳細判断根拠 (新規追加)
  reasoningContext?: {
    summary: string;
    positiveFactors: Array<{ factor: string; score: number; explanation: string }>;
    negativeFactors: Array<{ factor: string; penalty: number; explanation: string }>;
    suspendReason?: string;
    suspendRemovalConditions?: string[];
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

  // 動的な信頼度閾値 (市場環境に応じた調整)
  const dynamicThreshold = calculateDynamicThreshold(
    regime.type,
    volatilityAnalysis.volatilityLevel,
    session.score,
    riskMetrics
  );

  const isRiskOk = !riskMetrics || (
    riskMetrics.consecutiveLosses < (tuningConfig?.maxDailyDrawdownAllowed ? 5 : 3) &&
    riskMetrics.drawdownPercent < (tuningConfig?.maxDailyDrawdownAllowed || 10)
  );

  // 段階的判定システム（AND ロジックではなく段階的スコア評価）
  const judgment = determineDecisionWithGradation(
    momentumScores,
    structureAnalysis,
    volatilityAnalysis,
    fakeoutAnalysis,
    confluenceScore,
    finalScore,
    dynamicThreshold,
    session,
    indicatorStatus,
    isRiskOk,
    riskMetrics
  );

  const isEntryAllowed = judgment.isEntryAllowed;

  if (isEntryAllowed) reasons.push(`✓ ${judgment.actionType}判定 - 信頼度${finalScore.toFixed(0)}%`);
  if (!isRiskOk) reasons.push("⚠ リスク制限により停止中");

  // ロット調整（判定レベルに応じた段階的調整）
  const baseLot = 1.0;
  let adjustedLot = calculateAdaptiveLot(
    baseLot,
    finalScore,
    judgment.aggressiveness,
    tuningConfig,
    indicatorStatus,
    riskMetrics,
    judgment.actionType
  );

  const recommendationAction: "BUY" | "SELL" | "WAIT" | "CAUTION_LOT_REDUCTION" | "PROHIBITED" | "BUY_PROBE" | "SELL_PROBE" | "BUY_PARTIAL" | "SELL_PARTIAL" =
    !isEntryAllowed ? (indicatorStatus.status === "prohibited" ? "PROHIBITED" : "WAIT") :
    judgment.recommendedAction;

  // 詳細な判断根拠を構築
  const reasoningContext = buildDetailedReasoningContext(
    momentumScores,
    structureAnalysis,
    volatilityAnalysis,
    fakeoutAnalysis,
    confluenceScore,
    session,
    indicatorStatus,
    riskMetrics,
    isRiskOk,
    isEntryAllowed
  );

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
      reason: reasons[reasons.length - 1] || "条件待機中",
      aggressiveness: judgment.aggressiveness
    },
    reasoningContext
  };
}

// ============================================================================
// デイトレ向け段階的判定システム
// ============================================================================

interface GradationJudgment {
  isEntryAllowed: boolean;
  recommendedAction: "BUY" | "SELL" | "BUY_PROBE" | "SELL_PROBE" | "BUY_PARTIAL" | "SELL_PARTIAL" | "WAIT" | "CAUTION_LOT_REDUCTION" | "PROHIBITED";
  aggressiveness: "conservative" | "moderate" | "aggressive";
  actionType: "標準" | "試し買い" | "一部";
  rationale: string;
}

function calculateDynamicThreshold(
  regimeType: string,
  volatilityLevel: "low" | "normal" | "high",
  sessionScore: number,
  riskMetrics: any
): number {
  let baseThreshold = 70; // デフォルト

  // レジーム別調整
  if (regimeType === "TREND_UP" || regimeType === "TREND_DOWN") {
    baseThreshold -= 15; // トレンド相場: 55
  } else if (regimeType === "STRONG_TREND") {
    baseThreshold -= 20; // 強いトレンド: 50
  } else if (regimeType.includes("RANGE")) {
    baseThreshold += 10; // レンジ相場: 80（厳しく）
  }

  // ボラティリティ別調整
  if (volatilityLevel === "high") {
    baseThreshold -= 10; // 高ボラ: 活発な相場を活かす
  } else if (volatilityLevel === "low") {
    baseThreshold += 5; // 低ボラ: 慎重に
  }

  // セッション別調整
  if (sessionScore >= 100) {
    baseThreshold -= 5; // ロンドン・NY開始時は積極的
  }

  // リスク状況別調整
  if (riskMetrics) {
    if (riskMetrics.consecutiveLosses >= 3) baseThreshold += 10; // 連敗中は慎重
    if (riskMetrics.drawdownPercent > 5) baseThreshold += 5; // DD増加中は慎重
  }

  return Math.max(40, Math.min(85, baseThreshold)); // 40-85の範囲で制限
}

function determineDecisionWithGradation(
  momentum: MomentumScores,
  structure: StructureAnalysis,
  volatility: VolatilityAnalysis,
  fakeout: FakeoutAnalysis,
  confluence: ConfluenceScore,
  finalScore: number,
  dynamicThreshold: number,
  session: any,
  indicatorStatus: any,
  isRiskOk: boolean,
  riskMetrics: any
): GradationJudgment {
  // 禁止状況の判定
  if (indicatorStatus?.status === "prohibited") {
    return {
      isEntryAllowed: false,
      recommendedAction: "PROHIBITED",
      aggressiveness: "conservative",
      actionType: "標準",
      rationale: "重要指標発表中は取引禁止"
    };
  }

  if (!isRiskOk) {
    return {
      isEntryAllowed: false,
      recommendedAction: "CAUTION_LOT_REDUCTION",
      aggressiveness: "conservative",
      actionType: "標準",
      rationale: "リスク制限により停止"
    };
  }

  // トレンド方向の確認
  const hasDirection = momentum.primaryDirection !== "none";
  if (!hasDirection) {
    return {
      isEntryAllowed: false,
      recommendedAction: "WAIT",
      aggressiveness: "conservative",
      actionType: "標準",
      rationale: "トレンド方向が不明確"
    };
  }

  // だまし懸念 → スコア削減（完全禁止ではなく）
  let adjustedScore = finalScore;
  if (fakeout.isFakeout) {
    adjustedScore *= 0.7; // 30%削減
  }

  // マイクロトレンドボーナス（短期モメンタム）
  const microTrendBonus = analyzeMicroTrend(momentum, structure) * 15;
  adjustedScore = Math.min(100, adjustedScore + microTrendBonus);

  // 段階的判定
  const isCaution = indicatorStatus?.status === "caution";

  // 【高確度エントリー】 75点以上
  if (adjustedScore >= 75 && volatility.isVolatileOk && session.isOk) {
    const action = momentum.primaryDirection === "buy"
      ? "BUY"
      : "SELL";

    return {
      isEntryAllowed: true,
      recommendedAction: action,
      aggressiveness: "aggressive",
      actionType: "標準",
      rationale: `高信頼度シグナル（${adjustedScore.toFixed(0)}/100）- 標準ロットでエントリー`
    };
  }

  // 【標準エントリー】 60点以上 & 基本条件OK
  if (adjustedScore >= 60 && volatility.isVolatileOk && !fakeout.isFakeout) {
    const action = momentum.primaryDirection === "buy"
      ? "BUY"
      : "SELL";

    return {
      isEntryAllowed: true,
      recommendedAction: action,
      aggressiveness: "moderate",
      actionType: "標準",
      rationale: `確度エントリー（${adjustedScore.toFixed(0)}/100） - 条件整い判定`
    };
  }

  // 【試し買い】 45点以上 & トレンド確認
  if (
    adjustedScore >= 45 &&
    (momentum.rsiValues.tf5m > 40 && momentum.rsiValues.tf5m < 70)
  ) {
    const action = momentum.primaryDirection === "buy"
      ? "BUY_PROBE"
      : "SELL_PROBE";

    return {
      isEntryAllowed: true,
      recommendedAction: action,
      aggressiveness: "moderate",
      actionType: "試し買い",
      rationale: `試験的エントリー（${adjustedScore.toFixed(0)}/100）- 小ロット0.5Lot`
    };
  }

  // 【一部エントリー】 40点以上 & マイクロトレンド確認
  if (adjustedScore >= 40 && structure.isPullback) {
    const action = momentum.primaryDirection === "buy"
      ? "BUY_PARTIAL"
      : "SELL_PARTIAL";

    return {
      isEntryAllowed: true,
      recommendedAction: action,
      aggressiveness: "conservative",
      actionType: "一部",
      rationale: `スケーリングエントリー（${adjustedScore.toFixed(0)}/100）- 初期ロット0.3Lot`
    };
  }

  // 待機
  return {
    isEntryAllowed: false,
    recommendedAction: "WAIT",
    aggressiveness: "conservative",
    actionType: "標準",
    rationale: `待機中（スコア${adjustedScore.toFixed(0)}/100、閾値${dynamicThreshold.toFixed(0)}） - 次のシグナル待機`
  };
}

function analyzeMicroTrend(momentum: MomentumScores, structure: StructureAnalysis): number {
  let bonus = 0;

  // RSI水準による加算
  if (momentum.primaryDirection === "buy") {
    if (momentum.rsiValues.tf1m > 50 && momentum.rsiValues.tf5m > 50) bonus += 0.5;
    if (momentum.macdValues.tf5m.histogram > 0) bonus += 0.3;
  } else {
    if (momentum.rsiValues.tf1m < 50 && momentum.rsiValues.tf5m < 50) bonus += 0.5;
    if (momentum.macdValues.tf5m.histogram < 0) bonus += 0.3;
  }

  // 構造ボーナス
  if (structure.isPullback) bonus += 0.4;
  if (structure.isBreakout) bonus += 0.3;

  return Math.min(1.0, bonus);
}

function calculateAdaptiveLot(
  baseLot: number,
  finalScore: number,
  aggressiveness: "conservative" | "moderate" | "aggressive",
  tuningConfig: any,
  indicatorStatus: any,
  riskMetrics: any,
  actionType: string
): number {
  let lot = baseLot * (tuningConfig?.riskMultiplier || 1.0);

  // アグレッシブレベルに応じた倍率
  if (aggressiveness === "aggressive") {
    lot *= 1.0; // 標準
  } else if (aggressiveness === "moderate") {
    lot *= 0.8; // 20%削減
  } else {
    lot *= 0.5; // 50%削減
  }

  // アクションタイプに応じた調整
  if (actionType === "試し買い") {
    lot *= 0.5; // 50% = 0.5 Lot
  } else if (actionType === "一部") {
    lot *= 0.3; // 30% = 0.3 Lot
  }

  // スコアに応じた動的調整
  lot *= Math.max(0.3, finalScore / 100);

  // 指標警戒時
  if (indicatorStatus?.status === "caution") {
    lot *= 0.5;
  }

  // 連敗時
  if (riskMetrics?.consecutiveLosses >= 1) {
    lot *= Math.max(0.5, 1.0 - riskMetrics.consecutiveLosses * 0.15);
  }

  return Number(Math.max(0.01, lot).toFixed(2));
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

// ============================================================================
// 詳細判断根拠の構築
// ============================================================================

function buildDetailedReasoningContext(
  momentum: MomentumScores,
  structure: StructureAnalysis,
  volatility: VolatilityAnalysis,
  fakeout: FakeoutAnalysis,
  confluence: ConfluenceScore,
  session: { name: string; isOk: boolean; score: number },
  indicatorStatus: { status: "normal" | "caution" | "prohibited"; message: string },
  riskMetrics: any,
  isRiskOk: boolean,
  isEntryAllowed: boolean
) {
  const positiveFactors: Array<{ factor: string; score: number; explanation: string }> = [];
  const negativeFactors: Array<{ factor: string; penalty: number; explanation: string }> = [];

  // ポジティブ要因の分析
  if (momentum.primaryDirection !== "none") {
    positiveFactors.push({
      factor: "トレンド方向性",
      score: 20,
      explanation: `${momentum.primaryDirection === "buy" ? "上昇" : "下降"}トレンドが複数タイムフレームで確認されています（信頼度: ${momentum.confidence}%）`
    });
  }

  if (momentum.rsiValues.tf5m > 55 && momentum.rsiValues.tf5m < 75) {
    positiveFactors.push({
      factor: "RSI最適水準",
      score: 12,
      explanation: `5分足RSI ${momentum.rsiValues.tf5m.toFixed(0)}は過熱でも売られすぎでもなく、トレンド確認に最適な水準です`
    });
  }

  if (momentum.macdValues.tf5m.histogram > 0 && momentum.primaryDirection === "buy") {
    positiveFactors.push({
      factor: "MACD正転",
      score: 10,
      explanation: "MACD Histogramが正転し、上昇モメンタムの強化を示唆しています"
    });
  }

  if (structure.isPullback) {
    positiveFactors.push({
      factor: "押し目確認",
      score: 15,
      explanation: `EMA21付近での押し目が確認されており、エントリー最適タイミングです（深さ: ${structure.pullbackDepth.toFixed(4)}）`
    });
  }

  if (structure.isBreakout) {
    positiveFactors.push({
      factor: "レベルブレイク",
      score: 13,
      explanation: "直近の抵抗線/サポート線を正規ブレイクし、新たなトレンド形成が期待できます"
    });
  }

  if (volatility.volatilityLevel === "normal" || volatility.volatilityLevel === "high") {
    positiveFactors.push({
      factor: "ボラティリティ適正",
      score: 10,
      explanation: `現在のATR ${volatility.currentATR.toFixed(5)} は取引に十分な値動きを提供しています`
    });
  }

  if (session.isOk) {
    positiveFactors.push({
      factor: "アクティブセッション",
      score: 8,
      explanation: `${session.name}が稼働中で、流動性と値動きが確保されています`
    });
  }

  // ネガティブ要因の分析
  if (fakeout.isFakeout) {
    negativeFactors.push({
      factor: "だまし懸念",
      penalty: 20,
      explanation: `${fakeout.reason} - 高い確率でフェイクブレイクの可能性があります`
    });
  }

  if (!session.isOk) {
    negativeFactors.push({
      factor: "セッション外",
      penalty: 10,
      explanation: "市場のアクティブセッション外のため、流動性不足と予期しない値動きのリスクがあります"
    });
  }

  if (!volatility.isVolatileOk) {
    negativeFactors.push({
      factor: "ボラティリティ不足",
      penalty: 8,
      explanation: `現在のボラティリティが低すぎて、取引効率が低下する可能性があります`
    });
  }

  if (momentum.rsiValues.tf5m > 75) {
    negativeFactors.push({
      factor: "RSI過熱",
      penalty: 12,
      explanation: `RSI ${momentum.rsiValues.tf5m.toFixed(0)} は過熱水準にあり、反転リスクが高まっています`
    });
  }

  if (momentum.rsiValues.tf5m < 25) {
    negativeFactors.push({
      factor: "RSI売られすぎ",
      penalty: 12,
      explanation: `RSI ${momentum.rsiValues.tf5m.toFixed(0)} は売られすぎ水準にあり、下振れリスクが高まっています`
    });
  }

  // 停止理由と解除条件を構築
  let suspendReason: string | undefined;
  let suspendRemovalConditions: string[] = [];

  if (!isEntryAllowed) {
    if (indicatorStatus.status === "prohibited") {
      suspendReason = `🛑 重要経済指標による取引禁止: ${indicatorStatus.message}`;
      suspendRemovalConditions = [
        "指標発表から30分以上経過",
        "市場が正常な値動きに戻る（ボラティリティが正常化）",
        "システムが自動的に運用状態を確認した後"
      ];
    } else if (indicatorStatus.status === "caution") {
      suspendReason = `⚠️ 経済指標警戒中: ${indicatorStatus.message}`;
      suspendRemovalConditions = [
        "指標の影響が市場から消滅（通常20分程度）",
        "ボラティリティが通常範囲内（ATR > 0.03）に戻る"
      ];
    } else if (!isRiskOk) {
      suspendReason = "⚠️ リスク管理による取引制限";
      const consecutiveLosses = riskMetrics?.consecutiveLosses || 0;
      const drawdown = riskMetrics?.drawdownPercent || 0;
      suspendRemovalConditions = [
        consecutiveLosses >= 3 ? `連敗を2敗以下に減少させる（現在: ${consecutiveLosses}連敗）` : "",
        drawdown > 5 ? `本日のドローダウンを5%以下に抑制する（現在: ${drawdown.toFixed(1)}%）` : "",
        "30分以上安定した取引環境を保つ"
      ].filter(Boolean);
    } else if (!volatility.isVolatileOk) {
      suspendReason = "ボラティリティが不適切な水準です";
      suspendRemovalConditions = [
        "ボラティリティが正常範囲に戻るまで待機（ATR: 0.03～0.25）",
        "市場が大きく動き始めるまで待機"
      ];
    } else if (!session.isOk) {
      suspendReason = "非アクティブセッション中のため待機中";
      suspendRemovalConditions = [
        `${session.name}まで待機`,
        "セッション開始後、市場が正常化するまで（通常5～10分）"
      ];
    } else if (momentum.primaryDirection === "none") {
      suspendReason = "トレンド方向性が不明確です";
      suspendRemovalConditions = [
        "複数タイムフレーム（5m・15m）で同一方向のトレンド形成",
        "RSI/MACDで明確な方向性確認",
        "市場レジーム（トレンド vs レンジ）の判定"
      ];
    } else if (confluence.total < 70) {
      suspendReason = `シグナル合流度が不十分です（現在: ${confluence.total.toFixed(0)}/100）`;
      suspendRemovalConditions = [
        "複数の技術指標が同時に同じ方向を示す",
        "市場構造が明確なサポート/レジスタンスを形成",
        "信頼度スコアが70以上に上昇"
      ];
    }
  }

  const summary = isEntryAllowed
    ? `✅ エントリー許可：${momentum.primaryDirection === "buy" ? "買い" : "売り"}シグナル、信頼度${confluence.total.toFixed(0)}/100`
    : suspendReason || "条件を満たしていません";

  return {
    summary,
    positiveFactors: positiveFactors.sort((a, b) => b.score - a.score),
    negativeFactors: negativeFactors.sort((a, b) => b.penalty - a.penalty),
    suspendReason,
    suspendRemovalConditions
  };
}
