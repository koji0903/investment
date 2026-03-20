import { TradingRule, TradeProposal } from "@/types";

export interface TradingSignal {
  symbol: string;
  type: "buy" | "sell" | "hold";
  reason: string;
  price: number;
}

/**
 * 価格データから移動平均(SMA)を計算
 */
export const calculateSMA = (prices: number[], period: number): number[] => {
  const sma: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
      continue;
    }
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
};

/**
 * SMAクロスオーバー判定
 */
export const checkSMACrossover = (
  symbol: string,
  prices: number[],
  shortPeriod: number,
  longPeriod: number
): TradingSignal => {
  const shortSMA = calculateSMA(prices, shortPeriod);
  const longSMA = calculateSMA(prices, longPeriod);
  
  const lastIdx = prices.length - 1;
  const prevIdx = lastIdx - 1;

  if (isNaN(shortSMA[prevIdx]) || isNaN(longSMA[prevIdx])) {
    return { symbol, type: "hold", reason: "データ不足", price: prices[lastIdx] };
  }

  const prevShort = shortSMA[prevIdx];
  const prevLong = longSMA[prevIdx];
  const currShort = shortSMA[lastIdx];
  const currLong = longSMA[lastIdx];

  // ゴールデンクロス (短期が長期を上に抜ける)
  if (prevShort <= prevLong && currShort > currLong) {
    return {
      symbol,
      type: "buy",
      reason: `ゴールデンクロス発生 (${shortPeriod}SMA > ${longPeriod}SMA)`,
      price: prices[lastIdx],
    };
  }

  // デッドクロス (短期が長期を下に抜ける)
  if (prevShort >= prevLong && currShort < currLong) {
    return {
      symbol,
      type: "sell",
      reason: `デッドクロス発生 (${shortPeriod}SMA < ${longPeriod}SMA)`,
      price: prices[lastIdx],
    };
  }

  return { symbol, type: "hold", reason: "シグナルなし", price: prices[lastIdx] };
};
