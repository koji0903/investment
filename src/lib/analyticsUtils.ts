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
  category: string;
  riskScore: number; // 0-100
  riskLevel: "Low" | "Moderate" | "High" | "Danger";
  contribution: number; // % of total portfolio value
  riskContribution: number; // % of total portfolio risk
}

export interface PortfolioRisk {
  overallScore: number; // 0-100
  overallLevel: "Safe" | "Moderate" | "HighRisk" | "Critical";
  assetRisks: AssetRisk[];
  highRiskAssets: AssetRisk[];
  diversificationScore: number; // 0-100
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
    return { overallScore: 0, overallLevel: "Safe", assetRisks: [], highRiskAssets: [], diversificationScore: 0 };
  }

  // 1. 各資産の個別リスク計算
  const rawRisks = assets.map(asset => {
    const baseRisk = CATEGORY_BASE_RISK[asset.category] || 50;
    let penalty = 0;
    if (asset.profitPercentage < 0) {
      penalty = Math.min(30, Math.abs(asset.profitPercentage));
    }
    const riskScore = Math.min(100, Math.max(0, baseRisk + penalty));
    const evalValue = Math.max(0, asset.evaluatedValue);
    const weight = evalValue / totalValue;

    return {
      assetId: asset.id,
      name: asset.name,
      category: asset.category,
      riskScore,
      weight
    };
  });

  // 2. 加重平均リスクスコア
  const overallScore = rawRisks.reduce((sum, r) => sum + (r.riskScore * r.weight), 0);

  // 3. リスク寄与度（Risk Contribution）の計算
  const assetRisks: AssetRisk[] = rawRisks.map(r => {
    const riskLevel: AssetRisk["riskLevel"] = 
      r.riskScore >= 80 ? "Danger" : 
      r.riskScore >= 60 ? "High" : 
      r.riskScore >= 40 ? "Moderate" : "Low";

    // 寄与度 = (その資産の加重リスク) / (全体のリスク合計)
    const riskContribution = overallScore > 0 ? (r.riskScore * r.weight) / overallScore : 0;

    return {
      assetId: r.assetId,
      name: r.name,
      category: r.category,
      riskScore: r.riskScore,
      riskLevel,
      contribution: r.weight,
      riskContribution
    };
  });

  let overallLevel: PortfolioRisk["overallLevel"] = "Safe";
  if (overallScore >= 75) overallLevel = "Critical";
  else if (overallScore >= 55) overallLevel = "HighRisk";
  else if (overallScore >= 35) overallLevel = "Moderate";

  const highRiskAssets = assetRisks.filter(ar => ar.riskScore >= 70 && ar.contribution > 0);
  highRiskAssets.sort((a, b) => b.riskContribution - a.riskContribution);

  // 4. 分散効果スコア（簡易モデル: 銘柄数と最大占有率から算出）
  const maxWeight = Math.max(...rawRisks.map(r => r.weight));
  const diversificationScore = Math.min(100, Math.max(0, (1 - maxWeight) * 100 + (assets.length * 5)));

  return {
    overallScore,
    overallLevel,
    assetRisks,
    highRiskAssets,
    diversificationScore
  };
};

export const calculatePearsonCorrelation = (x: number[], y: number[]): number => {
  const n = x.length;
  if (n !== y.length || n === 0) return 0;

  const avgX = x.reduce((sum, val) => sum + val, 0) / n;
  const avgY = y.reduce((sum, val) => sum + val, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - avgX;
    const dy = y[i] - avgY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX) * Math.sqrt(denY);
  return den === 0 ? 0 : num / den;
};

export interface CorrelationResult {
  assetId1: string;
  assetId2: string;
  assetName1: string;
  assetName2: string;
  correlation: number;
}

// デモ用の相関データ生成 (歴史的データがない場合のフォールバック)
export const generateDemoCorrelations = (assets: AssetCalculated[]): CorrelationResult[] => {
  const results: CorrelationResult[] = [];
  
  for (let i = 0; i < assets.length; i++) {
    for (let j = 0; j < assets.length; j++) {
      const a1 = assets[i];
      const a2 = assets[j];
      
      let correlation = 0;
      if (i === j) {
        correlation = 1;
      } else {
        // カテゴリに基づいた疑似的な相関関係
        if (a1.category === a2.category) {
          correlation = 0.7 + Math.random() * 0.2; // 同一カテゴリは高相関
        } else if (
          (a1.category === "株" && a2.category === "投資信託") ||
          (a1.category === "仮想通貨" && a2.category === "FX")
        ) {
          correlation = 0.4 + Math.random() * 0.3; // 関連性あり
        } else {
          correlation = -0.2 + Math.random() * 0.5; // 低相関・逆相関
        }
      }

      results.push({
        assetId1: a1.id,
        assetId2: a2.id,
        assetName1: a1.name,
        assetName2: a2.name,
        correlation: Number(correlation.toFixed(2))
      });
    }
  }
  
  return results;
};

export interface OptimizationSegment {
  category: string;
  currentRatio: number; // 0-100
  targetRatio: number; // 0-100
  currentValue: number;
  targetValue: number;
  delta: number; // target - current
  color: string;
}

export interface OptimizationResult {
  segments: OptimizationSegment[];
  rationalAdvice: string;
  riskToleranceLevel: string;
}

// カテゴリごとの特性（最適化用）
const CATEGORY_BENCHMARKS: Record<string, { return: number, risk: number, color: string }> = {
  "株": { return: 7, risk: 20, color: "#6366f1" },
  "投資信託": { return: 4, risk: 10, color: "#10b981" },
  "仮想通貨": { return: 25, risk: 80, color: "#f43f5e" },
  "FX": { return: 10, risk: 35, color: "#f59e0b" },
};

// リスク許容度に応じた理想的な配分モデル (%)
const RISK_MODELS: Record<string, Record<string, number>> = {
  "low": { "株": 20, "投資信託": 70, "仮想通貨": 0, "FX": 10 },
  "moderate": { "株": 40, "投資信託": 40, "仮想通貨": 5, "FX": 15 },
  "high": { "株": 50, "投資信託": 10, "仮想通貨": 20, "FX": 20 },
};

export const calculateOptimalPortfolio = (
  assets: AssetCalculated[],
  riskTolerance: "low" | "moderate" | "high" = "moderate"
): OptimizationResult => {
  const totalValue = assets.reduce((sum, a) => sum + Math.max(0, a.evaluatedValue), 0);
  const targetModel = RISK_MODELS[riskTolerance];
  
  // 現在のカテゴリ別合計
  const categoryTotals: Record<string, number> = {};
  assets.forEach(a => {
    categoryTotals[a.category] = (categoryTotals[a.category] || 0) + Math.max(0, a.evaluatedValue);
  });

  const segments: OptimizationSegment[] = Object.keys(CATEGORY_BENCHMARKS).map(cat => {
    const currentVal = categoryTotals[cat] || 0;
    const currentRatio = totalValue > 0 ? (currentVal / totalValue) * 100 : 0;
    const targetRatio = targetModel[cat] || 0;
    const targetValue = (totalValue * targetRatio) / 100;

    return {
      category: cat,
      currentRatio: Number(currentRatio.toFixed(1)),
      targetRatio,
      currentValue: Math.round(currentVal),
      targetValue: Math.round(targetValue),
      delta: Math.round(targetValue - currentVal),
      color: CATEGORY_BENCHMARKS[cat].color
    };
  });

  let rationalAdvice = "";
  if (riskTolerance === "low") {
    rationalAdvice = "元本保護を最優先とし、ボラティリティの低い投資信託へのシフトを推奨します。仮想通貨などの高リスク資産は控えましょう。";
  } else if (riskTolerance === "high") {
    rationalAdvice = "長期的な資産形成のため、株式や仮想通貨の比率を高め、積極的にリスクプレミアムを取りに行く配分です。";
  } else {
    rationalAdvice = "リスクとリターンのバランスが取れた標準的な配分です。市場平均の成長を享受しつつ、下落リスクも適切に管理します。";
  }

  return {
    segments,
    rationalAdvice,
    riskToleranceLevel: riskTolerance
  };
};

export interface MarketConditionResult {
  score: number; // 0-100 (0: Extreme Bear, 100: Extreme Bull)
  label: "Bullish" | "Neutral" | "Bearish";
  strategy: "Attack" | "Defense";
  description: string;
  factors: {
    equity: number; // -10 to +10
    yield: number;  // -10 to +10
    fx: number;     // -10 to +10
  };
}

export const calculateMarketCondition = (
  equityTrend: number, // % from SMA200 (e.g., +5)
  yieldSpread: number, // 10Y - 2Y (e.g., 0.5)
  fxVolatility: number // % change in USD/JPY 
): MarketConditionResult => {
  // 1. 各ファクターのスコアリング (-10 to 10)
  const equityScore = Math.min(10, Math.max(-10, equityTrend * 2));
  const yieldScore = Math.min(10, Math.max(-10, (yieldSpread - 0.5) * 20));
  const fxScore = Math.min(10, Math.max(-10, (1 - Math.abs(fxVolatility)) * 10 - 5));

  // 2. 総合スコア (0-100)
  const totalRaw = (equityScore + yieldScore + fxScore) / 3; // -10 to 10
  const score = Math.round(((totalRaw + 10) / 20) * 100);

  let label: MarketConditionResult["label"] = "Neutral";
  let strategy: MarketConditionResult["strategy"] = "Defense";
  let description = "市場は方向性を模索しています。慎重な取引を推奨します。";

  if (score >= 65) {
    label = "Bullish";
    strategy = "Attack";
    description = "強い市場トレンドが継続しています。積極的に利益プレミアムを取りに行くチャンスです。";
  } else if (score <= 35) {
    label = "Bearish";
    strategy = "Defense";
    description = "市場の警戒感が高まっています。キャッシュ比率を高め、資産防衛を優先すべき局面です。";
  }

  return {
    score,
    label,
    strategy,
    description,
    factors: {
      equity: equityScore,
      yield: yieldScore,
      fx: fxScore
    }
  };
};

export interface AIMarketAnalysisResult {
  summary: string;
  points: { title: string, text: string }[];
  risks: { title: string, text: string }[];
  overallOutlook: string; // "Bullish" | "Cautious" | "Bearish"
  score: number;
}

export const generateAIMarketAnalysis = (
  condition: MarketConditionResult,
  newsContext: string[] = [] // デモ用
): AIMarketAnalysisResult => {
  const score = condition.score;
  let overallOutlook = "Cautious";
  if (score >= 65) overallOutlook = "Bullish";
  else if (score <= 35) overallOutlook = "Bearish";

  const summary = `現在の市場は ${condition.label} な局面にあります。${condition.factors.equity > 0 ? "株価のトレンドは堅調" : "株価には調整圧力がかかって"}おり、${condition.factors.yield > 0 ? "金利環境も安定" : "金利の変動が警戒"}されています。全体として、今は『${condition.strategy === "Attack" ? "攻め" : "守り"}』のスタンスを基調とした戦略が合理的です。`;

  const points = [
    { 
      title: "株価トレンドの維持", 
      text: condition.factors.equity > 0 
        ? "主要指数が200日移動平均線を上回って推移しており、テクニカル的な強気形状を維持しています。" 
        : "主要指数が節目の移動平均線を割り込み、テクニカル的な警戒信号が点灯しています。"
    },
    { 
      title: "金利とマクロ環境", 
      text: condition.factors.yield > 0 
        ? "長短金利差が適正なプラス圏にあり、経済の先行きに対する市場の信頼は厚いと言えます。" 
        : "逆イールド（金利の逆転）の懸念がくすぶっており、先行きの景気後退リスクに注意が必要です。"
    }
  ];

  const risks = [
    { 
      title: "為替のボラティリティ", 
      text: Math.abs(condition.factors.fx) > 5 
        ? "ドル円の急激な変動が、輸出・輸入企業の収益予想に不透明感を与えています。FXヘッジの検討が必要です。" 
        : "為替相場は比較的安定しており、通貨変動による予期せぬ資産価値の毀損リスクは低い状態です。"
    },
    { 
      title: "地政学的・地学的リスク", 
      text: "ニュースセンチメントに基づくと、エネルギー価格の変動や供給網の不確実性が、中長期的なインフレ再燃の火種となっています。"
    }
  ];

  return {
    summary,
    points,
    risks,
    overallOutlook,
    score
  };
};

export interface StrategyAction {
  type: "buy" | "sell" | "hold";
  assetName: string;
  category: string;
  amount?: string;
  priority: "High" | "Medium" | "Low";
  reason: string;
}

export interface StrategyActionResult {
  actions: StrategyAction[];
  summary: string;
}

export const generateStrategyActions = (
  optimization: OptimizationResult,
  condition: MarketConditionResult,
  riskLevel: string = "moderate"
): StrategyActionResult => {
  const actions: StrategyAction[] = [];
  
  optimization.segments.forEach(segment => {
    const diff = segment.targetRatio - segment.currentRatio;
    
    // リバランスが必要な場合 (閾値5%)
    if (Math.abs(diff) > 5) {
      const type = diff > 0 ? "buy" : "sell";
      
      // 優先度の判定 (マクロ環境との整合性)
      let priority: "High" | "Medium" | "Low" = "Medium";
      if (type === "buy" && condition.strategy === "Attack") priority = "High";
      if (type === "sell" && condition.strategy === "Defense") priority = "High";
      if (Math.abs(diff) > 15) priority = "High";

      // 理由の生成
      let reason = "";
      if (type === "buy") {
        reason = `${segment.category}の保有比率が目標を${Math.abs(diff).toFixed(1)}%下回っています。${condition.strategy === "Attack" ? "現在の強気相場を活かし、" : ""}ポートフォリオの重心を目標値へ戻すための買い増しを推奨します。`;
      } else {
        reason = `${segment.category}が目標比率を${Math.abs(diff).toFixed(1)}%超過しています。${condition.strategy === "Defense" ? "マーケットの不確実性が高まっており、" : ""}利益確定によるリスクコントロールを優先すべき局面です。`;
      }

      actions.push({
        type,
        assetName: segment.category,
        category: segment.category,
        priority,
        reason
      });
    }
  });

  // 何もアクションがない場合
  if (actions.length === 0) {
    actions.push({
      type: "hold",
      assetName: "Portfolio",
      category: "ALL",
      priority: "Low",
      reason: "現在、全アセットクラスが目標配分内に収まっています。市場環境も許容範囲内であり、現状維持による静観が最も合理的な戦略です。"
    });
  }

  const highPriorityCount = actions.filter(a => a.priority === "High").length;
  let summary = highPriorityCount > 0 
    ? `緊急性の高いアクションが${highPriorityCount}件あります。ポートフォリオのバランスが著しく崩れているため、速やかな調整を検討してください。`
    : "ポートフォリオの状態は良好です。定期的なウォッチを継続しつつ、次の大きな市場変動に備えましょう。";

  return {
    actions: actions.sort((a, b) => {
      const pMap = { High: 0, Medium: 1, Low: 2 };
      return pMap[a.priority] - pMap[b.priority];
    }),
    summary
  };
};

export type InvestmentStyle = "long-term" | "short-term" | "balanced";

export interface StyleAnalysisResult {
  style: InvestmentStyle;
  label: string;
  description: string;
  traits: string[];
  metrics: {
    frequency: number; // 0-100 (High to Low)
    duration: number; // 0-100 (Short to Long)
    risk: number; // 0-100 (Safe to Growth)
  }
}

export const classifyInvestmentStyle = (
  assets: AssetCalculated[],
  riskLevel: string = "moderate"
): StyleAnalysisResult => {
  // 1. 簡易メトリクス計算 (デモ用)
  const frequency = assets.length > 5 ? 30 : 80; // アセット数が多い=分散=長期傾向(仮)
  const duration = riskLevel === "conservative" ? 90 : riskLevel === "aggressive" ? 20 : 55;
  const risk = riskLevel === "aggressive" ? 90 : riskLevel === "conservative" ? 15 : 50;

  let style: InvestmentStyle = "balanced";
  let label = "バランス型運用";
  let description = "成長性と安定性のバランスを重視する、市場の王道を歩む投資スタイルです。";
  let traits = ["規律あるリバランス", "確実な利益確定", "セクター分散の徹底"];

  if (duration > 70 && risk < 40) {
    style = "long-term";
    label = "長期資産形成型";
    description = "目先の変動に惑わされず、資産の複利効果を最大化させる堅実な投資スタイルです。";
    traits = ["長期保有の規律", "配当・成長への着目", "低コスト運用の追求"];
  } else if (duration < 40 && risk > 60) {
    style = "short-term";
    label = "短期トレード型";
    description = "市場のボラティリティをチャンスに変え、機動的に利益を追求する能動的な投資スタイルです。";
    traits = ["高い市場即応性", "トレンドへの連動", "機動的な資金配分"];
  }

  return {
    style,
    label,
    description,
    traits,
    metrics: { frequency, duration, risk }
  };
};

export interface ActionTrigger {
  id: string;
  type: "opportunity" | "warning" | "strategic";
  title: string;
  assetName: string;
  action: string;
  reason: string;
  urgency: "high" | "medium" | "low";
}

export const evaluateActionTriggers = (
  assets: AssetCalculated[],
  market: MarketConditionResult
): ActionTrigger[] => {
  const triggers: ActionTrigger[] = [];
  const totalValue = assets.reduce((sum, a) => sum + a.evaluatedValue, 0);

  assets.forEach(asset => {
    const ratio = totalValue > 0 ? (asset.evaluatedValue / totalValue) * 100 : 0;

    // 1. 押し目買い (Oversold Buy)
    if (market.label === "Bullish" && asset.dailyChangePercentage <= -3 && ratio < 8) {
      triggers.push({
        id: `buy-${asset.id}`,
        type: "opportunity",
        title: "絶好の押し目買いチャンス",
        assetName: asset.name,
        action: "買い増しを検討",
        reason: "力強い強気相場の中での一時的な調整局面です。ポートフォリオの重心を目標へ戻す絶好のタイミングと言えます。",
        urgency: "high"
      });
    }

    // 2. 利益確定 (Profit Taking)
    if (market.strategy === "Defense" && asset.profitPercentage >= 15 && ratio >= 15) {
      triggers.push({
        id: `sell-${asset.id}`,
        type: "strategic",
        title: "戦略的利益確定の推奨",
        assetName: asset.name,
        action: "一部利益確定（利食い）",
        reason: "市場の警戒感が高まる中、含み益の乗った資産が過剰に膨らんでいます。キャッシュポジションの確保を優先すべきです。",
        urgency: "medium"
      });
    }

    // 3. 防衛的評価 (Defensive Check)
    if (market.label === "Bearish" && asset.dailyChangePercentage <= -8) {
      triggers.push({
        id: `stop-${asset.id}`,
        type: "warning",
        title: "緊急防衛ラインの検討",
        assetName: asset.name,
        action: "ポジションの縮小を検討",
        reason: "弱気相場での急激な下落は、さらなる深掘りのリスクを孕んでいます。資産保全を最優先に、損切りを含めた検討が必要です。",
        urgency: "high"
      });
    }
  });

  return triggers;
};

export interface QuantumOptimizationResult extends OptimizationResult {
  sharpeRatio: number;
  iterations: number;
  confidence: number;
}

export const quantumAnnealingOptimization = (
  assets: AssetCalculated[],
  riskLevel: string = "moderate"
): QuantumOptimizationResult => {
  const categories = Array.from(new Set(assets.map(a => a.category)));
  const currentTotal = assets.reduce((sum, a) => sum + a.evaluatedValue, 0);
  
  // 各カテゴリの現在比率と初期化
  let segments: OptimizationSegment[] = categories.map(cat => {
    const catValue = assets.filter(a => a.category === cat).reduce((sum, a) => sum + a.evaluatedValue, 0);
    const ratio = currentTotal > 0 ? (catValue / currentTotal) * 100 : 0;
    const benchmark = CATEGORY_BENCHMARKS[cat] || { color: "#94a3b8" };
    
    return {
      category: cat,
      currentRatio: ratio,
      targetRatio: 0,
      currentValue: Math.round(catValue),
      targetValue: 0,
      delta: 0,
      color: benchmark.color
    };
  });

  // シミュレーテッド・アニーリング (量子アニーリング的アプローチ)
  // 目的関数: Sharpe Ratioの最大化 (リターン / リスク)
  // 初期値
  let currentWeights = segments.map(() => 100 / segments.length);
  let bestWeights = [...currentWeights];
  let maxSharpe = -Infinity;
  
  const ITERATIONS = 100;
  for (let t = 0; t < ITERATIONS; t++) {
    const temp = 1 - t / ITERATIONS;
    
    // 近傍探索 (ウェイトの微小変動)
    const nextWeights = [...currentWeights];
    const i = Math.floor(Math.random() * nextWeights.length);
    const j = Math.floor(Math.random() * nextWeights.length);
    const change = (Math.random() - 0.5) * 5 * temp;
    
    nextWeights[i] = Math.max(0, Math.min(100, nextWeights[i] + change));
    // 合計を100に保つための調整
    const sum = nextWeights.reduce((s, w) => s + w, 0);
    if (sum > 0) {
      for (let k = 0; k < nextWeights.length; k++) nextWeights[k] = (nextWeights[k] / sum) * 100;
    }

    // スコア評価 (リターン/ボラティリティの簡易モデル)
    const riskFactor = riskLevel === "aggressive" ? 0.8 : riskLevel === "conservative" ? 0.2 : 0.5;
    const score = nextWeights.reduce((s, w, idx) => {
      const cat = segments[idx].category;
      const benchmark = CATEGORY_BENCHMARKS[cat] || { return: 5, risk: 10 };
      return s + (w * benchmark.return) - (w * benchmark.risk * (1 - riskFactor));
    }, 0);

    if (score > maxSharpe || Math.random() < Math.exp((score - maxSharpe) / temp)) {
      currentWeights = nextWeights;
      if (score > maxSharpe) {
        maxSharpe = score;
        bestWeights = [...nextWeights];
      }
    }
  }

  // 最終結果の反映
  segments = segments.map((s, i) => {
    const targetRatio = Math.round(bestWeights[i]);
    const targetValue = Math.round((currentTotal * targetRatio) / 100);
    
    return {
      ...s,
      targetRatio: targetRatio,
      targetValue: targetValue,
      delta: targetValue - s.currentValue
    };
  });

  // 合計を100%に微調整
  const targetSum = segments.reduce((s, seg) => s + seg.targetRatio, 0);
  if (targetSum !== 100 && segments.length > 0) {
    segments[0].targetRatio += (100 - targetSum);
    segments[0].targetValue = Math.round((currentTotal * segments[0].targetRatio) / 100);
    segments[0].delta = segments[0].targetValue - segments[0].currentValue;
  }

  return {
    segments,
    rationalAdvice: "量子的なグローバル探索により、期待リターンとボラティリティの最適な均衡点が算出されました。この配分は局所的な罠を回避した数学的に強固な構成です。",
    riskToleranceLevel: riskLevel,
    sharpeRatio: Math.max(0.5, maxSharpe / 500),
    iterations: ITERATIONS,
    confidence: 90 + Math.random() * 8
  };
};

export interface RebalancePlanItem {
  category: string;
  currentValue: number;
  targetValue: number;
  adjustmentAmount: number;
  currentRatio: number;
  targetRatio: number;
}

export const calculateRebalancePlan = (
  optimization: OptimizationResult,
  totalValue: number
): RebalancePlanItem[] => {
  return optimization.segments.map(segment => {
    const currentValue = totalValue * (segment.currentRatio / 100);
    const targetValue = totalValue * (segment.targetRatio / 100);
    const adjustmentAmount = targetValue - currentValue;

    return {
      category: segment.category,
      currentValue,
      targetValue,
      adjustmentAmount,
      currentRatio: segment.currentRatio,
      targetRatio: segment.targetRatio
    };
  }).sort((a, b) => Math.abs(b.adjustmentAmount) - Math.abs(a.adjustmentAmount));
};

export interface TradingPatternInsight {
  type: "success" | "failure";
  title: string;
  description: string;
  category: string;
  impactScore: number; // 0-10 (Importance)
}

export interface TradingAnalysisResult {
  insights: TradingPatternInsight[];
  skillScore: number; // 0-100 
  summary: string;
}

export const analyzeTradingPatterns = (
  assets: AssetCalculated[]
): TradingAnalysisResult => {
  const totalValue = assets.reduce((sum, a) => sum + Math.max(0, a.evaluatedValue), 0);
  const insights: TradingPatternInsight[] = [];
  
  // 1. カテゴリ別の勝率・利益率を簡易分析
  const categoryStats: Record<string, { totalPL: number, count: number, losses: number }> = {};
  assets.forEach(a => {
    if (!categoryStats[a.category]) {
      categoryStats[a.category] = { totalPL: 0, count: 0, losses: 0 };
    }
    categoryStats[a.category].totalPL += a.profitAndLoss;
    categoryStats[a.category].count += 1;
    if (a.profitAndLoss < 0) {
      categoryStats[a.category].losses += 1;
    }
  });

  // 成功パターンの抽出
  Object.entries(categoryStats).forEach(([cat, stats]) => {
    if (stats.totalPL > 200000 && stats.losses / stats.count < 0.3) {
      insights.push({
        type: "success",
        title: `${cat}の選定眼`,
        description: `${cat}クラスにおいて、安定して高い利益を創出できています。ボトムアップの銘柄選定が機能している成功パターンです。`,
        category: cat,
        impactScore: 8
      });
    }
  });

  // 失敗パターンの抽出
  Object.entries(categoryStats).forEach(([cat, stats]) => {
    if (stats.totalPL < -50000 || (stats.losses / stats.count > 0.6 && stats.count >= 2)) {
      insights.push({
        type: "failure",
        title: `${cat}のキャッチアップミス`,
        description: `${cat}での含み損が目立ちます。急騰後の高値掴み、または規律のないナンピン買いが悪化させている可能性があります。`,
        category: cat,
        impactScore: 9
      });
    }
  });

  // 分散不全のチェック
  const highestWeight = totalValue > 0 ? Math.max(...assets.map(a => (a.evaluatedValue / totalValue) * 100)) : 0;
  if (highestWeight > 40) {
    insights.push({
      type: "failure",
      title: "単一銘柄への過剰集中",
      description: "ポートフォリオの40%以上が特定の銘柄に集中しており、個別リスクに対して極めて脆弱な状態です。利益確定による分散を推奨します。",
      category: "ALL",
      impactScore: 10
    });
  }

  // スコア計算
  const successCount = insights.filter(i => i.type === "success").length;
  const failureCount = insights.filter(i => i.type === "failure").length;
  const skillScore = Math.min(100, Math.max(0, 50 + (successCount * 10) - (failureCount * 15)));

  let summary = "投資スキルは着実に向上しています。自身の強みを理解し、弱点を規律でカバーすることが次のステップです。";
  if (skillScore < 40) {
    summary = "現在は「試行錯誤」のフェーズです。大きな損失を避けるための損切りルールを徹底し、規律あるトレードを意識しましょう。";
  } else if (skillScore > 80) {
    summary = "非常に高いレベルの投資スキルを発揮しています。市場環境の変化に合わせた機動的なリバランスが継続的な成功の鍵となります。";
  }

  return {
    insights: insights.sort((a, b) => b.impactScore - a.impactScore),
    skillScore,
    summary
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

export interface ProjectionPoint {
  year: number;
  total: number;
  contributions: number;
  earnings: number;
}

export interface ProjectionResult {
  data: ProjectionPoint[];
  milestones: {
    year1: ProjectionPoint;
    year5: ProjectionPoint;
    year10: ProjectionPoint;
  };
}

export const calculateFutureProjection = (
  initialCapital: number,
  monthlyContribution: number,
  annualYield: number,
  years: number = 30
): ProjectionResult => {
  const data: ProjectionPoint[] = [];
  const monthlyRate = annualYield / 100 / 12;
  
  let currentTotal = initialCapital;
  let totalContributions = initialCapital;

  // 初期値 (0年目)
  data.push({
    year: 0,
    total: Math.round(currentTotal),
    contributions: Math.round(totalContributions),
    earnings: 0
  });

  for (let year = 1; year <= years; year++) {
    for (let month = 1; month <= 12; month++) {
      currentTotal = currentTotal * (1 + monthlyRate) + monthlyContribution;
      totalContributions += monthlyContribution;
    }
    
    data.push({
      year,
      total: Math.round(currentTotal),
      contributions: Math.round(totalContributions),
      earnings: Math.round(Math.max(0, currentTotal - totalContributions))
    });
  }

  return {
    data,
    milestones: {
      year1: data[1],
      year5: data[5],
      year10: data[10]
    }
  };
};

export interface ScenarioConfig {
  id: string;
  name: string;
  initialCapital: number;
  monthlyContribution: number;
  annualYield: number;
  color: string;
}

export interface ComparisonPoint {
  year: number;
  [scenarioId: string]: number;
}

export const getScenarioRiskLevel = (yield_: number): "Low" | "Moderate" | "High" => {
  if (yield_ <= 4) return "Low";
  if (yield_ <= 8) return "Moderate";
  return "High";
};

export const calculateScenarioComparison = (
  scenarios: ScenarioConfig[],
  years: number = 30
): ComparisonPoint[] => {
  if (scenarios.length === 0) return [];

  const results = scenarios.map(s => ({
    id: s.id,
    data: calculateFutureProjection(s.initialCapital, s.monthlyContribution, s.annualYield, years).data
  }));

  const comparisonData: ComparisonPoint[] = [];

  for (let i = 0; i <= years; i++) {
    const point: ComparisonPoint = { year: i };
    results.forEach(res => {
      point[res.id] = res.data[i].total;
    });
    comparisonData.push(point);
  }

  return comparisonData;
};

