import { describe, it, expect } from "vitest";
import { analyzeStockShareholderReturn } from "@/utils/stock/shareholder";
import type { StockFundamental } from "@/types/stock";

function makeFund(overrides: Partial<StockFundamental> = {}): StockFundamental {
  return {
    ticker: "7203", companyName: "トヨタ", sector: "自動車",
    revenueGrowth: 5, operatingProfitGrowth: 5, epsGrowth: 8,
    roe: 10, roa: 5, operatingMargin: 8,
    equityRatio: 40, interestBearingDebt: 100,
    operatingCashflow: 50, freeCashflow: 30,
    per: 12, pbr: 1.2, evEbitda: 8,
    avgPer5Year: 15, avgPbr5Year: 1.4,
    dividendYield: 2.5, payoutRatio: 35,
    dividendGrowthYears: 3, buybackFlag: false,
    updatedAt: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("analyzeStockShareholderReturn", () => {
  it("配当利回り > 4% → +35 スコア", () => {
    const high = analyzeStockShareholderReturn(makeFund({ dividendYield: 5.0 }));
    const low = analyzeStockShareholderReturn(makeFund({ dividendYield: 0 }));
    expect(high.score).toBeGreaterThan(low.score + 30);
  });

  it("配当利回り 2〜4% → +15 スコア", () => {
    const mid = analyzeStockShareholderReturn(makeFund({ dividendYield: 3.0, payoutRatio: 35 }));
    const none = analyzeStockShareholderReturn(makeFund({ dividendYield: 0, payoutRatio: 35 }));
    expect(mid.score).toBeGreaterThan(none.score + 10);
  });

  it("連続増配 > 10年 → +30 スコア", () => {
    const longDiv = analyzeStockShareholderReturn(makeFund({ dividendGrowthYears: 15, payoutRatio: 35 }));
    const shortDiv = analyzeStockShareholderReturn(makeFund({ dividendGrowthYears: 0, payoutRatio: 35 }));
    expect(longDiv.score).toBeGreaterThan(shortDiv.score + 25);
  });

  it("自社株買いフラグ → スコアが加算される", () => {
    const withBuyback = analyzeStockShareholderReturn(makeFund({ buybackFlag: true, dividendGrowthYears: 0 }));
    const noBuyback = analyzeStockShareholderReturn(makeFund({ buybackFlag: false, dividendGrowthYears: 0 }));
    expect(withBuyback.score).toBeGreaterThan(noBuyback.score);
  });

  it("配当性向 > 80% → -25 ペナルティ", () => {
    const risky = analyzeStockShareholderReturn(makeFund({ payoutRatio: 90 }));
    const healthy = analyzeStockShareholderReturn(makeFund({ payoutRatio: 35 }));
    expect(risky.score).toBeLessThan(healthy.score);
  });

  it("配当性向 < 40% → +10 スコア（将来の増配余地）", () => {
    const low = analyzeStockShareholderReturn(makeFund({ payoutRatio: 30 }));
    const high = analyzeStockShareholderReturn(makeFund({ payoutRatio: 60 }));
    expect(low.score).toBeGreaterThan(high.score);
  });

  it("profile: 利回り > 4% → 'high_dividend'", () => {
    const result = analyzeStockShareholderReturn(makeFund({ dividendYield: 5.0 }));
    expect(result.profile).toBe("high_dividend");
  });

  it("profile: 利回り 0.5〜4% → 'stable_dividend'", () => {
    const result = analyzeStockShareholderReturn(makeFund({ dividendYield: 2.0 }));
    expect(result.profile).toBe("stable_dividend");
  });

  it("profile: 利回り ≤ 0.5% → 'low_dividend'", () => {
    const result = analyzeStockShareholderReturn(makeFund({ dividendYield: 0 }));
    expect(result.profile).toBe("low_dividend");
  });

  it("suitability: 高配当+高スコア → 'good_for_long_term'", () => {
    // score > 30 かつ dividendYield > 2 の条件
    const result = analyzeStockShareholderReturn(
      makeFund({ dividendYield: 5.0, dividendGrowthYears: 15, payoutRatio: 30 })
    );
    expect(result.suitability).toBe("good_for_long_term");
  });

  it("スコアは [-100, 100] の範囲に収まる", () => {
    const worst = analyzeStockShareholderReturn(makeFund({ dividendYield: 0, payoutRatio: 100, dividendGrowthYears: 0 }));
    const best = analyzeStockShareholderReturn(makeFund({ dividendYield: 10, payoutRatio: 20, dividendGrowthYears: 20 }));
    expect(worst.score).toBeGreaterThanOrEqual(-100);
    expect(best.score).toBeLessThanOrEqual(100);
  });
});
