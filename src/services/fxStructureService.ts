import { FXStructureAnalysis, FXStructureType, TechnicalTrend } from "@/types/fx";
import { calculateATR } from "@/lib/technicalAnalysis";

/**
 * 相場構造解析サービス
 * 秒単位ではなく、価格の「構造」と「完成度」を判定します。
 */
export const FXStructureService = {
  /**
   * 現在の相場構造を解析
   */
  analyzeStructure(ohlcData: Record<string, any[]>, pairCode: string = "USD/JPY"): FXStructureAnalysis {
    const data1m = ohlcData["1m"];
    const data5m = ohlcData["5m"];
    
    if (data1m.length < 50) {
      return this.unknown();
    }

    // 1. 保ち合い・エネルギー蓄積度の判定
    const energyLevel = this.calculateEnergyLevel(data5m, pairCode);
    
    // 2. 各構造パターンのスコアリング
    const pullback = this.scorePullback(ohlcData, pairCode);
    const breakout = this.scoreBreakout(ohlcData, energyLevel, pairCode);
    const rangeComp = this.scoreRangeCompression(ohlcData, energyLevel);

    // 最もスコアの高い構造を選択
    const patterns = [
      { type: "PULLBACK" as FXStructureType, ...pullback },
      { type: "BREAKOUT" as FXStructureType, ...breakout },
      { type: "RANGE_COMPRESSION" as FXStructureType, ...rangeComp }
    ].sort((a, b) => b.completionScore - a.completionScore);

    const best = patterns[0];
    
    // 定着（執行タイミング）の判定
    const isEntryTiming = best.completionScore >= 75 && energyLevel >= 50;

    return {
      type: best.type,
      completionScore: best.completionScore,
      label: best.label,
      reasons: best.reasons,
      isEntryTiming,
      energyLevel
    };
  },

  /**
   * エネルギー蓄積度（ボラティリティ収縮）を算出
   */
  calculateEnergyLevel(data: any[], pairCode: string): number {
    const atr = calculateATR({
      high: data.map(d => d.high),
      low: data.map(d => d.low),
      close: data.map(d => d.close)
    }, 14);
    
    const lastATR = atr[atr.length - 1];
    const prevATR = atr[atr.length - 10]; 
    
    const isJPY = pairCode.endsWith("JPY");
    const lowVolThreshold = isJPY ? 0.05 : 0.0005;

    let score = 50;
    if (lastATR < prevATR) score += 20;
    if (lastATR < lowVolThreshold) score += 30; // 極小ボラ
    
    return Math.min(100, score);
  },

  /**
   * 押し目・戻りの完成度をスコアリング
   */
  scorePullback(ohlc: Record<string, any[]>, pairCode: string) {
    const reasons: string[] = [];
    let score = 0;
    
    const trend1h = this.getTrend(ohlc["1h"]);
    const price = ohlc["1m"][ohlc["1m"].length - 1].close;
    const ema25 = this.calculateEMA(ohlc["15m"].map(d => d.close), 25).pop() || 0;

    if (trend1h === "neutral") return { completionScore: 0, label: "方向感なし", reasons: [] };

    const isJPY = pairCode.endsWith("JPY");
    const dist = Math.abs(price - ema25);
    const softThreshold = isJPY ? 0.1 : 0.001;
    const hardThreshold = isJPY ? 0.2 : 0.002;

    if (dist < softThreshold) {
      score += 60;
      reasons.push("主要EMA付近への理想的な押し");
    } else if (dist < hardThreshold) {
      score += 40;
      reasons.push("浅い押し目");
    }

    const last3 = ohlc["1m"].slice(-3);
    const isReversing = trend1h === "bullish" ? last3[2].close > last3[1].close : last3[2].close < last3[1].close;
    if (isReversing) {
      score += 20;
      reasons.push("反転足の出現を確認");
    }

    return { 
      completionScore: score, 
      label: trend1h === "bullish" ? "押し目形成" : "戻り売り形成",
      reasons 
    };
  },

  /**
   * ブレイクアウトの完成度をスコアリング
   */
  scoreBreakout(ohlc: Record<string, any[]>, energy: number, pairCode: string) {
    const reasons: string[] = [];
    let score = energy * 0.5; 
    
    const data15m = ohlc["15m"];
    const high = Math.max(...data15m.slice(-20).map(d => d.high));
    const low = Math.min(...data15m.slice(-20).map(d => d.low));
    const price = ohlc["1m"][ohlc["1m"].length - 1].close;

    const isJPY = pairCode.endsWith("JPY");
    const pipFactor = isJPY ? 100 : 10000;
    const distToHigh = (high - price) * pipFactor;
    const distToLow = (price - low) * pipFactor;

    if (distToHigh < 2 || distToLow < 2) {
      score += 40;
      reasons.push("重要サポレジへの近接");
      if (energy > 70) {
        score += 10;
        reasons.push("十分なエネルギー蓄積を伴う接近");
      }
    }

    return { 
      completionScore: Math.min(100, score), 
      label: "ブレイク準備", 
      reasons 
    };
  },

  scoreRangeCompression(ohlc: Record<string, any[]>, energy: number) {
    return {
      completionScore: energy, 
      label: "値幅収縮（レンジ）",
      reasons: ["ボラティリティ低下", "均衡状態"]
    };
  },

  getTrend(data: any[]): TechnicalTrend {
    const prices = data.map(d => d.close);
    const ema20 = this.calculateEMA(prices, 20).pop() || 0;
    const ema50 = this.calculateEMA(prices, 50).pop() || 0;
    if (ema20 > ema50) return "bullish";
    if (ema20 < ema50) return "bearish";
    return "neutral";
  },

  calculateEMA(data: number[], period: number): number[] {
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
  },

  unknown(): FXStructureAnalysis {
    return {
      type: "UNKNOWN",
      completionScore: 0,
      label: "解析不能",
      reasons: ["データ不足"],
      isEntryTiming: false,
      energyLevel: 0
    };
  }
};
