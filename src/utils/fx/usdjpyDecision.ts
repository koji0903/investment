import { 
  TechnicalTrend, 
  LearningMetric 
} from "@/types/fx";
import { 
  calculateRSI, 
  calculateATR 
} from "@/lib/technicalAnalysis";

/**
 * USD/JPY専用 エントリー判断エンジン (勝率70%重視ロジック)
 */
export interface USDJPYDecisionResult {
  score: number; // 0-100
  signal: "buy" | "sell" | "wait";
  isEntryAllowed: boolean; // 最終エントリー許可
  isEnvironmentOk: boolean; // 環境フィルター
  alignmentLevel: "strong" | "mid" | "weak"; // 一致度
  confidence: number; // 0-100%
  reasons: string[];
  trends: {
    "1m": TechnicalTrend;
    "5m": TechnicalTrend;
    "15m": TechnicalTrend;
    "1h": TechnicalTrend;
    alignment: number;
  };
  session: {
    name: string;
    isOk: boolean;
  };
  filters: {
    trend: boolean;
    vol: boolean;
    time: boolean;
    fakeout: boolean;
    pullback: boolean;
  };
  volatility: {
    atr: number;
    status: "low" | "normal" | "high";
  };
}

export function calculateUSDJPYDecision(
  ohlc: Record<string, any[]>,
  metrics: LearningMetric[] = [],
  isHighProbMode: boolean = true
): USDJPYDecisionResult {
  const reasons: string[] = [];
  let score = 50;

  // 1. セッション判定 (時間帯フィルター)
  const session = checkMarketSession();
  
  // 2. トレンド判定 (1m, 5m, 15m)
  const trends = {
    "1m": getTrend(ohlc["1m"]),
    "5m": getTrend(ohlc["5m"]),
    "15m": getTrend(ohlc["15m"]),
    "1h": getTrend(ohlc["1h"]),
  };

  // 3時間足 (1m, 5m, 15m) の一致度
  const shortTermTrends = [trends["1m"], trends["5m"], trends["15m"]];
  const bullishCount = shortTermTrends.filter(v => v === "bullish").length;
  const bearishCount = shortTermTrends.filter(v => v === "bearish").length;
  
  let alignmentLevel: "strong" | "mid" | "weak" = "weak";
  let primaryDirection: "buy" | "sell" | "none" = "none";

  if (bullishCount === 3) { alignmentLevel = "strong"; primaryDirection = "buy"; }
  else if (bearishCount === 3) { alignmentLevel = "strong"; primaryDirection = "sell"; }
  else if (bullishCount === 2) { alignmentLevel = "mid"; primaryDirection = "buy"; }
  else if (bearishCount === 2) { alignmentLevel = "mid"; primaryDirection = "sell"; }

  // 3. 環境フィルター (Trend Clarity + Volatility)
  const trendClarity = checkTrendClarity(ohlc["15m"]);
  const atrArr = calculateATR({
    high: ohlc["15m"].map(d => d.high),
    low: ohlc["15m"].map(d => d.low),
    close: ohlc["15m"].map(d => d.close)
  }, 14);
  const lastATR = atrArr[atrArr.length - 1];
  const isVolOk = lastATR > 0.08; // 0.08以上を最低基準とする
  const isEnvOk = trendClarity.isPerfectOrder && isVolOk;

  // 4. ダマし回避 & 押し目判定
  const fakeout = checkFakeout(ohlc["5m"], primaryDirection);
  const pullback = checkPullback(ohlc["5m"], primaryDirection);

  // 5. スコア計算
  if (alignmentLevel === "strong") score += 25;
  if (alignmentLevel === "mid") score += 10;
  if (isEnvOk) score += 15;
  if (pullback.isPullback) score += 15;
  if (fakeout.isFakeout) score -= 30; // ダマしの疑いがある場合は大幅減点
  if (!session.isOk) score -= 10;

  // 6. 学習エンジンによる補正 (既存)
  metrics.forEach(m => {
    if (m.reliabilityCorrection !== 0) {
      score += m.reliabilityCorrection;
      if (Math.abs(m.reliabilityCorrection) > 5) {
        reasons.push(`AI補正: ${m.patternName}`);
      }
    }
  });

  // 7. 最終判定 (勝率70%ロジックの核心)
  const filters = {
    trend: alignmentLevel !== "weak",
    vol: isVolOk,
    time: session.isOk,
    fakeout: !fakeout.isFakeout,
    pullback: pullback.isPullback
  };

  // 全ての主要フィルターを通過し、スコアが一定以上の場合のみ許可
  const isEntryAllowed = 
    filters.trend && 
    filters.vol && 
    filters.time && 
    filters.fakeout && 
    (isHighProbMode ? filters.pullback : true) && // 勝率優先なら押し目必須
    (primaryDirection === "buy" ? score >= 70 : score <= 30);

  // 理由の構築
  if (!isEnvOk) reasons.push(isVolOk ? "トレンドの秩序が不足（レンジ）" : "低ボラティリティにより停滞中");
  if (!session.isOk) reasons.push(`時間外（${session.name}）のため待機`);
  if (alignmentLevel === "strong") reasons.push("3時間足のトレンドが完全一致");
  if (pullback.isPullback) reasons.push(primaryDirection === "buy" ? "絶好の押し目ポイント" : "戻り売りポイントを検知");
  if (fakeout.isFakeout) reasons.push("ブレイク後の戻りが速くダマしの疑い");
  if (isEntryAllowed) reasons.push("【勝率70%】全フィルターをクリア");

  const finalScore = Math.max(0, Math.min(100, score));
  let signal: "buy" | "sell" | "wait" = "wait";
  if (isEntryAllowed) signal = primaryDirection === "buy" ? "buy" : "sell";

  return {
    score: finalScore,
    signal,
    isEntryAllowed,
    isEnvironmentOk: isEnvOk,
    alignmentLevel,
    confidence: Math.round((finalScore > 50 ? finalScore : 100 - finalScore)),
    reasons: reasons.slice(0, 5),
    trends: { ...trends, alignment: alignmentLevel === "strong" ? 100 : alignmentLevel === "mid" ? 66 : 33 },
    session,
    filters,
    volatility: { atr: lastATR, status: isVolOk ? (lastATR > 0.15 ? "high" : "normal") : "low" }
  };
}

/**
 * マーケットセッション判定 (JST)
 */
function checkMarketSession(): { name: string; isOk: boolean } {
  const now = new Date();
  const jstHour = (now.getUTCHours() + 9) % 24;
  
  // ロンドン: 16:00 - 01:00 (JST)
  // NY: 21:00 - 06:00 (JST)
  // 活発な時間帯: 16:00 - 02:00
  const isActive = jstHour >= 16 || jstHour <= 2;
  
  let name = "東京/アジア";
  if (jstHour >= 16 && jstHour < 21) name = "ロンドン";
  if (jstHour >= 21 || jstHour < 2) name = "ニューヨーク";
  
  return { name, isOk: isActive };
}

/**
 * トレンドの明確さ (パーフェクトオーダー)
 */
function checkTrendClarity(data: any[]): { isPerfectOrder: boolean; direction: "up" | "down" | "none" } {
  if (data.length < 200) return { isPerfectOrder: false, direction: "none" };
  
  const prices = data.map(d => d.close);
  const ema20 = calculateEMA(prices, 20).slice(-1)[0];
  const ema50 = calculateEMA(prices, 50).slice(-1)[0];
  const ema200 = calculateEMA(prices, 200).slice(-1)[0];

  if (ema20 > ema50 && ema50 > ema200) return { isPerfectOrder: true, direction: "up" };
  if (ema20 < ema50 && ema50 < ema200) return { isPerfectOrder: true, direction: "down" };
  
  return { isPerfectOrder: false, direction: "none" };
}

/**
 * ダマし回避ロジック
 * ブレイク後、実体で維持できているかを確認
 */
function checkFakeout(data: any[], direction: "buy" | "sell" | "none"): { isFakeout: boolean } {
  if (data.length < 5 || direction === "none") return { isFakeout: false };
  
  const last3 = data.slice(-3);
  // 買いの場合: 直近3本のどれかが長い上髭を出して戻していないか
  if (direction === "buy") {
    const hasLongWick = last3.some(d => (d.high - Math.max(d.open, d.close)) > (Math.abs(d.open - d.close) * 1.5));
    const isFalling = data[data.length - 1].close < data[data.length - 2].close;
    return { isFakeout: hasLongWick && isFalling };
  }
  
  if (direction === "sell") {
    const hasLongWick = last3.some(d => (Math.min(d.open, d.close) - d.low) > (Math.abs(d.open - d.close) * 1.5));
    const isRising = data[data.length - 1].close > data[data.length - 2].close;
    return { isFakeout: hasLongWick && isRising };
  }

  return { isFakeout: false };
}

/**
 * 押し目・戻り判定
 */
function checkPullback(data: any[], direction: "buy" | "sell" | "none"): { isPullback: boolean } {
  if (data.length < 25 || direction === "none") return { isPullback: false };
  
  const prices = data.map(d => d.close);
  const ema25 = calculateEMA(prices, 25).slice(-1)[0];
  const lastPrice = prices[prices.length - 1];
  
  // 買いの場合: 価格がEMA25の近く（0.05円以内）かつEMA25より上にある
  if (direction === "buy") {
    const dist = lastPrice - ema25;
    return { isPullback: dist > 0 && dist < 0.05 };
  }
  
  if (direction === "sell") {
    const dist = ema25 - lastPrice;
    return { isPullback: dist > 0 && dist < 0.05 };
  }

  return { isPullback: false };
}

/**
 * トレンド判定ユーティリティ
 */
function getTrend(data: any[]): TechnicalTrend {
  if (data.length < 50) return "neutral";
  const prices = data.map(d => d.close);
  const ema20 = calculateEMA(prices, 20).slice(-1)[0];
  const ema50 = calculateEMA(prices, 50).slice(-1)[0];
  const lastPrice = prices[prices.length - 1];

  if (lastPrice > ema20 && ema20 > ema50) return "bullish";
  if (lastPrice < ema20 && ema20 < ema50) return "bearish";
  return "neutral";
}

/**
 * 内部用 EMA 
 */
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
