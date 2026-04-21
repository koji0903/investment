import { describe, it, expect } from "vitest";
import {
  calculateCurrencyStrengthFromAnalysis,
  getJpyRate,
  getBaseCurrency,
} from "@/lib/fxUtils";

// ===== calculateCurrencyStrengthFromAnalysis =====
describe("calculateCurrencyStrengthFromAnalysis", () => {
  it("空の配列でも5通貨分の結果を返す", () => {
    const result = calculateCurrencyStrengthFromAnalysis([]);
    expect(result).toHaveLength(5);
    result.forEach((r) => expect(r.strength).toBe(0));
  });

  it("strength の降順でソートされる", () => {
    const fxAnalysis = [
      { pair: "USDJPY=X", change: 1.5 },
      { pair: "EURUSD=X", change: -0.5 },
    ];
    const result = calculateCurrencyStrengthFromAnalysis(fxAnalysis);
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].strength).toBeGreaterThanOrEqual(result[i + 1].strength);
    }
  });

  it("ベース通貨のポジティブ変化は strength を上げる", () => {
    // USD が base (USDJPY=X) → USD の strength に +change
    const withUsd = calculateCurrencyStrengthFromAnalysis([{ pair: "USDJPY=X", change: 2.0 }]);
    const withoutUsd = calculateCurrencyStrengthFromAnalysis([]);
    const usdWith = withUsd.find((r) => r.currency === "USD")!;
    const usdWithout = withoutUsd.find((r) => r.currency === "USD")!;
    expect(usdWith.strength).toBeGreaterThan(usdWithout.strength);
  });

  it("クォート通貨のポジティブ変化は strength を下げる", () => {
    // USDJPY=X → JPY はクォート通貨 → JPY strength に -change
    const result = calculateCurrencyStrengthFromAnalysis([{ pair: "USDJPY=X", change: 2.0 }]);
    const jpy = result.find((r) => r.currency === "JPY")!;
    expect(jpy.strength).toBeLessThan(0);
  });

  it("strength が小数点2桁に丸められる", () => {
    const result = calculateCurrencyStrengthFromAnalysis([{ pair: "EURUSD=X", change: 1.123456 }]);
    result.forEach((r) => {
      const decimals = String(r.strength).split(".")[1]?.length ?? 0;
      expect(decimals).toBeLessThanOrEqual(2);
    });
  });

  it("change が undefined / null でも 0 として扱われる", () => {
    expect(() =>
      calculateCurrencyStrengthFromAnalysis([{ pair: "USDJPY=X", change: undefined }])
    ).not.toThrow();
  });
});

// ===== getJpyRate =====
describe("getJpyRate", () => {
  it("JPY は常に 1 を返す", () => {
    expect(getJpyRate("JPY", {})).toBe(1);
    expect(getJpyRate("JPY", { "USDJPY=X": 150 })).toBe(1);
  });

  it("USD は USDJPY=X レートを優先して返す", () => {
    expect(getJpyRate("USD", { "JPY=X": 148, "USDJPY=X": 150 })).toBe(150);
  });

  it("USD の USDJPY=X がない場合は JPY=X を使う", () => {
    expect(getJpyRate("USD", { "JPY=X": 148 })).toBe(148);
  });

  it("USD のレートが一切ない場合はデフォルト 151.2 を返す", () => {
    expect(getJpyRate("USD", {})).toBe(151.2);
  });

  it("EUR は EURJPY=X を直接返す", () => {
    expect(getJpyRate("EUR", { "EURJPY=X": 163.5 })).toBe(163.5);
  });

  it("EUR の EURJPY=X がなく EURUSD=X がある場合は合成する", () => {
    const rate = getJpyRate("EUR", { "EURUSD=X": 1.08, "JPY=X": 150 });
    expect(rate).toBeCloseTo(1.08 * 150, 2);
  });

  it("既知の通貨ペアがない場合はフォールバック値を返す", () => {
    const rate = getJpyRate("EUR", {});
    expect(rate).toBe(164.5); // EUR のフォールバック
  });

  it("未知の通貨はデフォルトの USDJPY 相当を返す", () => {
    const rate = getJpyRate("XYZ", {});
    expect(rate).toBe(151.2);
  });
});

// ===== getBaseCurrency =====
describe("getBaseCurrency", () => {
  it("name に '/' がある場合はその前の部分を返す", () => {
    expect(getBaseCurrency("USD/JPY", "USDJPY=X")).toBe("USD");
    expect(getBaseCurrency("EUR/USD", "EURUSD=X")).toBe("EUR");
  });

  it("name がない場合は symbol の先頭3文字を返す", () => {
    expect(getBaseCurrency("", "USDJPY=X")).toBe("USD");
    expect(getBaseCurrency("", "GBPJPY=X")).toBe("GBP");
  });

  it("name と symbol が両方空の場合は 'USD' を返す", () => {
    expect(getBaseCurrency("", "")).toBe("USD");
    expect(getBaseCurrency("", "AB")).toBe("USD"); // 3文字未満
  });

  it("name の前後の空白がトリムされる", () => {
    expect(getBaseCurrency("  USD / JPY", "USDJPY=X")).toBe("USD");
  });
});
