import { AssetCalculated } from "@/types";
import { ChartDataPoint } from "./chartUtils";

export interface PerformanceMetrics {
  winRate: number;
  averageReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

export const getPerformanceMetrics = (
  assets: AssetCalculated[],
  trendData: ChartDataPoint[]
): PerformanceMetrics => {
  // 1. 勝率 & 平均リターン
  let winCount = 0;
  let totalReturn = 0;
  const validAssets = assets.filter((a) => a.averageCost > 0 && a.quantity > 0);
  
  if (validAssets.length > 0) {
    validAssets.forEach((asset) => {
      if (asset.profitAndLoss > 0) winCount++;
      totalReturn += asset.profitPercentage;
    });
  }
  
  const winRate = validAssets.length > 0 ? (winCount / validAssets.length) * 100 : 0;
  const averageReturn = validAssets.length > 0 ? totalReturn / validAssets.length : 0;

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

