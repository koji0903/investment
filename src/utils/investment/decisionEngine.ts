import { 
  InvestmentDecision, 
  Scenario, 
  EVLabel, 
  RiskMode, 
  EntryPermission 
} from "@/types/decision";

/**
 * 意思決定エンジン・ユーティリティ
 */

// 1. 期待値（Expected Value）計算
export function calculateEV(winRate: number, avgProfit: number, avgLoss: number): { ev: number; label: EVLabel; comment: string } {
  const ev = (winRate * avgProfit) - ((1 - winRate) * Math.abs(avgLoss));
  
  let label: EVLabel = "neutral";
  let comment = "";

  if (ev > 5) {
    label = "positive";
    comment = "期待値は十分にプラスです。統計的に優位性のあるトレード機会です。";
  } else if (ev < 0) {
    label = "negative";
    comment = "期待値がマイナスです。この条件下でのエントリーは避けるべきです。";
  } else {
    label = "neutral";
    comment = "期待値が低く、手数料やスプレッドを考慮すると優位性が乏しい状態です。";
  }

  return { ev, label, comment };
}

// 2. シナリオ分岐分析
export function generateScenarios(baseProfit: number, baseLoss: number): Scenario[] {
  return [
    { name: "上昇成功", probability: 0.4, expectedProfit: baseProfit, description: "想定通りのトレンド継続" },
    { name: "だまし・微損", probability: 0.4, expectedProfit: baseLoss * 0.5, description: "ブレイクアウト失敗による小幅な逆行" },
    { name: "急落・損切り", probability: 0.2, expectedProfit: baseLoss, description: "トレンド転換による損切りライン到達" }
  ];
}

// 3. ポートフォリオリスク管理 & 4. ドローダウン制御
export function evaluateOverallRisk(
  currentDrawdown: number, 
  sectorExposure: number, 
  totalRisk: number
): { riskMode: RiskMode; entryPermission: EntryPermission; allowedRiskLevel: number; score: number } {
  let riskMode: RiskMode = "normal";
  let entryPermission: EntryPermission = "allow";
  let score = 80;

  // ドローダウン量による制御
  if (currentDrawdown > 5) {
    riskMode = "risk_off";
    entryPermission = "restrict";
    score -= 40;
  } else if (currentDrawdown > 2) {
    riskMode = "caution";
    entryPermission = "caution";
    score -= 20;
  }

  // セクター・アセットの偏りによる制限
  if (sectorExposure > 30) {
    entryPermission = "caution";
    score -= 15;
  }

  const allowedRiskLevel = riskMode === "risk_off" ? 0.5 : riskMode === "caution" ? 1.0 : 2.0; // 資金の%

  return { riskMode, entryPermission, allowedRiskLevel, score };
}

// 5. 利益最大化ロジック
export function getProfitStrategy(trendStrength: number): { strategy: string; holdOrExit: "hold" | "exit" | "partial_exit" } {
  if (trendStrength > 70) {
    return { strategy: "トレーリングストップで利益追随", holdOrExit: "hold" };
  } else if (trendStrength > 40) {
    return { strategy: "一部利確（30-50%）を推奨", holdOrExit: "partial_exit" };
  }
  return { strategy: "目標値到達、全利確を検討", holdOrExit: "exit" };
}

/**
 * 総合意思決定の算出
 */
export function calculateDecision(
  ticker: string,
  input: {
    winRate: number;
    targetPrice: number;
    stopPrice: number;
    currentPrice: number;
    currentDrawdown: number;
    sectorExposure: number;
    trendStrength: number;
  }
): InvestmentDecision {
  const profitPct = ((input.targetPrice / input.currentPrice) - 1) * 100;
  const lossPct = ((input.stopPrice / input.currentPrice) - 1) * 100;

  const evResult = calculateEV(input.winRate, profitPct, lossPct);
  const scenarios = generateScenarios(profitPct, lossPct);
  const riskResult = evaluateOverallRisk(input.currentDrawdown, input.sectorExposure, 0);
  const profitResult = getProfitStrategy(input.trendStrength);

  return {
    ticker,
    winRate: input.winRate,
    avgProfit: profitPct,
    avgLoss: lossPct,
    expectedValue: evResult.ev,
    evLabel: evResult.label,
    evComment: evResult.comment,
    scenarios,
    bestScenario: scenarios[0],
    worstScenario: scenarios[2],
    portfolioRiskScore: riskResult.score,
    exposureFlags: input.sectorExposure > 30 ? ["Sector Concentration"] : [],
    entryPermission: riskResult.entryPermission,
    currentDrawdown: input.currentDrawdown,
    riskMode: riskResult.riskMode,
    allowedRiskLevel: riskResult.allowedRiskLevel,
    takeProfitStrategy: profitResult.strategy,
    holdOrExit: profitResult.holdOrExit,
    trailingStopLevel: input.currentPrice * (1 - 0.03), // 簡易的に現在値から3%下
    updatedAt: new Date().toISOString()
  };
}
