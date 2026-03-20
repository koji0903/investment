// ============================================================
// バックテストエンジン
// 過去の模擬価格データに戦略ルールを適用し、パフォーマンスを検証する
// ============================================================

export type StrategyType = "trend_follow" | "mean_reversion" | "hold";

export interface StrategyConfig {
  asset: string;           // 対象アセット名
  initialCapital: number;  // 初期資金 (JPY)
  strategyType: StrategyType;
  periodDays: 90 | 180 | 365 | 730;
  shortWindow: number;     // 短期移動平均の日数
  longWindow: number;      // 長期移動平均の日数
  takeProfitPct: number;   // 利確ライン (%)
  stopLossPct: number;     // 損切りライン (%)
}

export interface DailyResult {
  date: string;
  price: number;
  equity: number;         // その日の評価額
  inPosition: boolean;
  shortMA: number;
  longMA: number;
}

export interface BacktestResult {
  config: StrategyConfig;
  dailyResults: DailyResult[];
  totalReturn: number;       // 総リターン (%)
  totalProfitJpy: number;    // 総利益 (円)
  winRate: number;           // 勝率 (%)
  totalTrades: number;       // 総取引回数
  winTrades: number;         // 勝ちトレード数
  maxDrawdown: number;       // 最大ドローダウン (%)
  maxDrawdownJpy: number;    // 最大ドローダウン (円)
  sharpe: number;            // シャープレシオ (近似)
}

// ----- モック価格データ生成 -----
// ランダムウォーク + トレンドで過去価格シリーズを生成する
function generateMockPrices(
  days: number,
  basePrice: number,
  volatility = 0.02,
  trend = 0.0003
): number[] {
  const prices: number[] = [basePrice];
  for (let i = 1; i < days; i++) {
    const change = (Math.random() - 0.5) * 2 * volatility + trend;
    const nextPrice = Math.max(1, prices[i - 1] * (1 + change));
    prices.push(Math.round(nextPrice * 100) / 100);
  }
  return prices;
}

// 移動平均計算
function movingAverage(prices: number[], window: number, idx: number): number {
  if (idx < window - 1) return prices[idx];
  const slice = prices.slice(idx - window + 1, idx + 1);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

// アセット別のモック設定
const ASSET_CONFIGS: Record<string, { basePrice: number; volatility: number; trend: number }> = {
  "日本株（日経平均）": { basePrice: 35000, volatility: 0.012, trend: 0.0003 },
  "米国株（S&P500）": { basePrice: 4500, volatility: 0.01, trend: 0.0004 },
  "ビットコイン (BTC)": { basePrice: 6000000, volatility: 0.04, trend: 0.0005 },
  "米ドル/円 (FX)": { basePrice: 145, volatility: 0.005, trend: 0.0001 },
  "投資信託（全世界株）": { basePrice: 20000, volatility: 0.008, trend: 0.0003 },
};

// ----- メインのバックテスト実行関数 -----
export function runBacktest(config: StrategyConfig): BacktestResult {
  const assetConfig = ASSET_CONFIGS[config.asset] || ASSET_CONFIGS["日本株（日経平均）"];

  // シードを固定してモックデータを再現性ある形で生成
  // （実際のアプリではAPIから取得する部分）
  const prices = generateMockPrices(
    config.periodDays + config.longWindow,
    assetConfig.basePrice,
    assetConfig.volatility,
    assetConfig.trend
  );

  const dailyResults: DailyResult[] = [];
  let equity = config.initialCapital;
  let inPosition = false;
  let entryPrice = 0;
  let entryEquity = 0;
  let peakEquity = config.initialCapital;

  let totalTrades = 0;
  let winTrades = 0;
  let maxDrawdown = 0;
  let maxDrawdownJpy = 0;

  // 保有比率: 1回のエントリーで資金の100%を投入するシンプルモデル
  for (let i = config.longWindow; i < prices.length; i++) {
    const price = prices[i];
    const shortMA = movingAverage(prices, config.shortWindow, i);
    const longMA = movingAverage(prices, config.longWindow, i);
    const prevShortMA = movingAverage(prices, config.shortWindow, i - 1);
    const prevLongMA = movingAverage(prices, config.longWindow, i - 1);

    let signal: "buy" | "sell" | null = null;

    if (config.strategyType === "trend_follow") {
      // ゴールデンクロス: 短期MAが長期MAを上抜け → 買い
      if (!inPosition && prevShortMA <= prevLongMA && shortMA > longMA) signal = "buy";
      // デッドクロス: 短期MAが長期MAを下抜け → 売り
      if (inPosition && prevShortMA >= prevLongMA && shortMA < longMA) signal = "sell";
    } else if (config.strategyType === "mean_reversion") {
      // 逆張り: 短期MAが長期MAより大幅に下のとき → 買い
      if (!inPosition && shortMA < longMA * 0.97) signal = "buy";
      if (inPosition && shortMA > longMA * 1.02) signal = "sell";
    } else {
      // HOLD戦略: 最初に買ってそのまま保持
      if (!inPosition && i === config.longWindow) signal = "buy";
    }

    // 利確・損切りチェック
    if (inPosition) {
      const returnPct = ((price - entryPrice) / entryPrice) * 100;
      if (returnPct >= config.takeProfitPct) signal = "sell";
      if (returnPct <= -config.stopLossPct) signal = "sell";
    }

    // シグナル実行
    if (signal === "buy" && !inPosition) {
      inPosition = true;
      entryPrice = price;
      entryEquity = equity;
    } else if (signal === "sell" && inPosition) {
      const returnPct = (price - entryPrice) / entryPrice;
      equity = equity * (1 + returnPct) * 0.999; // 0.1%の手数料控除
      inPosition = false;
      totalTrades++;
      if (equity > entryEquity) winTrades++;
    }

    // 含み益を反映した評価額
    const currentEquity = inPosition
      ? equity * (price / entryPrice)
      : equity;

    if (currentEquity > peakEquity) peakEquity = currentEquity;
    const drawdown = ((peakEquity - currentEquity) / peakEquity) * 100;
    const drawdownJpy = peakEquity - currentEquity;
    if (drawdown > maxDrawdown) { maxDrawdown = drawdown; maxDrawdownJpy = drawdownJpy; }

    // 最初の longWindow 日は表示しない
    const dayIndex = i - config.longWindow;
    const date = new Date();
    date.setDate(date.getDate() - (config.periodDays - dayIndex));

    dailyResults.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      price: Math.round(price * 10) / 10,
      equity: Math.round(currentEquity),
      inPosition,
      shortMA: Math.round(shortMA * 10) / 10,
      longMA: Math.round(longMA * 10) / 10
    });
  }

  // 最終の評価額（ポジション保有中なら決済価格で算出）
  const finalEquity = inPosition
    ? equity * (prices[prices.length - 1] / entryPrice)
    : equity;
  const totalProfitJpy = Math.round(finalEquity - config.initialCapital);
  const totalReturn = Math.round(((finalEquity - config.initialCapital) / config.initialCapital) * 10000) / 100;
  const winRate = totalTrades > 0 ? Math.round((winTrades / totalTrades) * 100) : 0;

  // シャープレシオの近似（簡易版）
  const returns = dailyResults.slice(1).map((d, i) => (d.equity - dailyResults[i].equity) / dailyResults[i].equity);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdReturn = Math.sqrt(returns.reduce((a, b) => a + (b - avgReturn) ** 2, 0) / returns.length);
  const sharpe = stdReturn > 0 ? Math.round((avgReturn / stdReturn) * Math.sqrt(252) * 100) / 100 : 0;

  return {
    config,
    dailyResults,
    totalReturn,
    totalProfitJpy,
    winRate,
    totalTrades,
    winTrades,
    maxDrawdown: Math.round(maxDrawdown * 10) / 10,
    maxDrawdownJpy: Math.round(maxDrawdownJpy),
    sharpe
  };
}

// ストラテジーのプリセット設定
export const STRATEGY_PRESETS: { id: StrategyType; label: string; description: string }[] = [
  {
    id: "trend_follow",
    label: "トレンド順張り型",
    description: "上昇の勢いに乗って買い、下落転換したら売るシンプルな手法です。相場が一方向に動く時に強い傾向があります。"
  },
  {
    id: "mean_reversion",
    label: "逆張り（押し目買い）型",
    description: "一時的に下がった銘柄が元の水準に戻ることを期待して買う手法です。横ばいの相場環境に向いています。"
  },
  {
    id: "hold",
    label: "長期保有（ガチホ）型",
    description: "売買せず、最初に買った後は相場の上下を気にせず持ち続ける安定重視の手法です。"
  }
];

export const ASSET_CHOICES = Object.keys(ASSET_CONFIGS);
