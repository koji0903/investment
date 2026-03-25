"use server";

import YahooFinance from "yahoo-finance2";
const yf = new YahooFinance();
import { FXJudgment, FXPairMaster, CurrencyFundamental } from "@/types/fx";
import { analyzeTechnical } from "@/utils/fx/technical";
import { analyzeFundamental } from "@/utils/fx/fundamental";
import { evaluateSwap, calculateTotalJudgment } from "@/utils/fx/scoring";
import { calculateEnergyAnalysis } from "@/utils/fx/energy";
import { calculateEntryTiming } from "@/utils/fx/entry";
import { calculatePositionSizing } from "@/utils/fx/position";
import { calculateATR, calculatePivotPoints } from "@/lib/technicalAnalysis";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDocs, collection, query, orderBy } from "firebase/firestore";
import { consolidateJudgments } from "@/utils/fx/scoring";

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
 * 個別の通貨ペアを同期する内部関数
 */
async function syncSpecificPair(pair: FXPairMaster): Promise<FXJudgment> {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 360);
  const symbol = toYahooSymbol(pair.pairCode);
  
  let judgment: FXJudgment | null = null;
  
  try {
    // 1. Yahoo Finance からデータを取得
    const historical = await yf.historical(symbol, {
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
      const lastDay = historical[historical.length - 1];
      const pivots = calculatePivotPoints(lastDay.high, lastDay.low, lastDay.close);
      judgment.energyAnalysis = calculateEnergyAnalysis(prices, highs, lows, currentPrice, pivots);

      // エントリータイミング最適化を追加
      const atrArr = calculateATR({ high: highs, low: lows, close: prices }, 14);
      const atr = atrArr[atrArr.length - 1] || (currentPrice * 0.005);
      const recentHigh = Math.max(...highs.slice(-20));
      const recentLow = Math.min(...lows.slice(-20));
      
      judgment.entryTimingAnalysis = calculateEntryTiming(
        pair.pairCode, currentPrice, technical, judgment.energyAnalysis,
        atr, recentHigh, recentLow
      );

      // ポジションサイズ自動調整を追加
      judgment.positionSizing = calculatePositionSizing(
        pair.pairCode, judgment.entryTimingAnalysis, judgment.energyAnalysis
      );

      // 統合と矛盾解消
      judgment = consolidateJudgments(judgment, judgment.energyAnalysis, judgment.entryTimingAnalysis);
      
      judgment.syncStatus = "completed";
      judgment.lastSyncAt = new Date().toISOString();
    } else {
      throw new Error(`Insufficient historical data for ${pair.pairCode} (found ${historical?.length || 0} days)`);
    }
  } catch (e: any) {
    console.error(`[FX] Sync error for ${pair.pairCode}:`, e.message);
    const errorMessage = e.message || "同期エラー";
    
    // エラー時はフォールバックを作成
    const isJPY = pair.quoteCurrency === "JPY";
    const dummyPrice = isJPY ? 150.0 + (Math.random() * 2) : 1.1 + (Math.random() * 0.05);
    const swaps = getSemiRealSwaps(pair.pairCode);
    const swapEval = evaluateSwap(swaps.buy, swaps.sell);
    const fundamental = analyzeFundamental(
      FIXED_CURRENCY_FUNDAMENTALS[pair.baseCurrency],
      FIXED_CURRENCY_FUNDAMENTALS[pair.quoteCurrency]
    );
    
    const energy = calculateEnergyAnalysis([dummyPrice], [dummyPrice], [dummyPrice], dummyPrice);
    
    judgment = {
      pairCode: pair.pairCode,
      baseCurrency: pair.baseCurrency,
      quoteCurrency: pair.quoteCurrency,
      currentPrice: dummyPrice,
      technicalScore: 0,
      technicalTrend: "neutral",
      technicalReasons: ["テクニカル分析データ同期中..."],
      fundamentalScore: fundamental.score,
      macroBias: fundamental.macroBias,
      fundamentalReasons: fundamental.reasons,
      buySwap: swaps.buy,
      sellSwap: swaps.sell,
      swapScore: swapEval.score,
      swapDirection: swapEval.swapDirection,
      swapComment: swapEval.swapComment,
      holdingStyle: swapEval.holdingStyle,
      totalScore: Math.round(fundamental.score * 0.4 + swapEval.score * 0.2),
      signalLabel: "中立",
      confidence: "低",
      summaryComment: `同期エラー: ${errorMessage}。現在再試行の待機中です。`,
      shortTermSignal: "中立",
      mediumTermSignal: "中立",
      suitability: "様子見推奨",
      energyAnalysis: energy,
      certainty: 10,
      safetyScore: 0,
      syncStatus: "failed",
      updatedAt: new Date().toISOString()
    };

    judgment.entryTimingAnalysis = calculateEntryTiming(
      pair.pairCode, dummyPrice, undefined, energy, dummyPrice * 0.005, dummyPrice * 1.01, dummyPrice * 0.99
    );

    judgment = consolidateJudgments(judgment!, judgment.energyAnalysis, judgment.entryTimingAnalysis);
  }

  // 保存
  if (judgment) {
    await setDoc(doc(db, "fx_judgments", pair.pairCode.replace("/", "-")), judgment);
  }
  return judgment!;
}

/**
 * 特定の通貨ペアのみを同期する Server Action
 */
export async function syncSpecificPairAction(pairCode: string) {
  const pair = SUPPORTED_PAIRS.find(p => p.pairCode === pairCode);
  if (!pair) return { success: false, message: "Unsupported pair" };
  
  try {
    const result = await syncSpecificPair(pair);
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (err: any) {
    console.error(`Sync specific pair failed for ${pairCode}:`, err);
    return { success: false, message: err.message };
  }
}

/**
 * 実データを非同期に同期を開始する
 */
export async function syncFXRealData() {
  (async () => {
    try {
      for (const pair of SUPPORTED_PAIRS) {
        await syncSpecificPair(pair);
        await new Promise(r => setTimeout(r, 200)); 
      }
    } catch (err) {
      console.error("Background sync fatal error:", err);
    }
  })().catch(err => console.error("Background sync failure:", err));

  return { success: true, message: "Background sync started" };
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

    // 全てのサポートされているペアに対してデータを網羅する (マージ)
    const dataMap = new Map(data.map(d => [d.pairCode, d]));
    const mergedData: FXJudgment[] = SUPPORTED_PAIRS.map(pair => {
      const existing = dataMap.get(pair.pairCode);
      if (existing) return existing;

      // 存在しない場合は「同期中/保留中」のプレースホルダーを生成
      const isJPY = pair.quoteCurrency === "JPY";
      const dummyPrice = isJPY ? 150.0 : 1.1;
      const swaps = getSemiRealSwaps(pair.pairCode);
      const fundamental = analyzeFundamental(
        FIXED_CURRENCY_FUNDAMENTALS[pair.baseCurrency],
        FIXED_CURRENCY_FUNDAMENTALS[pair.quoteCurrency]
      );

      return {
        pairCode: pair.pairCode,
        baseCurrency: pair.baseCurrency,
        quoteCurrency: pair.quoteCurrency,
        currentPrice: dummyPrice,
        technicalScore: 0,
        technicalTrend: "neutral",
        technicalReasons: ["テクニカル分析データ取得中..."],
        fundamentalScore: fundamental.score,
        macroBias: fundamental.macroBias,
        fundamentalReasons: fundamental.reasons,
        buySwap: swaps.buy,
        sellSwap: swaps.sell,
        swapScore: 0,
        swapDirection: "neutral",
        swapComment: "スワップ情報取得中...",
        holdingStyle: "short_term_only",
        totalScore: 0,
        signalLabel: "中立",
        confidence: "低",
        summaryComment: "現在リアルタイムデータを同期中です。もうしばらくお待ちください。",
        shortTermSignal: "中立",
        mediumTermSignal: "中立",
        suitability: "様子見推奨",
        certainty: 0,
        safetyScore: 0,
        syncStatus: "pending",
        updatedAt: new Date().toISOString()
      } as FXJudgment;
    });

    // 件数が足りない場合、または全くない（権限エラー含む）場合は同期を走らせる
    if (data.length < SUPPORTED_PAIRS.length) {
      console.log(`[FX] Data count incomplete (${data.length}/21). Triggering background-sync...`);
      syncFXRealData(); 
    }

    return JSON.parse(JSON.stringify(mergedData.sort((a, b) => b.totalScore - a.totalScore)));
  } catch (err) {
    console.error("Critical error in getFXJudgmentsAction:", err);
    return [];
  }
}

export async function generateFXDummyDataAction(): Promise<FXJudgment[]> {
  await syncFXRealData();
  return getFXJudgmentsAction();
}
