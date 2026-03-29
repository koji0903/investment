/**
 * FX投資判断エンジン 型定義
 */

export type CurrencyCode = "USD" | "JPY" | "EUR" | "GBP" | "AUD" | "NZD" | "CAD" | "CHF" | "ZAR" | "MXN" | "TRY";

export type TechnicalTrend = "bullish" | "bearish" | "neutral";
export type MacroBias = "bullish" | "bearish" | "neutral";
export type SwapDirection = "long_positive" | "short_positive" | "both_negative" | "neutral";
export type HoldingStyle = "short_term_only" | "medium_term_long" | "medium_term_short" | "not_suitable_for_hold";
export type SignalLabel = "買い優勢" | "やや買い" | "中立" | "やや売り" | "売り優勢" | "押し目待ち" | "戻り売り待ち";
export type ConfidenceLevel = "高" | "中" | "低";
export type TradingSuitability = "短期売買向き" | "中長期保有向き" | "短期・中長期共に良好" | "様子見推奨";

/**
 * 通貨ペアのマスタ情報
 */
export interface FXPairMaster {
  pairCode: string; // e.g. "USD/JPY"
  baseCurrency: CurrencyCode;
  quoteCurrency: CurrencyCode;
  displayName?: string;
}

export const SUPPORTED_PAIRS: FXPairMaster[] = [
  { pairCode: "USD/JPY", baseCurrency: "USD", quoteCurrency: "JPY" },
  { pairCode: "EUR/JPY", baseCurrency: "EUR", quoteCurrency: "JPY" },
  { pairCode: "GBP/JPY", baseCurrency: "GBP", quoteCurrency: "JPY" },
  { pairCode: "AUD/JPY", baseCurrency: "AUD", quoteCurrency: "JPY" },
  { pairCode: "NZD/JPY", baseCurrency: "NZD", quoteCurrency: "JPY" },
  { pairCode: "CAD/JPY", baseCurrency: "CAD", quoteCurrency: "JPY" },
  { pairCode: "CHF/JPY", baseCurrency: "CHF", quoteCurrency: "JPY" },
  { pairCode: "ZAR/JPY", baseCurrency: "ZAR", quoteCurrency: "JPY" },
  { pairCode: "MXN/JPY", baseCurrency: "MXN", quoteCurrency: "JPY" },
  { pairCode: "TRY/JPY", baseCurrency: "TRY", quoteCurrency: "JPY" },
  { pairCode: "EUR/USD", baseCurrency: "EUR", quoteCurrency: "USD" },
  { pairCode: "GBP/USD", baseCurrency: "GBP", quoteCurrency: "USD" },
  { pairCode: "AUD/USD", baseCurrency: "AUD", quoteCurrency: "USD" },
  { pairCode: "NZD/USD", baseCurrency: "NZD", quoteCurrency: "USD" },
  { pairCode: "USD/CAD", baseCurrency: "USD", quoteCurrency: "CAD" },
  { pairCode: "USD/CHF", baseCurrency: "USD", quoteCurrency: "CHF" },
  { pairCode: "EUR/GBP", baseCurrency: "EUR", quoteCurrency: "GBP" },
  { pairCode: "EUR/AUD", baseCurrency: "EUR", quoteCurrency: "AUD" },
  { pairCode: "GBP/AUD", baseCurrency: "GBP", quoteCurrency: "AUD" },
  { pairCode: "EUR/CHF", baseCurrency: "EUR", quoteCurrency: "CHF" },
  { pairCode: "AUD/NZD", baseCurrency: "AUD", quoteCurrency: "NZD" },
];

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
 * 相場エネルギー分析結果
 */
export interface MarketEnergyAnalysis {
  energyScore: number;           // 0〜100
  energyLevel: "low" | "medium" | "high";
  status: "accumulating" | "releasing"; // 蓄積中 / 放出中
  breakoutDirection: "up" | "down" | "none";
  breakoutStrength: "strong" | "medium" | "weak";
  targetPrices: number[];        // 目標価格1, 2, 3
  fakeBreakProbability: number;  // 0〜100 (%)
  fakeFlag: boolean;             // だましフラグ
  entryRecommendation: "enter" | "wait" | "avoid"; // 推奨アクション
  dataProgress: number;          // 0-100 (%)
  certainty: number;             // 0-100 (%) 分析の確からしさ
}

/**
 * エントリータイミング最適化 (構造単位エントリーエンジン)
 */
export type StructurePhase = 
  | "pre_consolidation"
  | "consolidating"
  | "breakout_initial"
  | "pullback_waiting"
  | "reacceleration"
  | "extended_move"
  | "possible_fakeout";

export type RecommendedEntryType = 
  | "initial_breakout_entry"
  | "pullback_entry"
  | "reacceleration_entry";

export interface EntryTimingAnalysis {
  structurePhase: StructurePhase;
  structureComment: string;
  recommendedEntryType: RecommendedEntryType;
  entryTypeReason: string;
  entryScore: number;           // 0〜100
  entryLabel: string;           // エントリー好機, 条件付きで有望, 待機優先, 見送り
  waitReasons: string[];
  shouldWait: boolean;
  suggestedEntryPrice: number;
  invalidationPrice: number;    // 損切り候補
  targetPrice: number;          // 目標価格
  rrRatio: number;              // リスクリワード比
  stopComment: string;
  targetComment: string;
  dataProgress: number;          // 0-100 (%)
  certainty: number;             // 0-100 (%) 分析の確からしさ
  switchConditions?: string[];   // 次の判断へ切り替わるための具体的な条件
}

/**
 * ポジションサイズ最適化・自動調整
 */
export interface PositionSizingAnalysis {
  accountBalance: number;
  riskPercent: number;
  entryPrice: number;
  stopPrice: number;
  maxRiskAmount: number;
  riskPerUnit: number;
  basePositionSize: number;
  breakoutFactor: number;
  energyFactor: number;
  fakeFactor: number;
  rrFactor: number;
  structureFactor: number;
  finalPositionSize: number;
  cappedPositionSize: number;
  suggestedLot: string;         // "1.2 ロット" のような表示用文字列
  estimatedLossAmount: number;
  safetyScore: number;                // 0-100: 損失最小化・リスク管理の適切さ
  sizingComment: string;
  riskWarningMessages: string[];
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
  
  // 短期・中長期の分離評価
  shortTermSignal: SignalLabel;
  mediumTermSignal: SignalLabel;
  suitability: TradingSuitability;
  
  // 相場エネルギー分析 (新規追加)
  energyAnalysis?: MarketEnergyAnalysis;

  // エントリータイミング分析 (新規追加)
  entryTimingAnalysis?: EntryTimingAnalysis;

  // ポジションサイズ自動調整 (新規追加)
  positionSizing?: PositionSizingAnalysis;

  certainty: number;           // 0-100 (%) 統合判断の確からしさ
  safetyScore: number;         // 0-100: 損失最小化のしやすさ・安全性反映
  syncStatus?: "pending" | "syncing" | "completed" | "failed"; // 同期ステータス
  lastSyncAt?: string;         // 最終同期時刻
  updatedAt: string;
  
  // 詳細データ (UI表示用)
  indicators?: TechnicalAnalysisResult["indicators"];
  chartData?: { date: string; value: number }[];
}

/**
 * USD/JPY シミュレーション (仮想トレード)
 */
export interface FXSimulation {
  id: string;
  userId: string;
  pairCode: "USD/JPY";
  status: "open" | "closed";
  side: "buy" | "sell";
  entryPrice: number;
  entryTimestamp: string;
  exitPrice?: number;
  exitTimestamp?: string;
  takeProfit?: number;
  stopLoss?: number;
  quantity: number; // ロット数 or 通貨量
  pnl: number;
  pnlPercentage: number;
  entryReason: string;
  exitReason?: string;
  // エントリー時の市場コンディション (学習用)
  context: {
    trend1m: TechnicalTrend;
    trend5m: TechnicalTrend;
    trend15m: TechnicalTrend;
    trend1h: TechnicalTrend;
    rsi15m: number;
    volatilityATR: number;
    isBreakout: boolean;
    structuralPhase: StructurePhase;
    totalScore: number;
  };
  updatedAt: string;
}

/**
 * 学習エンジン用メトリクス
 */
export interface LearningMetric {
  patternId: string; // e.g. "trend_alignment_buy"
  patternName: string;
  description: string;
  winRate: number; // 0-1 (0-100%)
  totalTrades: number;
  expectedValue: number; // 期待値 (pips or currency)
  reliabilityCorrection: number; // 判断エンジンへの補正値 (-20〜+20)
  lastUpdatedAt: string;
}

/**
 * USD/JPY ダッシュボード状態
 */
export interface USDJPYDashboardState {
  userId: string;
  scenarios: {
    bullish: string;
    bearish: string;
    invalidation: string;
  };
  riskSettings: {
    capital: number;
    riskPercent: number;
    defaultStopPips: number;
  };
  learningWeights: Record<string, number>; // パターンID -> 重み
  updatedAt: string;
}
