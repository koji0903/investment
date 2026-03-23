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

  const dataProgress = energy?.dataProgress ?? 0;

  // データ不足時のフォールバック (閾値を energy.ts と合わせる)
  if (!technical || !energy || atr === 0) {
    return {
      structurePhase: "consolidating",
      structureComment: "現在十分なデータが集計されていません。安定した多角分析まで数日お待ちください。",
      recommendedEntryType: "pullback_entry",
      entryTypeReason: "データ収集中",
      entryScore: 0,
      entryLabel: "判断保留",
      waitReasons: ["ヒストリカルデータ収集中"],
      shouldWait: true,
      suggestedEntryPrice: currentPrice,
      invalidationPrice: currentPrice,
      targetPrice: currentPrice,
      rrRatio: 0,
      stopComment: "-",
      targetComment: "-",
      dataProgress,
      certainty: Math.round(dataProgress * 0.4)
    };
  }

  // 1. Structure Phase 判定
  let phase: StructurePhase = "consolidating";
  let structureComment = "";
  
  const sma20 = technical.indicators.sma.sma20;
  const sma50 = technical.indicators.sma.sma50;
  const isUpTrend = sma20 > sma50;
  const isDownTrend = sma20 < sma50;
  
  const rsi = technical.indicators.rsi;

  if (energy.status === "accumulating") {
    if (energy.energyScore > 75) {
      phase = "pre_consolidation";
      structureComment = "極度のエネルギー蓄積状態。ブレイク初動の爆発力に備える局面です。";
      waitReasons.push("ブレイクの方向確定待ち");
    } else {
      phase = "consolidating";
      structureComment = "レンジ内でパワーを充填中。明確な方向感が出るまで静観が推奨されます。";
      waitReasons.push("方向感の欠如");
    }
  } else {
    // releasing (エネルギー放出中)
    if (energy.breakoutStrength === "strong") {
      if ((isUpTrend && rsi > 70) || (isDownTrend && rsi < 30)) {
        phase = "extended_move";
        structureComment = "ブレイク後の動きが伸びきっています。高値掴み/安値売りを避け、押しを待つべきです。";
        waitReasons.push("過熱感による押し目待ち");
      } else {
        phase = "breakout_initial";
        structureComment = "明確なブレイクアウト。モメンタムが極めて強く、トレンドに乗る好機です。";
      }
    } else if (energy.fakeBreakProbability > 65) {
      phase = "possible_fakeout";
      structureComment = "ブレイクの勢いが弱く、だましで逆行するリスクが高い波形です。";
      waitReasons.push("だましリスクの警戒");
    } else {
      if ((isUpTrend && currentPrice < recentHigh && rsi < 60) || (isDownTrend && currentPrice > recentLow && rsi > 40)) {
        phase = "pullback_waiting";
        structureComment = "トレンド中の健全な調整。有利な価格でのエントリータイミングを計るフェーズです。";
        waitReasons.push("反転シグナルの確認待ち");
      } else {
        phase = "reacceleration";
        structureComment = "調整からの再加速。トレンド継続への信頼性が高い局面です。";
      }
    }
  }

  // 2. Recommended Entry Type 判定
  let entryType: RecommendedEntryType = "pullback_entry";
  let entryTypeReason = "";

  if (phase === "pre_consolidation" || phase === "breakout_initial") {
    entryType = "initial_breakout_entry";
    entryTypeReason = "ブレイク直後の瞬発的な伸びに追随する戦略が有効です。";
  } else if (phase === "pullback_waiting" || phase === "extended_move" || phase === "consolidating") {
    entryType = "pullback_entry";
    entryTypeReason = "一時的な逆行（押し・戻り）を待ち、有利なレートで入る優位性を重視します。";
  } else {
    entryType = "reacceleration_entry";
    entryTypeReason = "トレンド再開を確認してから入る、安全性の高い順張り戦略です。";
  }

  // 3. リスクリワード評価と価格算出 (精度の向上)
  const isUp = energy.breakoutDirection === "up" || (energy.breakoutDirection === "none" && isUpTrend);
  
  let suggestedEntryPrice = currentPrice;
  let invalidationPrice = currentPrice;
  let targetPrice = energy.targetPrices[0] || (isUp ? currentPrice + atr * 2 : currentPrice - atr * 2);

  if (isUp) {
    if (phase === "pullback_waiting") {
      suggestedEntryPrice = Math.max(recentLow, currentPrice - (atr * 0.4));
      invalidationPrice = recentLow - (atr * 0.6);
    } else {
      suggestedEntryPrice = currentPrice;
      invalidationPrice = Math.min(recentLow, currentPrice - (atr * 1.8));
    }
  } else {
    // ダウン
    if (phase === "pullback_waiting") {
      suggestedEntryPrice = Math.min(recentHigh, currentPrice + (atr * 0.4));
      invalidationPrice = recentHigh + (atr * 0.6);
    } else {
      suggestedEntryPrice = currentPrice;
      invalidationPrice = Math.max(recentHigh, currentPrice + (atr * 1.8));
    }
  }

  const risk = Math.abs(suggestedEntryPrice - invalidationPrice) || (currentPrice * 0.001);
  const reward = Math.abs(targetPrice - suggestedEntryPrice);
  const rrRatio = Number((reward / risk).toFixed(2));

  let stopComment = "";
  if (phase === "breakout_initial") stopComment = "ブレイク元レンジの反対端に設定";
  else if (phase === "pullback_waiting") stopComment = "直近の安値/高値の外側に配置";
  else stopComment = "ボラティリティ(1.8ATR)に基づき設定";

  let targetComment = pivotsStatus(energy.targetPrices);

  if (rrRatio < 1.3 && rrRatio > 0) {
    waitReasons.push("リスクリワード比が不利 (期待値低)");
  }

  // 4. エントリースコア算出
  let structureScore = 0;
  if (phase === "breakout_initial" || phase === "reacceleration") structureScore = 90;
  else if (phase === "pre_consolidation") structureScore = 70;
  else if (phase === "pullback_waiting") structureScore = 60; 
  else structureScore = 30;

  let breakoutQuality = energy.breakoutStrength === "strong" ? 90 : energy.breakoutStrength === "medium" ? 60 : 30;
  let riskRewardScore = rrRatio >= 2.0 ? 100 : rrRatio >= 1.5 ? 80 : 40;
  let techAlign = Math.abs(technical.score) > 30 ? 90 : 50;
  
  let fakePenalty = energy.fakeBreakProbability > 60 ? 50 : energy.fakeBreakProbability > 30 ? 20 : 0;

  const entryScoreRaw = 
    structureScore * 0.35 +
    energy.energyScore * 0.20 +
    breakoutQuality * 0.15 +
    riskRewardScore * 0.20 +
    techAlign * 0.10 - 
    fakePenalty;

  const entryScore = Math.max(0, Math.min(100, Math.round(entryScoreRaw)));

  let entryLabel = "";
  if (entryScore >= 80) entryLabel = "エントリー好機";
  else if (entryScore >= 65) entryLabel = "慎重に検討可能";
  else if (entryScore >= 45) entryLabel = "待機を推奨";
  else entryLabel = "見送り";

  if (waitReasons.length > 0 || entryScore < 65) shouldWait = true;
  
  const uniqueWaitReasons = Array.from(new Set(waitReasons));
  if (!shouldWait && uniqueWaitReasons.length === 0) {
    uniqueWaitReasons.push("全てのテクニカル条件が整っています");
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
    targetComment,
    dataProgress,
    certainty: Math.min(100, Math.round(
      (dataProgress * 0.6) + // データ量 (max 60)
      (rrRatio >= 1.5 ? 20 : 0) + // RR比の妥当性 (max 20)
      (entryScore > 60 ? 20 : 0) // エントリスコアの強さ (max 20)
    ))
  };
};

function pivotsStatus(targets: number[]): string {
  if (targets.length >= 2) return "理論第1・第2目標（R/Sライン）";
  return "ATRボラティリティ目標";
}
