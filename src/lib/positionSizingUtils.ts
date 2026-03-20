/**
 * ポジションサイズ（注文数量）を計算する
 * 
 * @param totalCapital 総資金（口座残高）
 * @param riskPct 許容リスク率（1トレードあたりの最大損失率 %）
 * @param maxCapitalPct 最大投入資金率（1トレードあたりの最大資金 %）
 * @param entryPrice エントリー価格
 * @param stopLossPrice 損切り価格
 * @returns 計算結果 { quantity: 推奨数量, riskAmount: リスク額, capitalRequired: 必要資金 }
 */
export const calculatePositionSize = (
  totalCapital: number,
  riskPct: number,
  maxCapitalPct: number,
  entryPrice: number,
  stopLossPrice: number
) => {
  if (entryPrice <= 0 || stopLossPrice <= 0 || entryPrice === stopLossPrice) {
    return { quantity: 0, riskAmount: 0, capitalRequired: 0, riskPerUnit: 0 };
  }

  // 1. 許容損失額 (Risk Amount)
  const allowedRiskAmount = totalCapital * (riskPct / 100);

  // 2. 1単位あたりのリスク (Risk per Unit)
  const riskPerUnit = Math.abs(entryPrice - stopLossPrice);

  // 3. リスクベースの数量 (Risk-based Quantity)
  let quantity = Math.floor(allowedRiskAmount / riskPerUnit);

  // 4. 資金効率ベースの制限 (Capital constraint)
  const maxAllowedCapital = totalCapital * (maxCapitalPct / 100);
  const capitalBasedQuantity = Math.floor(maxAllowedCapital / entryPrice);

  // 5. 最小の数量を採用
  quantity = Math.min(quantity, capitalBasedQuantity);

  return {
    quantity,
    riskAmount: quantity * riskPerUnit,
    capitalRequired: quantity * entryPrice,
    riskPerUnit,
    isLimitedByCapital: quantity === capitalBasedQuantity && quantity < (allowedRiskAmount / riskPerUnit)
  };
};
