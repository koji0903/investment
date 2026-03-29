import { FXSimulation, FXTradingReview, FXMarketSentiment } from "@/types/fx";

/**
 * 複数のトレード結果から運用の集計と分析を行い、レビューを生成する
 */
export function generateTradingReview(
  trades: FXSimulation[],
  period: "daily" | "weekly",
  startDate: string,
  endDate: string
): FXTradingReview {
  const totalTrades = trades.length;
  if (totalTrades === 0) {
    return createEmptyReview(period, startDate, endDate);
  }

  const finishedTrades = trades.filter(t => t.status === "closed");
  const winCount = finishedTrades.filter(t => t.pnl > 0).length;
  const lossCount = finishedTrades.filter(t => t.pnl <= 0).length;
  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

  const grossProfit = finishedTrades.filter(t => t.pnl > 0).reduce((a, b) => a + b.pnl, 0);
  const grossLoss = Math.abs(finishedTrades.filter(t => t.pnl <= 0).reduce((a, b) => a + b.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 99 : 0);

  const totalPnl = finishedTrades.reduce((a, b) => a + b.pnl, 0);
  const totalPnlYen = totalPnl * 1500; // 便宜上 1pips=1000円 * 数量 的な想定 or pips換算

  // 最大ドローダウン (期間内でのピークからの下落)
  let maxDrawdown = 0;
  let peak = 0;
  let currentBalance = 0;
  finishedTrades.sort((a, b) => new Date(a.exitTimestamp || "").getTime() - new Date(b.exitTimestamp || "").getTime())
    .forEach(t => {
      currentBalance += t.pnl;
      if (currentBalance > peak) peak = currentBalance;
      const dd = peak - currentBalance;
      if (dd > maxDrawdown) maxDrawdown = dd;
    });

  const averageProfit = winCount > 0 ? grossProfit / winCount : 0;
  const averageLoss = lossCount > 0 ? grossLoss / lossCount : 0;

  // 勝ちパターン・負けパターンの抽出
  const winning: string[] = [];
  const losing: string[] = [];

  // 地合いとの相関
  const tailwindTrades = finishedTrades.filter(t => t.context?.setup?.score > 70);
  const headwindTrades = finishedTrades.filter(t => t.context?.setup?.score < 40);

  const tailwindWinRate = tailwindTrades.length > 0 
    ? (tailwindTrades.filter(t => t.pnl > 0).length / tailwindTrades.length) * 100 
    : 0;
  const headwindWinRate = headwindTrades.length > 0 
    ? (headwindTrades.filter(t => t.pnl > 0).length / headwindTrades.length) * 100 
    : 0;

  if (tailwindWinRate > 60) winning.push("地合いに逆らわないトレンドフォローが非常に有効です。");
  if (headwindWinRate < 30) losing.push("地合いに逆らった逆張りでの損失が目立ちます。");

  // 時間帯別の傾向 (簡易)
  const londonTrades = finishedTrades.filter(t => t.context?.timezone === "LONDON");
  if (londonTrades.length > 0 && londonTrades.filter(t => t.pnl > 0).length / londonTrades.length > 0.6) {
    winning.push("ロンドン時間のボラティリティを活用したトレードの勝率が高いです。");
  }

  // ルール遵守状況
  const details: string[] = [];
  let violationCount = 0;
  finishedTrades.forEach(t => {
    if (!t.stopLoss) {
      violationCount++;
      details.push(`${new Date(t.entryTimestamp).toLocaleTimeString()}: 損切り設定なしでのエントリー`);
    }
  });

  const complianceScore = Math.max(0, 100 - (violationCount * 20));

  // AI 改善提案
  const aiRecommendations: string[] = [];
  if (complianceScore < 100) aiRecommendations.push("まず第一に、すべてのトレードで損切り(SL)を設定することを徹底してください。");
  if (tailwindWinRate > winRate) aiRecommendations.push("地合いスコアが70以上の「追い風」時のみにエントリーを絞ることで、期待値の向上が見込めます。");
  if (averageLoss > averageProfit) aiRecommendations.push("損小利大が実現できていません。利確を急ぎすぎているか、損切りを遅らせている可能性があります。");

  const summary = totalPnl > 0 
    ? `本日の運用はプラス収支で終了しました。${winning[0] || "安定したトレードができています。"}`
    : `本日の運用はマイナス収支となりました。${losing[0] || "ルールの再確認と修正が必要です。"}`;

  return {
    id: `rev-${period}-${Date.now()}`,
    userId: trades[0]?.userId || "unknown",
    period,
    startDate,
    endDate,
    stats: {
      totalTrades,
      winCount,
      lossCount,
      winRate,
      profitFactor,
      totalPnl,
      totalPnlYen,
      maxDrawdown,
      averageProfit,
      averageLoss,
    },
    patterns: { winning, losing },
    compliance: {
      score: complianceScore,
      violationCount,
      details,
    },
    sentimentCorrelations: {
      tailwindWinRate,
      headwindWinRate,
    },
    aiRecommendations,
    summary,
    updatedAt: new Date().toISOString(),
  };
}

function createEmptyReview(period: "daily" | "weekly", startDate: string, endDate: string): FXTradingReview {
  return {
    id: `empty-${period}-${Date.now()}`,
    userId: "",
    period,
    startDate,
    endDate,
    stats: {
      totalTrades: 0,
      winCount: 0,
      lossCount: 0,
      winRate: 0,
      profitFactor: 0,
      totalPnl: 0,
      totalPnlYen: 0,
      maxDrawdown: 0,
      averageProfit: 0,
      averageLoss: 0,
    },
    patterns: { winning: [], losing: [] },
    compliance: { score: 100, violationCount: 0, details: [] },
    sentimentCorrelations: { tailwindWinRate: 0, headwindWinRate: 0 },
    aiRecommendations: ["トレード履歴がありません。まずはシミュレーションを開始しましょう。"],
    summary: "期間内のトレードデータが見つかりませんでした。",
    updatedAt: new Date().toISOString(),
  };
}
