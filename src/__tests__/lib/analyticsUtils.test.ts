import { describe, it, expect } from "vitest";
import {
  getPerformanceMetrics,
  getMetricComment,
  calculatePortfolioRisk,
  calculatePearsonCorrelation,
  calculateOptimalPortfolio,
} from "@/lib/analyticsUtils";
import type { AssetCalculated } from "@/types";

// テスト用のモックデータファクトリ
function makeAsset(overrides: Partial<AssetCalculated> = {}): AssetCalculated {
  return {
    id: "asset-1",
    symbol: "7203.T",
    name: "トヨタ自動車",
    category: "株",
    currentPrice: 2500,
    quantity: 100,
    averageCost: 2000,
    evaluatedValue: 250000,
    profitAndLoss: 50000,
    profitPercentage: 25,
    dailyChange: 1000,
    dailyChangePercentage: 0.4,
    ...overrides,
  };
}

// ===== getPerformanceMetrics =====
describe("getPerformanceMetrics", () => {
  it("資産がゼロの場合はすべて 0 を返す", () => {
    const result = getPerformanceMetrics([], []);
    expect(result.winRate).toBe(0);
    expect(result.averageReturn).toBe(0);
    expect(result.maxDrawdown).toBe(0);
    expect(result.sharpeRatio).toBe(0);
    expect(result.totalTrades).toBe(0);
  });

  it("含み益資産の勝率が 100% になる", () => {
    const assets = [
      makeAsset({ profitAndLoss: 10000, profitPercentage: 10 }),
      makeAsset({ id: "asset-2", profitAndLoss: 5000, profitPercentage: 5 }),
    ];
    const result = getPerformanceMetrics(assets, []);
    expect(result.winRate).toBe(100);
    expect(result.totalTrades).toBe(2);
  });

  it("含み損・含み益が混在する場合の勝率が 50% になる", () => {
    const assets = [
      makeAsset({ profitAndLoss: 10000, profitPercentage: 10 }),
      makeAsset({ id: "asset-2", profitAndLoss: -5000, profitPercentage: -5 }),
    ];
    const result = getPerformanceMetrics(assets, []);
    expect(result.winRate).toBe(50);
  });

  it("averageCost が 0 の資産は除外される", () => {
    const assets = [
      makeAsset({ averageCost: 0 }),
      makeAsset({ id: "asset-2", averageCost: 2000, profitAndLoss: 5000 }),
    ];
    const result = getPerformanceMetrics(assets, []);
    expect(result.totalTrades).toBe(1);
  });

  it("トレンドデータから最大ドローダウンを正しく計算する", () => {
    const trendData = [
      { date: "2024-01", value: 100000 },
      { date: "2024-02", value: 120000 },
      { date: "2024-03", value: 90000 },  // ここで -25% ドローダウン
      { date: "2024-04", value: 110000 },
    ];
    const result = getPerformanceMetrics([], trendData);
    // peak=120000, drawdown=(120000-90000)/120000 = 25%
    expect(result.maxDrawdown).toBeCloseTo(25, 0);
  });
});

// ===== getMetricComment =====
describe("getMetricComment", () => {
  it("勝率 70% 以上は '極めて優秀な勝率' を返す", () => {
    expect(getMetricComment("winRate", 70)).toBe("極めて優秀な勝率です");
    expect(getMetricComment("winRate", 90)).toBe("極めて優秀な勝率です");
  });

  it("勝率 50-69% は '安定した銘柄選定' を返す", () => {
    expect(getMetricComment("winRate", 50)).toBe("安定した銘柄選定です");
    expect(getMetricComment("winRate", 60)).toBe("安定した銘柄選定です");
  });

  it("勝率 50% 未満は '見直しを推奨' を返す", () => {
    expect(getMetricComment("winRate", 49)).toBe("見直しを推奨します");
  });

  it("ドローダウン 10% 以下は '優れたリスク耐性' を返す", () => {
    expect(getMetricComment("maxDrawdown", 10)).toBe("優れたリスク耐性です");
  });

  it("シャープレシオ 1.5 以上は '非常に効率的な運用' を返す", () => {
    expect(getMetricComment("sharpeRatio", 1.5)).toBe("非常に効率的な運用です");
  });

  it("シャープレシオが負の場合は '見合っていません' を返す", () => {
    expect(getMetricComment("sharpeRatio", -0.5)).toBe("リスクに見合っていません");
  });
});

// ===== calculatePearsonCorrelation =====
describe("calculatePearsonCorrelation", () => {
  it("完全正相関 (+1) を正しく計算する", () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10]; // y = 2x
    expect(calculatePearsonCorrelation(x, y)).toBeCloseTo(1, 5);
  });

  it("完全負相関 (-1) を正しく計算する", () => {
    const x = [1, 2, 3, 4, 5];
    const y = [10, 8, 6, 4, 2]; // y = -2x + 12
    expect(calculatePearsonCorrelation(x, y)).toBeCloseTo(-1, 5);
  });

  it("要素数が異なる場合は 0 を返す", () => {
    expect(calculatePearsonCorrelation([1, 2, 3], [1, 2])).toBe(0);
  });

  it("空配列の場合は 0 を返す", () => {
    expect(calculatePearsonCorrelation([], [])).toBe(0);
  });

  it("一定値（分散ゼロ）の場合は 0 を返す", () => {
    const x = [5, 5, 5, 5];
    const y = [1, 2, 3, 4];
    expect(calculatePearsonCorrelation(x, y)).toBe(0);
  });
});

// ===== calculatePortfolioRisk =====
describe("calculatePortfolioRisk", () => {
  it("資産がゼロの場合は Safe/0 を返す", () => {
    const result = calculatePortfolioRisk([]);
    expect(result.overallScore).toBe(0);
    expect(result.overallLevel).toBe("Safe");
    expect(result.assetRisks).toHaveLength(0);
  });

  it("仮想通貨のみのポートフォリオは Critical レベルになる", () => {
    const assets = [
      makeAsset({ category: "仮想通貨", evaluatedValue: 1000000, profitPercentage: 0 }),
    ];
    const result = calculatePortfolioRisk(assets);
    // 仮想通貨のベースリスク = 85 → Critical (>=75)
    expect(result.overallLevel).toBe("Critical");
    expect(result.overallScore).toBeGreaterThanOrEqual(75);
  });

  it("投資信託のみのポートフォリオは Safe レベルになる", () => {
    const assets = [
      makeAsset({ category: "投資信託", evaluatedValue: 1000000, profitPercentage: 0 }),
    ];
    const result = calculatePortfolioRisk(assets);
    // 投資信託のベースリスク = 30 → Safe (<35)
    expect(result.overallLevel).toBe("Safe");
  });

  it("含み損はリスクスコアを上昇させる", () => {
    const profitAsset = makeAsset({ evaluatedValue: 1000000, profitPercentage: 10 });
    const lossAsset = makeAsset({ evaluatedValue: 1000000, profitPercentage: -20 });

    const profitResult = calculatePortfolioRisk([profitAsset]);
    const lossResult = calculatePortfolioRisk([lossAsset]);

    expect(lossResult.overallScore).toBeGreaterThan(profitResult.overallScore);
  });

  it("分散スコアは単一資産より複数資産で高くなる", () => {
    const single = calculatePortfolioRisk([
      makeAsset({ evaluatedValue: 1000000 }),
    ]);
    const diversified = calculatePortfolioRisk([
      makeAsset({ evaluatedValue: 500000 }),
      makeAsset({ id: "asset-2", evaluatedValue: 500000, category: "投資信託" }),
    ]);
    expect(diversified.diversificationScore).toBeGreaterThan(single.diversificationScore);
  });

  it("riskLevel が正しく分類される", () => {
    const assets = [
      makeAsset({ category: "仮想通貨", evaluatedValue: 1000000, profitPercentage: 0 }),
    ];
    const result = calculatePortfolioRisk(assets);
    expect(result.assetRisks[0].riskLevel).toBe("Danger"); // 85点 >= 80
  });
});

// ===== calculateOptimalPortfolio =====
describe("calculateOptimalPortfolio", () => {
  it("低リスクモデルは銀行・投資信託の目標比率が高い", () => {
    const result = calculateOptimalPortfolio([], "low");
    const bank = result.segments.find((s) => s.category === "銀行");
    const fund = result.segments.find((s) => s.category === "投資信託");
    expect(bank?.targetRatio).toBe(45);
    expect(fund?.targetRatio).toBe(40);
  });

  it("高リスクモデルは株・仮想通貨の目標比率が高い", () => {
    const result = calculateOptimalPortfolio([], "high");
    const stock = result.segments.find((s) => s.category === "株");
    const crypto = result.segments.find((s) => s.category === "仮想通貨");
    expect(stock?.targetRatio).toBe(50);
    expect(crypto?.targetRatio).toBe(20);
  });

  it("現在の資産配分が正しく計算される", () => {
    const assets = [
      makeAsset({ category: "株", evaluatedValue: 600000 }),
      makeAsset({ id: "asset-2", category: "投資信託", evaluatedValue: 400000 }),
    ];
    const result = calculateOptimalPortfolio(assets, "moderate");
    const stockSegment = result.segments.find((s) => s.category === "株");
    expect(stockSegment?.currentRatio).toBeCloseTo(60, 1);
    expect(stockSegment?.currentValue).toBe(600000);
  });

  it("riskToleranceLevel が返り値に含まれる", () => {
    const result = calculateOptimalPortfolio([], "high");
    expect(result.riskToleranceLevel).toBe("high");
  });

  it("日本株・外国株は '株' に正規化される", () => {
    const assets = [
      makeAsset({ category: "日本株", evaluatedValue: 500000 }),
      makeAsset({ id: "asset-2", category: "外国株", evaluatedValue: 500000 }),
    ];
    const result = calculateOptimalPortfolio(assets, "moderate");
    const stockSegment = result.segments.find((s) => s.category === "株");
    // 日本株 + 外国株 = 1000000 → 100%
    expect(stockSegment?.currentRatio).toBeCloseTo(100, 1);
  });
});
