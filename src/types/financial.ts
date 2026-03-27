/**
 * 財務諸表分析の型定義
 */

export interface PLData {
  revenue: number;
  grossProfit: number;
  operatingProfit: number;
  ordinaryProfit: number;
  netIncome: number;
  eps: number;
  operatingMargin: number;
  netMargin: number;
  updatedAt: string;
}

export interface BSData {
  totalAssets: number;
  netAssets: number;
  equity: number;
  equityRatio: number;
  retainedEarnings: number;
  cashAndDeposits: number;
  interestBearingDebt: number;
  currentAssets: number;
  currentLiabilities: number;
  fixedLiabilities: number;
  updatedAt: string;
}

export interface CFData {
  operatingCF: number;
  investingCF: number;
  financingCF: number;
  freeCF: number;
  depreciation: number;
  updatedAt: string;
}

export interface FinancialAnalysisResult {
  ticker: string;
  companyName: string;
  
  // 1. PL分析
  plScore: number;
  plLabel: "strong" | "normal" | "weak";
  plReasons: string[];
  
  // 2. BS分析
  bsScore: number;
  bsLabel: "safe" | "caution" | "risky";
  bsReasons: string[];
  
  // 3. CF分析
  cfScore: number;
  cfLabel: "healthy" | "caution" | "unhealthy";
  cfReasons: string[];
  
  // 4. 三表整合性
  consistencyScore: number;
  consistencyFlags: string[];
  consistencyComment: string;
  
  // 5. 危険シグナル
  riskFlags: string[];
  riskLevel: "low" | "medium" | "high";
  
  // 6. 総合評価
  financialStatementScore: number;
  financialGrade: "A" | "B" | "C" | "D";
  financialComment: string;
  
  updatedAt: string;
}

export interface FinancialStatementPayload {
  pl: PLData[]; // 履歴データ（直近数期分）
  bs: BSData[];
  cf: CFData[];
}
