/**
 * 実戦運用チューニング (Pragmatic Tuning) 型定義
 */

export type FXTuningMode = "conservative" | "standard" | "aggressive";

export interface FXDriftScore {
  score: number;       // 0-100 (100: ズレなし / 0: 深刻なズレ)
  frequency: number;   // 0-100% 発生頻度
  impact: number;      // 損益(pips)への累積影響
  suggestedAction: string;
}

/**
 * ズレ検知エンジン 出力
 */
export interface FXDriftAnalysis {
  userId: string;
  signalDrift: FXDriftScore;    // エントリー精度のズレ
  profitDrift: FXDriftScore;    // 利確タイミングのズレ
  lotDrift: FXDriftScore;       // ロット適正のズレ
  executionDrift: FXDriftScore; // 執行品質（滑り等）のズレ
  regimeDrift: FXDriftScore;    // 判定レジームとの適合ズレ
  overallDriftScore: number;    // 総合スコア
  updatedAt: string;
}

/**
 * 実際にロジックに適用されるパラメータ
 */
export interface FXTuningConfig {
  userId: string;
  mode: FXTuningMode;
  
  // シグナル・条件
  confidenceThreshold: number;  // 60, 70, 80...
  minAlignmentLevel: number;    // 33, 66, 100
  fakeoutStrictness: number;    // だまし回避レベル (0.1〜2.0)
  
  // 利確
  trailingStopWidth: number;   // pips単位
  splitTakeProfitRatio: number; // 分割利確の割合
  earlyExitThreshold: number;  // 逃げ足の速さスコア (0-100)
  
  // ロット・リスク
  riskMultiplier: number;      // ロット倍率補正 (0.5〜1.5)
  maxDailyDrawdownAllowed: number; // 1.0〜5.0%
  
  // 執行
  maxSpreadAllowed: number;    // pips単位
  maxSlippageAllowed: number;  // pips単位
  
  // レジーム判定
  regimeSensitivity: number;   // 判定の敏感さ (0.5〜2.0)
  
  updatedAt: string;
}

/**
 * 変更履歴とA/Bテスト管理
 */
export interface FXTuningLog {
  id: string;
  userId: string;
  changeReason: string;
  oldConfig: Partial<FXTuningConfig>;
  newConfig: Partial<FXTuningConfig>;
  appliedAt: string;
  
  // A/Bテスト結果 (適用後の追跡データ)
  performanceDelta?: {
    winRate: number;      // %
    expectedValue: number; // pips
    drawdown: number;     // %
    isSuccessful: boolean;
  };
}
