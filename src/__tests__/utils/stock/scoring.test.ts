import { describe, it, expect } from "vitest";
import { calculateStockTotalJudgment } from "@/utils/stock/scoring";
import type { TechnicalAnalysisResult } from "@/utils/stock/technical";
import type { FundamentalAnalysisResult } from "@/utils/stock/fundamental";
import type { ValuationAnalysisResult } from "@/utils/stock/valuation";
import type { ShareholderReturnResult } from "@/utils/stock/shareholder";

// モックデータファクトリ
function makeTech(score: number, trend: "bullish" | "bearish" | "neutral" = "neutral"): TechnicalAnalysisResult {
  return { score, trend, reasons: [`テクニカルスコア: ${score}`] };
}

function makeFund(score: number): FundamentalAnalysisResult {
  return {
    score,
    growthProfile: "Stable",
    financialHealth: "Healthy",
    reasons: [`ファンダメンタルスコア: ${score}`],
  };
}

function makeVal(score: number): ValuationAnalysisResult {
  return { score, label: "適正", reasons: [`バリュエーションスコア: ${score}`] };
}

function makeDiv(score: number): ShareholderReturnResult {
  return {
    score,
    profile: "Dividend",
    suitability: "good_for_long_term",
    reasons: [`配当スコア: ${score}`],
  };
}

// ===== calculateStockTotalJudgment =====
describe("calculateStockTotalJudgment", () => {
  it("基本フィールドが正しく返る", () => {
    const result = calculateStockTotalJudgment(
      "7203", "トヨタ自動車", "自動車", 2500,
      makeTech(0), makeFund(0), makeVal(0), makeDiv(0)
    );
    expect(result.ticker).toBe("7203");
    expect(result.companyName).toBe("トヨタ自動車");
    expect(result.sector).toBe("自動車");
    expect(result.currentPrice).toBe(2500);
    expect(result.syncStatus).toBe("completed");
  });

  it("全スコアがゼロの場合、totalScore は 0 で signalLabel は '中立'", () => {
    const result = calculateStockTotalJudgment(
      "7203", "トヨタ", "自動車", 2500,
      makeTech(0), makeFund(0), makeVal(0), makeDiv(0)
    );
    expect(result.totalScore).toBe(0);
    expect(result.signalLabel).toBe("中立");
  });

  it("高スコアの場合 '買い優勢' になる (totalScore >= 60)", () => {
    // tech*0.25 + fund*0.35 + val*0.25 + div*0.15 = 100*0.25+100*0.35+100*0.25+100*0.15 = 100
    const result = calculateStockTotalJudgment(
      "7203", "トヨタ", "自動車", 2500,
      makeTech(100), makeFund(100), makeVal(100), makeDiv(100)
    );
    expect(result.totalScore).toBe(100);
    expect(result.signalLabel).toBe("買い優勢");
  });

  it("低スコアの場合 '売り優勢' になる (totalScore <= -60)", () => {
    const result = calculateStockTotalJudgment(
      "7203", "トヨタ", "自動車", 2500,
      makeTech(-100), makeFund(-100), makeVal(-100), makeDiv(-100)
    );
    expect(result.totalScore).toBe(-100);
    expect(result.signalLabel).toBe("売り優勢");
  });

  it("中程度の買いシグナル: totalScore 25-59 は 'やや買い'", () => {
    // tech=40*0.25 + fund=40*0.35 + val=40*0.25 + div=40*0.15 = 40
    const result = calculateStockTotalJudgment(
      "7203", "トヨタ", "自動車", 2500,
      makeTech(40), makeFund(40), makeVal(40), makeDiv(40)
    );
    expect(result.signalLabel).toBe("やや買い");
  });

  it("テクニカル過熱 + ファンダ強力 → '押し目待ち' に変化する", () => {
    // tech < -20, fund > 40, かつ合計はやや買いレンジ
    const result = calculateStockTotalJudgment(
      "7203", "トヨタ", "自動車", 2500,
      makeTech(-30, "bearish"),  // テクニカルが過熱（売られすぎ）
      makeFund(80),              // ファンダ強力
      makeVal(20),
      makeDiv(20)
    );
    // totalScore = -30*0.25 + 80*0.35 + 20*0.25 + 20*0.15
    //            = -7.5 + 28 + 5 + 3 = 28.5 → round → 29 → "やや買い" → '押し目待ち' に変化
    expect(result.signalLabel).toBe("押し目待ち");
  });

  it("重み付けが正しく計算される (tech:25, fund:35, val:25, div:15)", () => {
    const result = calculateStockTotalJudgment(
      "7203", "トヨタ", "自動車", 2500,
      makeTech(80),   // 80 * 0.25 = 20
      makeFund(40),   // 40 * 0.35 = 14
      makeVal(60),    // 60 * 0.25 = 15
      makeDiv(0)      // 0  * 0.15 = 0
      // 合計 = 49
    );
    expect(result.totalScore).toBe(49);
  });

  it("全指標が一致する場合、certainty が 90 になる", () => {
    const result = calculateStockTotalJudgment(
      "7203", "トヨタ", "自動車", 2500,
      makeTech(70), makeFund(70), makeVal(70), makeDiv(70)
    );
    expect(result.certainty).toBe(90);
  });

  it("chartData が空配列で初期化される", () => {
    const result = calculateStockTotalJudgment(
      "7203", "トヨタ", "自動車", 2500,
      makeTech(0), makeFund(0), makeVal(0), makeDiv(0)
    );
    expect(result.chartData).toEqual([]);
  });

  it("summaryComment が空でない文字列を返す", () => {
    const result = calculateStockTotalJudgment(
      "7203", "トヨタ", "自動車", 2500,
      makeTech(80), makeFund(80), makeVal(80), makeDiv(80)
    );
    expect(typeof result.summaryComment).toBe("string");
    expect(result.summaryComment.length).toBeGreaterThan(0);
  });
});
