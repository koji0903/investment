import { calculateBollingerBands, calculateATR } from "@/lib/technicalAnalysis";
import { MarketEnergyAnalysis } from "@/types/fx";

/**
 * 相場エネルギー分析（保ち合い → ブレイク）を計算する
 */
export function calculateEnergyAnalysis(
  prices: number[],
  highs: number[],
  lows: number[],
  currentPrice: number
): MarketEnergyAnalysis {
  const period = 20;
  if (prices.length < 50) {
    return getDefaultAnalysis(currentPrice);
  }

  // 1. ボリンジャーバンド幅 (BB Width)
  const bb = calculateBollingerBands(prices, period);
  const bbWidths = bb.upper.map((u, i) => (u - bb.lower[i]) / bb.sma[i]);
  const currentBBWidth = bbWidths[bbWidths.length - 1];
  const avgBBWidth = bbWidths.slice(-period).reduce((a, b) => a + b, 0) / period;
  const bbCompression = Math.max(0, Math.min(100, (1 - currentBBWidth / avgBBWidth) * 100));

  // 2. ATR低下
  const atr = calculateATR({ high: highs, low: lows, close: prices }, 14);
  const currentATR = atr[atr.length - 1];
  const avgATR = atr.slice(-period).reduce((a, b) => a + (isNaN(b) ? currentATR : b), 0) / period;
  const atrReduction = Math.max(0, Math.min(100, (1 - currentATR / avgATR) * 100));

  // 3. 直近レンジ幅
  const recentPrices = prices.slice(-period);
  const rangeHigh = Math.max(...recentPrices);
  const rangeLow = Math.min(...recentPrices);
  const rangeWidth = (rangeHigh - rangeLow) / currentPrice;
  const rangeReduction = Math.max(0, Math.min(100, (0.02 - rangeWidth) / 0.02 * 100)); // 2%レンジを基準

  // 4. 横ばい期間 (単純化のため、レンジ内に価格が留まっている期間をカウント)
  let sidewaysCount = 0;
  for (let i = prices.length - 1; i >= prices.length - 30; i--) {
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
  
  const prevPrice = prices[prices.length - 2];
  const isBreakingUp = currentPrice > rangeHigh;
  const isBreakingDown = currentPrice < rangeLow;
  
  if (isBreakingUp) {
    breakoutDirection = "up";
    const volExpansion = (currentPrice - prevPrice) / currentATR;
    breakoutStrength = volExpansion > 1.5 ? "strong" : volExpansion > 0.8 ? "medium" : "weak";
  } else if (isBreakingDown) {
    breakoutDirection = "down";
    const volExpansion = (prevPrice - currentPrice) / currentATR;
    breakoutStrength = volExpansion > 1.5 ? "strong" : volExpansion > 0.8 ? "medium" : "weak";
  }

  const status = (breakoutDirection !== "none" || energyScore < 30) ? "releasing" : "accumulating";

  // 目標価格
  const rWidth = rangeHigh - rangeLow;
  const targetPrices = breakoutDirection === "up" 
    ? [currentPrice + rWidth, currentPrice + currentATR * 2, currentPrice + (bb.upper[bb.upper.length - 1] - bb.sma[bb.sma.length - 1]) * 2]
    : breakoutDirection === "down"
    ? [currentPrice - rWidth, currentPrice - currentATR * 2, currentPrice - (bb.sma[bb.sma.length - 1] - bb.lower[bb.lower.length - 1]) * 2]
    : [rangeHigh + rWidth, rangeHigh + currentATR * 2, rangeLow - rWidth];

  // だまし判定
  let fakeBreakProbability = 0;
  if (breakoutDirection !== "none") {
    // ヒゲの長さ判定 (簡易的に直近の高安との乖離)
    const wickSize = breakoutDirection === "up" ? (highs[highs.length - 1] - currentPrice) : (currentPrice - lows[lows.length - 1]);
    const bodySize = Math.abs(currentPrice - prevPrice);
    if (wickSize > bodySize) fakeBreakProbability += 40;
    
    // ボラティリティ不足
    if (breakoutStrength === "weak") fakeBreakProbability += 30;
    
    // レンジ再突入の兆候 (現在価格がレンジ内に戻りつつあるか)
    if (breakoutDirection === "up" && currentPrice < rangeHigh * 1.001) fakeBreakProbability += 20;
    if (breakoutDirection === "down" && currentPrice > rangeLow * 0.999) fakeBreakProbability += 20;
  }

  const fakeFlag = fakeBreakProbability > 60;
  const entryRecommendation = breakoutDirection === "none" 
    ? "wait" 
    : (fakeFlag || breakoutStrength === "weak") 
    ? "avoid" 
    : "enter";

  return {
    energyScore,
    energyLevel,
    status,
    breakoutDirection,
    breakoutStrength,
    targetPrices: targetPrices.map(p => Number(p.toFixed(4))),
    fakeBreakProbability,
    fakeFlag,
    entryRecommendation
  };
}

function getDefaultAnalysis(price: number): MarketEnergyAnalysis {
  return {
    energyScore: 50,
    energyLevel: "medium",
    status: "accumulating",
    breakoutDirection: "none",
    breakoutStrength: "weak",
    targetPrices: [price * 1.01, price * 1.02, price * 1.03],
    fakeBreakProbability: 0,
    fakeFlag: false,
    entryRecommendation: "wait"
  };
}
