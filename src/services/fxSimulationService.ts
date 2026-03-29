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
  serverTimestamp,
  Timestamp,
  getDoc
} from "firebase/firestore";
import { FXSimulation, FXRiskMetrics } from "@/types/fx";
import { FXLearningService } from "./fxLearningService";
import { setDoc } from "firebase/firestore";

/**
 * USD/JPY シミュレーション (仮想トレード) サービス
 */
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
      // スリッページのエミュレーション (ボラティリティ急増時に発生)
      let slippagePips = 0;
      if (executionProfile?.volatilitySpike) {
        // 0.2 〜 1.5 pips のランダムな滑り
        slippagePips = 0.2 + Math.random() * 1.3;
      } else if (executionProfile && executionProfile.spreadPips > 0.5) {
        // スプレッド拡大時は 0.1 〜 0.3 pips 程度滑りやすい
        slippagePips = Math.random() * 0.3;
      }

      const slipAmount = slippagePips / 100; // pips to currency units
      const realizedEntryPrice = data.side === "buy" ? data.entryPrice + slipAmount : data.entryPrice - slipAmount;

      const docRef = await addDoc(collection(db, `users/${userId}/usdjpy/simulations`), {
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
      
      // 直近エントリー時刻の更新
      const metrics = await this.getRiskMetrics(userId);
      await setDoc(doc(db, `users/${userId}/usdjpy/risk_metrics`), {
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
  async closeSimulation(userId: string, id: string, exitPrice: number, exitReason: string): Promise<void> {
    try {
      const docRef = doc(db, `users/${userId}/usdjpy/simulations`, id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error("Simulation not found");
      
      const data = snap.data() as FXSimulation;
      const entryPrice = data.execution?.realizedEntryPrice ?? data.entryPrice;
      const pnl = data.side === "buy" ? exitPrice - entryPrice : entryPrice - exitPrice;
      const pnlPercentage = (pnl / entryPrice) * 100;

      await updateDoc(docRef, {
        status: "closed",
        exitPrice,
        exitTimestamp: new Date().toISOString(),
        exitReason,
        pnl,
        pnlPercentage,
        updatedAt: serverTimestamp(),
      });
      
      // リスクメトリクスの更新 (JST日付ベース)
      const realPnl = pnl * data.quantity * 100 * 100; // 1Lot=1万通貨
      await this.updateRiskMetricsOnTrade(userId, realPnl, new Date().toISOString());
      
      // 自動振り返りの生成
      await this.generateTradeReview(userId, id);
      
    } catch (error) {
      console.error("Error closing simulation:", error);
      throw error;
    }
  },

  /**
   * ポジションのリスク管理（オートクローズ、トレーリングストップ）
   */
  async manageOpenPositions(userId: string, currentPrice: number): Promise<void> {
    try {
      const activePositions = await this.getActiveSimulations(userId);
      
      for (const pos of activePositions) {
        let shouldClose = false;
        let exitReason = "";

        // 1. 損切り・利確の自動判定
        if (pos.side === "buy") {
          if (pos.stopLoss && currentPrice <= pos.stopLoss) {
            shouldClose = true;
            exitReason = "Auto-Close: Stop Loss hit";
          } else if (pos.takeProfit && currentPrice >= pos.takeProfit) {
            shouldClose = true;
            exitReason = "Auto-Close: Take Profit hit";
          }
          
          // トレーリングストップ (含み益が乗ったらSLを引き上げる)
          if (pos.stopLoss && currentPrice > pos.entryPrice + 0.1) { // 10pips以上の含み益
            const newSL = currentPrice - 0.2; // 20pips下に追従
            if (newSL > pos.stopLoss) {
              await updateDoc(doc(db, `users/${userId}/usdjpy/simulations`, pos.id), {
                stopLoss: newSL,
                updatedAt: serverTimestamp()
              });
            }
          }
        } else {
          if (pos.stopLoss && currentPrice >= pos.stopLoss) {
            shouldClose = true;
            exitReason = "Auto-Close: Stop Loss hit";
          } else if (pos.takeProfit && currentPrice <= pos.takeProfit) {
            shouldClose = true;
            exitReason = "Auto-Close: Take Profit hit";
          }

          // トレーリングストップ
          if (pos.stopLoss && currentPrice < pos.entryPrice - 0.1) {
            const newSL = currentPrice + 0.2;
            if (newSL < pos.stopLoss) {
              await updateDoc(doc(db, `users/${userId}/usdjpy/simulations`, pos.id), {
                stopLoss: newSL,
                updatedAt: serverTimestamp()
              });
            }
          }
        }

        if (shouldClose) {
          await this.closeSimulation(userId, pos.id, currentPrice, exitReason);
        }
      }
    } catch (error) {
      console.error("Error managing open positions:", error);
    }
  },

  /**
   * 現在オープンなポジションの取得
   */
  async getActiveSimulations(userId: string): Promise<FXSimulation[]> {
    try {
      const q = query(
        collection(db, `users/${userId}/usdjpy/simulations`),
        where("status", "==", "open"),
        orderBy("entryTimestamp", "desc")
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as FXSimulation));
    } catch (error) {
      console.error("Error fetching active simulations:", error);
      return [];
    }
  },

  /**
   * 履歴の取得
   */
  async getSimulationHistory(userId: string, limitCount: number = 20): Promise<FXSimulation[]> {
    try {
      const q = query(
        collection(db, `users/${userId}/usdjpy/simulations`),
        where("status", "==", "closed"),
        orderBy("exitTimestamp", "desc"),
        // リミットは後で実装
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as FXSimulation)).slice(0, limitCount);
    } catch (error) {
      console.error("Error fetching simulation history:", error);
      return [];
    }
  },

  /**
   * 指定期間のトレード履歴を取得 (レビュー用)
   */
  async getSimulationsByDateRange(userId: string, start: string, end: string): Promise<FXSimulation[]> {
    try {
      const q = query(
        collection(db, `users/${userId}/usdjpy/simulations`),
        where("exitTimestamp", ">=", start),
        where("exitTimestamp", "<=", end),
        orderBy("exitTimestamp", "asc")
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as FXSimulation));
    } catch (error) {
      console.error("Error fetching simulations by range:", error);
      return [];
    }
  },

  /**
   * 現在のリスクメトリクス（連敗、DD）を取得
   */
  async getRiskMetrics(userId: string): Promise<FXRiskMetrics> {
    try {
      const docRef = doc(db, `users/${userId}/usdjpy/risk_metrics`);
      const snap = await getDoc(docRef);
      
      if (snap.exists()) {
        return snap.data() as FXRiskMetrics;
      }
      
      // 初期値 (100万円スタート)
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
        lastEntryTimestamp: new Date(0).toISOString(),
        lastExitTimestamp: new Date(0).toISOString(),
        lastTradeTimestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error fetching risk metrics:", error);
      throw error;
    }
  },

  /**
   * トレード結果からリスクメトリクスを更新
   */
  async updateRiskMetricsOnTrade(userId: string, lastPnl: number, exitTime: string): Promise<void> {
    try {
      const metrics = await this.getRiskMetrics(userId);
      const history = await this.getSimulationHistory(userId, 50);
      
      // 本日（JST）のトレード抽出
      const todayString = new Date().toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" });
      const todayTrades = history.filter(t => {
        const tDate = new Date(t.exitTimestamp || "").toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" });
        return tDate === todayString;
      });

      // 連敗数の計算
      let consecutiveLosses = 0;
      for (const trade of history) {
        if (trade.pnl < 0) consecutiveLosses++;
        else break;
      }
      
      // ドローダウン計算
      const newBalance = metrics.currentBalance + lastPnl;
      const newMaxBalance = Math.max(metrics.maxBalance, newBalance);
      const drawdownPercent = ((newMaxBalance - newBalance) / newMaxBalance) * 100;
      
      // 日次損益率の計算
      const dailyPnlAmount = todayTrades.reduce((acc, t) => acc + (t.pnl * t.quantity * 100 * 100), lastPnl);
      const dailyPnlPercent = (dailyPnlAmount / metrics.currentBalance) * 100;

      // 勝率計算
      const totalTradesCount = history.length;
      const wins = history.filter(t => t.pnl > 0).length;
      const winRate = totalTradesCount > 0 ? wins / totalTradesCount : 0;

      const updatedMetrics: FXRiskMetrics = {
        ...metrics,
        currentBalance: newBalance,
        maxBalance: newMaxBalance,
        drawdownPercent,
        consecutiveLosses,
        winRate,
        totalFinishedTrades: metrics.totalFinishedTrades + 1,
        dailyTradeCount: todayTrades.length + 1,
        dailyPnlPercent,
        lastExitTimestamp: exitTime,
        lastTradeTimestamp: new Date().toISOString()
      };

      await setDoc(doc(db, `users/${userId}/usdjpy/risk_metrics`), updatedMetrics);
    } catch (error) {
      console.error("Error updating risk metrics:", error);
    }
  },

  /**
   * ルール違反の記録
   */
  async logViolation(userId: string, reason: string, context: any): Promise<void> {
    try {
      await addDoc(collection(db, `users/${userId}/usdjpy/violations`), {
        reason,
        context,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error logging violation:", error);
    }
  },

  /**
   * トレード後のAI自動振り返り
   */
  async generateTradeReview(userId: string, simulationId: string): Promise<void> {
    try {
      const docRef = doc(db, `users/${userId}/usdjpy/simulations`, simulationId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;
      
      const trade = snap.data() as FXSimulation;
      const isWin = trade.pnl > 0;
      
      let feedback = "";
      if (isWin) {
        feedback = "ルール通りに待機し、優位性のあるポイントでエントリーできました。利益確定のタイミングも適切です。";
      } else {
        feedback = "損切りはトレードの一部です。ルールに基づいた撤退であれば、この負けには価値があります。";
      }

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
