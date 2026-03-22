import { CurrencyFundamental, FundamentalAnalysisResult, MacroBias } from "@/types/fx";

/**
 * ファンダメンタル分析エンジン
 * ベース通貨とクォート通貨の差分から -100 〜 +100 のスコアを算出
 */
export function analyzeFundamental(
  base: CurrencyFundamental,
  quote: CurrencyFundamental
): FundamentalAnalysisResult {
  let score = 0;
  const reasons: string[] = [];

  // 1. 政策金利差 (キャリートレード要因)
  const rateDiff = base.interestRate - quote.interestRate;
  if (rateDiff > 2) {
    score += 30;
    reasons.push(`${base.currencyCode}と${quote.currencyCode}の金利差が大きく、ロングに有利です。`);
  } else if (rateDiff < -2) {
    score -= 30;
    reasons.push(`${quote.currencyCode}の方が金利が高く、ショートに有利な金利差です。`);
  } else if (rateDiff > 0) {
    score += 10;
  } else if (rateDiff < 0) {
    score -= 10;
  }

  // 2. 中央銀行のスタンス
  if (base.centralBankBias === "hawkish" && quote.centralBankBias === "dovish") {
    score += 40;
    reasons.push(`${base.currencyCode}中銀がタカ派、${quote.currencyCode}中銀がハト派で方向性が明確です。`);
  } else if (base.centralBankBias === "dovish" && quote.centralBankBias === "hawkish") {
    score -= 40;
    reasons.push(`${base.currencyCode}中銀がハト派、${quote.currencyCode}中銀がタカ派で下落圧力が強いです。`);
  } else {
    if (base.centralBankBias === "hawkish") score += 20;
    if (base.centralBankBias === "dovish") score -= 20;
    if (quote.centralBankBias === "hawkish") score -= 20;
    if (quote.centralBankBias === "dovish") score += 20;
  }

  // 3. インフレ・景気強弱 (中長期的な利上げ期待)
  const growthDiff = base.growthScore - quote.growthScore;
  if (growthDiff > 5) {
    score += 15;
    reasons.push(`${base.currencyCode}の景気指標が${quote.currencyCode}より堅調です。`);
  } else if (growthDiff < -5) {
    score -= 15;
    reasons.push(`${quote.currencyCode}の景気指標が${base.currencyCode}より堅調です。`);
  }

  const inflationDiff = base.inflationScore - quote.inflationScore;
  if (inflationDiff > 5) {
    score += 10;
    reasons.push(`${base.currencyCode}のインフレ圧力により利上げ期待が高まっています。`);
  } else if (inflationDiff < -5) {
    score -= 10;
    reasons.push(`${quote.currencyCode}のインフレ圧力により相対的に${base.currencyCode}が売られやすいです。`);
  }

  // 4. 特性（資源国・安全通貨）
  // 簡易的に：現在はリスクオン寄りと仮定
  if (base.commodityLinkedScore > 5 && quote.safeHavenScore > 5) {
    score += 10;
    reasons.push("リスクオン局面では資源国通貨が買われやすく、安全通貨が売られやすい傾向です。");
  }

  const finalScore = Math.max(-100, Math.min(100, score));
  
  let macroBias: MacroBias = "neutral";
  if (finalScore >= 30) macroBias = "bullish";
  else if (finalScore <= -30) macroBias = "bearish";

  return {
    score: finalScore,
    macroBias,
    reasons: reasons.length > 0 ? reasons : ["ファンダメンタル要因は拮抗しており、明確なトレンドがありません。"],
    interestRateDiff: rateDiff
  };
}
