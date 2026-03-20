import { AssetCalculated, RiskRule } from "@/types";

export interface RiskStatus {
  totalLossPct: number;
  maxIndividualLossPct: number;
  currentDrawdownPct: number;
  isViolated: boolean;
  violations: string[];
}

/**
 * ポートフォリオの状態をリスクルールに照らしてチェックする
 */
export const checkRiskStatus = (
  assets: AssetCalculated[],
  totalValue: number,
  rules: RiskRule,
  historicalMax: number // 過去最高値
): RiskStatus => {
  const status: RiskStatus = {
    totalLossPct: 0,
    maxIndividualLossPct: 0,
    currentDrawdownPct: 0,
    isViolated: false,
    violations: [],
  };

  if (!rules.enabled || assets.length === 0) return status;

  // 1. 合計損失のチェック
  const totalProfit = assets.reduce((sum, a) => sum + a.profitAndLoss, 0);
  const totalCost = assets.reduce((sum, a) => sum + (a.averageCost * a.quantity), 0);
  status.totalLossPct = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  if (status.totalLossPct < -rules.maxLossPct) {
    status.isViolated = true;
    status.violations.push(`全体損失が許容範囲(${rules.maxLossPct}%)を超えています: ${status.totalLossPct.toFixed(1)}%`);
  }

  // 2. 個別銘柄の損切りチェック
  const maxLossAsset = assets.reduce((max, a) => a.profitPercentage < (max?.profitPercentage || 0) ? a : max, assets[0]);
  status.maxIndividualLossPct = maxLossAsset.profitPercentage;

  if (status.maxIndividualLossPct < -rules.stopLossPct) {
    status.isViolated = true;
    status.violations.push(`銘柄「${maxLossAsset.name}」が損切りライン(${rules.stopLossPct}%)を超えています: ${status.maxIndividualLossPct.toFixed(1)}%`);
  }

  // 3. ドローダウンのチェック
  status.currentDrawdownPct = historicalMax > 0 ? ((historicalMax - totalValue) / historicalMax) * 100 : 0;
  if (status.currentDrawdownPct > rules.maxDrawdownPct) {
    status.isViolated = true;
    status.violations.push(`ドローダウンが許容範囲(${rules.maxDrawdownPct}%)を超えています: ${status.currentDrawdownPct.toFixed(1)}%`);
  }

  return status;
};
