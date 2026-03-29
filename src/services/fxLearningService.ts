import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  query, 
  where, 
  updateDoc,
  serverTimestamp,
  increment,
  getDoc,
  addDoc,
  orderBy,
  limit
} from "firebase/firestore";
import { FXSimulation, LearningMetric, FXTradeContext, FXWeightProfile } from "@/types/fx";

/**
 * 自己学習・精度改善エンジン サービス (V2: 自己進化型)
 */
export const FXLearningService = {
  /**
   * トレード終了時に生データを保存
   */
  async recordTradeHistory(userId: string, simulation: FXSimulation): Promise<void> {
    try {
      await addDoc(collection(db, `users/${userId}/fx_usdjpy_learning_history`), {
        ...simulation,
        recordedAt: serverTimestamp()
      });
      
      // 基本メトリクスの簡易更新も継続
      await this.updateBasicMetrics(userId, simulation);
    } catch (error) {
      console.error("Error recording trade history:", error);
    }
  },

  /**
   * 基本パターンの勝率集計 (既存互換)
   */
  async updateBasicMetrics(userId: string, simulation: FXSimulation): Promise<void> {
    try {
      const isWin = simulation.pnl > 0;
      const patterns = this.identifyPatterns(simulation);
      
      for (const patternId of patterns) {
        const docRef = doc(db, `users/${userId}/fx_usdjpy_learning_metrics`, patternId);
        const snap = await getDoc(docRef);
        
        if (!snap.exists()) {
          const newMetric: LearningMetric = {
            patternId,
            patternName: this.getPatternName(patternId),
            description: this.getPatternDescription(patternId),
            winRate: isWin ? 1 : 0,
            totalTrades: 1,
            expectedValue: simulation.pnl,
            reliabilityCorrection: 0,
            lastUpdatedAt: new Date().toISOString()
          };
          await setDoc(docRef, newMetric);
        } else {
          const data = snap.data() as LearningMetric;
          const newTotal = data.totalTrades + 1;
          const newWinRate = (data.winRate * data.totalTrades + (isWin ? 1 : 0)) / newTotal;
          const newExpectedValue = (data.expectedValue * data.totalTrades + simulation.pnl) / newTotal;
          const correction = this.calculateCorrection(newWinRate, newTotal);

          await updateDoc(docRef, {
            winRate: newWinRate,
            totalTrades: newTotal,
            expectedValue: newExpectedValue,
            reliabilityCorrection: correction,
            lastUpdatedAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error("Error updating basic metrics:", error);
    }
  },

  identifyPatterns(sim: FXSimulation): string[] {
    const patterns: string[] = [];
    const ctx = sim.context;

    // トレンド一致パターン
    if (sim.side === "buy" && ctx.trends["1h"] === "bullish" && ctx.trends["15m"] === "bullish") {
      patterns.push("trend_alignment_bullish");
    }
    if (sim.side === "sell" && ctx.trends["1h"] === "bearish" && ctx.trends["15m"] === "bearish") {
      patterns.push("trend_alignment_bearish");
    }

    // ブレイクアウト
    if (ctx.levels.isBreakout) {
      patterns.push("breakout_momentum");
    }

    // 地合い別
    if (ctx.environment === "HIGH_VOLATILITY") {
      patterns.push("high_volatility_trade");
    }

    return patterns;
  },

  calculateCorrection(winRate: number, totalTrades: number): number {
    if (totalTrades < 5) return 0;
    const baseCorrection = (winRate - 0.5) * 40;
    const confidenceFactor = Math.min(totalTrades / 20, 1.0);
    return Math.round(baseCorrection * confidenceFactor);
  },

  getPatternName(id: string): string {
    const names: Record<string, string> = {
      trend_alignment_bullish: "1H/15M トレンド一致 (買い)",
      trend_alignment_bearish: "1H/15M トレンド一致 (売り)",
      breakout_momentum: "レンジブレイク・モメンタム",
      high_volatility_trade: "高ボラティリティ環境トレード"
    };
    return names[id] || id;
  },

  getPatternDescription(id: string): string {
    const descs: Record<string, string> = {
      trend_alignment_bullish: "上位足と下位足のトレンドが買いで一致している状態。",
      trend_alignment_bearish: "上位足と下位足のトレンドが売りで一致している状態。",
      breakout_momentum: "重要ラインを抜け、一方向に加速しやすいタイミング。",
      high_volatility_trade: "値動きが激しく利幅が狙えるが、リスクも高い状態。"
    };
    return descs[id] || "";
  },

  /**
   * 最新の環境プロファイルを取得
   */
  async getWeightProfile(userId: string, profileId: string = "DEFAULT"): Promise<FXWeightProfile | null> {
    try {
      const docRef = doc(db, `users/${userId}/fx_usdjpy_weight_profiles`, profileId);
      const snap = await getDoc(docRef);
      if (snap.exists()) return snap.data() as FXWeightProfile;
      
      // デフォルト初期値
      return {
        id: "DEFAULT",
        name: "Standard AI Model",
        weights: {
          trendAlignment: 1.0,
          volatility: 1.0,
          supportResistance: 1.0,
          timeOfDay: 1.0,
          indicatorSignal: 1.0
        },
        bias: 0,
        lastOptimizedAt: new Date().toISOString(),
        sampleCount: 0
      };
    } catch (error) {
      return null;
    }
  },

  async getAllMetrics(userId: string): Promise<LearningMetric[]> {
    try {
      const q = query(collection(db, `users/${userId}/fx_usdjpy_learning_metrics`));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as LearningMetric);
    } catch (error) {
      return [];
    }
  }
};
