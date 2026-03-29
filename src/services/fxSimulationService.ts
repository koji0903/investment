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
import { FXSimulation } from "@/types/fx";
import { FXLearningService } from "./fxLearningService";

/**
 * USD/JPY シミュレーション (仮想トレード) サービス
 */
export const FXSimulationService = {
  /**
   * 仮想エントリーの作成
   */
  async createSimulation(userId: string, data: Omit<FXSimulation, "id" | "pnl" | "pnlPercentage" | "updatedAt">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, `users/${userId}/usdjpy/simulations`), {
        ...data,
        pnl: 0,
        pnlPercentage: 0,
        status: "open",
        updatedAt: serverTimestamp(),
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
      const pnl = data.side === "buy" ? exitPrice - data.entryPrice : data.entryPrice - exitPrice;
      const pnlPercentage = (pnl / data.entryPrice) * 100;

      await updateDoc(docRef, {
        status: "closed",
        exitPrice,
        exitTimestamp: new Date().toISOString(),
        exitReason,
        pnl,
        pnlPercentage,
        updatedAt: serverTimestamp(),
      });
      
      // 学習エンジンの更新をキック
      await FXLearningService.updateMetricsOnTradeClose(userId, { ...data, exitPrice, exitTimestamp: new Date().toISOString(), pnl, pnlPercentage, status: "closed" });
      
    } catch (error) {
      console.error("Error closing simulation:", error);
      throw error;
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
  }
};
