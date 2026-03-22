/**
 * 日本株ファンダメンタル分析ユーティリティ
 */
import { StockFundamental, GrowthProfile, FinancialHealth } from "@/types/stock";

export interface FundamentalAnalysisResult {
  score: number;
  growthProfile: GrowthProfile;
  financialHealth: FinancialHealth;
  reasons: string[];
}

export function analyzeStockFundamental(fund: StockFundamental): FundamentalAnalysisResult {
  let score = 0;
  const reasons: string[] = [];

  // 1. 成長性 (EPS/利益ベース)
  if (fund.epsGrowth > 15 && fund.revenueGrowth > 10) {
    score += 40;
    reasons.push("増収増益のトレンドが非常に強く、成長期待が高い");
  } else if (fund.epsGrowth > 5) {
    score += 20;
    reasons.push("利益成長が続いており、堅実な業績拡大フェーズ");
  } else if (fund.epsGrowth < -5) {
    score -= 30;
    reasons.push("減益傾向にあり、業績の立て直しが課題");
  }

  // 2. 収益性 (ROE)
  if (fund.roe > 15) {
    score += 25;
    reasons.push(`ROEが${fund.roe}%と非常に高く、効率的な資本運用を実現`);
  } else if (fund.roe > 8) {
    score += 10;
    reasons.push(`ROEは${fund.roe}%で、資本コストを上回る収益性を確保`);
  } else {
    score -= 10;
    reasons.push("収益性が低迷しており、資産の有効活用が求められる");
  }

  // 3. 財務健全性 (自己資本比率)
  let health: FinancialHealth = "medium";
  if (fund.equityRatio > 60) {
    score += 20;
    health = "strong";
    reasons.push("自己資本比率が極めて高く、鉄壁の財務基盤を誇る");
  } else if (fund.equityRatio > 30) {
    score += 5;
    health = "medium";
    reasons.push("財務状況は適正レベルで、事業運営に支障なし");
  } else {
    score -= 20;
    health = "weak";
    reasons.push("財務レバレッジが高く、金利上昇時の負担増に注意が必要");
  }

  // プロファイル判定
  const growth: GrowthProfile = fund.epsGrowth > 10 ? "growth" : fund.epsGrowth >= 0 ? "stable" : "weak";

  return {
    score: Math.max(-100, Math.min(100, score)),
    growthProfile: growth,
    financialHealth: health,
    reasons
  };
}
