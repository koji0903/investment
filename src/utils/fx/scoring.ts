import { 
  TechnicalAnalysisResult, 
  FundamentalAnalysisResult, 
  SwapEvaluation, 
  FXJudgment,
  SignalLabel,
  ConfidenceLevel,
  HoldingStyle,
  CurrencyCode,
  TradingSuitability
} from "@/types/fx";

/**
 * 総合判定スコアリングエンジン (追加要件反映版)
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
  // 1. 短期判定 (主にテクニカル)
  let shortTermSignal: SignalLabel = getSignalFromScore(technical.score);
  
  // 2. 中長期判定 (ファンダメンタル + スワップ)
  // スワップスコアを -100〜+100 スケールに換算して合算
  const mediumTermScore = fundamental.score * 0.7 + (swap.score * 2) * 0.3;
  let mediumTermSignal: SignalLabel = getSignalFromScore(mediumTermScore);

  // 3. 総合判定の算出と特殊ラベルの適用
  const totalScore = 
    technical.score * 0.50 +
    fundamental.score * 0.35 +
    (swap.score * 2) * 0.15;

  const finalScore = Math.round(Math.max(-100, Math.min(100, totalScore)));
  let signalLabel: SignalLabel = getSignalFromScore(finalScore);

  // 【追加要件】押し目待ち判定
  // ファンダメンタルが強く(買い)、かつテクニカルが買われすぎ(RSI > 70 等)の場合
  if (fundamental.score > 30 && technical.indicators.rsi > 70) {
    signalLabel = "押し目待ち";
  } else if (fundamental.score < -30 && technical.indicators.rsi < 30) {
    signalLabel = "戻り売り待ち";
  }

  // 【追加要件】スワップ考慮
  // スワップが大幅マイナスの場合、中長期保有を不向きとする
  let effectiveHoldingStyle = swap.holdingStyle;
  if (swap.buySwap < -200 && (signalLabel === "買い優勢" || signalLabel === "やや買い")) {
    effectiveHoldingStyle = "not_suitable_for_hold";
  }

  // 4. 売買適正 (suitability)
  let suitability: TradingSuitability = "様子見推奨";
  const isShortGood = technical.score > 25;
  const isMediumGood = mediumTermScore > 25;
  const isShortBad = technical.score < -25;
  const isMediumBad = mediumTermScore < -25;

  if ((isShortGood || isShortBad) && (isMediumGood || isMediumBad)) {
    suitability = "短期・中長期共に良好";
  } else if (isShortGood || isShortBad) {
    suitability = "短期売買向き";
  } else if (isMediumGood || isMediumBad) {
    suitability = "中長期保有向き";
  }

  // 信頼度の決定
  let confidence: ConfidenceLevel = "低";
  const techDir = technical.score > 0 ? 1 : technical.score < 0 ? -1 : 0;
  const fundDir = fundamental.score > 0 ? 1 : fundamental.score < 0 ? -1 : 0;

  if (techDir === fundDir && techDir !== 0) {
    confidence = Math.abs(technical.score) > 50 && Math.abs(fundamental.score) > 50 ? "高" : "中";
  } else if (techDir === 0 || fundDir === 0) {
    confidence = "中";
  }

  // サマリーコメントの生成 (日本語理由の充実)
  let summaryComment = "";
  const techReason = technical.score > 0 ? "上昇トレンド" : technical.score < 0 ? "下落トレンド" : "レンジ推移";
  const fundReason = fundamental.score > 0 ? "金利・景気面での買い支持" : fundamental.score < 0 ? "ファンダメンタル面の弱気" : "材料視される要因が乏しい";

  summaryComment = `${pairCode}は現在、テクニカル面で${techReason}、ファンダメンタル面で${fundReason}となっています。`;

  if (signalLabel === "押し目待ち") {
    summaryComment += " 中長期的には強気ですが、短期的には過熱感があるため、一時的な調整（押し目）を待つのが賢明です。";
  } else if (signalLabel === "戻り売り待ち") {
    summaryComment += " 短期的に売られすぎの兆候があり、戻り売りを検討できる水準までの回復を待ちたい局面です。";
  }

  if (effectiveHoldingStyle === "not_suitable_for_hold") {
    summaryComment += " スワップポイントの負担が大きいため、長期保有には向きません。";
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
    holdingStyle: effectiveHoldingStyle,
    totalScore: finalScore,
    signalLabel,
    confidence,
    summaryComment,
    shortTermSignal,
    mediumTermSignal,
    suitability,
    certainty: 100,
    updatedAt: new Date().toISOString(),
    indicators: technical.indicators
  };
}

function getSignalFromScore(score: number): SignalLabel {
  if (score >= 60) return "買い優勢";
  if (score >= 25) return "やや買い";
  if (score <= -60) return "売り優勢";
  if (score <= -25) return "やや売り";
  return "中立";
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
    score = Math.min(50, buySwap / 4); 
    swapComment = `買いスワップが1日あたり ${buySwap} 円と有利です。`;
    if (buySwap > 150) holdingStyle = "medium_term_long";
  } else if (sellSwap > 0 && buySwap < 0) {
    swapDirection = "short_positive";
    score = -Math.min(50, sellSwap / 4); 
    swapComment = `売りスワップが1日あたり ${sellSwap} 円と有利です。`;
    if (sellSwap > 150) holdingStyle = "medium_term_short";
  } else {
    swapDirection = "both_negative";
    score = -10;
    swapComment = "両方向でスワップ負担が発生するため、中長期保有には不向きです。";
    holdingStyle = "not_suitable_for_hold";
  }
  
  return { score, buySwap, sellSwap, swapDirection, swapComment, holdingStyle };
}

/**
 * 複数の分析結果を統合し、ユーザーに提示する最終結論を導き出す
 */
export function consolidateJudgments(
  initial: FXJudgment,
  energy: FXJudgment["energyAnalysis"],
  entry: FXJudgment["entryTimingAnalysis"]
): FXJudgment {
  if (!energy || !entry) return initial;

  let finalLabel = initial.signalLabel;
  let finalComment = initial.summaryComment;

  // 1. 判断の矛盾解消 (Conflict Resolution)
  // エネルギーが「enter (即エントリ)」かつ エントリタイミングが「見送り/待機」の場合
  if (energy.entryRecommendation === "enter" && (entry.entryLabel === "見送り" || entry.entryLabel === "待機を推奨")) {
    // モメンタムはあるが、エントリ位置が悪い（伸び切り等）
    finalLabel = "押し目待ち";
    finalComment = `【判断統合】${initial.pairCode}は現在強いモメンタムが発生していますが、価格が伸び切っているため、現在は「深追い厳禁」です。一歩引いて、有利な価格（押し目・戻り）まで引きつけるのを待ちましょう。`;
  } else if (energy.entryRecommendation === "enter" && entry.entryScore >= 65) {
    // 両方 Go
    finalLabel = "買い優勢"; // または銘柄に合わせた方向
    if (energy.breakoutDirection === "down") finalLabel = "売り優勢";
    finalComment = `【判断統合】トレンドの初動とエントリ条件が完全に一致しました。非常に優位性の高い局面です。目標価格 ${entry.targetPrice} を目指した積極的な戦略が検討できます。`;
  } else if (entry.entryLabel === "エントリー好機") {
    finalLabel = "買い優勢";
    if (initial.totalScore < 0) finalLabel = "売り優勢";
    finalComment = `【判断統合】構造的に非常に有利なポイントに到達しました。${entry.structureComment}`;
  } else if (energy.fakeFlag || entry.structurePhase === "possible_fakeout") {
    finalLabel = "中立";
    finalComment = "【判断統合】ブレイクアウトの兆候がありますが、だましのリスクが極めて高い波形です。無理な参加は避け、底堅さ/上値の重さを再確認するまで静観を推奨します。";
  }

  // 2. 信頼度の調整
  let finalConfidence = initial.confidence;
  if (energy.energyScore > 70 && entry.entryScore > 75) finalConfidence = "高";

  // 3. 確からしさ (Integrated Certainty) の計算
  let certainty = Math.round((energy.certainty + entry.certainty) / 2);
  
  // コンバージェンス（方向性の一致）ボーナス
  const techDir = initial.technicalScore > 25 ? "up" : initial.technicalScore < -25 ? "down" : "none";
  const fundDir = initial.fundamentalScore > 25 ? "up" : initial.fundamentalScore < -25 ? "down" : "none";
  const energyDir = energy.breakoutDirection;

  if (techDir !== "none" && techDir === fundDir && techDir === energyDir) {
    certainty = Math.min(100, certainty + 20); // 3つ一致で大幅プラス
  } else if ((techDir === fundDir && techDir !== "none") || (techDir === energyDir && techDir !== "none")) {
    certainty = Math.min(100, certainty + 5);  // 2つ一致で微プラス
  }

  // 4. データ取得進捗・確からしさの表示
  if (entry.dataProgress < 100) {
    finalComment = `[データ収集中: ${entry.dataProgress}% / 精度: ${certainty}%] ${finalComment}`;
  } else {
    finalComment = `[分析精度: ${certainty}%] ${finalComment}`;
  }

  return {
    ...initial,
    signalLabel: finalLabel,
    summaryComment: finalComment,
    confidence: finalConfidence,
    certainty,
    updatedAt: new Date().toISOString()
  };
}
