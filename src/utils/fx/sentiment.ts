import { FXMarketSentiment, CurrencyCode } from "@/types/fx";

/**
 * 複数通貨ペアのデータから市場地合い（通貨強弱）を計算する
 */
export function calculateMarketSentiment(
  prices: Record<string, { current: number; prev24h: number }>
): FXMarketSentiment {
  const pairs = Object.keys(prices);
  
  // 1. 各通貨の変動率算出 (%)
  const getChange = (pair: string) => {
    const data = prices[pair];
    if (!data || data.prev24h === 0) return 0;
    return ((data.current - data.prev24h) / data.prev24h) * 100;
  };

  // ドル強弱の判定材料
  const usdPairs = {
    "EUR/USD": -getChange("EUR/USD"), // 逆相関
    "GBP/USD": -getChange("GBP/USD"), // 逆相関
    "AUD/USD": -getChange("AUD/USD"), // 逆相関
    "USD/CHF": getChange("USD/CHF"),
    "USD/JPY": getChange("USD/JPY"),
  };

  const usdChanges = Object.values(usdPairs).filter(v => !isNaN(v));
  const usdStrengthBase = usdChanges.length > 0 ? usdChanges.reduce((a, b) => a + b, 0) / usdChanges.length : 0;
  // スコア化 (-2%〜+2% を 0〜100 にマップ)
  const usdStrength = Math.max(0, Math.min(100, (usdStrengthBase + 1) * 50));
  const usdLabel = usdStrength > 65 ? "強い" : usdStrength < 35 ? "弱い" : "中立";

  // 円強弱の判定材料
  const jpyPairs = {
    "USD/JPY": -getChange("USD/JPY"), // 逆相関
    "EUR/JPY": -getChange("EUR/JPY"), // 逆相関
    "GBP/JPY": -getChange("GBP/JPY"), // 逆相関
    "AUD/JPY": -getChange("AUD/JPY"), // 逆相関
  };

  const jpyChanges = Object.values(jpyPairs).filter(v => !isNaN(v));
  const jpyStrengthBase = jpyChanges.length > 0 ? jpyChanges.reduce((a, b) => a + b, 0) / jpyChanges.length : 0;
  const jpyStrength = Math.max(0, Math.min(100, (jpyStrengthBase + 1) * 50));
  const jpyLabel = jpyStrength > 65 ? "強い" : jpyStrength < 35 ? "弱い" : "中立";

  // クロス円全体の地合い
  const crossYenPairs = ["EUR/JPY", "GBP/JPY", "AUD/JPY"];
  const crossYenChanges = crossYenPairs.map(p => getChange(p));
  const crossYenAvg = crossYenChanges.reduce((a, b) => a + b, 0) / crossYenChanges.length;
  const crossYenSentiment = crossYenAvg > 0.1 ? "bullish" : crossYenAvg < -0.1 ? "bearish" : "neutral";

  // USD/JPYに対する統合スコア (追い風度)
  // ドル強 & 円弱 なら USD/JPY 上昇
  let integratedScore = 50;
  integratedScore += (usdStrength - 50) / 2;
  integratedScore -= (jpyStrength - 50) / 2;
  integratedScore = Math.max(0, Math.min(100, integratedScore));

  const reasons: string[] = [];
  if (usdLabel === "強い") reasons.push("ドル買いが全体的に優勢です。");
  if (usdLabel === "弱い") reasons.push("ドル売りが広範に発生しています。");
  if (jpyLabel === "強い") reasons.push("円買い（リスクオフ）傾向にあります。");
  if (jpyLabel === "弱い") reasons.push("円売り（リスクオン）傾向にあります。");
  if (crossYenSentiment === "bullish") reasons.push("クロス円全体が底堅く推移しています。");
  if (crossYenSentiment === "bearish") reasons.push("クロス円全体に売り圧力がかかっています。");

  let overallBias: FXMarketSentiment["overallBias"] = "NEUTRAL";
  if (usdLabel === "強い" && jpyLabel === "弱い") overallBias = "USD_STRENGTH";
  else if (jpyLabel === "強い" && usdLabel === "弱い") overallBias = "JPY_STRENGTH";
  else if (crossYenSentiment === "bullish") overallBias = "CROSS_YEN_BULLISH";
  else if (crossYenSentiment === "bearish") overallBias = "CROSS_YEN_BEARISH";

  return {
    usdStrength,
    usdLabel,
    jpyStrength,
    jpyLabel,
    crossYenSentiment,
    overallBias,
    integratedScore,
    reasons,
    updatedAt: new Date().toISOString(),
  };
}
