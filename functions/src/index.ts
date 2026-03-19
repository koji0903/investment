import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * 取引データが更新された際に、ポートフォリオ分析を再計算する
 */
export const onTransactionUpdate = onDocumentWritten(
  "users/{userId}/portfolios/{portfolioId}/transactions/{txId}",
  async (event) => {
    const { userId, portfolioId } = event.params;
    const db = admin.firestore();

    // 1. 全取引履歴の取得
    const txSnapshot = await db
      .collection("users")
      .doc(userId)
      .collection("portfolios")
      .doc(portfolioId)
      .collection("transactions")
      .orderBy("date", "asc")
      .get();

    const transactions = txSnapshot.docs.map(doc => doc.data());

    // 2. 資産別の算出 (数量、平均取得単価)
    const assetSummary: Record<string, { quantity: number; totalCost: number }> = {};
    let totalRealizedProfit = 0;
    let winCount = 0;
    let lossCount = 0;

    transactions.forEach(tx => {
      const assetId = tx.assetId;
      if (!assetSummary[assetId]) {
        assetSummary[assetId] = { quantity: 0, totalCost: 0 };
      }

      const summary = assetSummary[assetId];

      if (tx.type === "buy") {
        summary.totalCost += tx.quantity * tx.price;
        summary.quantity += tx.quantity;
      } else if (tx.type === "sell") {
        const avgCost = summary.quantity > 0 ? summary.totalCost / summary.quantity : 0;
        const profit = (tx.price - avgCost) * tx.quantity;
        
        totalRealizedProfit += profit;
        if (profit > 0) winCount++;
        else if (profit < 0) lossCount++;

        summary.quantity = Math.max(0, summary.quantity - tx.quantity);
        summary.totalCost = summary.quantity > 0 ? summary.quantity * avgCost : 0;
      }
    });

    // 3. パフォーマンス指標の計算
    const totalTrades = winCount + lossCount;
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

    // 4. 行動分析 (Behavior Analysis)
    const closedPositions: any[] = [];
    const openPositions: Record<string, { buyDate: string; quantity: number; price: number }[]> = {};

    transactions.forEach(tx => {
      const assetId = tx.assetId;
      if (tx.type === "buy") {
        if (!openPositions[assetId]) openPositions[assetId] = [];
        openPositions[assetId].push({ buyDate: tx.date, quantity: tx.quantity, price: tx.price });
      } else if (tx.type === "sell") {
        let sellQty = tx.quantity;
        while (sellQty > 0 && openPositions[assetId]?.length > 0) {
          const buy = openPositions[assetId][0];
          const qtyToClose = Math.min(sellQty, buy.quantity);
          
          const holdingDays = (new Date(tx.date).getTime() - new Date(buy.buyDate).getTime()) / (1000 * 60 * 60 * 24);
          closedPositions.push({
            assetId,
            holdingDays,
            profit: (tx.price - buy.price) * qtyToClose,
            profitRate: ((tx.price - buy.price) / buy.price) * 100
          });

          buy.quantity -= qtyToClose;
          sellQty -= qtyToClose;
          if (buy.quantity <= 0) openPositions[assetId].shift();
        }
      }
    });

    const winningTrades = closedPositions.filter(p => p.profit > 0);
    const losingTrades = closedPositions.filter(p => p.profit <= 0);

    const avgWinDays = winningTrades.length > 0 ? winningTrades.reduce((s, p) => s + p.holdingDays, 0) / winningTrades.length : 0;
    const avgLossDays = losingTrades.length > 0 ? losingTrades.reduce((s, p) => s + p.holdingDays, 0) / losingTrades.length : 0;

    // 投資傾向の判定
    let tendency = "分析中";
    let advice = "取引を継続してデータを蓄積してください。";

    if (closedPositions.length >= 3) {
      if (avgWinDays < avgLossDays) {
        tendency = "損大利小（塩漬け傾向）";
        advice = "損失が出ている銘柄を長く持ちすぎる傾向があります。損切りルールを厳格化しましょう。";
      } else if (winRate > 60 && avgWinDays < 7) {
        tendency = "短期スキャルパー型";
        advice = "高い勝率を維持していますが、利伸ばしを意識するとさらに利益が向上します。";
      } else {
        tendency = "バランス型";
        advice = "安定した運用です。現在のトレードスタイルを維持しつつ、リスク管理を徹底しましょう。";
      }
    }

    // 5. 分析結果の保存
    const analysisFolder = db
      .collection("users")
      .doc(userId)
      .collection("portfolios")
      .doc(portfolioId)
      .collection("analysis");

    // summary の更新 (既存)
    await analysisFolder.doc("summary").set({
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      realizedProfit: totalRealizedProfit,
      winRate: winRate,
      winCount,
      lossCount,
      totalTrades,
      assetMeta: Object.entries(assetSummary).map(([id, data]) => ({
        id,
        quantity: data.quantity,
        averageCost: data.quantity > 0 ? data.totalCost / data.quantity : 0
      }))
    }, { merge: true });

    // behavior の更新 (新規)
    await analysisFolder.doc("behavior").set({
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      tendency,
      advice,
      avgWinDays,
      avgLossDays,
      patterns: {
        winning: winningTrades.length > 0 ? "利確が早い" : "データ不足",
        losing: avgLossDays > 30 ? "損切りが遅い" : "良好"
      }
    });

    console.log(`Behavior analysis updated for user: ${userId}`);
  }
);
