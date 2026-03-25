/**
 * 日本株総合スコアリングユーティリティ
 */
import { 
  StockJudgment, 
  StockSignalLabel 
} from "@/types/stock";
import { TechnicalAnalysisResult } from "./technical";
import { FundamentalAnalysisResult } from "./fundamental";
import { ValuationAnalysisResult } from "./valuation";
import { ShareholderReturnResult } from "./shareholder";

export function calculateStockTotalJudgment(
  ticker: string,
  companyName: string,
  sector: string,
  currentPrice: number,
  tech: TechnicalAnalysisResult,
  fund: FundamentalAnalysisResult,
  val: ValuationAnalysisResult,
  div: ShareholderReturnResult
): StockJudgment {
  
  // 重み付け計算
  // テクニカル: 25%, ファンダメンタル: 35%, バリュエーション: 25%, 配当還元: 15%
  const totalScore = Math.round(
    tech.score * 0.25 + 
    fund.score * 0.35 + 
    val.score * 0.25 + 
    div.score * 0.15
  );

  // 判定ラベル
  let signalLabel: StockSignalLabel = "中立";
  if (totalScore >= 60) signalLabel = "買い優勢";
  else if (totalScore >= 25) signalLabel = "やや買い";
  else if (totalScore <= -60) signalLabel = "売り優勢";
  else if (totalScore <= -25) signalLabel = "やや売り";

  // 特殊判定: テクニカルが過熱しているがファンダが強い場合
  if (tech.score < -20 && fund.score > 40 && signalLabel.includes("買い")) {
    signalLabel = "押し目待ち";
  } else if (tech.score > 20 && fund.score < -40 && signalLabel.includes("売り")) {
    signalLabel = "戻り売り待ち";
  }

  // 信頼度算出 (各要素の方向性が一致しているか)
  const signs = [tech.score, fund.score, val.score, div.score].map(s => Math.sign(s));
  const sameSignCount = signs.filter(s => s === Math.sign(totalScore)).length;
  
  // AI総合コメント（簡易生成）
  const summaryComment = generateSummaryComment(signalLabel, tech, fund);

  return {
    ticker,
    companyName,
    sector,
    currentPrice,
    technicalScore: tech.score,
    technicalTrend: tech.trend,
    technicalReasons: tech.reasons,
    fundamentalScore: fund.score,
    growthProfile: fund.growthProfile,
    financialHealth: fund.financialHealth,
    fundamentalReasons: fund.reasons,
    valuationScore: val.score,
    valuationLabel: val.label,
    valuationReasons: val.reasons,
    shareholderReturnScore: div.score,
    dividendProfile: div.profile,
    holdSuitability: div.suitability,
    shareholderReasons: div.reasons,
    totalScore,
    signalLabel,
    certainty: sameSignCount >= 4 ? 90 : sameSignCount >= 3 ? 60 : 30, // 0-100%
    summaryComment,
    syncStatus: 'completed',
    lastSyncAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    chartData: [] // To be filled by the caller based on historical data
  };
}

function generateSummaryComment(
  signal: StockSignalLabel, 
  tech: TechnicalAnalysisResult, 
  fund: FundamentalAnalysisResult
): string {
  if (signal === "買い優勢") {
    return `強固なファンダメンタルズ(${fund.score}点)と割安なバリュエーションが魅力です。テクニカル面でも追い風が吹いており、中長期での保有に適した状態です。`;
  }
  if (signal === "やや買い") {
    return `${tech.trend === "bullish" ? "チャート形状が良好で、" : ""}配当利回りなどの還元姿勢も評価できます。押し目での買い増しを検討できる水準です。`;
  }
  if (signal === "押し目待ち") {
    return "業績背景は非常に強力ですが、短期的なテクニカル指標に過熱感（買われすぎ）が見られます。調整局面を待っての参入が合理的です。";
  }
  if (signal === "売り優勢") {
    return "業績の低迷に加え、バリュエーション面でも割高感が拭えません。テクニカル的にも下落トレンドにあり、当面は静観が賢明です。";
  }
  return "各指標に方向性のばらつきがあり、決定的な材料に欠ける状態です。次の決算発表やマクロ指標の動向を待ちたい局面です。";
}
