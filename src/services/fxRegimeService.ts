import { FXMarketRegime, MarketRegimeType } from "@/types/fx";
import { calculateATR } from "@/lib/technicalAnalysis";

/**
 * 相場レジーム判定 サービス
 */
export const FXRegimeService = {
  /**
   * 現在の市場データからレジームを判定
   */
  detectMarketRegime(ohlcData: Record<string, any[]>): FXMarketRegime {
    const data15m = ohlcData["15m"];
    const prices = data15m.map(d => d.close);
    
    // 1. MA傾き (15m EMA 200)
    const ema200 = this.calculateEMA(prices, 200);
    const lastEma = ema200[ema200.length - 1];
    const prevEma = ema200[ema200.length - 10];
    const maSlope = (lastEma - prevEma) * 100; // 簡易傾き

    // 2. ボラティリティ (ATR)
    const atrArr = calculateATR({
      high: data15m.map(d => d.high),
      low: data15m.map(d => d.low),
      close: data15m.map(d => d.close)
    }, 14);
    const lastATR = atrArr[atrArr.length - 1];

    // 3. ボリンジャーバンド幅
    const bb = this.calculateBollinger(prices, 20);
    const lastBBWidth = (bb.upper - bb.lower) / lastEma * 100;

    let type: MarketRegimeType = "RANGE";
    let confidence = 70;
    let reason = "Price is oscillating within a narrow band (Narrow BB).";

    // 判定ロジック
    if (Math.abs(maSlope) > 2.0) {
      type = maSlope > 0 ? "TREND_UP" : "TREND_DOWN";
      reason = maSlope > 0 ? "Strong bullish trend detected (EMA200 rising)." : "Strong bearish trend confirmed (EMA200 falling).";
      confidence = 85;
    } else if (lastATR > 0.15) {
      type = "HIGH_VOLATILITY";
      reason = "High ATR detected. Expect wild price swings even in range.";
      confidence = 80;
    } else if (lastATR < 0.05 && lastBBWidth < 0.2) {
      type = "LOW_VOLATILITY";
      reason = "Market is in deep consolidation (Squeeze). Low liquidity suspected.";
      confidence = 75;
    }

    if (lastATR > 0.25) {
      type = "INSTABILITY";
      reason = "Extreme volatility or news impact. Predictability is low.";
      confidence = 60;
    }

    return {
      type,
      name: this.getRegimeName(type),
      confidence,
      reason,
      timestamp: new Date().toISOString(),
      metrics: {
        maSlope,
        atrLevel: lastATR,
        bbWidth: lastBBWidth,
        volatilityStatus: lastATR > 0.15 ? "high" : lastATR < 0.05 ? "low" : "normal"
      }
    };
  },

  getRegimeName(type: MarketRegimeType): string {
    const names: Record<MarketRegimeType, string> = {
      TREND_UP: "上昇トレンド相場",
      TREND_DOWN: "下降トレンド相場",
      RANGE: "レンジ相場",
      HIGH_VOLATILITY: "高ボラティリティ相場",
      LOW_VOLATILITY: "低ボラティリティ相場",
      INSTABILITY: "不安定相場（指標警戒）"
    };
    return names[type];
  },

  calculateEMA(data: number[], period: number): number[] {
    const k = 2 / (period + 1);
    let ema = data[0];
    const results = [ema];
    for (let i = 1; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
      results.push(ema);
    }
    return results;
  },

  calculateBollinger(data: number[], period: number): { mid: number, upper: number, lower: number } {
    const slice = data.slice(-period);
    const mid = slice.reduce((a, b) => a + b, 0) / period;
    const std = Math.sqrt(slice.map(x => Math.pow(x - mid, 2)).reduce((a, b) => a + b, 0) / period);
    return { mid, upper: mid + std * 2, lower: mid - std * 2 };
  }
};
