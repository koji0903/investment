/**
 * CAGR (Compound Annual Growth Rate) - 年平均成長率
 * @param startValue 開始時の評価額
 * @param endValue 終了時の評価額
 * @param years 期間（年）
 */
export const calculateCAGR = (startValue: number, endValue: number, years: number): number => {
  if (startValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
};

/**
 * Modified Dietz Return - 修正ディーツ法による期間リターン
 * 外部キャッシュフロー（入出金）を考慮した収益率の算出
 * @param startValue 開始時の評価額
 * @param endValue 終了時の評価額
 * @param cashflows キャッシュフローの配列 { amount: number, dayOffset: number } (dayOffsetは期間開始からの日数)
 * @param periodDays 期間の日数
 */
export const calculateModifiedDietz = (
  startValue: number,
  endValue: number,
  cashflows: { amount: number; dayOffset: number }[],
  periodDays: number
): number => {
  if (periodDays <= 0) return 0;

  const totalCashflow = cashflows.reduce((sum, cf) => sum + cf.amount, 0);
  const weightedCashflow = cashflows.reduce((sum, cf) => {
    // ウェイト = (期間日数 - 発生までの日数) / 期間日数
    const weight = (periodDays - cf.dayOffset) / periodDays;
    return sum + (cf.amount * weight);
  }, 0);

  const netGain = endValue - startValue - totalCashflow;
  const averageCapital = startValue + weightedCashflow;

  if (averageCapital === 0) return 0;
  return (netGain / averageCapital) * 100;
};

/**
 * Sharpe Ratio - シャープレシオ
 * @param dailyReturns 日次収益率の配列 (%)
 * @param riskFreeRate リスクフリーレート（年率、デフォルト0）
 */
export const calculateSharpeRatio = (dailyReturns: number[], riskFreeRate: number = 0): number => {
  if (dailyReturns.length < 2) return 0;

  const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const dailyRiskFreeRate = riskFreeRate / 252; // 年率を営業日ベースに変換

  const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (dailyReturns.length - 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;

  // 年率換算 (252営業日)
  const annualizedReturn = avgReturn * 252;
  const annualizedStdDev = stdDev * Math.sqrt(252);

  return (annualizedReturn - riskFreeRate) / annualizedStdDev;
};

/**
 * Maximum Drawdown - 最大ドローダウン
 * @param history 資産評価額の時系列データ
 */
export const calculateMaxDrawdown = (history: number[]): number => {
  if (history.length < 2) return 0;

  let maxDrawdown = 0;
  let peak = history[0];

  for (const value of history) {
    if (value > peak) {
      peak = value;
    }
    const drawdown = (peak - value) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown * 100;
};

/**
 * 指標に基づいた評価コメントとカラーを生成
 */
export const getMetricEvaluation = (type: 'cagr' | 'dietz' | 'sharpe' | 'mdd', value: number) => {
  switch (type) {
    case 'cagr':
    case 'dietz':
      if (value > 20) return { label: '極めて優秀', color: 'text-emerald-500', comment: '市場を大きく上回る驚異的な成長です。' };
      if (value > 10) return { label: '良好', color: 'text-emerald-400', comment: '着実な資産形成ができています。' };
      if (value > 0) return { label: '安定', color: 'text-indigo-400', comment: 'プラス成長を維持しています。' };
      return { label: '苦戦', color: 'text-rose-500', comment: '成長が停滞しています。戦略の見直しが必要かもしれません。' };
    
    case 'sharpe':
      if (value > 2) return { label: '極めて効率的', color: 'text-emerald-500', comment: 'リスクに対して非常に高い収益を得られています。' };
      if (value > 1) return { label: '優秀', color: 'text-emerald-400', comment: '効率的な運用ができています。' };
      if (value > 0.5) return { label: '普通', color: 'text-indigo-400', comment: '平均的なリスク・リターン特性です。' };
      return { label: '注意', color: 'text-rose-400', comment: 'リスクの割に収益が低いです。分散投資を検討してください。' };

    case 'mdd':
      if (value < 5) return { label: '鉄壁', color: 'text-emerald-500', comment: '下落耐性が非常に高く、安定しています。' };
      if (value < 15) return { label: '標準的', color: 'text-indigo-400', comment: '許容範囲内のボラティリティです。' };
      return { label: '高リスク', color: 'text-rose-500', comment: '下落幅が大きいです。ポジションサイズの調整を推奨します。' };
    
    default:
      return { label: '-', color: 'text-slate-400', comment: '' };
  }
};
