import { AssetCalculated } from "@/types";

export interface PortfolioScores {
  growth: number;        // 成長性 (CAGR)
  stability: number;     // 安定性 (MDD)
  diversification: number; // 分散性 (資産配分)
  efficiency: number;    // 資金効率 (キャッシュ比率)
  discipline: number;    // 行動規律 (ルール違反)
  total: number;
}

/**
 * 資産スコアリングエンジン
 */
export const calculatePortfolioScores = (
  metrics: { cagr: number; maxDrawdown: number },
  assets: AssetCalculated[],
  cashRatio: number, // 0-1
  violationsCount: number
): PortfolioScores => {
  
  // 1. 成長性 (0-20点) - CAGR 15%以上で満点
  const growth = Math.min(20, Math.max(0, (metrics.cagr / 15) * 20));

  // 2. 安定性 (0-20点) - MDD 10%以下で満点、30%以上で0点
  const stability = Math.min(20, Math.max(0, 20 - ((Math.max(0, metrics.maxDrawdown - 10) / 20) * 20)));

  // 3. 分散性 (0-20点) - アセット数が5以上かつ特定カテゴリが50%超えない
  const assetCountWeight = Math.min(10, (assets.length / 5) * 10);
  const maxCategoryWeight = assets.reduce((max, a) => {
    const catTotal = assets.filter(x => x.category === a.category).reduce((sum, x) => sum + x.evaluatedValue, 0);
    const total = assets.reduce((sum, x) => sum + x.evaluatedValue, 0);
    return Math.max(max, catTotal / total);
  }, 0);
  const diversificationWeight = Math.max(0, 10 - (Math.max(0, maxCategoryWeight - 0.4) / 0.6) * 10);
  const diversification = assetCountWeight + diversificationWeight;

  // 4. 資金効率 (0-20点) - キャッシュ比率 10%-30% を理想とする
  let efficiency = 0;
  if (cashRatio >= 0.1 && cashRatio <= 0.3) efficiency = 20;
  else if (cashRatio < 0.1) efficiency = 10 + (cashRatio / 0.1) * 10;
  else efficiency = Math.max(0, 20 - ((cashRatio - 0.3) / 0.7) * 20);

  // 5. 行動規律 (0-20点) - 違反なしで満点。1回につき-5点
  const discipline = Math.max(0, 20 - (violationsCount * 5));

  const total = Math.round(growth + stability + diversification + efficiency + discipline);

  return {
    growth: Math.round(growth),
    stability: Math.round(stability),
    diversification: Math.round(diversification),
    efficiency: Math.round(efficiency),
    discipline: Math.round(discipline),
    total
  };
};

/**
 * スコアに基づく総合評価コメント
 */
export const getTotalScoreEvaluation = (score: number) => {
  if (score >= 90) return { label: "SSS: 達人級", color: "text-amber-500", comment: "完璧な運用です。現在の規律を維持しましょう。" };
  if (score >= 80) return { label: "S: 優秀", color: "text-emerald-500", comment: "非常にバランスの良いポートフォリオです。" };
  if (score >= 60) return { label: "A: 良好", color: "text-indigo-500", comment: "安定した運用ができています。さらなる分散を検討しても良いでしょう。" };
  if (score >= 40) return { label: "B: 普通", color: "text-slate-500", comment: "標準的な運用ですが、改善の余地があります。" };
  return { label: "C: 要改善", color: "text-rose-500", comment: "リスク管理または分散性に課題があります。戦略を見直しましょう。" };
};
