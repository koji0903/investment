import { db } from "@/lib/firebase";
import { doc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { FXWeightProfile } from "@/types/fx";
import { AnalysisResult, PatternStats } from "./FXPatternAnalyzer";

export interface OptimizationLog {
  id: string;
  previousWeights: Record<string, number>;
  newWeights: Record<string, number>;
  reason: string;
  timestamp: string;
}

/**
 * 自己進化型 AI 重み最適化エンジン
 */
export const FXWeightOptimizer = {
  /**
   * 分析結果に基づき、重みプロファイルを自己更新
   */
  async optimizeWeights(
    userId: string, 
    analysis: AnalysisResult,
    currentProfile: FXWeightProfile
  ): Promise<{ profile: FXWeightProfile, log: OptimizationLog }> {
    
    const LEARNING_RATE = 0.2; // 20% ずつ EMA で更新
    const MIN_WEIGHT = 0.5;
    const MAX_WEIGHT = 2.0;

    const newWeights = { ...currentProfile.weights };
    let reason = "Analysis-driven optimization: ";

    // 1. 各トピックの強化/抑制
    // トレンド一致度の重み調整
    const highTrendAlignment = analysis.topWinPatterns.find(p => p.id === "ALIGNMENT_HIGH");
    const lowTrendAlignment = analysis.topLossPatterns.find(p => p.id === "ALIGNMENT_LOW");

    if (highTrendAlignment && highTrendAlignment.winRate > 0.6) {
      newWeights.trendAlignment = this.emaUpdate(newWeights.trendAlignment, 1.2, LEARNING_RATE);
      reason += "Increased trend alignment weight (+). ";
    } else if (lowTrendAlignment && lowTrendAlignment.winRate < 0.4) {
      newWeights.trendAlignment = this.emaUpdate(newWeights.trendAlignment, 0.8, LEARNING_RATE);
      reason += "Reduced trend alignment weight (-). ";
    }

    // ボラティリティの重み調整
    const highVolPatterns = analysis.topWinPatterns.find(p => p.id === "ENV_HIGH_VOLATILITY");
    if (highVolPatterns && highVolPatterns.winRate > 0.6) {
      newWeights.volatility = this.emaUpdate(newWeights.volatility, 1.3, LEARNING_RATE);
      reason += "Better performance in high vol (+). ";
    }

    // 戦略別の重み調整
    const breakoutWin = analysis.topWinPatterns.find(p => p.id === "STRATEGY_BREAKOUT");
    const pullbackWin = analysis.topWinPatterns.find(p => p.id === "STRATEGY_PULLBACK");

    if (breakoutWin && breakoutWin.totalTrades > 5) {
      newWeights.indicatorSignal = this.emaUpdate(newWeights.indicatorSignal, 1.1, LEARNING_RATE);
      reason += "Breakout logic showing high EV. ";
    }

    // 2. 制約の適用
    Object.keys(newWeights).forEach(key => {
      const k = key as keyof typeof newWeights;
      newWeights[k] = Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, newWeights[k]));
      // 小数点第2位までに丸める
      newWeights[k] = Math.round(newWeights[k] * 100) / 100;
    });

    const optimizedProfile: FXWeightProfile = {
      ...currentProfile,
      weights: newWeights,
      lastOptimizedAt: new Date().toISOString(),
      sampleCount: currentProfile.sampleCount + 1
    };

    const log: OptimizationLog = {
      id: `opt_${Date.now()}`,
      previousWeights: currentProfile.weights,
      newWeights: newWeights,
      reason,
      timestamp: new Date().toISOString()
    };

    // Firestore への永続化
    await setDoc(doc(db, `users/${userId}/usdjpy/weight_profiles`, currentProfile.id), optimizedProfile);
    await addDoc(collection(db, `users/${userId}/usdjpy/optimization_logs`), {
      ...log,
      recordedAt: serverTimestamp()
    });

    return { profile: optimizedProfile, log };
  },

  emaUpdate(current: number, target: number, rate: number): number {
    return current * (1 - rate) + target * rate;
  }
};
