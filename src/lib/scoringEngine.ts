import { AssetCalculated } from "@/types";

export interface PortfolioScores {
  growth: number;        // 成長性 (CAGR)
  stability: number;     // 安定性 (MDD)
  diversification: number; // 分散性 (資産配分)
  efficiency: number;    // 資金効率 (キャッシュ比率)
  discipline: number;    // 行動規律 (ルール違反)
  total: number;
  reasons: {
    growth: string;
    stability: string;
    diversification: string;
    efficiency: string;
    discipline: string;
  };
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
  const reasons = {
    growth: "",
    stability: "",
    diversification: "",
    efficiency: "",
    discipline: ""
  };

  // 1. 成長性 (0-20点) - CAGR 15%以上で満点
  const growth = Math.min(20, Math.max(0, (metrics.cagr / 15) * 20));
  if (metrics.cagr >= 15) reasons.growth = "年平均成長率(CAGR)が15%を超えており、極めて高い成長性です。";
  else if (metrics.cagr >= 8) reasons.growth = "堅実な成長率を維持しています。";
  else if (metrics.cagr > 0) reasons.growth = "プラス成長ですが、さらなる収益性の向上が期待できます。";
  else reasons.growth = "成長が停滞しています。投資対象の入れ替えを検討してください。";

  // 2. 安定性 (0-20点) - MDD 10%以下で満点、30%以上で0点
  const stability = Math.min(20, Math.max(0, 20 - ((Math.max(0, metrics.maxDrawdown - 10) / 20) * 20)));
  if (metrics.maxDrawdown <= 10) reasons.stability = "最大ドローダウンが10%以内に抑えられており、非常に安定しています。";
  else if (metrics.maxDrawdown <= 20) reasons.stability = "標準的なボラティリティの範囲内です。";
  else reasons.stability = "下落幅が大きくなっています。リスク資産の比率調整を推奨します。";

  // 3. 分散性 (0-20点) - アセット数が5以上かつ特定カテゴリが40%超えない
  const assetCountWeight = Math.min(10, (assets.length / 5) * 10);
  const maxCategoryInfo = assets.reduce((max, a) => {
    const catTotal = assets.filter(x => x.category === a.category).reduce((sum, x) => sum + x.evaluatedValue, 0);
    const total = assets.reduce((sum, x) => sum + x.evaluatedValue, 0);
    return (catTotal / total) > max.ratio ? { ratio: catTotal / total, category: a.category } : max;
  }, { ratio: 0, category: "" });
  
  const diversificationWeight = Math.max(0, 10 - (Math.max(0, maxCategoryInfo.ratio - 0.4) / 0.6) * 10);
  const diversification = assetCountWeight + diversificationWeight;

  let divReason = assets.length >= 5 ? "銘柄数が分散されており良好です。" : "銘柄数が少なく、個別銘柄のリスクを受けやすい状態です。";
  if (maxCategoryInfo.ratio > 0.6) divReason += ` ${maxCategoryInfo.category}への集中投資（${Math.round(maxCategoryInfo.ratio * 100)}%）がリスク要因です。`;
  reasons.diversification = divReason;

  // 4. 資金効率 (0-20点) - キャッシュ比率 10%-30% を理想とする
  let efficiency = 0;
  if (cashRatio >= 0.1 && cashRatio <= 0.3) {
    efficiency = 20;
    reasons.efficiency = "キャッシュ比率が理想的な水準(10-30%)で、機動力と安定性が両立されています。";
  } else if (cashRatio < 0.1) {
    efficiency = 10 + (cashRatio / 0.1) * 10;
    reasons.efficiency = "現金比率が低すぎます。急な下落時の買い増し余力が不足している可能性があります。";
  } else {
    efficiency = Math.max(0, 20 - ((cashRatio - 0.3) / 0.7) * 20);
    reasons.efficiency = "現金比率が高く、資産の稼働効率が低下しています。";
  }

  // 5. 行動規律 (0-20点) - 違反なしで満点。1回につき-5点
  const discipline = Math.max(0, 20 - (violationsCount * 5));
  if (violationsCount === 0) reasons.discipline = "投資ルールを厳守できており、素晴らしい規律です。";
  else reasons.discipline = `${violationsCount}件のルール違反が検知されています。一貫性のある運用を心がけましょう。`;

  const total = Math.round(growth + stability + diversification + efficiency + discipline);

  return {
    growth: Math.round(growth),
    stability: Math.round(stability),
    diversification: Math.round(diversification),
    efficiency: Math.round(efficiency),
    discipline: Math.round(discipline),
    total,
    reasons
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
