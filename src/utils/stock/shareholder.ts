/**
 * 日本株配当・株主還元分析ユーティリティ
 */
import { StockFundamental, DividendProfile, TradingSuitability } from "@/types/stock";

export interface ShareholderReturnResult {
  score: number;
  profile: DividendProfile;
  suitability: TradingSuitability;
  reasons: string[];
}

export function analyzeStockShareholderReturn(fund: StockFundamental): ShareholderReturnResult {
  let score = 0;
  const reasons: string[] = [];

  // 1. 配当利回り
  if (fund.dividendYield > 4) {
    score += 35;
    reasons.push(`配当利回り${fund.dividendYield}%と高水準でインカムゲインが魅力`);
  } else if (fund.dividendYield > 2) {
    score += 15;
    reasons.push(`配当利回り${fund.dividendYield}%で安定的な還元を維持`);
  }

  // 2. 増配・自社株買い
  if (fund.dividendGrowthYears > 10) {
    score += 30;
    reasons.push(`${fund.dividendGrowthYears}期連続増配中で、株主還元への意識が極めて高い`);
  } else if (fund.buybackFlag) {
    score += 15;
    reasons.push("自社株買いを実施中、または直近実績があり還元に積極的");
  }

  // 3. 配当性向 (健全性)
  if (fund.payoutRatio > 80) {
    score -= 25;
    reasons.push("配当性向が高すぎ、今後の利益水準によっては減配リスクあり");
  } else if (fund.payoutRatio < 40) {
    score += 10;
    reasons.push("配当性向に余裕があり、将来の増配余地が大きい");
  }

  // プロファイルと適性
  const profile: DividendProfile = fund.dividendYield > 4 ? "high_dividend" : fund.dividendYield > 0.5 ? "stable_dividend" : "low_dividend";
  const suitability: TradingSuitability = (score > 30 && fund.dividendYield > 2) ? "good_for_long_term" : "neutral";

  return {
    score: Math.max(-100, Math.min(100, score)),
    profile,
    suitability,
    reasons
  };
}
