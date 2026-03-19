import { AssetCalculated } from "@/types";
import { ChartDataPoint } from "./chartUtils";

export interface PerformanceMetrics {
  winRate: number;
  averageReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  totalTrades: number;
  realizedProfit: number;
}

export const getPerformanceMetrics = (
  assets: AssetCalculated[],
  trendData: ChartDataPoint[]
): PerformanceMetrics => {
  // 1. 勝率 & 平均リターン
  let winCount = 0;
  let totalReturn = 0;
  let totalProfit = 0;
  const validAssets = assets.filter((a) => a.averageCost > 0 && a.quantity > 0);
  
  if (validAssets.length > 0) {
    validAssets.forEach((asset) => {
      if (asset.profitAndLoss > 0) winCount++;
      totalReturn += asset.profitPercentage;
      totalProfit += asset.profitAndLoss;
    });
  }
  
  const winRate = validAssets.length > 0 ? (winCount / validAssets.length) * 100 : 0;
  const averageReturn = validAssets.length > 0 ? totalReturn / validAssets.length : 0;
  const totalTrades = validAssets.length; // クライアント側での簡易集計
  const realizedProfit = totalProfit; // 簡易

  // 2. 最大ドローダウン & トレンドボラティリティ
  let maxDrawdown = 0;
  let peak = 0;
  
  const dailyReturns: number[] = [];
  
  if (trendData.length > 1) {
    for (let i = 0; i < trendData.length; i++) {
      const val = trendData[i].value;
      if (val > peak) peak = val;
      const drawdown = peak > 0 ? ((peak - val) / peak) * 100 : 0;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      
      if (i > 0) {
        const prevVal = trendData[i - 1].value;
        const dailyRet = prevVal > 0 ? (val - prevVal) / prevVal : 0;
        dailyReturns.push(dailyRet);
      }
    }
  }

  // 3. 簡易シャープレシオ (Risk-Free Rate = 0%)
  let sharpeRatio = 0;
  if (dailyReturns.length > 0) {
    const avgDailyReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
    // 分散
    const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgDailyReturn, 2), 0) / dailyReturns.length;
    const stdDev = Math.sqrt(variance);
    
    // 年率換算 (252営業日想定)
    const annualizedReturn = avgDailyReturn * 252;
    const annualizedVol = stdDev * Math.sqrt(252);
    
    sharpeRatio = annualizedVol > 0 ? annualizedReturn / annualizedVol : 0;
  } else {
    // トレンドデータがない場合の簡易フォールバック
    sharpeRatio = averageReturn > 0 ? averageReturn / 15 : 0;
  }

  return {
    winRate,
    averageReturn,
    maxDrawdown,
    sharpeRatio,
    totalTrades,
    realizedProfit,
  };
};

export const getMetricComment = (type: keyof PerformanceMetrics, value: number): string => {
  switch (type) {
    case "winRate":
      if (value >= 70) return "極めて優秀な勝率です";
      if (value >= 50) return "安定した銘柄選定です";
      return "見直しを推奨します";
    case "averageReturn":
      if (value >= 20) return "非常に高いリターン水準";
      if (value >= 5) return "着実に成長しています";
      return "やや伸び悩んでいます";
    case "maxDrawdown":
      if (value <= 10) return "優れたリスク耐性です";
      if (value <= 20) return "一般的な下落幅です";
      return "下落リスクに注意して下さい";
    case "sharpeRatio":
      if (value >= 1.5) return "非常に効率的な運用です";
      if (value >= 1.0) return "バランスの良い運用です";
      if (value > 0) return "まずまずのリターン効率";
      return "リスクに見合っていません";
    default:
      return "";
  }
};

export interface AssetRisk {
  assetId: string;
  name: string;
  riskScore: number; // 0-100
  riskLevel: "Low" | "Moderate" | "High" | "Danger";
  contribution: number; // % of total portfolio
}

export interface PortfolioRisk {
  overallScore: number; // 0-100
  overallLevel: "Safe" | "Moderate" | "HighRisk" | "Critical";
  assetRisks: AssetRisk[];
  highRiskAssets: AssetRisk[];
}

const CATEGORY_BASE_RISK: Record<string, number> = {
  "仮想通貨": 85,
  "FX": 65,
  "株": 50,
  "投資信託": 30,
};

export const calculatePortfolioRisk = (assets: AssetCalculated[]): PortfolioRisk => {
  const totalValue = assets.reduce((sum, a) => sum + Math.max(0, a.evaluatedValue), 0);
  
  if (totalValue === 0 || assets.length === 0) {
    return { overallScore: 0, overallLevel: "Safe", assetRisks: [], highRiskAssets: [] };
  }

  const assetRisks = assets.map(asset => {
    // 1. 各クラスの基本ボラティリティリスク
    const baseRisk = CATEGORY_BASE_RISK[asset.category] || 50;
    
    // 2. 評価損を抱えている場合は短期リスク上昇とみなしてペナルティ加算
    let penalty = 0;
    if (asset.profitPercentage < 0) {
      penalty = Math.min(30, Math.abs(asset.profitPercentage)); // 最大30ポイント加算
    }
    
    const riskScore = Math.min(100, Math.max(0, baseRisk + penalty));
    
    // 3. ポートフォリオ全体に対する構成比率
    const evalValue = Math.max(0, asset.evaluatedValue);
    const contribution = evalValue / totalValue;
    
    let riskLevel: AssetRisk["riskLevel"] = "Low";
    if (riskScore >= 80) riskLevel = "Danger";
    else if (riskScore >= 60) riskLevel = "High";
    else if (riskScore >= 40) riskLevel = "Moderate";
    
    return {
      assetId: asset.id,
      name: asset.name,
      riskScore,
      riskLevel,
      contribution
    };
  });

  // ポートフォリオ全体のリスクスコア（加重平均）
  const overallScore = assetRisks.reduce((sum, ar) => sum + (ar.riskScore * ar.contribution), 0);
  
  let overallLevel: PortfolioRisk["overallLevel"] = "Safe";
  if (overallScore >= 75) overallLevel = "Critical";
  else if (overallScore >= 55) overallLevel = "HighRisk";
  else if (overallScore >= 35) overallLevel = "Moderate";

  // スコアが70以上（危険水域）かつ保有割合が0より大きい資産を警告対象にする
  const highRiskAssets = assetRisks.filter(ar => ar.riskScore >= 70 && ar.contribution > 0);
  
  // 影響度が大きい順にソート
  highRiskAssets.sort((a, b) => b.contribution - a.contribution);

  return {
    overallScore,
    overallLevel,
    assetRisks,
    highRiskAssets
  };
};

export interface AssetOptimization {
  category: string;
  currentRatio: number; // 0-100
  targetRatio: number; // 0-100
  differenceValue: number; // プラスは過剰、マイナスは不足
  status: "Excess" | "Deficit" | "Optimal";
  actionText: string;
}

// モデルポートフォリオ（標準的な理想配分 %）
const TARGET_PORTFOLIO: Record<string, number> = {
  "株": 40,
  "投資信託": 40,
  "FX": 10,
  "仮想通貨": 10,
};

export const calculateOptimization = (assets: AssetCalculated[]): AssetOptimization[] => {
  const totalValue = assets.reduce((sum, a) => sum + Math.max(0, a.evaluatedValue), 0);
  
  if (totalValue === 0) return [];

  // カテゴリごとの合計を算出
  const categoryTotals: Record<string, number> = {
    "株": 0,
    "投資信託": 0,
    "FX": 0,
    "仮想通貨": 0,
  };
  
  assets.forEach(a => {
    if (categoryTotals[a.category] !== undefined) {
      categoryTotals[a.category] += Math.max(0, a.evaluatedValue);
    } else {
      categoryTotals[a.category] = Math.max(0, a.evaluatedValue);
    }
  });

  const optimizations: AssetOptimization[] = [];

  for (const [category, targetRatio] of Object.entries(TARGET_PORTFOLIO)) {
    const currentValue = categoryTotals[category] || 0;
    const currentRatio = (currentValue / totalValue) * 100;
    const targetValue = totalValue * (targetRatio / 100);
    const differenceValue = currentValue - targetValue;
    
    const diffRatio = currentRatio - targetRatio;
    let status: AssetOptimization["status"] = "Optimal";
    
    // ±5%以上乖離している場合にリバランスを提案
    if (diffRatio > 5) status = "Excess";
    else if (diffRatio < -5) status = "Deficit";

    let actionText = "適正なバランスです。現在の比率を維持してください。";
    if (status === "Excess") {
      actionText = `比率が過剰です。約 ¥${Math.abs(Math.round(differenceValue)).toLocaleString()} 分の利益確定（売却）を検討してください。`;
    } else if (status === "Deficit") {
      actionText = `比率が不足しています。約 ¥${Math.abs(Math.round(differenceValue)).toLocaleString()} 分の買い増しを推奨します。`;
    }

    optimizations.push({
      category,
      currentRatio,
      targetRatio,
      differenceValue,
      status,
      actionText
    });
  }

  // 表示用に、乖離が大きい順（絶対値）にソート
  return optimizations.sort((a, b) => Math.abs(b.differenceValue) - Math.abs(a.differenceValue));
};

export interface InvestmentAdvice {
  marketStatus: string;
  portfolioEvaluation: string;
  actionProposal: string;
}

export const generateInvestmentAdvice = (
  performance: PerformanceMetrics,
  risk: PortfolioRisk,
  optimizations: AssetOptimization[]
): InvestmentAdvice => {
  // 1. 市場・資産状況
  let marketStatus = "資産は安定して推移しています。";
  if (performance.averageReturn > 10) {
    marketStatus = `Average Returnが +${performance.averageReturn.toFixed(1)}% と非常に好調です。現在の相場トレンドにうまく乗れており、確かな利益を生み出しています。`;
  } else if (performance.averageReturn > 0) {
    marketStatus = `Average Returnが +${performance.averageReturn.toFixed(1)}% とプラス圏を維持しており、着実で底堅い運用ができています。`;
  } else if (performance.averageReturn > -5) {
    marketStatus = `Average Returnは若干のマイナス（${performance.averageReturn.toFixed(1)}%）ですが、許容範囲内での健全な調整局面と考えられます。`;
  } else {
    marketStatus = `全体的な評価損（${performance.averageReturn.toFixed(1)}%）が目立ちます。下落トレンドが続いているため、保有銘柄の見直しや損切りラインの再確認が必要です。`;
  }

  // 2. ポートフォリオ評価
  let portfolioEvaluation = "分散の効いた良いバランスです。";
  if (risk.overallLevel === "Critical" || risk.overallLevel === "HighRisk") {
    portfolioEvaluation = `ポートフォリオのリスクスコアが ${Math.round(risk.overallScore)} と高止まりしています。ハイボラティリティな資産への集中投資になっている可能性があるため、急落時の痛手に注意が必要です。`;
  } else if (risk.overallLevel === "Safe") {
    portfolioEvaluation = `リスクスコアは ${Math.round(risk.overallScore)} と非常に抑えられており、暴落耐性が高い安全性重視のディフェンシブな構成が組まれています。`;
  } else {
    portfolioEvaluation = `リスクスコアは ${Math.round(risk.overallScore)} と適正水準にあります。過度なリスクを取らない健全なポートフォリオと言えます。`;
  }

  // 3. 改善アクション提案
  let actionProposal = "現在のところ、大規模なリバランスの緊急性はありません。このまま市場の動向を注視してください。";
  if (optimizations.length > 0) {
    // 乖離額が一番大きいものを取得（ソート済みなので先頭）
    const topOpt = optimizations[0];
    if (topOpt.status !== "Optimal") {
      const direction = topOpt.status === "Excess" ? "過剰" : "不足";
      const action = topOpt.status === "Excess" ? "の一部売却" : "の積極的な買い増し";
      actionProposal = `最も優先すべき最適化アクション：現在『${topOpt.category}』の比率が${direction}しています。理想のバランスに近づけるため、${topOpt.category}${action}を検討し、リバランスを行うことを推奨します。`;
    }
  }

  return { marketStatus, portfolioEvaluation, actionProposal };
};

