import { AssetCalculated, InvestmentReport } from "@/types";
import { PerformanceMetrics } from "./analyticsUtils";

/**
 * 現在のデータから資産運用レポートを生成する
 */
export const generateReportData = (
  type: "weekly" | "monthly",
  assets: AssetCalculated[],
  metrics: PerformanceMetrics
): Omit<InvestmentReport, "id" | "createdAt"> => {
  const totalValue = assets.reduce((sum, a) => sum + a.evaluatedValue, 0);
  const totalProfit = assets.reduce((sum, a) => sum + a.profitAndLoss, 0);
  const avgProfitPct = assets.length > 0 ? totalProfit / (totalValue - totalProfit) * 100 : 0;

  // AIサマリーの生成
  let summary = "";
  if (type === "weekly") {
    summary = `今週の運用成績は ${totalProfit >= 0 ? "プラス" : "マイナス"} でした。${metrics.winRate >= 60 ? "全体として高い勝率を維持しています。" : "市場の変動により、一部の銘柄で調整が入っています。"}`;
  } else {
    summary = `今月のポートフォリオは ${avgProfitPct >= 5 ? "非常に堅調でした。" : "市場平均並みの推移となりました。"} ${totalValue >= 5000000 ? "大口の資産クラスが安定しており、複利効果が期待できる状態です。" : "小規模なポジションの積み上げが実を結び始めています。"}`;
  }

  // アドバイスの生成
  const advice = [
    {
      title: "資産配分の最適化",
      text: assets.some(a => (a.evaluatedValue / totalValue) > 0.4) 
        ? "特定の銘柄の比率が40%を超えています。リスク分散のため、一部利益確定を検討してください。"
        : "現在の分散状況は良好です。引き続きこのバランスを維持しましょう。"
    },
    {
      title: "パフォーマンス向上に向けて",
      text: metrics.maxDrawdown > 15 
        ? "最大ドローダウンがやや大きくなっています。逆指値の設定を強め、防衛力を高めることを推奨します。"
        : "ドローダウンが低く抑えられており、理想的なリスク管理ができいています。"
    }
  ];

  // 資産構成データ
  const assetDistribution = assets.map(a => ({
    name: a.name,
    value: a.evaluatedValue
  })).sort((a, b) => b.value - a.value).slice(0, 5); // 上位5件

  return {
    type,
    date: new Date().toISOString(),
    totalValue,
    performancePct: Math.round(avgProfitPct * 100) / 100,
    profitAndLoss: totalProfit,
    summary,
    advice,
    assetDistribution
  };
};
