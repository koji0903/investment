import { 
  TechnicalTrend, 
  LearningMetric,
  FXWeightProfile,
  FXMarketRegime
} from "@/types/fx";
import { 
  calculateATR 
} from "@/lib/technicalAnalysis";
import { FXRegimeService } from "@/services/fxRegimeService";

/**
 * USD/JPY専用 エントリー判断エンジン (V2: 自己進化型)
 */
export interface USDJPYDecisionResult {
  score: number;
  signal: "buy" | "sell" | "wait";
  isEntryAllowed: boolean;
  isEnvironmentOk: boolean;
  alignmentLevel: number; // 0, 33, 66, 100
  confidence: number;
  reasons: string[];
  trends: {
    "1m": TechnicalTrend;
    "5m": TechnicalTrend;
    "15m": TechnicalTrend;
    "1h": TechnicalTrend;
  };
  session: {
    name: string;
    isOk: boolean;
  };
  volatilityATR: number;
  supportResistance: {
    support: number;
    resistance: number;
  };
  isBreakout: boolean;
  isFakeoutSuspicion: boolean;
  envDetails: {
    isPerfectOrder: boolean;
    isHighVolatility: boolean;
  };
  regime: FXMarketRegime;
}

export function calculateUSDJPYDecision(
  ohlcData: Record<string, any[]>,
  learningMetrics: LearningMetric[],
  isHighProbMode: boolean = true,
  weightProfile: FXWeightProfile | null = null
): USDJPYDecisionResult {
  const trends = {
    "1m": getTrend(ohlcData["1m"]),
    "5m": getTrend(ohlcData["5m"]),
    "15m": getTrend(ohlcData["15m"]),
    "1h": getTrend(ohlcData["1h"]),
  };

  const session = checkMarketSession();
  const currentPrice = ohlcData["1m"][ohlcData["1m"].length - 1].close;
  const regime = FXRegimeService.detectMarketRegime(ohlcData);
  
  // トレンド一致度の算出 (0-100)
  const shortTermTrends = [trends["1m"], trends["5m"], trends["15m"]];
  const bullishCount = shortTermTrends.filter(v => v === "bullish").length;
  const bearishCount = shortTermTrends.filter(v => v === "bearish").length;
  const primaryDirection: "buy" | "sell" | "none" = bullishCount >= 2 ? "buy" : bearishCount >= 2 ? "sell" : "none";
  const alignmentLevel = Math.max(bullishCount, bearishCount) === 3 ? 100 : Math.max(bullishCount, bearishCount) === 2 ? 66 : 33;

  // 重みの取得 (標準 or AI最適化)
  const weights = weightProfile?.weights || {
    trendAlignment: 1.0,
    volatility: 1.0,
    supportResistance: 1.0,
    timeOfDay: 1.0,
    indicatorSignal: 1.0
  };

  const scores: Record<string, number> = {};
  const reasons: string[] = [];
  
  // 📈 1. トレンド判定 (Base 40)
  let trendScore = (alignmentLevel / 100) * 40 * weights.trendAlignment;
  if ((trends["1h"] === "bullish" && primaryDirection === "buy") || 
      (trends["1h"] === "bearish" && primaryDirection === "sell")) {
    trendScore += 10;
  }
  scores["trend"] = trendScore;

  // 📊 2. ボラティリティ判定 (Base 20)
  const atrArr = calculateATR({
    high: ohlcData["15m"].map(d => d.high),
    low: ohlcData["15m"].map(d => d.low),
    close: ohlcData["15m"].map(d => d.close)
  }, 14);
  const lastATR = atrArr[atrArr.length - 1];
  const isVolOk = lastATR > 0.08;
  let volScore = Math.min(lastATR * 100, 20) * weights.volatility;
  scores["volatility"] = volScore;

  // 🎯 3. サポレジ/ブレイク判定 (Base 30)
  const sr = findSRLevels(ohlcData["15m"]);
  const distToRes = (sr.resistance - currentPrice) * 100;
  const distToSup = (currentPrice - sr.support) * 100;
  const isBreakout = distToRes < 2 || distToSup < 2;
  
  let levelScore = 0;
  if (isBreakout) levelScore += 25 * weights.indicatorSignal;
  if (distToRes > 10 && primaryDirection === "buy") levelScore += 10; // 上値余地
  
  const fakeout = checkFakeout(ohlcData["5m"], primaryDirection);
  if (fakeout.isFakeout) levelScore -= 30;
  scores["levels"] = levelScore;

  // 🕒 4. セッション補正
  let sessionScore = session.isOk ? 10 * weights.timeOfDay : -10;
  scores["session"] = sessionScore;

  // 5. 学習メトリクスによる補正
  let learningCorrection = 0;
  learningMetrics.forEach(m => {
    if (m.reliabilityCorrection !== 0) {
      learningCorrection += m.reliabilityCorrection;
    }
  });

  // 合計スコア (0-100)
  let totalScore = Object.values(scores).reduce((a, b) => a + b, 0) + learningCorrection + (weightProfile?.bias || 0);
  totalScore = Math.max(0, Math.min(100, totalScore));

  const isEnvironmentOk = alignmentLevel >= 66 && isVolOk;
  const pullback = checkPullback(ohlcData["5m"], primaryDirection);

  // 最終判定
  const isEntryAllowed = 
    isEnvironmentOk && 
    session.isOk && 
    !fakeout.isFakeout &&
    (isHighProbMode ? pullback.isPullback : true) &&
    ((primaryDirection === "buy" && totalScore >= 70) || (primaryDirection === "sell" && totalScore >= 70));

  if (isEntryAllowed) reasons.push("【AI最高評価】全フィルター合致");
  if (alignmentLevel === 100) reasons.push("全時間足トレンド完全一致");
  if (pullback.isPullback) reasons.push("絶好の押し目/戻りポイント");
  if (fakeout.isFakeout) reasons.push("強引な動き（ダマし）を検知");
  if (weightProfile && weightProfile.sampleCount > 0) reasons.push("AI最適化重みを適用中");

  return {
    score: totalScore,
    signal: isEntryAllowed ? (primaryDirection === "buy" ? "buy" : "sell") : "wait",
    isEntryAllowed,
    isEnvironmentOk,
    alignmentLevel,
    confidence: Math.round(totalScore),
    reasons: reasons.slice(0, 5),
    trends,
    session,
    volatilityATR: lastATR,
    supportResistance: sr,
    isBreakout,
    isFakeoutSuspicion: fakeout.isFakeout,
    envDetails: {
      isPerfectOrder: isEnvironmentOk,
      isHighVolatility: lastATR > 0.15
    },
    regime
  };
}

function getTrend(data: any[]): TechnicalTrend {
  if (!data || data.length < 50) return "neutral";
  const prices = data.map(d => d.close);
  const ema20 = calculateEMA(prices, 20).slice(-1)[0];
  const ema50 = calculateEMA(prices, 50).slice(-1)[0];
  const lastPrice = prices[prices.length - 1];

  if (lastPrice > ema20 && ema20 > ema50) return "bullish";
  if (lastPrice < ema20 && ema20 < ema50) return "bearish";
  return "neutral";
}

function checkMarketSession(): { name: string; isOk: boolean } {
  const now = new Date();
  const jstHour = (now.getUTCHours() + 9) % 24;
  const isActive = jstHour >= 16 || jstHour <= 2;
  
  let name = "東京";
  if (jstHour >= 16 && jstHour < 21) name = "ロンドン";
  if (jstHour >= 21 || jstHour < 2) name = "ニューヨーク";
  
  return { name, isOk: isActive };
}

function findSRLevels(data: any[]): { support: number; resistance: number } {
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  return {
    resistance: Math.max(...highs.slice(-20)),
    support: Math.min(...lows.slice(-20))
  };
}

function checkFakeout(data: any[], direction: "buy" | "sell" | "none"): { isFakeout: boolean } {
  if (data.length < 5 || direction === "none") return { isFakeout: false };
  const last = data[data.length - 1];
  if (direction === "buy") {
    const wick = last.high - Math.max(last.open, last.close);
    return { isFakeout: wick > Math.abs(last.open - last.close) * 2 };
  } else {
    const wick = Math.min(last.open, last.close) - last.low;
    return { isFakeout: wick > Math.abs(last.open - last.close) * 2 };
  }
}

function checkPullback(data: any[], direction: "buy" | "sell" | "none"): { isPullback: boolean } {
  if (data.length < 25 || direction === "none") return { isPullback: false };
  const prices = data.map(d => d.close);
  const ema25 = calculateEMA(prices, 25).slice(-1)[0];
  const lastPrice = prices[prices.length - 1];
  const dist = Math.abs(lastPrice - ema25);
  return { isPullback: dist < 0.05 };
}

function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const k = 2 / (period + 1);
  let prevEma = data[0];
  ema.push(prevEma);
  for (let i = 1; i < data.length; i++) {
    const currentEma = data[i] * k + prevEma * (1 - k);
    ema.push(currentEma);
    prevEma = currentEma;
  }
  return ema;
}
