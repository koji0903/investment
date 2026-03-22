import { PositionSizingAnalysis, MarketEnergyAnalysis, EntryTimingAnalysis } from "@/types/fx";

// 初期ダミー設定 (将来的にユーザデータベースなどから引っ張ることを想定)
const DEFAULT_ACCOUNT_BALANCE = 1000000; // 100万円
const DEFAULT_RISK_PERCENT = 0.02;       // 2%

export const calculatePositionSizing = (
  pairCode: string,
  entryAnalysis: EntryTimingAnalysis | undefined,
  energyAnalysis: MarketEnergyAnalysis | undefined,
  accountBalance = DEFAULT_ACCOUNT_BALANCE,
  riskPercent = DEFAULT_RISK_PERCENT
): PositionSizingAnalysis | undefined => {
  // 必須データが不足している、または無効な価格の場合は計算スキップ
  if (!entryAnalysis || !energyAnalysis || entryAnalysis.suggestedEntryPrice === 0 || entryAnalysis.invalidationPrice === 0) {
    return undefined; 
  }

  const { suggestedEntryPrice: entry, invalidationPrice: stop, rrRatio, structurePhase } = entryAnalysis;
  const { breakoutStrength, energyScore, fakeBreakProbability } = energyAnalysis;
  
  if (entry === stop) return undefined;

  // 1. 基本リスク額計算
  const maxRiskAmount = accountBalance * riskPercent;
  
  // 1ロット = 10,000通貨 とした際のエントリーとストップの幅（価格差）の金額換算
  const LOT_SIZE = 10000;
  let diff = Math.abs(entry - stop);
  let riskPerLot = diff * LOT_SIZE;

  // クロス円以外（例：EUR/USD）の場合は概算で円転換 (ここではプロトタイプとして一律150円掛けている)
  if (!pairCode.includes("JPY")) {
    riskPerLot *= 150; 
  }

  // 0割り防止の安全装置
  if (riskPerLot === 0) riskPerLot = 1;

  // ベースポジションサイズ
  const basePositionSize = maxRiskAmount / riskPerLot;

  // 2. 構造補正係数
  // A. ブレイク強度補正
  let breakoutFactor = breakoutStrength === "strong" ? 1.15 : breakoutStrength === "medium" ? 1.0 : 0.75;

  // B. エネルギー蓄積補正
  let energyFactor = energyScore >= 80 ? 1.10 : energyScore >= 60 ? 1.00 : energyScore >= 40 ? 0.90 : 0.75;

  // C. だまし率補正
  let fakeFactor = fakeBreakProbability >= 70 ? 0.50 : fakeBreakProbability >= 50 ? 0.70 : fakeBreakProbability >= 30 ? 0.85 : 1.00;

  // D. RR比補正
  let rrFactor = rrRatio >= 2.5 ? 1.10 : rrRatio >= 1.8 ? 1.00 : rrRatio >= 1.2 ? 0.80 : 0.50;

  // E. 構造フェーズ補正
  let structureFactor = 1.0;
  switch (structurePhase) {
    case "breakout_initial": structureFactor = 1.05; break;
    case "reacceleration": structureFactor = 1.00; break;
    case "pullback_waiting": structureFactor = 0.95; break;
    case "pre_consolidation": structureFactor = 0.85; break;
    case "consolidating": structureFactor = 0.80; break;
    case "extended_move": structureFactor = 0.60; break;
    case "possible_fakeout": structureFactor = 0.50; break;
  }

  // もしエントリー分析上で "見送り" や待機がとても強い場合、フェーズ外でも強引に下げる
  if (entryAnalysis.shouldWait && structureFactor > 0.6) {
    structureFactor *= 0.7; 
  }

  // 3. 最終ロット計算
  const finalPositionSize = basePositionSize * breakoutFactor * energyFactor * fakeFactor * rrFactor * structureFactor;

  // 4. 安全装置（キャップ）と警告抽出
  const MIN_LOT = 0.1;
  const MAX_LOT = 10.0;
  let capped = Math.min(MAX_LOT, Math.max(MIN_LOT, finalPositionSize));
  
  // 明らかに見送りの場合は 0 にする
  if (entryAnalysis.entryScore < 30) {
    capped = 0;
  }

  const riskWarningMessages: string[] = [];
  
  if (capped > 0) {
    if (finalPositionSize < MIN_LOT) {
      riskWarningMessages.push("算出ロットが最低基準枠を下回りました。(最小枠適用)");
    } else if (finalPositionSize > MAX_LOT) {
      riskWarningMessages.push("算出ロットが最大保有上限を超過しました。(上限キャップ適用)");
    }
  }

  if (fakeFactor <= 0.70) riskWarningMessages.push("だましリスクが高水準のため、ロットを大幅に縮小しています。");
  if (rrFactor <= 0.80) riskWarningMessages.push("RR比が不利なため、相応のサイズ縮小を行いました。");
  if (structurePhase === "extended_move") riskWarningMessages.push("伸び切り警戒エリアのため、飛びつきサイズを抑制しています。");

  // コメント作成
  let sizingComment = "標準的な基準の範囲内でのサイズ提案です。";
  if (capped === 0) {
    sizingComment = "現在エントリー環境が整っていないため、ポジション保有は推奨されません。";
  } else if (finalPositionSize > basePositionSize * 1.15) {
    sizingComment = "構造良好かつ優位性が高いため、標準より厚めのサイズを提案しています。";
  } else if (finalPositionSize < basePositionSize * 0.75) {
    sizingComment = "リスク・構造的懸念が複数あるため、標準よりサイズを意図的に抑えています。";
  }

  const estimatedLossAmount = capped * riskPerLot;

  return {
    accountBalance,
    riskPercent,
    entryPrice: entry,
    stopPrice: stop,
    maxRiskAmount,
    riskPerUnit: riskPerLot,
    basePositionSize: Number(basePositionSize.toFixed(2)),
    breakoutFactor,
    energyFactor,
    fakeFactor,
    rrFactor,
    structureFactor,
    finalPositionSize: Number(finalPositionSize.toFixed(2)),
    cappedPositionSize: Number(capped.toFixed(2)),
    suggestedLot: capped === 0 ? "見送り" : `${capped.toFixed(1)} ロット`,
    estimatedLossAmount: Math.round(estimatedLossAmount),
    sizingComment,
    riskWarningMessages
  };
};
