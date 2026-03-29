import { FXExecutionProfile } from "@/types/fx";

/**
 * 執行品質・スプレッド監視サービス
 * 市場の流動性と執行コストをリアルタイム評価します。
 */
export const FXExecutionService = {
  /**
   * 現在の執行品質プロファイルを算出
   */
  calculateExecutionProfile(
    bid: number, 
    ask: number, 
    ohlc1m: any[] // 直近1分足データ（スパイク検知用）
  ): FXExecutionProfile {
    const spreadPips = Math.max(0, (ask - bid) * 100);
    
    // 1. スパイク検知 (直近1分での極端な値動き)
    const volatilitySpike = this.detectVolatilitySpike(ohlc1m);
    
    // 2. 流動性スコア (スプレッドベース)
    // USD/JPY 標準 0.2〜0.3 pips
    let liquidityScore = 100;
    if (spreadPips > 0.3) liquidityScore -= (spreadPips - 0.3) * 50;
    if (spreadPips > 1.0) liquidityScore -= 50; // 1.0 pips以上は深刻
    liquidityScore = Math.max(0, liquidityScore);

    // 3. 滑りリスク (ボラティリティとスプレッドから)
    let slippageRisk: "low" | "medium" | "high" = "low";
    if (volatilitySpike || spreadPips > 0.5) slippageRisk = "medium";
    if (volatilitySpike && spreadPips > 1.0) slippageRisk = "high";

    // 4. 総合品質スコア (0-100)
    let qualityScore = liquidityScore;
    if (volatilitySpike) qualityScore *= 0.6; // スパイク時は40%減衰
    qualityScore = Math.round(qualityScore);

    // 5. ステータス判定
    let status: "ideal" | "caution" | "critical" = "ideal";
    if (qualityScore < 80) status = "caution";
    if (qualityScore < 60 || spreadPips >= 1.0) status = "critical";

    return {
      spreadPips,
      volatilitySpike,
      slippageRisk,
      liquidityScore,
      qualityScore,
      status
    };
  },

  /**
   * 短期間での異常な価格変動を検知
   */
  detectVolatilitySpike(ohlc1m: any[]): boolean {
    if (ohlc1m.length < 5) return false;
    const last = ohlc1m[ohlc1m.length - 1];
    const range = Math.abs(last.high - last.low) * 100; // pips
    
    // 直近5本の平均レンジと比較
    const avgRange = ohlc1m.slice(-6, -1).reduce((acc, curr) => 
      acc + (Math.abs(curr.high - curr.low) * 100), 0) / 5;
    
    // 平均の3倍以上の動きがあればスパイクとみなす
    return range > Math.max(avgRange * 3, 0.05); // 最小 5pips
  }
};
