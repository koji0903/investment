import { describe, it, expect } from "vitest";
import { analyzeStockValuation } from "@/utils/stock/valuation";
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

describe("analyzeStockValuation", () => {
  it("PER が過去平均の 0.8 倍未満 → 大幅割安で +40 スコア", () => {
    // per=10, avgPer5Year=15 → ratio=0.667 < 0.8
    const result = analyzeStockValuation(makeFund({ per: 10, avgPer5Year: 15 }));
    expect(result.score).toBeGreaterThanOrEqual(40);
  });

  it("PER が過去平均の 1.3 倍超 → 割高で -25 スコア", () => {
    const highResult = analyzeStockValuation(makeFund({ per: 20, avgPer5Year: 14 }));
    const fairResult = analyzeStockValuation(makeFund({ per: 14, avgPer5Year: 14 }));
    expect(highResult.score).toBeLessThan(fairResult.score);
  });

  it("PBR < 1.0 → 解散価値割れで +25 スコア加算", () => {
    const lowPbr = analyzeStockValuation(makeFund({ pbr: 0.8 }));
    const highPbr = analyzeStockValuation(makeFund({ pbr: 2.0 }));
    expect(lowPbr.score).toBeGreaterThan(highPbr.score);
  });

  it("配当利回り > 4.5% → バリュエーション支援で +20 スコア", () => {
    const highDiv = analyzeStockValuation(makeFund({ dividendYield: 5.0 }));
    const lowDiv = analyzeStockValuation(makeFund({ dividendYield: 1.0 }));
    expect(highDiv.score).toBeGreaterThan(lowDiv.score + 15);
  });

  it("label: スコア > 20 → 'undervalued'", () => {
    const result = analyzeStockValuation(makeFund({ per: 8, avgPer5Year: 15, pbr: 0.7 }));
    expect(result.label).toBe("undervalued");
  });

  it("label: スコア < -20 → 'overvalued'", () => {
    const result = analyzeStockValuation(makeFund({ per: 25, avgPer5Year: 15, pbr: 3.5 }));
    expect(result.label).toBe("overvalued");
  });

  it("label: 中間スコア → 'fair'", () => {
    // per=15, avgPer5Year=15 → ratio=1.0 (スコア加算なし), pbr=1.5 (ペナルティなし)
    const result = analyzeStockValuation(makeFund({ per: 15, avgPer5Year: 15, pbr: 1.5, dividendYield: 1.0 }));
    expect(result.label).toBe("fair");
  });

  it("スコアは [-100, 100] の範囲に収まる", () => {
    const best = analyzeStockValuation(makeFund({ per: 5, avgPer5Year: 20, pbr: 0.5, dividendYield: 6.0 }));
    const worst = analyzeStockValuation(makeFund({ per: 30, avgPer5Year: 20, pbr: 4.0, dividendYield: 0 }));
    expect(best.score).toBeLessThanOrEqual(100);
    expect(worst.score).toBeGreaterThanOrEqual(-100);
  });
});
