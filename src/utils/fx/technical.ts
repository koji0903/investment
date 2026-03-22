import { 
  calculateSMA, 
  calculateRSI, 
  calculateMACD, 
  calculateBollingerBands 
} from "@/lib/technicalAnalysis";
import { TechnicalAnalysisResult, TechnicalTrend } from "@/types/fx";

/**
 * テクニカル分析エンジン
 * -100 (強い売り) 〜 +100 (強い買い) のスコアを算出
 */
export function analyzeTechnical(
  prices: number[], 
  currentPrice: number
): TechnicalAnalysisResult {
  if (prices.length < 200) {
    // 200日線などの計算に十分なデータがない場合
    return {
      score: 0,
      trend: "neutral",
      reasons: ["分析に十分な価格データがありません。"],
      indicators: {
        rsi: 50,
        macd: { macdLine: 0, signalLine: 0, histogram: 0 },
        sma: { sma20: currentPrice, sma50: currentPrice, sma200: currentPrice },
        bollinger: { upper: currentPrice, lower: currentPrice, mid: currentPrice }
      }
    };
  }

  const rsiValues = calculateRSI(prices, 14);
  const rsi = rsiValues[rsiValues.length - 1];

  const macd = calculateMACD(prices);
  const lastMacdLine = macd.macdLine[macd.macdLine.length - 1];
  const lastSignalLine = macd.signalLine[macd.signalLine.length - 1];
  const lastHist = macd.histogram[macd.histogram.length - 1];
  const prevHist = macd.histogram[macd.histogram.length - 2];

  const sma20Values = calculateSMA(prices, 20);
  const sma50Values = calculateSMA(prices, 50);
  const sma200Values = calculateSMA(prices, 200);
  const sma20 = sma20Values[sma20Values.length - 1];
  const sma50 = sma50Values[sma50Values.length - 1];
  const sma200 = sma200Values[sma200Values.length - 1];

  const bb = calculateBollingerBands(prices, 20);
  const bbUpper = bb.upper[bb.upper.length - 1];
  const bbLower = bb.lower[bb.lower.length - 1];
  const bbMid = bb.sma[bb.sma.length - 1];

  const recentHigh = Math.max(...prices.slice(-20));
  const recentLow = Math.min(...prices.slice(-20));

  let score = 0;
  const reasons: string[] = [];

  // 1. 移動平均線の並び (パーフェクトオーダー)
  if (sma20 > sma50 && sma50 > sma200) {
    score += 30;
    reasons.push("SMA20 > 50 > 200 の上昇パーフェクトオーダー");
  } else if (sma20 < sma50 && sma50 < sma200) {
    score -= 30;
    reasons.push("SMA20 < 50 < 200 の下降パーフェクトオーダー");
  }

  // 2. 現在価格と移動平均線の位置
  if (currentPrice > sma20) score += 10;
  else if (currentPrice < sma20) score -= 10;

  // 3. RSI判定 (逆張り/順張りハイブリッド)
  if (rsi < 30) {
    score += 20;
    reasons.push("RSIが30未満で売られすぎサイン");
  } else if (rsi > 70) {
    score -= 20;
    reasons.push("RSIが70超で買われすぎサイン");
  }

  // 4. MACD判定
  if (lastHist > 0 && prevHist <= 0) {
    score += 20;
    reasons.push("MACDゴールデンクロス発生");
  } else if (lastHist < 0 && prevHist >= 0) {
    score -= 20;
    reasons.push("MACDデッドクロス発生");
  }

  // 5. ボリンジャーバンド判定
  if (currentPrice <= bbLower) {
    score += 15;
    reasons.push("価格がボリンジャーバンド下限付近");
  } else if (currentPrice >= bbUpper) {
    score -= 15;
    reasons.push("価格がボリンジャーバンド上限付近");
  }

  // 6. 直近高値・安値ブレイク
  if (currentPrice >= recentHigh * 0.995) {
    score += 10;
    reasons.push("直近高値圏への接近・ブレイク");
  } else if (currentPrice <= recentLow * 1.005) {
    score -= 10;
    reasons.push("直近安値圏への接近・ブレイク");
  }

  // スコアを -100 〜 +100 にクランプ
  const finalScore = Math.max(-100, Math.min(100, score));

  let trend: TechnicalTrend = "neutral";
  if (finalScore >= 30) trend = "bullish";
  else if (finalScore <= -30) trend = "bearish";

  return {
    score: finalScore,
    trend,
    reasons: reasons.length > 0 ? reasons : ["主要な指標は概ね中立です。"],
    indicators: {
      rsi,
      macd: { 
        macdLine: lastMacdLine, 
        signalLine: lastSignalLine, 
        histogram: lastHist 
      },
      sma: { sma20, sma50, sma200 },
      bollinger: { upper: bbUpper, lower: bbLower, mid: bbMid }
    }
  };
}
