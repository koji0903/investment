import { describe, it, expect } from "vitest";
import { analyzeStockTechnical } from "@/utils/stock/technical";

function repeat(value: number, n: number): number[] {
  return Array(n).fill(value);
}

/**
 * SMA20 > SMA50 > SMA200 となる上昇トレンドの価格列を生成（200件）。
 * - 先頭150件: 100（SMA200を低く保つ）
 * - 次35件: 200（SMA50を中程度に）
 * - 末尾15件: 295/305 交互（SMA20を高く、かつ RSI を中立域に保つ）
 * 結果: SMA20≈275 > SMA50≈230 > SMA200≈132 → パーフェクトオーダー成立
 * RSI≈50（交互変動）→ ペナルティなし、最終スコア+40
 */
function makeBullishPrices(): number[] {
  const prices: number[] = [];
  for (let i = 0; i < 150; i++) prices.push(100);
  for (let i = 0; i < 35; i++) prices.push(200);
  for (let i = 0; i < 15; i++) prices.push(i % 2 === 0 ? 295 : 305);
  return prices;
}

/**
 * SMA20 < SMA50 < SMA200 となる下降トレンドの価格列を生成（200件）。
 * - 先頭150件: 300（SMA200を高く保つ）
 * - 次35件: 200（SMA50を中程度に）
 * - 末尾15件: 95/105 交互（SMA20を低く、RSI 中立域）
 * 結果: SMA20≈125 < SMA50≈170 < SMA200≈267 → ベアパーフェクトオーダー成立
 */
function makeBearishPrices(): number[] {
  const prices: number[] = [];
  for (let i = 0; i < 150; i++) prices.push(300);
  for (let i = 0; i < 35; i++) prices.push(200);
  for (let i = 0; i < 15; i++) prices.push(i % 2 === 0 ? 95 : 105);
  return prices;
}

describe("analyzeStockTechnical", () => {
  it("データが 200 件未満の場合はスコア 0・neutral を返す", () => {
    const result = analyzeStockTechnical([100, 200, 150], 150);
    expect(result.score).toBe(0);
    expect(result.trend).toBe("neutral");
    expect(result.reasons).toContain("データ不足");
  });

  it("ちょうど 200 件のデータで動作する（境界値）", () => {
    const prices = repeat(1000, 200);
    const result = analyzeStockTechnical(prices, 1000);
    expect(result.score).toBeDefined();
    expect(typeof result.trend).toBe("string");
  });

  it("パーフェクトオーダー上昇: trend が bullish でスコアが正", () => {
    const prices = makeBullishPrices();
    const result = analyzeStockTechnical(prices, 200);
    expect(result.score).toBeGreaterThan(0);
    expect(result.trend).toBe("bullish");
  });

  it("パーフェクトオーダー下降: trend が bearish でスコアが負", () => {
    const prices = makeBearishPrices();
    const result = analyzeStockTechnical(prices, 100);
    expect(result.score).toBeLessThan(0);
    expect(result.trend).toBe("bearish");
  });

  it("スコアは [-100, 100] の範囲に収まる", () => {
    const pricesUp = makeBullishPrices();
    const pricesDn = makeBearishPrices();
    const r1 = analyzeStockTechnical(pricesUp, 200);
    const r2 = analyzeStockTechnical(pricesDn, 100);
    expect(r1.score).toBeGreaterThanOrEqual(-100);
    expect(r1.score).toBeLessThanOrEqual(100);
    expect(r2.score).toBeGreaterThanOrEqual(-100);
    expect(r2.score).toBeLessThanOrEqual(100);
  });

  it("reasons 配列が空でない", () => {
    const prices = repeat(1500, 200);
    const result = analyzeStockTechnical(prices, 1500);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("ボリンジャーバンド下限を割れた価格は+スコアを加算する", () => {
    // 一定価格200件 → std ≈ 0 → lower ≈ sma20
    // currentPrice を極端に低くするとバンド下限割れ扱い
    const prices = repeat(1000, 200);
    const aboveResult = analyzeStockTechnical(prices, 1000);
    const belowResult = analyzeStockTechnical(prices, 1);   // 極端に低い
    expect(belowResult.score).toBeGreaterThan(aboveResult.score);
  });
});
