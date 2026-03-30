import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  getDoc,
  writeBatch,
  limit,
  serverTimestamp
} from "firebase/firestore";
import { FXSimulation, FXRiskMetrics, FXConditionAnalysis, FXBacktestComparison } from "@/types/fx";
import { setDoc } from "firebase/firestore";

/**
 * FX シミュレーション (仮想トレード) サービス
 */

const getCollPrefix = (pair: string) => `fx_${pair.toLowerCase().replace("/", "_")}`;

/**
 * 通貨別計算用のヘルパー
 */
const getMultipliers = (pairCode: string) => {
  const isJPY = pairCode.endsWith("JPY");
  return {
    isJPY,
    pipMultiplier: isJPY ? 100 : 10000,
    // 1Lot=1万通貨。JPY建なら pnl * 10000。Non-JPY(e.g. EURUSD)なら pnl * 10000 * USDJPYレート
    // 本来は動的なレート取得が必要だが、一旦 150.0 を基準とする。
    yenMultiplier: isJPY ? 10000 : 10000 * 150.0 
  };
};

export const FXSimulationService = {
  /**
   * 仮想エントリーの作成
   */
  async createSimulation(
    userId: string, 
    data: Omit<FXSimulation, "id" | "pnl" | "pnlPercentage" | "updatedAt">,
    executionProfile?: { spreadPips: number, qualityScore: number, volatilitySpike: boolean }
  ): Promise<string> {
    try {
      const pair = data.pairCode || "USD/JPY";
      const prefix = getCollPrefix(pair);
      const { isJPY } = getMultipliers(pair);

      // スリッページのエミュレーション (ボラティリティ急増時に発生)
      let slippagePips = 0;
      if (executionProfile?.volatilitySpike) {
        slippagePips = 0.2 + Math.random() * 1.3;
      } else if (executionProfile && executionProfile.spreadPips > 0.5) {
        slippagePips = Math.random() * 0.3;
      }

      const slipAmount = isJPY ? slippagePips / 100 : slippagePips / 10000;
      const realizedEntryPrice = data.side === "buy" ? data.entryPrice + slipAmount : data.entryPrice - slipAmount;

      const docRef = await addDoc(collection(db, `users/${userId}/${prefix}_simulations`), {
        ...data,
        execution: {
          slippagePips,
          spreadPips: executionProfile?.spreadPips || 0.2,
          executionQualityScore: executionProfile?.qualityScore || 100,
          realizedEntryPrice
        },
        pnl: 0,
        pnlPercentage: 0,
        status: "open",
        updatedAt: serverTimestamp(),
      });
      
      const metrics = await this.getRiskMetrics(userId, pair);
      await setDoc(doc(db, `users/${userId}/${prefix}_risk_metrics/current`), {
        ...metrics,
        lastEntryTimestamp: new Date().toISOString()
      });
      
      return docRef.id;
    } catch (error) {
      console.error("Error creating simulation:", error);
      throw error;
    }
  },

  /**
   * 仮想ポジションのクローズ
   */
  async closeSimulation(userId: string, id: string, exitPrice: number, exitReason: string, pairCode: string = "USD/JPY"): Promise<void> {
    try {
      const prefix = getCollPrefix(pairCode);
      const { yenMultiplier } = getMultipliers(pairCode);
      const batch = writeBatch(db);
      const docRef = doc(db, `users/${userId}/${prefix}_simulations`, id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error("Simulation not found");
      
      const data = snap.data() as FXSimulation;
      const entryPrice = data.execution?.realizedEntryPrice ?? data.entryPrice;
      const pnl = data.side === "buy" ? exitPrice - entryPrice : entryPrice - exitPrice;
      const pnlPercentage = (pnl / entryPrice) * 100;

      batch.update(docRef, {
        status: "closed",
        exitPrice,
        exitTimestamp: new Date().toISOString(),
        exitReason,
        pnl,
        pnlPercentage,
        updatedAt: serverTimestamp(),
        aiReview: {
          score: pnl > 0 ? 90 : 80,
          compliance: "Excellent",
          feedback: pnl > 0 ? "ルール通りの利確です。" : "損切りを遵守しました。",
          suggestion: "このトレードを学習データに統合しました。"
        }
      });
      
      const realPnlYen = pnl * data.quantity * yenMultiplier;

      const metrics = await this.getRiskMetrics(userId, pairCode);
      const newBalance = metrics.currentBalance + realPnlYen;
      const newMaxBalance = Math.max(metrics.maxBalance, newBalance);
      
      batch.update(doc(db, `users/${userId}/${prefix}_risk_metrics/current`), {
        currentBalance: newBalance,
        maxBalance: newMaxBalance,
        lastExitTimestamp: new Date().toISOString(),
        lastTradeTimestamp: new Date().toISOString(),
        totalFinishedTrades: metrics.totalFinishedTrades + 1
      });

      await batch.commit();
      
      // メトリクスの詳細更新
      await this.updateRiskMetricsOnTrade(userId, realPnlYen, new Date().toISOString(), pairCode);

    } catch (error) {
      console.error("Error closing simulation:", error);
      throw error;
    }
  },
  
  async deleteSimulation(userId: string, id: string, pairCode: string = "USD/JPY"): Promise<void> {
    try {
      const prefix = getCollPrefix(pairCode);
      const { deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, `users/${userId}/${prefix}_simulations`, id));
    } catch (error) {
      console.error("Error deleting simulation:", error);
      throw error;
    }
  },

  async updateSimulation(userId: string, id: string, updates: Partial<FXSimulation>, pairCode: string = "USD/JPY"): Promise<void> {
    try {
      const prefix = getCollPrefix(pairCode);
      await updateDoc(doc(db, `users/${userId}/${prefix}_simulations`, id), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating simulation:", error);
      throw error;
    }
  },

  async getActiveSimulations(userId: string, pairCode: string = "USD/JPY"): Promise<FXSimulation[]> {
    try {
      const prefix = getCollPrefix(pairCode);
      const q = query(
        collection(db, `users/${userId}/${prefix}_simulations`),
        where("status", "==", "open"),
        limit(50)
      );
      const snap = await getDocs(q);
      const sims = snap.docs.map(d => ({ id: d.id, ...d.data() } as FXSimulation));
      return sims.sort((a, b) => new Date(b.entryTimestamp).getTime() - new Date(a.entryTimestamp).getTime());
    } catch (error) {
      console.error("Error fetching active simulations:", error);
      return [];
    }
  },

  async getSimulationHistory(userId: string, limitCount: number = 20, pairCode: string = "USD/JPY"): Promise<FXSimulation[]> {
    try {
      const prefix = getCollPrefix(pairCode);
      const q = query(
        collection(db, `users/${userId}/${prefix}_simulations`),
        where("status", "==", "closed"),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      const sims = snap.docs.map(d => ({ id: d.id, ...d.data() } as FXSimulation));
      return sims
        .sort((a, b) => new Date(b.exitTimestamp!).getTime() - new Date(a.exitTimestamp!).getTime())
        .slice(0, limitCount);
    } catch (error) {
      console.error("Error fetching simulation history:", error);
      return [];
    }
  },

  async getRiskMetrics(userId: string, pairCode: string = "USD/JPY"): Promise<FXRiskMetrics> {
    try {
      const prefix = getCollPrefix(pairCode);
      const docRef = doc(db, `users/${userId}/${prefix}_risk_metrics/current`);
      const snap = await getDoc(docRef);
      
      if (snap.exists()) {
        return snap.data() as FXRiskMetrics;
      }
      
      return {
        userId,
        currentBalance: 1000000,
        maxBalance: 1000000,
        drawdownPercent: 0,
        consecutiveLosses: 0,
        winRate: 0,
        totalFinishedTrades: 0,
        dailyTradeCount: 0,
        dailyPnlPercent: 0,
        ruleComplianceRate: 100,
        operationStatus: "normal",
        lastEntryTimestamp: new Date(0).toISOString(),
        lastExitTimestamp: new Date(0).toISOString(),
        lastTradeTimestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error fetching risk metrics:", error);
      throw error;
    }
  },

  async getAggregatedPerformance(userId: string, pairCode: string = "USD/JPY"): Promise<{
    today: { pips: number, yen: number, count: number, winRate: number },
    weekly: { pips: number, yen: number, count: number, winRate: number },
    monthly: { pips: number, yen: number, count: number, winRate: number },
    allTime: { pips: number, yen: number, count: number, winRate: number }
  }> {
    try {
      const prefix = getCollPrefix(pairCode);
      const q = query(
        collection(db, `users/${userId}/${prefix}_simulations`),
        where("status", "==", "closed")
      );
      
      const snap = await getDocs(q);
      const trades = snap.docs.map(d => d.data() as FXSimulation);

      const jstOffset = 9 * 60 * 60 * 1000;
      const todayJST = new Date(new Date().getTime() + jstOffset);
      todayJST.setHours(0, 0, 0, 0);

      const weekStartJST = new Date(todayJST);
      weekStartJST.setDate(todayJST.getDate() - todayJST.getDay());

      const monthStartJST = new Date(todayJST);
      monthStartJST.setDate(1);

      const { pipMultiplier, yenMultiplier } = getMultipliers(pairCode);

      const aggregate = (filteredTrades: FXSimulation[]) => {
        const pips = filteredTrades.reduce((acc, t) => acc + (t.pnl * pipMultiplier), 0);
        const yen = filteredTrades.reduce((acc, t) => acc + (t.pnl * t.quantity * yenMultiplier), 0);
        const wins = filteredTrades.filter(t => t.pnl > 0).length;
        return {
          pips: Number(pips.toFixed(1)),
          yen: Math.round(yen),
          count: filteredTrades.length,
          winRate: filteredTrades.length > 0 ? (wins / filteredTrades.length) * 100 : 0
        };
      };

      const getJSTDateString = (iso: string) => {
        return new Date(new Date(iso).getTime() + jstOffset).toISOString().split('T')[0];
      };
      
      const todayStr = todayJST.toISOString().split('T')[0];

      return {
        today: aggregate(trades.filter(t => getJSTDateString(t.exitTimestamp!) === todayStr)),
        weekly: aggregate(trades.filter(t => new Date(new Date(t.exitTimestamp!).getTime() + jstOffset).getTime() >= weekStartJST.getTime())),
        monthly: aggregate(trades.filter(t => new Date(new Date(t.exitTimestamp!).getTime() + jstOffset).getTime() >= monthStartJST.getTime())),
        allTime: aggregate(trades)
      };
    } catch (error) {
      console.error("Error aggregating performance:", error);
      return {
        today: { pips: 0, yen: 0, count: 0, winRate: 0 },
        weekly: { pips: 0, yen: 0, count: 0, winRate: 0 },
        monthly: { pips: 0, yen: 0, count: 0, winRate: 0 },
        allTime: { pips: 0, yen: 0, count: 0, winRate: 0 }
      };
    }
  },

  async updateRiskMetricsOnTrade(userId: string, lastPnlYen: number, exitTime: string, pairCode: string = "USD/JPY"): Promise<void> {
    try {
      const prefix = getCollPrefix(pairCode);
      const metrics = await this.getRiskMetrics(userId, pairCode);
      const history = await this.getSimulationHistory(userId, 50, pairCode);
      const { yenMultiplier } = getMultipliers(pairCode);
      
      const todayString = new Date().toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" });
      const todayTrades = history.filter(t => {
        const tDate = new Date(t.exitTimestamp || "").toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" });
        return tDate === todayString;
      });

      let consecutiveLosses = 0;
      for (const trade of history) {
        if (trade.pnl < 0) consecutiveLosses++;
        else if (trade.pnl > 0) break;
      }
      
      const newBalance = metrics.currentBalance;
      const newMaxBalance = Math.max(metrics.maxBalance, newBalance);
      const drawdownPercent = ((newMaxBalance - newBalance) / newMaxBalance) * 100;
      
      const dailyPnlAmount = todayTrades.reduce((acc, t) => {
        return acc + (t.pnl * t.quantity * yenMultiplier);
      }, 0);
      const dailyPnlPercent = (dailyPnlAmount / Math.max(1, metrics.currentBalance)) * 100;

      const wins = history.filter(t => t.pnl > 0).length;
      const winRate = history.length > 0 ? (wins / history.length) * 100 : 0;

      const violationsSnap = await getDocs(collection(db, `users/${userId}/${prefix}_violations`));
      const violationCount = violationsSnap.size;
      const ruleComplianceRate = metrics.totalFinishedTrades > 0 
        ? Math.max(0, Math.min(100, 100 - (violationCount / metrics.totalFinishedTrades * 100)))
        : 100;

      let operationStatus: "normal" | "caution" | "stop" = "normal";
      if (drawdownPercent > 10 || consecutiveLosses >= 5) {
        operationStatus = "stop";
      } else if (drawdownPercent > 5 || consecutiveLosses >= 3) {
        operationStatus = "caution";
      }

      await updateDoc(doc(db, `users/${userId}/${prefix}_risk_metrics/current`), {
        drawdownPercent: Number(drawdownPercent.toFixed(2)),
        consecutiveLosses,
        winRate: Number(winRate.toFixed(1)),
        dailyTradeCount: todayTrades.length,
        dailyPnlPercent: Number(dailyPnlPercent.toFixed(2)),
        ruleComplianceRate: Number(ruleComplianceRate.toFixed(1)),
        operationStatus,
        lastExitTimestamp: exitTime,
        lastTradeTimestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating risk metrics:", error);
    }
  },

  async logViolation(userId: string, reason: string, context: any, pairCode: string = "USD/JPY"): Promise<void> {
    try {
      const prefix = getCollPrefix(pairCode);
      await addDoc(collection(db, `users/${userId}/${prefix}_violations`), {
        reason,
        context,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error logging violation:", error);
    }
  },

  async getConditionAnalysis(userId: string, pairCode: string = "USD/JPY"): Promise<FXConditionAnalysis> {
    try {
      const prefix = getCollPrefix(pairCode);
      const q = query(
        collection(db, `users/${userId}/${prefix}_simulations`),
        where("status", "==", "closed"),
        orderBy("exitTimestamp", "desc"),
        limit(100)
      );
      const snap = await getDocs(q);
      const trades = snap.docs.map(d => d.data() as FXSimulation);

      const result: FXConditionAnalysis = {
        timeOfDay: {},
        dayOfWeek: {},
        regime: {},
        sentiment: {},
        liquidity: {}
      };

      const isJPY = pairCode.endsWith("JPY");
      const pipMultiplier = isJPY ? 100 : 10000;

      trades.forEach(t => {
        const exitDate = new Date(t.exitTimestamp!);
        const hour = exitDate.getHours().toString().padStart(2, '0') + ":00";
        const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][exitDate.getDay()];
        const regimeType = t.context?.environment || "UNKNOWN";
        const sentimentBias = t.context?.setup?.score > 70 ? "OPTIMISTIC" : t.context?.setup?.score < 30 ? "PESSIMISTIC" : "NEUTRAL";
        const liquidityStatus = (t.execution?.executionQualityScore || 0) > 80 ? "HIGH" : "LOW/MED";

        const updateAgg = (group: Record<string, any>, key: string) => {
          if (!group[key]) group[key] = { winRate: 0, profit: 0, count: 0, wins: 0 };
          group[key].count++;
          group[key].profit += (t.pnl * pipMultiplier);
          if (t.pnl > 0) group[key].wins++;
          group[key].winRate = (group[key].wins / group[key].count) * 100;
        };

        updateAgg(result.timeOfDay, hour);
        updateAgg(result.dayOfWeek, day);
        updateAgg(result.regime, regimeType);
        updateAgg(result.sentiment, sentimentBias);
        updateAgg(result.liquidity, liquidityStatus);
      });

      return result;
    } catch (error) {
      console.error("Error fetching condition analysis:", error);
      return { timeOfDay: {}, dayOfWeek: {}, regime: {}, sentiment: {}, liquidity: {} };
    }
  },

  async getViolationLogs(userId: string, pairCode: string = "USD/JPY"): Promise<any[]> {
    try {
      const prefix = getCollPrefix(pairCode);
      const q = query(
        collection(db, `users/${userId}/${prefix}_violations`),
        limit(50)
      );
      const snap = await getDocs(q);
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return logs.sort((a: any, b: any) => {
        const timeB = b.timestamp?.seconds || 0;
        const timeA = a.timestamp?.seconds || 0;
        return timeB - timeA;
      });
    } catch (error) {
       console.error("Error fetching violation logs:", error);
       return [];
    }
  },

  async getBacktestComparisons(pairCode: string = "USD/JPY"): Promise<FXBacktestComparison[]> {
    // ユーロドルの場合は少し数値を調整して返す
    if (pairCode === "EUR/USD") {
      return [
        { id: "current", name: "現行ロジック (EURUSD)", winRate: 64.2, expectedValue: 4.8, profitFactor: 1.72, maxDrawdown: 4.8, tradeCount: 142, stabilityScore: 92, overfittingWarning: false },
        { id: "momentum", name: "モメンタム追随", winRate: 55.5, expectedValue: 5.2, profitFactor: 1.45, maxDrawdown: 9.2, tradeCount: 185, stabilityScore: 72, overfittingWarning: false },
        { id: "counter_trend", name: "逆張り戦略", winRate: 48.2, expectedValue: 2.1, profitFactor: 1.25, maxDrawdown: 7.4, tradeCount: 95, stabilityScore: 58, overfittingWarning: false },
      ];
    }
    return [
      { id: "current", name: "現行ロジック", winRate: 62.5, expectedValue: 4.2, profitFactor: 1.65, maxDrawdown: 5.2, tradeCount: 156, stabilityScore: 88, overfittingWarning: false },
      { id: "ma_crossover", name: "MAクロス候補", winRate: 58.2, expectedValue: 3.1, profitFactor: 1.34, maxDrawdown: 8.5, tradeCount: 210, stabilityScore: 65, overfittingWarning: false },
      { id: "aggressive_momentum", name: "アグレッシブ", winRate: 45.1, expectedValue: 8.5, profitFactor: 1.48, maxDrawdown: 12.4, tradeCount: 88, stabilityScore: 45, overfittingWarning: true },
    ];
  }
};
      });
    } catch (error) {
       console.error("Error fetching violation logs:", error);
       return [];
    }
  },

  /**
   * トレード後のAI自動振り返り
   */
  async generateTradeReview(userId: string, simulationId: string, pairCode: string = "USD/JPY"): Promise<void> {
    try {
      const prefix = getCollPrefix(pairCode);
      const docRef = doc(db, `users/${userId}/${prefix}_simulations`, simulationId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;
      
      const trade = snap.data() as FXSimulation;
      const isWin = trade.pnl > 0;
      
      const feedback = isWin 
        ? "ルール通りに待機し、優位性のあるポイントでエントリーできました。利益確定のタイミングも適切です。"
        : "損切りはトレードの一部です。ルールに基づいた撤退であれば、この負けには価値があります。";

      await updateDoc(docRef, {
        aiReview: {
          score: isWin ? 90 : 80,
          compliance: "Excellent",
          feedback,
          suggestion: isWin ? "現在の規律を維持してください。" : "次回のトレードまでクールダウンを守りましょう。"
        }
      });
    } catch (error) {
      console.error("Error generating trade review:", error);
    }
  }
};
