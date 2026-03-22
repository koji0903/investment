/**
 * 日本株投資判断エンジンの型定義
 */

export type StockSignalLabel = 
  | "買い優勢" 
  | "やや買い" 
  | "中立" 
  | "やや売り" 
  | "売り優勢"
  | "押し目待ち"
  | "戻り売り待ち";

export type GrowthProfile = "growth" | "stable" | "weak";
export type FinancialHealth = "strong" | "medium" | "weak";
export type ValuationLabel = "undervalued" | "fair" | "overvalued";
export type DividendProfile = "high_dividend" | "stable_dividend" | "low_dividend" | "risky_dividend";
export type TradingSuitability = "good_for_short_term" | "good_for_long_term" | "neutral" | "weak_for_long_term";

export interface StockJudgment {
  ticker: string;
  companyName: string;
  sector: string;
  currentPrice: number;
  
  // テクニカル分析 (25%)
  technicalScore: number;
  technicalTrend: "bullish" | "bearish" | "neutral";
  technicalReasons: string[];
  
  // ファンダメンタル分析 (35%)
  fundamentalScore: number;
  growthProfile: GrowthProfile;
  financialHealth: FinancialHealth;
  fundamentalReasons: string[];
  
  // バリュエーション分析 (25%)
  valuationScore: number;
  valuationLabel: ValuationLabel;
  valuationReasons: string[];
  
  // 配当・株主還元分析 (15%)
  shareholderReturnScore: number;
  dividendProfile: DividendProfile;
  holdSuitability: TradingSuitability;
  shareholderReasons: string[];
  
  // 総合判定
  totalScore: number;
  signalLabel: StockSignalLabel;
  confidence: "高" | "中" | "低";
  summaryComment: string;
  
  updatedAt: string;
}

export interface StockFundamental {
  ticker: string;
  companyName: string;
  sector: string;
  
  // 成長性・収益性
  revenueGrowth: number;
  operatingProfitGrowth: number;
  epsGrowth: number;
  roe: number;
  roa: number;
  operatingMargin: number;
  
  // 財務健全性
  equityRatio: number;
  interestBearingDebt: number; // 有利子負債（単位: 億円等）
  operatingCashflow: number;
  freeCashflow: number;
  
  // バリュエーション
  per: number;
  pbr: number;
  evEbitda: number;
  avgPer5Year: number;
  avgPbr5Year: number;
  
  // 株主還元
  dividendYield: number;
  payoutRatio: number;
  dividendGrowthYears: number;
  buybackFlag: boolean;
  
  updatedAt: string;
}

export interface StockPairMaster {
  ticker: string;
  name: string;
  sector: string;
}
