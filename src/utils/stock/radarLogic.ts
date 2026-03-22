import { RadarResult, RadarCategory } from "@/types/radar";
import { 
  analyzeStockTechnical, 
  analyzeStockFundamental, 
  analyzeStockValuation, 
  analyzeStockShareholderReturn,
  calculateStockTotalJudgment 
} from "./stock_utils_bridge"; 

export function categorizeStock(data: any): RadarCategory[] {
  const tags: RadarCategory[] = [];
  if (data.revenueGrowth > 15 && data.epsGrowth > 10 && data.roe > 12) tags.push("growth");
  if (data.per < 12 && data.pbr < 1.0) tags.push("value");
  if (data.dividendYield > 3.5 && data.payoutRatio < 60) tags.push("dividend");
  if (data.technicalTrend === "上昇トレンド" || data.totalScore > 50) tags.push("trend");
  if (data.technicalTrend === "売られすぎ" || data.totalScore < -30) tags.push("rebound");
  return tags;
}

export function generateRadarComment(tags: RadarCategory[], totalScore: number): string {
  if (totalScore > 70) return "全ての指標が極めて強力な、今期最大の注目株です。";
  if (tags.includes("growth")) return "高い成長性と収益性を兼ね備えた、期待のグロース銘柄です。";
  if (tags.includes("value")) return "業績は安定しており、現在の株価は非常に割安な水準にあります。";
  if (tags.includes("dividend")) return "利回りが魅力的なだけでなく、財務基盤も強固な高配当銘柄です。";
  return "今後の発展やテクニカルの好転を待ちたいフェーズです。";
}
