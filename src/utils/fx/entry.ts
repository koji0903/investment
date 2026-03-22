import { 
  TechnicalAnalysisResult, 
  MarketEnergyAnalysis, 
  EntryTimingAnalysis, 
  StructurePhase, 
  RecommendedEntryType 
} from "@/types/fx";

export const calculateEntryTiming = (
  pairCode: string,
  currentPrice: number,
  technical: TechnicalAnalysisResult | undefined,
  energy: MarketEnergyAnalysis | undefined,
  atr: number,
  recentHigh: number,
  recentLow: number
): EntryTimingAnalysis => {
  const waitReasons: string[] = [];
  let shouldWait = false;

  // データ不足時のフォールバック
  if (!technical || !energy || atr === 0) {
    return {
      structurePhase: "consolidating",
      structureComment: "十分なデータがないため分析を待機中です",
      recommendedEntryType: "pullback_entry",
      entryTypeReason: "データ不足",
      entryScore: 0,
      entryLabel: "見送り",
      waitReasons: ["データ不足による分析不能"],
      shouldWait: true,
      suggestedEntryPrice: currentPrice,
      invalidationPrice: currentPrice,
      targetPrice: currentPrice,
      rrRatio: 0,
      stopComment: "-",
      targetComment: "-"
    };
  }

  // 1. Structure Phase 判定
  let phase: StructurePhase = "consolidating";
  let structureComment = "";
  
  const isUpTrend = technical.indicators.sma.sma20 > technical.indicators.sma.sma50;
  const isDownTrend = technical.indicators.sma.sma20 < technical.indicators.sma.sma50;
  
  const rsi = technical.indicators.rsi;
  const rangeWidth = recentHigh - recentLow;

  if (energy.status === "accumulating") {
    if (energy.energyScore > 80) {
      phase = "pre_consolidation";
      structureComment = "極度のエネルギー蓄積状態。まもなくブレイク発生の可能性が高いです。";
      waitReasons.push("まだブレイク未確定");
    } else {
      phase = "consolidating";
      structureComment = "レンジ内でエネルギーを蓄積中です。方向感が定まっていません。";
      waitReasons.push("レンジ内で方向未確定");
    }
  } else {
    // releasing (エネルギー放出中)
    if (energy.breakoutStrength === "strong") {
      if ((isUpTrend && rsi > 70) || (isDownTrend && rsi < 30)) {
        phase = "extended_move";
        structureComment = "ブレイク後の一方向への動きが過熱しています。押し目を待つべき水準です。";
        waitReasons.push("伸びすぎで押し目待ち");
      } else {
        phase = "breakout_initial";
        structureComment = "明確なブレイクアウトの初動です。モメンタムが乗っています。";
      }
    } else if (energy.fakeBreakProbability > 60) {
      phase = "possible_fakeout";
      structureComment = "ブレイクがだましに終わるリスクが高い波形です。";
      waitReasons.push("だましリスク高");
    } else {
      // release but momentum is medium/weak -> reacceleration or pullback
      if ((isUpTrend && currentPrice < recentHigh && rsi < 55) || (isDownTrend && currentPrice > recentLow && rsi > 45)) {
        phase = "pullback_waiting";
        structureComment = "ブレイクアウト後の健全な押し目・戻りを形成中です。";
        waitReasons.push("押し目/戻りの底・天井を確認中");
      } else {
        phase = "reacceleration";
        structureComment = "押し目・戻りからの再加速局面に移行しています。";
      }
    }
  }

  if (energy.breakoutDirection === "none" && phase !== "consolidating" && phase !== "pre_consolidation") {
    waitReasons.push("フォロースルー不足");
  }

  // 2. Recommended Entry Type 判定
  let entryType: RecommendedEntryType = "pullback_entry";
  let entryTypeReason = "";

  if (phase === "pre_consolidation" || phase === "breakout_initial") {
    entryType = "initial_breakout_entry";
    entryTypeReason = "エネルギー放出に順張りで乗るブレイク初動狙いが有効です。";
  } else if (phase === "pullback_waiting" || phase === "extended_move" || phase === "consolidating") {
    entryType = "pullback_entry";
    entryTypeReason = "一時的な過熱からのプルバック（押し目・戻り）をしっかり待つ優位性が高いです。";
  } else {
    entryType = "reacceleration_entry";
    entryTypeReason = "トレンド回帰へのモメンタム再加速波を狙うのが効果的です。";
  }

  // 3. リスクリワード評価と価格算出
  let targetPrice = currentPrice;
  let invalidationPrice = currentPrice;
  let suggestedEntryPrice = currentPrice;

  // 簡単な方向推定
  const isUp = energy.breakoutDirection === "up" || (energy.breakoutDirection === "none" && isUpTrend);
  
  if (isUp) {
    if (phase === "pullback_waiting") {
      suggestedEntryPrice = Math.max(recentLow, currentPrice - (atr * 0.5));
      invalidationPrice = recentLow - (atr * 0.5);
      targetPrice = recentHigh + (atr * 1.0);
    } else {
      suggestedEntryPrice = currentPrice;
      invalidationPrice = currentPrice - (atr * 1.5);
      targetPrice = currentPrice + (atr * 2.5);
    }
  } else {
    if (phase === "pullback_waiting") {
      suggestedEntryPrice = Math.min(recentHigh, currentPrice + (atr * 0.5));
      invalidationPrice = recentHigh + (atr * 0.5);
      targetPrice = recentLow - (atr * 1.0);
    } else {
      suggestedEntryPrice = currentPrice;
      invalidationPrice = currentPrice + (atr * 1.5);
      targetPrice = currentPrice - (atr * 2.5);
    }
  }

  const risk = Math.abs(suggestedEntryPrice - invalidationPrice);
  const reward = Math.abs(targetPrice - suggestedEntryPrice);
  const rrRatio = risk > 0 ? Number((reward / risk).toFixed(2)) : 0;

  let stopComment = "";
  if (phase === "breakout_initial") stopComment = "直近レンジ下限/上限の外側に設定";
  else if (phase === "pullback_waiting") stopComment = "押し安値/戻り高値の外側に設定";
  else stopComment = "直近1.5ATRバッファを確保";

  let targetComment = "理論第2目標（ATR拡張ゾーン）";

  if (rrRatio < 1.5 && rrRatio > 0) {
    waitReasons.push("RR比が悪い (目標まで値幅が薄い)");
  }

  // 4. エントリースコア算出
  let structureScore = 0;
  let breakoutQuality = 0;
  let pullbackQuality = 0;

  if (phase === "breakout_initial" || phase === "reacceleration") structureScore = 90;
  else if (phase === "pre_consolidation") structureScore = 70;
  else if (phase === "pullback_waiting") structureScore = 50; 
  else structureScore = 30;

  breakoutQuality = energy.breakoutStrength === "strong" ? 80 : energy.breakoutStrength === "medium" ? 50 : 20;

  // 引きつけ精度 (RSIが理想的な位置にあるか)
  if (isUp) {
    pullbackQuality = (rsi > 40 && rsi < 60) ? 80 : 40;
  } else {
    pullbackQuality = (rsi > 40 && rsi < 60) ? 80 : 40;
  }

  let riskRewardScore = rrRatio >= 2.0 ? 100 : rrRatio >= 1.5 ? 70 : 30;
  let techAlign = Math.abs(technical.score) > 20 ? 80 : 40; // トレンドが強いほどアライメント高
  let fundamentalAlign = 50; // 基本一律追加
  
  let fakePenalty = energy.fakeBreakProbability > 60 ? 40 : energy.fakeBreakProbability > 30 ? 15 : 0;
  if (energy.fakeFlag) {
    fakePenalty += 20;
    waitReasons.push("だましリスク顕在化");
  }

  const entryScoreRaw = 
    structureScore * 0.30 +
    energy.energyScore * 0.20 +
    breakoutQuality * 0.15 +
    pullbackQuality * 0.15 +
    riskRewardScore * 0.10 +
    techAlign * 0.05 +
    fundamentalAlign * 0.05 - 
    fakePenalty;

  const entryScore = Math.max(0, Math.min(100, Math.round(entryScoreRaw)));

  let entryLabel = "";
  if (entryScore >= 85) entryLabel = "エントリー好機";
  else if (entryScore >= 70) entryLabel = "条件付きで有望";
  else if (entryScore >= 50) entryLabel = "待機優先";
  else entryLabel = "見送り";

  if (waitReasons.length > 0 || entryScore < 70) shouldWait = true;
  
  // ダミーの待機理由を除去し、きれいな状態なら完了メッセージ
  const uniqueWaitReasons = Array.from(new Set(waitReasons));
  if (!shouldWait && uniqueWaitReasons.length === 0) {
    uniqueWaitReasons.push("最適なエントリー条件が揃っています");
  }

  const decimals = pairCode.includes("JPY") ? 3 : 5;

  return {
    structurePhase: phase,
    structureComment,
    recommendedEntryType: entryType,
    entryTypeReason,
    entryScore,
    entryLabel,
    waitReasons: uniqueWaitReasons,
    shouldWait,
    suggestedEntryPrice: Number(suggestedEntryPrice.toFixed(decimals)),
    invalidationPrice: Number(invalidationPrice.toFixed(decimals)),
    targetPrice: Number(targetPrice.toFixed(decimals)),
    rrRatio,
    stopComment,
    targetComment
  };
};
