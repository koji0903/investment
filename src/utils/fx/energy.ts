import { calculateBollingerBands, calculateATR } from "@/lib/technicalAnalysis";
import { MarketEnergyAnalysis } from "@/types/fx";

/**
 * 相場エネルギー分析（保ち合い → ブレイク）を計算する
 */
export function calculateEnergyAnalysis(
  prices: number[],
  highs: number[],
  lows: number[],
  currentPrice: number,
  pivots?: { p: number, r1: number, r2: number, s1: number, s2: number }
): MarketEnergyAnalysis {
  const period = 20;
  const dataProgress = Math.min(100, Math.round((prices.length / 20) * 100));
  if (prices.length < 20) {
    return getDefaultAnalysis(currentPrice, dataProgress, pivots);
  }

  // 1. ボリンジャーバンド幅 (BB Width)
  const bb = calculateBollingerBands(prices, period);
  const bbWidths = bb.upper.map((u, i) => (u - bb.lower[i]) / bb.sma[i]);
  const currentBBWidth = bbWidths[bbWidths.length - 1];
  const avgBBWidth = bbWidths.slice(-period).reduce((a, b) => a + b, 0) / period;
  const bbCompression = Math.max(0, Math.min(100, (1 - currentBBWidth / avgBBWidth) * 100));

  // 2. ATR低下
  const atr = calculateATR({ high: highs, low: lows, close: prices }, 14);
  const currentATR = atr[atr.length - 1] || (currentPrice * 0.005);
  const avgATR = (atr.slice(-period).filter(v => !isNaN(v)).reduce((a, b) => a + b, 0) / period) || currentATR;
  const atrReduction = Math.max(0, Math.min(100, (1 - currentATR / avgATR) * 100));

  // 3. 直近レンジ幅
  const recentPrices = prices.slice(-period);
  const rangeHigh = Math.max(...recentPrices);
  const rangeLow = Math.min(...recentPrices);
  const rangeWidth = (rangeHigh - rangeLow) / currentPrice;
  const rangeReduction = Math.max(0, Math.min(100, (0.02 - rangeWidth) / 0.02 * 100)); 

  // 4. 横ばい期間 
  let sidewaysCount = 0;
  const lookback = Math.min(prices.length, 30);
  for (let i = prices.length - 1; i >= prices.length - lookback; i--) {
    if (prices[i] <= rangeHigh * 1.002 && prices[i] >= rangeLow * 0.998) {
      sidewaysCount++;
    } else {
      break;
    }
  }
  const sidewaysScore = Math.min(100, (sidewaysCount / 20) * 100);

  // エネルギースコア算出
  const energyScore = Math.round(
    bbCompression * 0.4 +
    atrReduction * 0.3 +
    rangeReduction * 0.2 +
    sidewaysScore * 0.1
  );

  const energyLevel = energyScore > 70 ? "high" : energyScore > 40 ? "medium" : "low";
  
  // ブレイク判定
  let breakoutDirection: "up" | "down" | "none" = "none";
  let breakoutStrength: "strong" | "medium" | "weak" = "weak";
  
  const prevPrice = prices[prices.length - 2] || currentPrice;
  const isBreakingUp = currentPrice > rangeHigh;
  const isBreakingDown = currentPrice < rangeLow;
  
  if (isBreakingUp) {
    breakoutDirection = "up";
    const volExpansion = (currentPrice - prevPrice) / currentATR;
    breakoutStrength = volExpansion > 1.2 ? "strong" : volExpansion > 0.6 ? "medium" : "weak";
  } else if (isBreakingDown) {
    breakoutDirection = "down";
    const volExpansion = (prevPrice - currentPrice) / currentATR;
    breakoutStrength = volExpansion > 1.2 ? "strong" : volExpansion > 0.6 ? "medium" : "weak";
  }

  const status = (breakoutDirection !== "none" || energyScore < 25) ? "releasing" : "accumulating";

  // 改良された目標価格算出 (ピボットポイントを優先)
  let targetPrices: number[] = [];
  if (breakoutDirection === "up") {
    targetPrices = pivots 
      ? [pivots.r1, pivots.r2, pivots.r2 + currentATR]
      : [currentPrice + (rangeHigh - rangeLow), currentPrice + currentATR * 2, currentPrice + currentATR * 4];
  } else if (breakoutDirection === "down") {
    targetPrices = pivots 
      ? [pivots.s1, pivots.s2, pivots.s2 - currentATR]
      : [currentPrice - (rangeHigh - rangeLow), currentPrice - currentATR * 2, currentPrice - currentATR * 4];
  } else {
    // レンジ内
    targetPrices = pivots 
      ? [pivots.r1, pivots.s1, pivots.p]
      : [rangeHigh, rangeLow, (rangeHigh + rangeLow) / 2];
  }

  // だまし判定
  let fakeBreakProbability = 0;
  if (breakoutDirection !== "none") {
    const wickSize = breakoutDirection === "up" ? (highs[highs.length - 1] - currentPrice) : (currentPrice - lows[lows.length - 1]);
    const bodySize = Math.abs(currentPrice - prevPrice);
    if (wickSize > bodySize) fakeBreakProbability += 40;
    if (breakoutStrength === "weak") fakeBreakProbability += 30;
    if (breakoutDirection === "up" && currentPrice < rangeHigh * 1.0005) fakeBreakProbability += 20;
    if (breakoutDirection === "down" && currentPrice > rangeLow * 0.9995) fakeBreakProbability += 20;
  }

  const fakeFlag = fakeBreakProbability > 60;
  const entryRecommendation = breakoutDirection === "none" 
    ? "wait" 
    : (fakeFlag || breakoutStrength === "weak") 
    ? "avoid" 
    : "enter";

  // 8. 確からしさ (Certainty) の計算
  let certainty = dataProgress * 0.7; // データ量ベース (max 70)
  const lower = bb.lower[bb.lower.length - 1];
  const upper = bb.upper[bb.upper.length - 1];
  if (currentPrice >= lower && currentPrice <= upper) certainty += 20; // バンド内であれば安定 (max +20)
  if (Math.abs(energyScore - 50) > 20 && status === "releasing") certainty += 10; // 反応期は確信度アップ (max +10)
  certainty = Math.min(100, Math.round(certainty));

  return {
    energyScore,
    energyLevel,
    status,
    breakoutDirection,
    breakoutStrength,
    targetPrices: targetPrices.map(p => Number(p.toFixed(5))),
    fakeBreakProbability,
    fakeFlag,
    entryRecommendation,
    dataProgress,
    certainty
  };
}

function getDefaultAnalysis(price: number, dataProgress: number, pivots?: { p: number, r1: number, r2: number, s1: number, s2: number }): MarketEnergyAnalysis {
  return {
    energyScore: 50,
    energyLevel: "medium",
    status: "accumulating",
    breakoutDirection: "none",
    breakoutStrength: "weak",
    targetPrices: pivots ? [pivots.r1, pivots.s1, pivots.p] : [price * 1.005, price * 0.995, price],
    fakeBreakProbability: 0,
    fakeFlag: false,
    entryRecommendation: "wait",
    dataProgress,
    certainty: Math.round(dataProgress * 0.5) // データ不足時はデータ量比例
  };
}
