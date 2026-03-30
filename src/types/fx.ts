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

  // 市場地合い分析 (新規追加)
  sentiment?: FXMarketSentiment;

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
  pairCode: string; // e.g. "USD/JPY", "EUR/USD"
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
  // エントリー時の市場詳細コンテキスト (高度学習用)
  context: FXTradeContext;
  execution?: {
    slippagePips: number;
    spreadPips: number;
    executionQualityScore: number;
    realizedEntryPrice: number;
  };
  aiReview?: {
    score: number;
    compliance: string;
    feedback: string;
    suggestion: string;
  };
  updatedAt: string;
}

/**
 * 高度学習用トレードコンテキスト
 */
export interface FXTradeContext {
  timestamp: string;
  timezone: string;           // "TOKYO" | "LONDON" | "NEWYORK"
  price: number;
  trends: {
    "1m": TechnicalTrend;
    "5m": TechnicalTrend;
    "15m": TechnicalTrend;
    "1h": TechnicalTrend;
    alignment: number;
  };
  volatility: {
    atr: number;
    status: "low" | "normal" | "high";
  };
  levels: {
    distToSupport: number;    // pips
    distToResistance: number; // pips
    isBreakout: boolean;
    isFakeoutSuspected: boolean;
  };
  setup: {
    isPerfectOrder: boolean;
    isPullback: boolean;
    score: number;
  };
  executionQuality: number;   // エントリー時の執行品質スコア
  eventStatus: "normal" | "caution" | "prohibited"; // 指標警戒状態
  structure: FXStructureAnalysis; // 相場構造解析結果
  environment: string;        // "TREND_UP" | "RANGE" | "VOLATILE" etc.
}

/**
 * 環境別の最適化重みプロファイル
 */
export interface FXWeightProfile {
  id: string;                 // "DEFAULT" | "LONDON_TREND" etc.
  name: string;
  weights: {
    trendAlignment: number;   // 標準 1.0
    volatility: number;
    supportResistance: number;
    timeOfDay: number;
    indicatorSignal: number;  // RSI等
  };
  bias: number;               // 全体的な感度補正
  lastOptimizedAt: string;
  sampleCount: number;        // 学習に使われたデータ数
  regime?: string;            // このプロファイルが対象とするレジーム
}

/**
 * 相場レジーム判定結果
 */
export type MarketRegimeType = 
  | "TREND_UP" 
  | "TREND_DOWN" 
  | "RANGE" 
  | "HIGH_VOLATILITY" 
  | "LOW_VOLATILITY" 
  | "INSTABILITY";

export interface FXMarketRegime {
  type: MarketRegimeType;
  name: string;
  confidence: number;         // 0-100%
  reason: string;
  timestamp: string;
  metrics: {
    maSlope: number;
    atrLevel: number;
    bbWidth: number;
    volatilityStatus: "low" | "normal" | "high";
  };
}

/**
 * バックテスト実行結果
 */
export interface FXBacktestResult {
  id: string;
  userId: string;
  parameters: {
    maPeriod: number;
    confidenceThreshold: number;
    tpPips: number;
    slPips: number;
  };
  metrics: {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    maxDrawdown: number;
    expectedValue: number;    // pips
    netProfit: number;
  };
  regimePerformance: Record<MarketRegimeType, number>; // レジーム別の勝率/期待値
  executedAt: string;
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

/**
 * リスク管理・ロット計算用のメトリクス
 */
export interface FXRiskMetrics {
  userId: string;
  currentBalance: number;
  maxBalance: number;       // ドローダウン計算用 (ピーク資産)
  drawdownPercent: number;
  consecutiveLosses: number;
  winRate: number;
  totalFinishedTrades: number;
  dailyTradeCount: number;     // 本日のトレード回数
  dailyPnlPercent: number;    // 本日の損益率 (%)
  ruleComplianceRate: number;  // ルール遵守率 (0-100)
  operationStatus: "normal" | "caution" | "stop"; // 運用状態
  lastEntryTimestamp: string; // クールダウン計算用
  lastExitTimestamp: string;  // クールダウン計算用
  lastTradeTimestamp: string;
}

/**
 * ロット計算の最終結果
 */
export interface LotCalculationResult {
  baseLot: number;          // 資金とリスク率からの基本ロット
  adjustedLot: number;      // 全ての補正後の最終ロット
  maxLossAmount: number;    // このトレードでの最大想定損失額
  multipliers: {
    confidence: number;     // 信頼度による補正倍率
    consecutiveLoss: number; // 連敗による補正倍率
    drawdown: number;       // ドローダウンによる補正倍率
    environment: number;    // 市場環境による補正倍率
    execution: number;      // 執行品質による補正倍率
    event: number;          // 経済指標イベントによる補正倍率
    structure: number;      // 構造完成度による補正倍率
    liquidity: number;      // 流動性状態による補正倍率
  };
  reason: string;           // ロット決定の主要な理由
  isExecutionAllowed: boolean; // 取引許可（DD酷い場合などはfalse）
}

/**
 * 経済指標イベント
 */
export interface FXEconomicEvent {
  id: string;
  name: string;
  timestamp: string;          // ISO
  importance: "high" | "medium" | "low";
  currency: "USD" | "JPY" | "EUR" | "ALL";
  actual?: string;
  forecast?: string;
  previous?: string;
}

/**
 * 執行品質プロファイル
 */
export interface FXExecutionProfile {
  spreadPips: number;
  volatilitySpike: boolean;   // 急変動検知
  slippageRisk: "low" | "medium" | "high";
  liquidityScore: number;     // 0-100
  qualityScore: number;       // 0-100
  status: "ideal" | "caution" | "critical";
}

/**
 * 相場構造解析
 */
export type FXStructureType = 
  | "PULLBACK" 
  | "BREAKOUT" 
  | "RANGE_COMPRESSION" 
  | "FAKE_REVERSAL" 
  | "TREND_FOLLOW" 
  | "UNKNOWN";

export interface FXStructureAnalysis {
  type: FXStructureType;
  completionScore: number;    // 0-100
  label: string;              // "押し目形成中", "ブレイク寸前" 等
  reasons: string[];
  isEntryTiming: boolean;     // 構造的に今が執行タイミングか
  energyLevel: number;        // 0-100 (エネルギー蓄積度)
}

/**
 * 擬似板情報
 */
export interface FXOrderBookEntry {
  price: number;
  size: number;               // 厚み (相対値)
  isWall: boolean;            // 「壁」として機能しているか
}

export interface FXPseudoOrderBook {
  bids: FXOrderBookEntry[];
  asks: FXOrderBookEntry[];
  imbalance: number;          // 需給の偏り (-1.0 〜 +1.0)
  liquidityScore: number;     // 0-100
  walls: {
    resistance: number[];
    support: number[];
  };
}

/**
 * 市場地合い判定結果 (複数通貨ペア横断)
 */
export interface FXMarketSentiment {
  usdStrength: number;         // 0-100
  usdLabel: "強い" | "中立" | "弱い";
  jpyStrength: number;         // 0-100
  jpyLabel: "強い" | "中立" | "弱い";
  crossYenSentiment: "bullish" | "bearish" | "neutral";
  overallBias: "USD_STRENGTH" | "JPY_STRENGTH" | "CROSS_YEN_BULLISH" | "CROSS_YEN_BEARISH" | "NEUTRAL" | "STABLE";
  integratedScore: number;     // 0-100 (USD/JPYに対する追い風度)
  reasons: string[];
  updatedAt: string;
}

/**
 * トレード運用レビュー
 */
export interface FXTradingReview {
  id: string;
  userId: string;
  period: "daily" | "weekly";
  startDate: string;
  endDate: string;
  stats: {
    totalTrades: number;
    winCount: number;
    lossCount: number;
    winRate: number;
    profitFactor: number;
    totalPnl: number;
    totalPnlYen: number;
    maxDrawdown: number;
    averageProfit: number;
    averageLoss: number;
  };
  patterns: {
    winning: string[];
    losing: string[];
  };
  compliance: {
    score: number;             // 0-100
    violationCount: number;
    details: string[];
  };
  sentimentCorrelations: {
    tailwindWinRate: number;
    headwindWinRate: number;
  };
  aiRecommendations: string[];
  summary: string;
  updatedAt: string;
}

/**
 * 条件別分析成果 (Section J用)
 */
export interface FXConditionAnalysis {
  timeOfDay: Record<string, { winRate: number, profit: number, count: number }>;
  dayOfWeek: Record<string, { winRate: number, profit: number, count: number }>;
  regime: Record<string, { winRate: number, profit: number, count: number }>;
  sentiment: Record<string, { winRate: number, profit: number, count: number }>;
  liquidity: Record<string, { winRate: number, profit: number, count: number }>;
}

/**
 * 複数ロジック比較 (Section K用)
 */
export interface FXBacktestComparison {
  id: string;
  name: string;
  winRate: number;
  expectedValue: number;
  profitFactor: number;
  maxDrawdown: number;
  tradeCount: number;
  stabilityScore: number;
  overfittingWarning: boolean;
}

export interface FXViolationLog {
  id: string;
  reason: string;
  context?: any;
  timestamp: {
    toDate: () => Date;
    seconds: number;
    nanoseconds: number;
  };
}

export interface FXPerformancePeriod {
  pips: number;
  yen: number;
  count: number;
  winRate: number;
}

export interface FXPerformanceResult {
  today: FXPerformancePeriod;
  weekly: FXPerformancePeriod;
  monthly: FXPerformancePeriod;
  allTime: FXPerformancePeriod;
}

export type USDJPYDashboardSection = 
  | "STATUS" | "MARKET" | "DECISION" | "POSITION" 
  | "CONTEXT" | "RISK" | "PERFORMANCE" | "REVIEW" 
  | "LEARNING" | "ANALYSIS" | "BACKTEST" | "LOGS";
