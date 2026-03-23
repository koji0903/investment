"use server";

import yahooFinance from "yahoo-finance2";
import { FXJudgment, FXPairMaster, CurrencyFundamental } from "@/types/fx";
import { analyzeTechnical } from "@/utils/fx/technical";
import { analyzeFundamental } from "@/utils/fx/fundamental";
import { evaluateSwap, calculateTotalJudgment } from "@/utils/fx/scoring";
import { calculateEnergyAnalysis } from "@/utils/fx/energy";
import { calculateEntryTiming } from "@/utils/fx/entry";
import { calculatePositionSizing } from "@/utils/fx/position";
import { calculateATR } from "@/lib/technicalAnalysis";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDocs, collection, query } from "firebase/firestore";

// 対象とする通貨ペア
const SUPPORTED_PAIRS: FXPairMaster[] = [
  { pairCode: "USD/JPY", baseCurrency: "USD", quoteCurrency: "JPY" },
  { pairCode: "EUR/JPY", baseCurrency: "EUR", quoteCurrency: "JPY" },
  { pairCode: "GBP/JPY", baseCurrency: "GBP", quoteCurrency: "JPY" },
  { pairCode: "AUD/JPY", baseCurrency: "AUD", quoteCurrency: "JPY" },
  { pairCode: "NZD/JPY", baseCurrency: "NZD", quoteCurrency: "JPY" },
  { pairCode: "CAD/JPY", baseCurrency: "CAD", quoteCurrency: "JPY" },
  { pairCode: "CHF/JPY", baseCurrency: "CHF", quoteCurrency: "JPY" },
  { pairCode: "ZAR/JPY", baseCurrency: "ZAR", quoteCurrency: "JPY" },
  { pairCode: "MXN/JPY", baseCurrency: "MXN", quoteCurrency: "JPY" },
  { pairCode: "TRY/JPY", baseCurrency: "TRY", quoteCurrency: "JPY" },
  { pairCode: "EUR/USD", baseCurrency: "EUR", quoteCurrency: "USD" },
  { pairCode: "GBP/USD", baseCurrency: "GBP", quoteCurrency: "USD" },
  { pairCode: "AUD/USD", baseCurrency: "AUD", quoteCurrency: "USD" },
  { pairCode: "NZD/USD", baseCurrency: "NZD", quoteCurrency: "USD" },
  { pairCode: "USD/CAD", baseCurrency: "USD", quoteCurrency: "CAD" },
  { pairCode: "USD/CHF", baseCurrency: "USD", quoteCurrency: "CHF" },
  { pairCode: "EUR/GBP", baseCurrency: "EUR", quoteCurrency: "GBP" },
  { pairCode: "EUR/AUD", baseCurrency: "EUR", quoteCurrency: "AUD" },
  { pairCode: "GBP/AUD", baseCurrency: "GBP", quoteCurrency: "AUD" },
  { pairCode: "EUR/CHF", baseCurrency: "EUR", quoteCurrency: "CHF" },
  { pairCode: "AUD/NZD", baseCurrency: "AUD", quoteCurrency: "NZD" },
];

const FIXED_CURRENCY_FUNDAMENTALS: Record<string, CurrencyFundamental> = {
  USD: { currencyCode: "USD", interestRate: 5.5, inflationScore: 6, growthScore: 7, centralBankBias: "hawkish", riskSensitivity: 0, safeHavenScore: 8, commodityLinkedScore: 0, updatedAt: new Date().toISOString() },
  JPY: { currencyCode: "JPY", interestRate: 0.1, inflationScore: 2, growthScore: 1, centralBankBias: "dovish", riskSensitivity: 0, safeHavenScore: 10, commodityLinkedScore: 0, updatedAt: new Date().toISOString() },
  EUR: { currencyCode: "EUR", interestRate: 4.5, inflationScore: 5, growthScore: 3, centralBankBias: "neutral", riskSensitivity: 0, safeHavenScore: 5, commodityLinkedScore: 0, updatedAt: new Date().toISOString() },
  GBP: { currencyCode: "GBP", interestRate: 5.25, inflationScore: 7, growthScore: 4, centralBankBias: "hawkish", riskSensitivity: 0, safeHavenScore: 3, commodityLinkedScore: 0, updatedAt: new Date().toISOString() },
  AUD: { currencyCode: "AUD", interestRate: 4.35, inflationScore: 4, growthScore: 5, centralBankBias: "neutral", riskSensitivity: 8, safeHavenScore: 0, commodityLinkedScore: 9, updatedAt: new Date().toISOString() },
  NZD: { currencyCode: "NZD", interestRate: 5.5, inflationScore: 4, growthScore: 4, centralBankBias: "neutral", riskSensitivity: 8, safeHavenScore: 0, commodityLinkedScore: 7, updatedAt: new Date().toISOString() },
  CAD: { currencyCode: "CAD", interestRate: 5.0, inflationScore: 3, growthScore: 6, centralBankBias: "dovish", riskSensitivity: 5, safeHavenScore: 0, commodityLinkedScore: 8, updatedAt: new Date().toISOString() },
  CHF: { currencyCode: "CHF", interestRate: 1.5, inflationScore: 1, growthScore: 2, centralBankBias: "dovish", riskSensitivity: 0, safeHavenScore: 9, commodityLinkedScore: 0, updatedAt: new Date().toISOString() },
  ZAR: { currencyCode: "ZAR", interestRate: 8.25, inflationScore: 7, growthScore: 2, centralBankBias: "hawkish", riskSensitivity: 9, safeHavenScore: 0, commodityLinkedScore: 8, updatedAt: new Date().toISOString() },
  MXN: { currencyCode: "MXN", interestRate: 11.25, inflationScore: 5, growthScore: 4, centralBankBias: "hawkish", riskSensitivity: 7, safeHavenScore: 0, commodityLinkedScore: 6, updatedAt: new Date().toISOString() },
  TRY: { currencyCode: "TRY", interestRate: 45.0, inflationScore: 10, growthScore: 1, centralBankBias: "hawkish", riskSensitivity: 6, safeHavenScore: 0, commodityLinkedScore: 2, updatedAt: new Date().toISOString() },
};

function toYahooSymbol(pairCode: string): string {
  return pairCode.replace("/", "") + "=X";
}

function getSemiRealSwaps(pair: string) {
  const [base, quote] = pair.split("/");
  const baseRate = FIXED_CURRENCY_FUNDAMENTALS[base]?.interestRate || 0;
  const quoteRate = FIXED_CURRENCY_FUNDAMENTALS[quote]?.interestRate || 0;
  const diff = baseRate - quoteRate;
  const factor = 40;
  return { buy: Math.round(diff * factor), sell: Math.round(-diff * factor - 20) };
}

/**
 * 実データを全銘柄分同期する。失敗時はシミュレートデータを保存する。
 */
export async function syncFXRealData() {
  const results: FXJudgment[] = [];
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 360); // 1年弱のデータ。200日線などの長期指標を確実に。

  for (const pair of SUPPORTED_PAIRS) {
    let judgment: FXJudgment | null = null;
    try {
      const symbol = toYahooSymbol(pair.pairCode);
      // 通貨ペアごとの過去データを取得 (キャッシュ回避のため new Date() を使用)
      const historical: any[] = await (yahooFinance as any).historical(symbol, {
        period1: start,
        period2: end,
        interval: "1d"
      }).catch((err: any) => {
        console.warn(`[FX] Data fetch failed for ${pair.pairCode}:`, err.message);
        return [];
      });

      if (historical && historical.length >= 10) {
        const prices = historical.map(h => h.close).filter(p => typeof p === "number");
        const highs = historical.map(h => h.high).filter(p => typeof p === "number");
        const lows = historical.map(h => h.low).filter(p => typeof p === "number");
        
        const currentPrice = prices[prices.length - 1];
        const technical = analyzeTechnical(prices, currentPrice);
        const fundamental = analyzeFundamental(
          FIXED_CURRENCY_FUNDAMENTALS[pair.baseCurrency],
          FIXED_CURRENCY_FUNDAMENTALS[pair.quoteCurrency]
        );
        const swaps = getSemiRealSwaps(pair.pairCode);
        const swapEval = evaluateSwap(swaps.buy, swaps.sell);

        judgment = calculateTotalJudgment(
          pair.pairCode, pair.baseCurrency, pair.quoteCurrency,
          currentPrice, technical, fundamental, swapEval
        );

        // 相場エネルギー分析を追加
        const { calculatePivotPoints } = await import("@/lib/technicalAnalysis");
        const lastDay = historical[historical.length - 1];
        const pivots = calculatePivotPoints(lastDay.high, lastDay.low, lastDay.close);
        
        judgment.energyAnalysis = calculateEnergyAnalysis(prices, highs, lows, currentPrice, pivots);

        // エントリータイミング最適化を追加
        const atrArr = calculateATR({ high: highs, low: lows, close: prices }, 14);
        const atr = atrArr[atrArr.length - 1] || (currentPrice * 0.005);
        const recentHigh = Math.max(...highs.slice(-20)); // 過去20日の高値
        const recentLow = Math.min(...lows.slice(-20));  // 過去20日の安値
        
        judgment.entryTimingAnalysis = calculateEntryTiming(
          pair.pairCode,
          currentPrice,
          technical,
          judgment.energyAnalysis,
          atr,
          recentHigh,
          recentLow
        );

        // ポジションサイズ自動調整を追加
        judgment.positionSizing = calculatePositionSizing(
          pair.pairCode,
          judgment.entryTimingAnalysis,
          judgment.energyAnalysis
        );

        // 【最重要】判断の統合と矛盾解消
        const { consolidateJudgments } = await import("@/utils/fx/scoring");
        judgment = consolidateJudgments(judgment, judgment.energyAnalysis, judgment.entryTimingAnalysis);
      }
    } catch (e) {
      console.error(`Sync error for ${pair.pairCode}:`, e);
    }

    // データが取れない、またはエラー時はシミュレーション値で埋める
    if (!judgment) {
      const isJPY = pair.quoteCurrency === "JPY";
      const dummyPrice = isJPY ? 150.0 + (Math.random() * 2) : 1.1 + (Math.random() * 0.05);
      const isHighYield = ["ZAR", "MXN", "TRY"].includes(pair.baseCurrency);
      const swaps = getSemiRealSwaps(pair.pairCode);
      
      const energyScore = 40 + Math.floor(Math.random() * 30);
      const { calculateEnergyAnalysis } = await import("@/utils/fx/energy");
      const { calculateEntryTiming } = await import("@/utils/fx/entry");
      const { consolidateJudgments } = await import("@/utils/fx/scoring");

      // ダミー価格に基づいたエネルギー分析
      const energy = calculateEnergyAnalysis([dummyPrice], [dummyPrice], [dummyPrice], dummyPrice);
      
      judgment = {
        pairCode: pair.pairCode,
        baseCurrency: pair.baseCurrency,
        quoteCurrency: pair.quoteCurrency,
        currentPrice: dummyPrice,
        technicalScore: 0,
        technicalTrend: "neutral",
        technicalReasons: ["データ取得待機中"],
        fundamentalScore: isHighYield ? 30 : 10,
        macroBias: "neutral",
        fundamentalReasons: ["ファンダメンタル分析待機中"],
        buySwap: swaps.buy,
        sellSwap: swaps.sell,
        swapScore: isHighYield ? 40 : 20,
        swapDirection: diffToDirection(swaps.buy),
        swapComment: isHighYield ? "高金利通貨としてのスワップ魅力あり" : "スワップ金利を確認中",
        holdingStyle: isHighYield ? "medium_term_long" : "short_term_only",
        totalScore: 10,
        signalLabel: "中立",
        confidence: "低",
        summaryComment: "現在リアルタイムデータを同期中です。完了までしばらくお待ちください。",
        shortTermSignal: "中立",
        mediumTermSignal: "中立",
        suitability: "様子見推奨",
        energyAnalysis: energy,
        certainty: 10,
        updatedAt: new Date().toISOString()
      };

      judgment.entryTimingAnalysis = calculateEntryTiming(
        pair.pairCode,
        dummyPrice,
        undefined,
        energy,
        dummyPrice * 0.005,
        dummyPrice * 1.01,
        dummyPrice * 0.99
      );

      // 最終統合
      judgment = consolidateJudgments(judgment, judgment.energyAnalysis, judgment.entryTimingAnalysis);
    }

    try {
      await setDoc(doc(db, "fx_judgments", pair.pairCode.replace("/", "-")), judgment);
    } catch (err) {
      console.warn(`[FX] Failed to save ${pair.pairCode} to Firestore, but continuing...`);
    }
    
    results.push(judgment);
    
    // APIレート制限回避のための待機
    await new Promise(r => setTimeout(r, 50));
  }

  return { 
    success: true, 
    count: results.length, 
    data: results.sort((a, b) => b.totalScore - a.totalScore),
    updatedAt: new Date().toISOString()
  };
}

function diffToDirection(buySwap: number): any {
  return buySwap > 0 ? "long_positive" : buySwap < 0 ? "short_positive" : "neutral";
}

/**
 * 確実に全21件のデータを返す
 */
export async function getFXJudgmentsAction(): Promise<FXJudgment[]> {
  try {
    const snapshot = await getDocs(collection(db, "fx_judgments")).catch(err => {
      console.warn("[FX] Firestore read failed (Permission denied?):", err);
      return null;
    });

    let data: FXJudgment[] = [];
    if (snapshot && !snapshot.empty) {
      data = snapshot.docs.map(doc => doc.data() as FXJudgment);
    }

    // 件数が足りない場合、または全くない（権限エラー含む）場合は同期を走らせる
    if (data.length < SUPPORTED_PAIRS.length) {
      console.log(`[FX] Data count mismatch or read error (${data.length}/21). Triggering memory-sync...`);
      const syncRes = await syncFXRealData();
      
      // 保存の成否に関わらず、生成された 21 件のデータを最優先で使う
      if (syncRes.success && syncRes.data && syncRes.data.length >= SUPPORTED_PAIRS.length) {
        data = syncRes.data;
      }
    }

    // クライアントに渡す前にシリアライズ可能にする
    return JSON.parse(JSON.stringify(data.sort((a, b) => b.totalScore - a.totalScore)));
  } catch (err) {
    console.error("Critical error in getFXJudgmentsAction:", err);
    // 最終手段として同期を試みてその場で返す
    try {
      const fallback = await syncFXRealData();
      return JSON.parse(JSON.stringify(fallback.data || []));
    } catch {
      return [];
    }
  }
}

export async function generateFXDummyDataAction(): Promise<FXJudgment[]> {
  await syncFXRealData();
  return getFXJudgmentsAction();
}
