import { 
  TechnicalAnalysisResult, 
  FundamentalAnalysisResult, 
  SwapEvaluation, 
  FXJudgment,
  SignalLabel,
  ConfidenceLevel,
  HoldingStyle,
  CurrencyCode
} from "@/types/fx";

/**
 * 総合判定スコアリングエンジン
 */
export function calculateTotalJudgment(
  pairCode: string,
  base: CurrencyCode,
  quote: CurrencyCode,
  currentPrice: number,
  technical: TechnicalAnalysisResult,
  fundamental: FundamentalAnalysisResult,
  swap: SwapEvaluation
): FXJudgment {
  // 重み付け計算
  // テクニカル: 50%, ファンダメンタル: 35%, スワップ: 15%
  // スワップは -50〜+50 なので、2倍して -100〜+100 スケールに合わせる
  const totalScore = 
    technical.score * 0.50 +
    fundamental.score * 0.35 +
    (swap.score * 2) * 0.15;

  const finalScore = Math.round(Math.max(-100, Math.min(100, totalScore)));

  // 判定ラベルの決定
  let signalLabel: SignalLabel = "中立";
  if (finalScore >= 60) signalLabel = "買い優勢";
  else if (finalScore >= 25) signalLabel = "やや買い";
  else if (finalScore <= -60) signalLabel = "売り優勢";
  else if (finalScore <= -25) signalLabel = "やや売り";

  // 信頼度の決定 (テクニカルとファンダメンタルの方向性が一致しているほど高い)
  let confidence: ConfidenceLevel = "低";
  const techDir = technical.score > 0 ? 1 : technical.score < 0 ? -1 : 0;
  const fundDir = fundamental.score > 0 ? 1 : fundamental.score < 0 ? -1 : 0;

  if (techDir === fundDir && techDir !== 0) {
    if (Math.abs(technical.score) > 50 && Math.abs(fundamental.score) > 50) {
      confidence = "高";
    } else {
      confidence = "中";
    }
  } else if (techDir === 0 || fundDir === 0) {
    confidence = "中";
  } else {
    confidence = "低"; // 方向性が逆
  }

  // サマリーコメントの生成
  let summaryComment = "";
  if (signalLabel === "買い優勢") {
    summaryComment = `${pairCode}はテクニカル・ファンダメンタル共に強い買いシグナルを示しています。`;
  } else if (signalLabel === "売り優勢") {
    summaryComment = `${pairCode}は下落トレンドが明確で、ファンダメンタル面でも売りが推奨される局面です。`;
  } else if (signalLabel === "中立") {
    summaryComment = "現在は明確な方向性がなく、様子見が妥当な局面です。";
  } else {
    summaryComment = `押し目買いや戻り売りを検討できる、${signalLabel}の状況です。`;
  }

  if (swap.holdingStyle === "medium_term_long") {
    summaryComment += " スワップポイントが有利なため、中長期での買い保有も検討に値します。";
  } else if (swap.holdingStyle === "medium_term_short") {
    summaryComment += " スワップポイントが有利なため、中長期での売り保有も検討に値します。";
  }

  return {
    pairCode,
    baseCurrency: base,
    quoteCurrency: quote,
    currentPrice,
    technicalScore: technical.score,
    technicalTrend: technical.trend,
    technicalReasons: technical.reasons,
    fundamentalScore: fundamental.score,
    macroBias: fundamental.macroBias,
    fundamentalReasons: fundamental.reasons,
    buySwap: swap.buySwap,
    sellSwap: swap.sellSwap,
    swapScore: swap.score,
    swapDirection: swap.swapDirection,
    swapComment: swap.swapComment,
    holdingStyle: swap.holdingStyle,
    totalScore: finalScore,
    signalLabel,
    confidence,
    summaryComment,
    updatedAt: new Date().toISOString(),
    indicators: technical.indicators
  };
}

/**
 * スワップ評価ロジック
 */
export function evaluateSwap(buySwap: number, sellSwap: number): SwapEvaluation {
  let score = 0;
  let swapDirection: any = "neutral";
  let swapComment = "";
  let holdingStyle: HoldingStyle = "short_term_only";

  if (buySwap > 0 && sellSwap < 0) {
    swapDirection = "long_positive";
    score = Math.min(50, buySwap / 2); // 簡易計算
    swapComment = "買い保有でスワップ受取が期待できます。";
    if (buySwap > 100) holdingStyle = "medium_term_long";
  } else if (sellSwap > 0 && buySwap < 0) {
    swapDirection = "short_positive";
    score = -Math.min(50, sellSwap / 2); // 売りが有利ならマイナス方向にスコアをつける
    // 注意: totalScore計算時にプラスに働くように調整が必要
    // 実際には fundamentalScore/technicalScore と同じ方向 (+ = 買い, - = 売り) を向くようにする
    swapComment = "売り保有でスワップ受取が期待できます。";
    if (sellSwap > 100) holdingStyle = "medium_term_short";
  } else {
    swapDirection = "both_negative";
    score = -10;
    swapComment = "買い・売り共にマイナススワップが発生します。短期売買向き。";
    holdingStyle = "short_term_only";
  }

  // スワップスコアの符号を「買いベース」にする (+ = 買いに有利, - = 売りに有利)
  // analyzeTechnical/Fundamental も + = 買い, - = 売り なので合わせる。
  
  return {
    score, // + = 買いに有利, - = 売りに有利
    buySwap,
    sellSwap,
    swapDirection,
    swapComment,
    holdingStyle
  };
}
