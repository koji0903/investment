/**
 * 意思決定エンジンの型定義
 */

export type EVLabel = "positive" | "neutral" | "negative";
export type RiskMode = "normal" | "caution" | "risk_off";
export type EntryPermission = "allow" | "caution" | "restrict";

export interface Scenario {
  name: string;
  probability: number; // 0-1 (e.g., 0.6)
  expectedProfit: number; // % (e.g., 15)
  description?: string;
}

export interface InvestmentDecision {
  ticker: string; // または pairCode
  
  // 1. 期待値計算
  winRate: number;      // 0-1
  avgProfit: number;    // %
  avgLoss: number;      // %
  expectedValue: number; // (winRate * avgProfit) - ((1 - winRate) * avgLoss)
  evLabel: EVLabel;
  evComment: string;
  
  // 2. シナリオ分析
  scenarios: Scenario[];
  bestScenario: Scenario;
  worstScenario: Scenario;
  
  // 3. ポートフォリオリスク
  portfolioRiskScore: number; // 0-100
  exposureFlags: string[];
  entryPermission: EntryPermission;
  
  // 4. ドローダウン制御
  currentDrawdown: number; // %
  riskMode: RiskMode;
  allowedRiskLevel: number; // 許容損失額 or リスク許容度
  
  // 5. 利益最大化
  takeProfitStrategy: string;
  holdOrExit: "hold" | "exit" | "partial_exit";
  trailingStopLevel: number; // 価格 or %
  
  updatedAt: string;
}

export interface DecisionEngineState {
  globalRiskMode: RiskMode;
  totalExposure: number;
  lastDecisionAt: string;
}
