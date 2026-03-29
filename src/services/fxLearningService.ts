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
  getDoc
} from "firebase/firestore";
import { FXSimulation, LearningMetric } from "@/types/fx";

/**
 * 自己学習・精度改善エンジン サービス
 */
export const FXLearningService = {
  /**
   * トレード終了時にパターン分析を行い、メトリクスを更新
   */
  async updateMetricsOnTradeClose(userId: string, simulation: FXSimulation): Promise<void> {
    try {
      const isWin = simulation.pnl > 0;
      const patterns = this.identifyPatterns(simulation);
      
      for (const patternId of patterns) {
        const docRef = doc(db, `users/${userId}/usdjpy/learning_metrics`, patternId);
        const snap = await getDoc(docRef);
        
        if (!snap.exists()) {
          // 初期化
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
          
          // 信頼度補正の算出 (期待値と勝率に基づく)
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
      console.error("Error updating learning metrics:", error);
    }
  },

  /**
   * シミュレーションデータから合致するパターンを抽出
   */
  identifyPatterns(sim: FXSimulation): string[] {
    const patterns: string[] = [];
    const ctx = sim.context;

    // トレンド一致パターン
    if (sim.side === "buy" && ctx.trend1h === "bullish" && ctx.trend15m === "bullish") {
      patterns.push("trend_alignment_bullish");
    }
    if (sim.side === "sell" && ctx.trend1h === "bearish" && ctx.trend15m === "bearish") {
      patterns.push("trend_alignment_bearish");
    }

    // RSI 逆張りパターン
    if (sim.side === "buy" && ctx.rsi15m < 30) {
      patterns.push("rsi_oversold_buy");
    }
    if (sim.side === "sell" && ctx.rsi15m > 70) {
      patterns.push("rsi_overbought_sell");
    }

    // ブレイクアウトパターン
    if (ctx.isBreakout) {
      patterns.push("breakout_momentum");
    }

    // ボラティリティ・コンテキスト
    if (ctx.volatilityATR > 0.15) {
      patterns.push("high_volatility_trade");
    }

    return patterns;
  },

  /**
   * 補正値の算出ロジック
   */
  calculateCorrection(winRate: number, totalTrades: number): number {
    if (totalTrades < 5) return 0; // 統計的有意性が低い場合は補正なし
    
    // 勝率 50% を基準に、最大 +-20 の補正を行う
    const baseCorrection = (winRate - 0.5) * 40;
    // 取引数が多いほど信頼性を高める (減衰係数)
    const confidenceFactor = Math.min(totalTrades / 20, 1.0);
    
    return Math.round(baseCorrection * confidenceFactor);
  },

  getPatternName(id: string): string {
    const names: Record<string, string> = {
      trend_alignment_bullish: "1H/15M トレンド一致 (買い)",
      trend_alignment_bearish: "1H/15M トレンド一致 (売り)",
      rsi_oversold_buy: "RSI 売られすぎ反発",
      rsi_overbought_sell: "RSI 買われすぎ反落",
      breakout_momentum: "レンジブレイク・モメンタム",
      high_volatility_trade: "高ボラティリティ環境トレード"
    };
    return names[id] || id;
  },

  getPatternDescription(id: string): string {
    const descs: Record<string, string> = {
      trend_alignment_bullish: "上位足と下位足のトレンドが買いで一致している状態。",
      trend_alignment_bearish: "上位足と下位足のトレンドが売りで一致している状態。",
      rsi_oversold_buy: "短長期の乖離が大きく、買い戻しが期待できるポイント。",
      rsi_overbought_sell: "買われすぎており、調整売りが期待できるポイント。",
      breakout_momentum: "重要ラインを抜け、一方向に加速しやすいタイミング。",
      high_volatility_trade: "値動きが激しく利幅が狙えるが、リスクも高い状態。"
    };
    return descs[id] || "";
  },

  /**
   * 学習結果の全取得
   */
  async getAllMetrics(userId: string): Promise<LearningMetric[]> {
    try {
      const q = query(collection(db, `users/${userId}/usdjpy/learning_metrics`));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as LearningMetric);
    } catch (error) {
      console.error("Error fetching learning metrics:", error);
      return [];
    }
  }
};
