import { FXRiskMetrics, LotCalculationResult } from "@/types/fx";

/**
 * 自動ロット調整ロジック
 */
export function calculateAdjustedLot(
  metrics: FXRiskMetrics,
  riskPercent: number, // 0-100 (e.g. 1.0)
  stopPips: number,
  confidenceScore: number,
  isEnvironmentOk: boolean
): LotCalculationResult {
  const pipsValue = 100; // 1ロット(1万通貨)あたり1pips(0.01円) = 100円
  
  // 1. ベースロット算出
  const maxLossAmountBase = metrics.currentBalance * (riskPercent / 100);
  const baseLot = maxLossAmountBase / (stopPips * pipsValue);

  // 2. 補正倍率の初期化
  const multipliers = {
    confidence: 1.0,
    consecutiveLoss: 1.0,
    drawdown: 1.0,
    environment: 1.0
  };

  const reasons: string[] = [];

  // 3. 信頼度補正
  if (confidenceScore >= 90) {
    multipliers.confidence = 1.2;
    reasons.push("高信頼度（AIスコア90以上）によりロット増量");
  } else if (confidenceScore >= 80) {
    multipliers.confidence = 1.0;
  } else if (confidenceScore >= 70) {
    multipliers.confidence = 0.8;
    reasons.push("中信頼度によりロット抑制");
  } else if (confidenceScore >= 60) {
    multipliers.confidence = 0.5;
    reasons.push("低信頼度によりロット大幅縮小");
  } else {
    multipliers.confidence = 0;
    reasons.push("信頼度不足により取引見送り");
  }

  // 4. 連敗補正
  if (metrics.consecutiveLosses >= 4) {
    multipliers.consecutiveLoss = 0.4;
    reasons.push(`4連敗中のためロットを40%に制限`);
  } else if (metrics.consecutiveLosses === 3) {
    multipliers.consecutiveLoss = 0.6;
    reasons.push(`3連敗中のためロットを60%に制限`);
  } else if (metrics.consecutiveLosses === 2) {
    multipliers.consecutiveLoss = 0.8;
    reasons.push(`2連敗中のためロットを80%に制限`);
  }

  // 5. ドローダウン補正
  if (metrics.drawdownPercent > 10) {
    multipliers.drawdown = 0.5;
    reasons.push(`ドローダウン10%超えのためロットを半分に制限`);
  } else if (metrics.drawdownPercent > 5) {
    multipliers.drawdown = 0.8;
    reasons.push(`ドローダウン5%超えのためロットを80%に制限`);
  }

  // 6. 環境補正
  if (!isEnvironmentOk) {
    multipliers.environment = 0.5;
    reasons.push("市場環境が不安定なためロット縮小");
  }

  // 7. 最終ロットの統合
  let adjustedLot = baseLot * 
                    multipliers.confidence * 
                    multipliers.consecutiveLoss * 
                    multipliers.drawdown * 
                    multipliers.environment;

  // 8. 最終的な取引可否判定
  const isExecutionAllowed = 
    adjustedLot > 0 && 
    metrics.drawdownPercent < 15 && 
    multipliers.confidence > 0;

  if (metrics.drawdownPercent >= 15) {
    reasons.push("ドローダウン15%超過により新規取引停止");
  }

  // 小数点第2位までに丸める
  adjustedLot = Math.floor(adjustedLot * 100) / 100;
  
  // 最終的な損失額（リスク管理用）
  const finalMaxLoss = adjustedLot * stopPips * pipsValue;

  return {
    baseLot,
    adjustedLot,
    maxLossAmount: finalMaxLoss,
    multipliers,
    reason: reasons[0] || "標準リスク運用中",
    isExecutionAllowed
  };
}
