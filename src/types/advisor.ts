export type AdvisorCategory = "日本株" | "外国株" | "FX" | "仮想通貨";

export interface StockIndicator {
  per?: number;
  pbr?: number;
  roe?: number;
  dividendYield?: number;
  marketCap?: number;
  rsi?: number;
}

export interface FXIndicator {
  rsi?: number;
  swapPoint?: number;
  volatility?: number;
  technicalSignal: "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell";
}

export interface CryptoIndicator {
  rsi?: number;
  dominance?: number;
  trend: "bullish" | "bearish" | "sideways";
}

export interface RecommendedAsset {
  symbol: string;
  name: string;
  category: AdvisorCategory;
  price: number;
  change24h: number;
  recommendationType: "buy" | "hold" | "sell";
  confidence: number;
  reason: string;
  rationale: string; // プロの判断根拠（詳細）
  expectedGrowth: string; // 今後の成長見込み（予測値含む文言）
  exitStrategy: string; // 撤退基準（損切り・利確）
  indicators: StockIndicator | FXIndicator | CryptoIndicator;
  indicatorExplanations?: Record<string, string>; // 指標の初心者向け解説
}

export interface AdvisorRecommendation {
  summary: string;
  budgetUsed: number;
  remainingBudget: number;
  assets: RecommendedAsset[];
  marketContext: string;
}
