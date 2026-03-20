/**
 * テクニカル分析指標計算ユーティリティ
 */

/**
 * 単純移動平均 (SMA)
 */
export function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
      continue;
    }
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
}

/**
 * 指数平滑移動平均 (EMA)
 */
export function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const k = 2 / (period + 1);
  let prevEma = data[0];
  ema.push(prevEma);

  for (let i = 1; i < data.length; i++) {
    const currentEma = data[i] * k + prevEma * (1 - k);
    ema.push(currentEma);
    prevEma = currentEma;
  }
  return ema;
}

/**
 * RSI (Relative Strength Index)
 */
export function calculateRSI(data: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  let gains: number[] = [];
  let losses: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const difference = data[i] - data[i - 1];
    gains.push(Math.max(difference, 0));
    losses.push(Math.max(-difference, 0));
  }

  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      rsi.push(NaN);
      continue;
    }

    const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }

  return rsi;
}

/**
 * MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
  const fastEma = calculateEMA(data, fastPeriod);
  const slowEma = calculateEMA(data, slowPeriod);
  
  const macdLine: number[] = [];
  for (let i = 0; i < data.length; i++) {
    macdLine.push(fastEma[i] - slowEma[i]);
  }

  const signalLine = calculateEMA(macdLine.filter(val => !isNaN(val)), signalPeriod);
  // Padding signalLine to match macdLine length
  const paddedSignalLine = Array(macdLine.length - signalLine.length).fill(NaN).concat(signalLine);

  const histogram: number[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    histogram.push(macdLine[i] - paddedSignalLine[i]);
  }

  return { macdLine, signalLine: paddedSignalLine, histogram };
}

/**
 * 現在のステータス判定
 */
export function getTechnicalStatus(lastPrice: number, data: number[]) {
  const rsi = calculateRSI(data, 14);
  const lastRSI = rsi[rsi.length - 1];
  
  const sma20 = calculateSMA(data, 20);
  const lastSMA20 = sma20[sma20.length - 1];

  let signal: "buy" | "sell" | "neutral" = "neutral";
  let reason = "";

  if (lastRSI < 30) {
    signal = "buy";
    reason = "RSIが30を下回り、売られすぎ水準です。反発の可能性があります。";
  } else if (lastRSI > 70) {
    signal = "sell";
    reason = "RSIが70を上回り、買われすぎ水準です。調整の可能性があります。";
  } else if (lastPrice > lastSMA20 * 1.02) {
    signal = "sell";
    reason = "移動平均線(20)から上方乖離しています。";
  } else if (lastPrice < lastSMA20 * 0.98) {
    signal = "buy";
    reason = "移動平均線(20)から下方乖離しています。";
  } else {
    reason = "主要なテクニカル指標は中立を示しています。";
  }

  return { rsi: lastRSI, sma20: lastSMA20, signal, reason };
}
