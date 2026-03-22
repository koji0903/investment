/**
 * 日本株バリュエーション分析ユーティリティ
 */
import { StockFundamental, ValuationLabel } from "@/types/stock";

export interface ValuationAnalysisResult {
  score: number;
  label: ValuationLabel;
  reasons: string[];
}

export function analyzeStockValuation(fund: StockFundamental): ValuationAnalysisResult {
  let score = 0;
  const reasons: string[] = [];

  // 1. PER 評価 (過去平均比較)
  const perRatio = fund.per / fund.avgPer5Year;
  if (perRatio < 0.8) {
    score += 40;
    reasons.push(`PERが過去平均(${fund.avgPer5Year.toFixed(1)}倍)に対して著しく割安な水準`);
  } else if (perRatio < 1.0) {
    score += 15;
    reasons.push("PERは過去平均並み、もしくはやや割安なレンジで推移");
  } else if (perRatio > 1.3) {
    score -= 25;
    reasons.push("利益成長に対してPERが高値圏にあり、期待先行の感がある");
  }

  // 2. PBR 評価
  if (fund.pbr < 1.0) {
    score += 25;
    reasons.push(`PBRが${fund.pbr}倍と、解散価値を下回る是正期待銘柄`);
  } else if (fund.pbr > 3.0) {
    score -= 10;
    reasons.push("PBRが高く、資産面からのバッファーは限定的");
  }

  // 3. 利回り面 (バリュエーションとしての配当)
  if (fund.dividendYield > 4.5) {
    score += 20;
    reasons.push("配当利回りが高く、下支え効果の期待できるバリュエーション");
  }

  // ラベル判定
  const label: ValuationLabel = score > 20 ? "undervalued" : score < -20 ? "overvalued" : "fair";

  return {
    score: Math.max(-100, Math.min(100, score)),
    label,
    reasons
  };
}
