/**
 * CAGR (Compound Annual Growth Rate) - 年平均成長率
 * @param startValue 開始時の評価額
 * @param endValue 終了時の評価額
 * @param years 期間（年）
 */
export const calculateCAGR = (startValue: number, endValue: number, years: number): number => {
  if (startValue <= 0 || years <= 0 || endValue <= 0) return 0;
  try {
    return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
  } catch {
    return 0;
  }
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
    const weight = Math.max(0, (periodDays - cf.dayOffset) / periodDays);
    return sum + (cf.amount * weight);
  }, 0);

  const netGain = endValue - startValue - totalCashflow;
  const averageCapital = startValue + weightedCashflow;

  if (Math.abs(averageCapital) < 1) return 0;
  return (netGain / averageCapital) * 100;
};

/**
 * Sharpe Ratio - シャープレシオ (実績ベースの近似モデル)
 * @param returns 期間ごとの収益率データ (%)
 * @param riskFreeRate リスクフリーレート（年率、デフォルト0）
 * @param annualizationFactor 換算係数 (日次=252, 週次=52, 月次=12)
 */
export const calculateSharpeRatio = (
  returns: number[], 
  riskFreeRate: number = 0,
  annualizationFactor: number = 252
): number => {
  if (returns.length < 2) return 0;

  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;

  // 年率換算
  const annualizedReturn = avgReturn * annualizationFactor;
  const annualizedStdDev = stdDev * Math.sqrt(annualizationFactor);

  return (annualizedReturn - riskFreeRate) / annualizedStdDev;
};

/**
 * 取引履歴から簡易的なボラティリティ（標準偏差）を算出する
 */
export const estimateVolatilityFromTrades = (tradeReturns: number[]): number => {
  if (tradeReturns.length < 2) return 15; // デフォルト 15%
  const avg = tradeReturns.reduce((a, b) => a + b, 0) / tradeReturns.length;
  const variance = tradeReturns.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / (tradeReturns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(12); // 月次ベースから年次への簡易換算
};

/**
 * Maximum Drawdown - 最大ドローダウン (資産履歴からの算出)
 */
export const calculateMaxDrawdown = (history: number[]): number => {
  if (history.length < 2) return 0;

  let maxDrawdown = 0;
  let peak = -Infinity;

  for (const value of history) {
    if (value > peak) peak = value;
    if (peak > 0) {
      const drawdown = (peak - value) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
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
      if (value > 25) return { label: '極めて優秀', color: 'text-emerald-500', comment: '市場平均を大幅にアウトパフォームした驚異的な成長です。' };
      if (value > 12) return { label: '良好', color: 'text-emerald-400', comment: '安定した成長曲線を描けており、非常に健全な運用です。' };
      if (value > 0) return { label: '安定', color: 'text-indigo-400', comment: '資産は増加傾向にあります。継続的な運用を推奨します。' };
      if (value === 0) return { label: '未確定', color: 'text-slate-400', comment: '十分なデータがありません。' };
      return { label: '苦戦', color: 'text-rose-500', comment: '期間利益がマイナスです。ポートフォリオの再建案を検討しましょう。' };
    
    case 'sharpe':
      if (value > 2) return { label: 'プロ水準', color: 'text-emerald-500', comment: 'リスク管理が極めて完璧。無駄のない収益獲得ができています。' };
      if (value > 1) return { label: '優秀', color: 'text-emerald-400', comment: 'リスクに対して十分な収益を得られており、効率的な運用です。' };
      if (value > 0.5) return { label: '普通', color: 'text-indigo-400', comment: '標準的な運用効率です。さらなる分散でリスク低減を図れます。' };
      return { label: '注意', color: 'text-rose-400', comment: '変動リスクの割に収益が低迷。銘柄選定の見直し時期かもしれません。' };

    case 'mdd':
      if (value < 5) return { label: '鉄壁', color: 'text-emerald-500', comment: '下落耐性が非常に高く、心理的にも安定したポートフォリオです。' };
      if (value < 15) return { label: '標準的', color: 'text-indigo-400', comment: '一般的な市場の下落幅と同等。許容範囲内の推移です。' };
      return { label: '警告', color: 'text-rose-500', comment: '一時的な下落幅が深刻です。損切りルール等のリスク管理を再確認。' };
    
    default:
      return { label: '-', color: 'text-slate-400', comment: '' };
  }
};
