/**
 * FX投資判断エンジン 型定義
 */

export type CurrencyCode = "USD" | "JPY" | "EUR" | "GBP" | "AUD" | "NZD" | "CAD" | "CHF";

export type TechnicalTrend = "bullish" | "bearish" | "neutral";
export type MacroBias = "bullish" | "bearish" | "neutral";
export type SwapDirection = "long_positive" | "short_positive" | "both_negative" | "neutral";
export type HoldingStyle = "short_term_only" | "medium_term_long" | "medium_term_short" | "not_suitable_for_hold";
export type SignalLabel = "買い優勢" | "やや買い" | "中立" | "やや売り" | "売り優勢";
export type ConfidenceLevel = "高" | "中" | "低";

/**
 * 通貨ペアのマスタ情報
 */
export interface FXPairMaster {
  pairCode: string; // e.g. "USD/JPY"
  baseCurrency: CurrencyCode;
  quoteCurrency: CurrencyCode;
  displayName?: string;
}

/**
 * 通貨のファンダメンタル指標
 */
export interface CurrencyFundamental {
  currencyCode: CurrencyCode;
  interestRate: number;        // 政策金利 (%)
  inflationScore: number;      // インフレ傾向 (-10〜+10, 高いほどインフレ/利上げバイアス)
  growthScore: number;         // 景気強弱 (-10〜+10)
  centralBankBias: "hawkish" | "dovish" | "neutral";
  riskSensitivity: number;     // リスク感度 (高いほどリスクオンで買われやすい)
  safeHavenScore: number;      // 安全通貨スコア (高いほどリスクオフで買われやすい)
  commodityLinkedScore: number; // 資源国通貨スコア
  updatedAt: string;
}

/**
 * テクニカル分析結果
 */
export interface TechnicalAnalysisResult {
  score: number;               // -100〜+100
  trend: TechnicalTrend;
  reasons: string[];
  indicators: {
    rsi: number;
    macd: {
      macdLine: number;
      signalLine: number;
      histogram: number;
    };
    sma: {
      sma20: number;
      sma50: number;
      sma200: number;
    };
    bollinger: {
      upper: number;
      lower: number;
      mid: number;
    };
  };
}

/**
 * ファンダメンタル分析結果
 */
export interface FundamentalAnalysisResult {
  score: number;               // -100〜+100
  macroBias: MacroBias;
  reasons: string[];
  interestRateDiff: number;    // 金利差
}

/**
 * スワップ評価結果
 */
export interface SwapEvaluation {
  score: number;               // -50〜+50
  buySwap: number;
  sellSwap: number;
  swapDirection: SwapDirection;
  swapComment: string;
  holdingStyle: HoldingStyle;
}

/**
 * 統合判定結果 (Firestore 保存形式)
 */
export interface FXJudgment {
  pairCode: string;            // Primary Key e.g. "USD/JPY"
  baseCurrency: CurrencyCode;
  quoteCurrency: CurrencyCode;
  currentPrice: number;
  
  // 各分析スコア
  technicalScore: number;
  technicalTrend: TechnicalTrend;
  technicalReasons: string[];
  
  fundamentalScore: number;
  macroBias: MacroBias;
  fundamentalReasons: string[];
  
  buySwap: number;
  sellSwap: number;
  swapScore: number;
  swapDirection: SwapDirection;
  swapComment: string;
  holdingStyle: HoldingStyle;
  
  // 総合判定
  totalScore: number;
  signalLabel: SignalLabel;
  confidence: ConfidenceLevel;
  summaryComment: string;
  
  updatedAt: string;
  
  // 詳細データ (UI表示用)
  indicators?: TechnicalAnalysisResult["indicators"];
}
