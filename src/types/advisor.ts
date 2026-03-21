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
  minPurchaseAmount: number; // 最小購入単位 (円換算)
  indicators: StockIndicator | FXIndicator | CryptoIndicator;
  reason: string;
  priority: "high" | "medium" | "low";
}

export interface AdvisorRecommendation {
  summary: string;
  budgetUsed: number;
  remainingBudget: number;
  assets: RecommendedAsset[];
  marketContext: string;
}
