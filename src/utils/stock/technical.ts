/**
 * 日本株テクニカル分析ユーティリティ
 */

export interface TechnicalAnalysisResult {
  score: number;
  trend: "bullish" | "bearish" | "neutral";
  reasons: string[];
}

export function analyzeStockTechnical(prices: number[], currentPrice: number): TechnicalAnalysisResult {
  let score = 0;
  const reasons: string[] = [];
  
  if (prices.length < 200) {
    return { score: 0, trend: "neutral", reasons: ["データ不足"] };
  }

  const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const sma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / 50;
  const sma200 = prices.slice(-200).reduce((a, b) => a + b, 0) / 200;

  // 1. 移動平均線 (SMA)
  if (sma20 > sma50 && sma50 > sma200) {
    score += 40;
    reasons.push("移動平均線がパーフェクトオーダー（上昇トレンド）を形成中");
  } else if (sma20 < sma50 && sma50 < sma200) {
    score -= 40;
    reasons.push("下降トレンドのパーフェクトオーダーとなっており警戒");
  } else if (currentPrice > sma200) {
    score += 15;
    reasons.push("長期的なレジスタンスライン（200日線）を上抜けて推移");
  }

  // 2. RSI
  const rsi = calculateRSI(prices.slice(-15));
  if (rsi < 30) {
    score += 25;
    reasons.push(`RSI(${rsi.toFixed(1)})が30を下回り、短期的な売られすぎを示唆`);
  } else if (rsi > 70) {
    score -= 20;
    reasons.push(`RSI(${rsi.toFixed(1)})が70を超え、短期的な過熱感あり`);
  } else {
    reasons.push(`RSI(${rsi.toFixed(1)})は中立圏内にあり安定`);
  }

  // 3. ボリンジャーバンド (簡易)
  const std = calculateStd(prices.slice(-20));
  const upper = sma20 + std * 2;
  const lower = sma20 - std * 2;
  
  if (currentPrice < lower) {
    score += 20;
    reasons.push("価格がボリンジャーバンド-2σ付近で反発の兆し");
  } else if (currentPrice > upper) {
    score -= 15;
    reasons.push("ボリンジャーバンド+2σ付近で利益確定売りの出やすい水準");
  }

  // 4. トレンド方向
  const trend: "bullish" | "bearish" | "neutral" = score > 20 ? "bullish" : score < -20 ? "bearish" : "neutral";

  return {
    score: Math.max(-100, Math.min(100, score)),
    trend,
    reasons
  };
}

function calculateRSI(prices: number[]): number {
  if (prices.length < 14) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i-1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - (100 / (1 + rs));
}

function calculateStd(prices: number[]): number {
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const sqDiffs = prices.map(p => Math.pow(p - avg, 2));
  const avgSqDiff = sqDiffs.reduce((a, b) => a + b, 0) / sqDiffs.length;
  return Math.sqrt(avgSqDiff);
}
