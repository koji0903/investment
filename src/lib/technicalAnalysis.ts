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
 * ボリンジャーバンド (+-2σ)
 */
export function calculateBollingerBands(data: number[], period: number = 20) {
  const sma = calculateSMA(data, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
      continue;
    }

    const subset = data.slice(i - period + 1, i + 1);
    const mean = sma[i];
    const variance = subset.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    upper.push(mean + stdDev * 2);
    lower.push(mean - stdDev * 2);
  }

  return { upper, lower, sma };
}

/**
 * 現在のステータス判定
 */
/**
 * ATR (Average True Range)
 */
export function calculateATR(data: { high: number[], low: number[], close: number[] }, period: number = 14): number[] {
  const tr: number[] = [0];
  for (let i = 1; i < data.close.length; i++) {
    const hl = data.high[i] - data.low[i];
    const hcp = Math.abs(data.high[i] - data.close[i - 1]);
    const lcp = Math.abs(data.low[i] - data.close[i - 1]);
    tr.push(Math.max(hl, hcp, lcp));
  }

  const atr: number[] = [];
  let sum = tr.slice(0, period).reduce((a, b) => a + b, 0);
  
  for (let i = 0; i < tr.length; i++) {
    if (i < period - 1) {
      atr.push(NaN);
      continue;
    }
    if (i === period - 1) {
      atr.push(sum / period);
    } else {
      const currentAtr = (atr[atr.length - 1] * (period - 1) + tr[i]) / period;
      atr.push(currentAtr);
    }
  }

  return atr;
}

/**
 * ピボットポイント (Standard Pivot Points)
 */
export function calculatePivotPoints(high: number, low: number, close: number) {
  const p = (high + low + close) / 3;
  const r1 = 2 * p - low;
  const r2 = p + (high - low);
  const s1 = 2 * p - high;
  const s2 = p - (high - low);

  return { p, r1, r2, s1, s2 };
}

export function getTechnicalStatus(lastPrice: number, data: number[]) {
  const rsi = calculateRSI(data, 14);
  const lastRSI = rsi[rsi.length - 1];
  
  const { upper, lower, sma } = calculateBollingerBands(data, 20);
  const lastUpper = upper[upper.length - 1];
  const lastLower = lower[lower.length - 1];
  const lastSMA20 = sma[sma.length - 1];

  const { histogram } = calculateMACD(data);
  const lastHist = histogram[histogram.length - 1];
  const prevHist = histogram[histogram.length - 2];

  let score = 0; // -3 (Strong Sell) to +3 (Strong Buy)
  let reasons: string[] = [];

  // RSI判定
  if (lastRSI < 30) { score += 1; reasons.push("RSI売られすぎ"); }
  if (lastRSI < 20) { score += 1; }
  if (lastRSI > 70) { score -= 1; reasons.push("RSI買われすぎ"); }
  if (lastRSI > 80) { score -= 1; }

  // ボリンジャーバンド判定
  if (lastPrice <= lastLower) { score += 2; reasons.push("ボリバン-2σ到達"); }
  if (lastPrice >= lastUpper) { score -= 2; reasons.push("ボリバン+2σ到達"); }

  // MACD判定 (ゴールデンクロス/デッドクロス)
  if (lastHist > 0 && prevHist <= 0) { score += 1; reasons.push("MACDゴールデンクロス"); }
  if (lastHist < 0 && prevHist >= 0) { score -= 1; reasons.push("MACDデッドクロス"); }

  // 乖離率判定
  if (lastPrice > lastSMA20 * 1.03) { score -= 1; reasons.push("SMA乖離過大(上)"); }
  if (lastPrice < lastSMA20 * 0.97) { score += 1; reasons.push("SMA乖離過大(下)"); }

  let signal: "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell" = "neutral";
  if (score >= 3) signal = "strong_buy";
  else if (score >= 1) signal = "buy";
  else if (score <= -3) signal = "strong_sell";
  else if (score <= -1) signal = "sell";

  const reason = reasons.length > 0 ? reasons.join("・") + "から総合判定。" : "主要な指標は中立を示しています。";

  return { rsi: lastRSI, sma20: lastSMA20, signal, reason, score, bollinger: { upper: lastUpper, lower: lastLower } };
}
