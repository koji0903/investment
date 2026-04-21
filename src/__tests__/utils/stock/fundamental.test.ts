import { describe, it, expect } from "vitest";
import { analyzeStockFundamental } from "@/utils/stock/fundamental";
import type { StockFundamental } from "@/types/stock";

function makeFund(overrides: Partial<StockFundamental> = {}): StockFundamental {
  return {
    ticker: "7203",
    companyName: "トヨタ自動車",
    sector: "自動車",
    revenueGrowth: 5,
    operatingProfitGrowth: 5,
    epsGrowth: 8,
    roe: 10,
    roa: 5,
    operatingMargin: 8,
    equityRatio: 40,
    interestBearingDebt: 100,
    operatingCashflow: 50,
    freeCashflow: 30,
    per: 12,
    pbr: 1.2,
    evEbitda: 8,
    avgPer5Year: 14,
    avgPbr5Year: 1.4,
    dividendYield: 2.5,
    payoutRatio: 35,
    dividendGrowthYears: 3,
    buybackFlag: false,
    updatedAt: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("analyzeStockFundamental", () => {
  it("高成長 + 高ROE + 高自己資本比率で最大スコアに近い値を返す", () => {
    const result = analyzeStockFundamental(
      makeFund({ epsGrowth: 20, revenueGrowth: 15, roe: 20, equityRatio: 65 })
    );
    // +40 (成長) + 25 (ROE) + 20 (自己資本比率) = 85
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it("EPS成長 > 15 かつ 売上成長 > 10 で +40 スコア", () => {
    const base = analyzeStockFundamental(makeFund({ epsGrowth: 0, revenueGrowth: 0 }));
    const growth = analyzeStockFundamental(makeFund({ epsGrowth: 20, revenueGrowth: 15 }));
    expect(growth.score).toBeGreaterThan(base.score + 35);
  });

  it("減益 (epsGrowth < -5) でスコアが下がる", () => {
    const good = analyzeStockFundamental(makeFund({ epsGrowth: 10 }));
    const bad = analyzeStockFundamental(makeFund({ epsGrowth: -10 }));
    expect(bad.score).toBeLessThan(good.score);
  });

  it("growthProfile: EPS成長 > 10 → 'growth'", () => {
    const result = analyzeStockFundamental(makeFund({ epsGrowth: 15 }));
    expect(result.growthProfile).toBe("growth");
  });

  it("growthProfile: EPS成長 0〜10 → 'stable'", () => {
    const result = analyzeStockFundamental(makeFund({ epsGrowth: 5 }));
    expect(result.growthProfile).toBe("stable");
  });

  it("growthProfile: EPS成長 < 0 → 'weak'", () => {
    const result = analyzeStockFundamental(makeFund({ epsGrowth: -3 }));
    expect(result.growthProfile).toBe("weak");
  });

  it("自己資本比率 > 60 → financialHealth が 'strong'", () => {
    const result = analyzeStockFundamental(makeFund({ equityRatio: 65 }));
    expect(result.financialHealth).toBe("strong");
  });

  it("自己資本比率 <= 30 → financialHealth が 'weak'", () => {
    const result = analyzeStockFundamental(makeFund({ equityRatio: 25 }));
    expect(result.financialHealth).toBe("weak");
  });

  it("スコアは [-100, 100] の範囲に収まる", () => {
    const worst = analyzeStockFundamental(
      makeFund({ epsGrowth: -100, roe: 0, equityRatio: 0 })
    );
    const best = analyzeStockFundamental(
      makeFund({ epsGrowth: 100, revenueGrowth: 100, roe: 100, equityRatio: 100 })
    );
    expect(worst.score).toBeGreaterThanOrEqual(-100);
    expect(best.score).toBeLessThanOrEqual(100);
  });

  it("reasons が空でない", () => {
    const result = analyzeStockFundamental(makeFund());
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});
