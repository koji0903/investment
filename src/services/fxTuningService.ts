import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  setDoc,
  limit
} from "firebase/firestore";
import { 
  FXDriftAnalysis, 
  FXTuningConfig, 
  FXTuningLog, 
  FXTuningMode 
} from "@/types/fxTuning";
import { FXSimulation, FXRiskMetrics, FXTradingReview } from "@/types/fx";
import { FXSimulationService } from "./fxSimulationService";

/**
 * 実戦運用チューニング (Pragmatic Tuning) サービス
 */

const getCollPrefix = (pair: string) => `fx_${pair.toLowerCase().replace("/", "_")}`;

export const FXTuningService = {
  /**
   * 現在のチューニング設定を取得
   */
  async getTuningConfig(userId: string, pairCode: string = "USD/JPY"): Promise<FXTuningConfig> {
    try {
      const prefix = getCollPrefix(pairCode);
      const docRef = doc(db, `users/${userId}/${prefix}_tuning_config/default`);
      const snap = await getDoc(docRef);
      
      if (snap.exists()) {
        return snap.data() as FXTuningConfig;
      }
      
      // デフォルト設定
      const defaultConfig: FXTuningConfig = {
        userId,
        mode: "standard",
        confidenceThreshold: 75,
        minAlignmentLevel: 66,
        fakeoutStrictness: 1.0,
        trailingStopWidth: 20,
        splitTakeProfitRatio: 0.5,
        earlyExitThreshold: 50,
        riskMultiplier: 1.0,
        maxDailyDrawdownAllowed: 3.0,
        maxSpreadAllowed: 0.5,
        maxSlippageAllowed: 0.3,
        regimeSensitivity: 1.0,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(docRef, defaultConfig);
      return defaultConfig;
    } catch (error) {
      console.error("Error fetching tuning config:", error);
      throw error;
    }
  },

  /**
   * チューニング設定を更新
   */
  async updateTuningConfig(userId: string, updates: Partial<FXTuningConfig>, reason: string, pairCode: string = "USD/JPY"): Promise<void> {
    try {
      const prefix = getCollPrefix(pairCode);
      const current = await this.getTuningConfig(userId, pairCode);
      const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
      
      await setDoc(doc(db, `users/${userId}/${prefix}_tuning_config/default`), updated);
      
      // ログの記録
      await addDoc(collection(db, `users/${userId}/${prefix}_tuning_logs`), {
        userId,
        changeReason: reason,
        oldConfig: current,
        newConfig: updated,
        appliedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating tuning config:", error);
      throw error;
    }
  },

  /**
   * ズレ（Drift）の分析を実行
   */
  async analyzeDrift(userId: string, pairCode: string = "USD/JPY"): Promise<FXDriftAnalysis> {
    try {
      const prefix = getCollPrefix(pairCode);
      // 直近50トレードを分析
      const trades = await FXSimulationService.getSimulationHistory(userId, 50, pairCode);
      const metrics = await FXSimulationService.getRiskMetrics(userId, pairCode);
      
      // 1. シグナルズレ分析 (期待勝率 vs 実勝率)
      const highConfidenceTrades = trades.filter(t => (t.context?.setup?.score || 0) > 75);
      const hcWinRate = highConfidenceTrades.length > 0 
        ? highConfidenceTrades.filter(t => t.pnl > 0).length / highConfidenceTrades.length 
        : 0.5;
      
      const signalScore = hcWinRate > 0.6 ? 100 : hcWinRate > 0.45 ? 70 : 40;
      const isJPY = pairCode.endsWith("JPY");
      const pipFactor = isJPY ? 100 : 10000;
      const signalImpact = highConfidenceTrades.reduce((acc, t) => acc + (t.pnl < 0 ? t.pnl : 0), 0) * pipFactor;

      // 2. 利確ズレ分析
      const earlyExitCount = trades.filter(t => t.exitReason?.includes("Auto-Close") && t.pnl > 0).length;
      const profitDriftScore = Math.max(0, 100 - (earlyExitCount * 5));

      // 3. ロットズレ分析
      const lotDriftScore = Math.max(0, 100 - (metrics.consecutiveLosses * 15));

      // 4. 執行ズレ分析 (滑り・スプレッド)
      const avgSlippage = trades.reduce((acc, t) => acc + (t.execution?.slippagePips || 0), 0) / (trades.length || 1);
      const executionScore = avgSlippage < 0.2 ? 100 : avgSlippage < 0.5 ? 60 : 30;

      const analysis: FXDriftAnalysis = {
        userId,
        signalDrift: {
          score: signalScore,
          frequency: highConfidenceTrades.length / (trades.length || 1) * 100,
          impact: signalImpact,
          suggestedAction: signalScore < 70 ? "エントリー条件の厳格化を推奨" : "安定しています"
        },
        profitDrift: {
          score: profitDriftScore,
          frequency: earlyExitCount / (trades.length || 1) * 100,
          impact: profitDriftScore < 80 ? -15.5 : 0,
          suggestedAction: profitDriftScore < 80 ? "トレーリングストップ幅の拡大を提案" : "適正です"
        },
        lotDrift: {
          score: lotDriftScore,
          frequency: metrics.consecutiveLosses > 2 ? 100 : 0,
          impact: metrics.consecutiveLosses * -5000,
          suggestedAction: lotDriftScore < 70 ? "連敗ガードを強化し、ロット倍率を下げてください" : "許容範囲内です"
        },
        executionDrift: {
          score: executionScore,
          frequency: avgSlippage > 0.3 ? 80 : 20,
          impact: avgSlippage * trades.length * -1,
          suggestedAction: executionScore < 70 ? "スプレッド許容値の引き下げ、または時間帯制限を推奨" : "良好です"
        },
        regimeDrift: {
          score: 85,
          frequency: 10,
          impact: -5.0,
          suggestedAction: "レジーム判定は安定しています"
        },
        overallDriftScore: (signalScore + profitDriftScore + lotDriftScore + executionScore) / 4,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, `users/${userId}/${prefix}_drift_analysis/latest`), analysis);
      return analysis;
    } catch (error) {
      console.error("Error analyzing drift:", error);
      throw error;
    }
  },

  /**
   * チューニング提案の生成
   */
  generateSuggestions(drift: FXDriftAnalysis, current: FXTuningConfig): Partial<FXTuningConfig> {
    const suggestions: Partial<FXTuningConfig> = {};
    const mode = current.mode;
    
    // モール別の調整感度
    const sensitivity = mode === "aggressive" ? 0.2 : mode === "standard" ? 0.1 : 0.05;

    // シグナル調整
    if (drift.signalDrift.score < 70) {
      suggestions.confidenceThreshold = Math.min(90, current.confidenceThreshold + 5);
      suggestions.fakeoutStrictness = Math.min(2.0, current.fakeoutStrictness + sensitivity);
    }

    // 利確調整
    if (drift.profitDrift.score < 80) {
      suggestions.trailingStopWidth = Math.min(50, current.trailingStopWidth + (sensitivity * 100));
    }

    // ロット調整
    if (drift.lotDrift.score < 70) {
      suggestions.riskMultiplier = Math.max(0.5, current.riskMultiplier - sensitivity);
    }

    // 執行調整
    if (drift.executionDrift.score < 70) {
      suggestions.maxSpreadAllowed = Math.max(0.3, current.maxSpreadAllowed - 0.1);
    }

    return suggestions;
  },

    return suggestions;
  },

  /**
   * チューニング履歴の取得
   */
  async getTuningLogs(userId: string, pairCode: string = "USD/JPY"): Promise<FXTuningLog[]> {
    try {
      const prefix = getCollPrefix(pairCode);
      const q = query(
        collection(db, `users/${userId}/${prefix}_tuning_logs`),
        orderBy("appliedAt", "desc"),
        limit(10)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as FXTuningLog));
    } catch (error) {
      console.error("Error fetching tuning logs:", error);
      return [];
    }
  }
};
