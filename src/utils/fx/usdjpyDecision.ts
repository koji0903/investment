import { 
  TechnicalTrend, 
  StructurePhase, 
  LearningMetric 
} from "@/types/fx";
import { 
  calculateSMA, 
  calculateRSI, 
  calculateBollingerBands, 
  calculateATR 
} from "@/lib/technicalAnalysis";

/**
 * USD/JPY専用 エントリー判断エンジン
 */
export interface USDJPYDecisionResult {
  score: number; // 0-100
  signal: "buy" | "sell" | "wait";
  confidence: number; // 0-100%
  reasons: string[];
  trends: {
    "1m": TechnicalTrend;
    "5m": TechnicalTrend;
    "15m": TechnicalTrend;
    "1h": TechnicalTrend;
    alignment: number; // 一致度 %
  };
  levels: {
    support: number[];
    resistance: number[];
  };
  volatility: {
    atr: number;
    status: "low" | "normal" | "high";
  };
}

export function calculateUSDJPYDecision(
  ohlc: Record<string, any[]>,
  metrics: LearningMetric[] = []
): USDJPYDecisionResult {
  const reasons: string[] = [];
  let score = 50; // ニュートラル
  
  // 1. 各時間足のトレンド判定 (EMA 20/50 基準)
  const getTrend = (data: any[]): TechnicalTrend => {
    if (data.length < 50) return "neutral";
    const prices = data.map(d => d.close);
    const ema20 = calculateEMA(prices, 20);
    const ema50 = calculateEMA(prices, 50);
    const lastPrice = prices[prices.length - 1];
    const lastEMA20 = ema20[ema20.length - 1];
    const lastEMA50 = ema50[ema50.length - 1];

    if (lastPrice > lastEMA20 && lastEMA20 > lastEMA50) return "bullish";
    if (lastPrice < lastEMA20 && lastEMA20 < lastEMA50) return "bearish";
    return "neutral";
  };

  const trends = {
    "1m": getTrend(ohlc["1m"]),
    "5m": getTrend(ohlc["5m"]),
    "15m": getTrend(ohlc["15m"]),
    "1h": getTrend(ohlc["1h"]),
  };

  // トレンド一致度の計算
  const trendValues = Object.values(trends);
  const bullishCount = trendValues.filter(v => v === "bullish").length;
  const bearishCount = trendValues.filter(v => v === "bearish").length;
  const alignment = Math.max(bullishCount, bearishCount) / 4 * 100;

  if (bullishCount >= 3) {
    score += 20;
    reasons.push("複数時間足で上昇トレンドが一致");
  } else if (bearishCount >= 3) {
    score -= 20;
    reasons.push("複数時間足で下落トレンドが一致");
  }

  // 2. RSI による過熱感 (15m 基準)
  const prices15m = ohlc["15m"].map(d => d.close);
  const rsi15mArr = calculateRSI(prices15m, 14);
  const rsi15m = rsi15mArr[rsi15mArr.length - 1];

  if (rsi15m < 30) {
    score += 10;
    reasons.push("RSI売られすぎ水準からの反発期待");
  } else if (rsi15m > 70) {
    score -= 10;
    reasons.push("RSI買われすぎ水準からの調整懸念");
  }

  // 3. ボラティリティチェック
  const atrArr = calculateATR({
    high: ohlc["15m"].map(d => d.high),
    low: ohlc["15m"].map(d => d.low),
    close: prices15m
  }, 14);
  const lastATR = atrArr[atrArr.length - 1];
  const volStatus = lastATR > 0.15 ? "high" : lastATR < 0.05 ? "low" : "normal";

  if (volStatus === "low") {
    reasons.push("低ボラティリティのため静観推奨");
    score = score * 0.8 + 10; // 50に近づける
  }

  // 4. 学習エンジンによる補正
  metrics.forEach(m => {
    if (m.reliabilityCorrection !== 0) {
      // 合致するパターンがあればスコアを補正
      // ここでは簡易的に全ての補正を加算
      score += m.reliabilityCorrection;
      if (Math.abs(m.reliabilityCorrection) > 5) {
        reasons.push(`過去統計より補正: ${m.patternName}`);
      }
    }
  });

  // 最終シグナルの決定
  const finalScore = Math.max(0, Math.min(100, score));
  let signal: "buy" | "sell" | "wait" = "wait";
  if (finalScore >= 65) signal = "buy";
  else if (finalScore <= 35) signal = "sell";

  return {
    score: finalScore,
    signal,
    confidence: alignment,
    reasons,
    trends: { ...trends, alignment },
    levels: { support: [], resistance: [] }, // サポレジ抽出は後ほど精緻化
    volatility: { atr: lastATR, status: volStatus }
  };
}

// 内部用 EMA 
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
