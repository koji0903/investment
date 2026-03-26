"use server";

import YahooFinance from "yahoo-finance2";
const yf = new YahooFinance();
import { 
  FXJudgment, 
  FXPairMaster, 
  CurrencyFundamental, 
  SUPPORTED_PAIRS 
} from "@/types/fx";
import { analyzeTechnical } from "@/utils/fx/technical";
import { analyzeFundamental } from "@/utils/fx/fundamental";
import { evaluateSwap, calculateTotalJudgment } from "@/utils/fx/scoring";
import { calculateEnergyAnalysis } from "@/utils/fx/energy";
import { calculateEntryTiming } from "@/utils/fx/entry";
import { calculatePositionSizing } from "@/utils/fx/position";
import { calculateATR, calculatePivotPoints } from "@/lib/technicalAnalysis";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDocs, getDoc, collection, query, orderBy } from "firebase/firestore";
import { consolidateJudgments } from "@/utils/fx/scoring";

// マスタ情報の定義は types/fx.ts に移動

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
async function syncSpecificPair(userId: string, portfolioId: string, pair: FXPairMaster): Promise<FXJudgment> {
  const end = new Date();
  // ... (ロジックは同一のため省略表示)
  const start = new Date();
  start.setDate(end.getDate() - 360);
  const symbol = toYahooSymbol(pair.pairCode);
  
  let judgment: FXJudgment | null = null;
  
  try {
    // 1. Yahoo Finance からデータを取得
    let historical: any[] = [];
    
    const fetchHistory = async (s: string) => {
      const timeoutMillis = 30000;
      const timeoutPromise = new Promise<any[]>((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout fetching ${s}`)), timeoutMillis)
      );

      const fetchPromise = (async () => {
        try {
          const chart = await yf.chart(s, { period1: start, period2: end, interval: "1d" });
          if (chart && chart.quotes && chart.quotes.length >= 10) {
            return chart.quotes.filter(q => q.close !== null && q.close !== undefined);
          }
        } catch (err) {}
        try {
          const shortStart = new Date();
          shortStart.setDate(end.getDate() - 60);
          const chart = await yf.chart(s, { period1: shortStart, period2: end, interval: "1d" });
          if (chart && chart.quotes && chart.quotes.length >= 3) {
            return chart.quotes.filter(q => q.close !== null && q.close !== undefined);
          }
        } catch (err) {}
        return await yf.historical(s, { period1: start, period2: end, interval: "1d" }).catch(() => []);
      })();

      return await Promise.race([fetchPromise, timeoutPromise]);
    };

    historical = await fetchHistory(symbol);
    if (historical.length < 10 && pair.pairCode === "USD/JPY") {
      historical = await fetchHistory("JPY=X");
    }

    if (historical && historical.length > 0) {
      const prices = historical.map(h => h.close).filter(p => typeof p === "number");
      const highs = historical.map(h => h.high || h.close).filter(p => typeof p === "number");
      const lows = historical.map(h => h.low || h.close).filter(p => typeof p === "number");
      
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

      const lastDay = historical[historical.length - 1];
      const pivots = calculatePivotPoints(lastDay.high || currentPrice, lastDay.low || currentPrice, lastDay.close || currentPrice);
      judgment.energyAnalysis = calculateEnergyAnalysis(prices, highs, lows, currentPrice, pivots);

      const atrArr = calculateATR({ high: highs, low: lows, close: prices }, 14);
      const atr = atrArr[atrArr.length - 1] || (currentPrice * 0.005);
      const recentHigh = Math.max(...highs.slice(-20));
      const recentLow = Math.min(...lows.slice(-20));
      
      judgment.entryTimingAnalysis = calculateEntryTiming(
        pair.pairCode, currentPrice, technical, judgment.energyAnalysis,
        atr, recentHigh, recentLow
      );

      judgment.positionSizing = calculatePositionSizing(
        pair.pairCode, judgment.entryTimingAnalysis, judgment.energyAnalysis
      );

      judgment.chartData = historical.slice(-180).map(h => ({
        date: new Date(h.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
        value: h.close || 0
      }));
      
      judgment = consolidateJudgments(judgment, judgment.energyAnalysis, judgment.entryTimingAnalysis);
      judgment.syncStatus = "completed";
      judgment.lastSyncAt = new Date().toISOString();
    } else {
      throw new Error(`Data not found for ${pair.pairCode}`);
    }
  } catch (e: any) {
    const errorMsg = e.message || "同期エラー";
    const fundamental = analyzeFundamental(FIXED_CURRENCY_FUNDAMENTALS[pair.baseCurrency], FIXED_CURRENCY_FUNDAMENTALS[pair.quoteCurrency]);
    judgment = {
      pairCode: pair.pairCode, baseCurrency: pair.baseCurrency, quoteCurrency: pair.quoteCurrency,
      currentPrice: 0, technicalScore: 0, technicalTrend: "neutral", technicalReasons: ["データ取得失敗"],
      fundamentalScore: fundamental.score, macroBias: fundamental.macroBias, fundamentalReasons: fundamental.reasons,
      buySwap: 0, sellSwap: 0, swapScore: 0, swapDirection: "neutral", swapComment: "", holdingStyle: "short_term_only",
      totalScore: 0, signalLabel: "中立", confidence: "低", summaryComment: `同期エラー: ${errorMsg}`,
      syncStatus: "failed", chartData: [], updatedAt: new Date().toISOString()
    } as any;
  }

  // ユーザー別のパスへ保存
  try {
    if (judgment && userId && portfolioId) {
      const path = `users/${userId}/portfolios/${portfolioId}/fx_judgments`;
      await setDoc(doc(db, path, pair.pairCode.replace("/", "-")), judgment);
    }
  } catch (err) {
    console.error(`[FX] User-specific save failed for ${pair.pairCode}:`, err);
  }
  return judgment!;
}

/**
 * 同期開始フラグを立てる Server Action
 */
export async function setSyncingStatusAction(userId: string, portfolioId: string, pairCode: string) {
  if (!userId || !portfolioId) return { success: false };
  try {
    const path = `users/${userId}/portfolios/${portfolioId}/fx_judgments`;
    const docRef = doc(db, path, pairCode.replace("/", "-"));
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      await setDoc(docRef, { 
        ...docSnap.data(), 
        syncStatus: "syncing",
        updatedAt: new Date().toISOString()
      });
    } else {
      const [base, quote] = pairCode.split("/");
      await setDoc(docRef, {
        pairCode, baseCurrency: base, quoteCurrency: quote,
        currentPrice: 0, syncStatus: "syncing", updatedAt: new Date().toISOString()
      });
    }
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}

/**
 * 特定の通貨ペアのみを同期する Server Action
 * 注: Firestoreへの保存が失敗しても、計算した分析結果データ自体を返却する（オプティミスティック更新用）
 */
/**
 * 特定の通貨ペアのみを同期する Server Action
 */
export async function syncSpecificPairAction(userId: string, portfolioId: string, pairCode: string): Promise<{ success: boolean; data: FXJudgment; message?: string }> {
  if (!userId || !portfolioId) return { success: false, data: {} as any };
  const pair = SUPPORTED_PAIRS.find(p => p.pairCode === pairCode);
  if (!pair) return { success: false, data: {} as any };
  
  try {
    const path = `users/${userId}/portfolios/${portfolioId}/fx_judgments`;
    const normalizedId = pairCode.replace("/", "-");
    const docRef = doc(db, path, normalizedId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const existingData = docSnap.data() as FXJudgment;
      const lastUpdated = new Date(existingData.updatedAt).getTime();
      const sixHoursInMs = 6 * 60 * 60 * 1000;
      
      if (Date.now() - lastUpdated < sixHoursInMs && existingData.syncStatus === 'completed') {
        return { success: true, data: JSON.parse(JSON.stringify(existingData)) };
      }
    }

    const result = await syncSpecificPair(userId, portfolioId, pair);
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (err: any) {
    return { success: false, message: err.message, data: { pairCode, syncStatus: "failed", updatedAt: new Date().toISOString() } as any };
  }
}

/**
 * 実データを非同期に同期を開始する
 */
export async function syncFXRealData(userId: string, portfolioId: string) {
  if (!userId || !portfolioId) return { success: false };
  (async () => {
    try {
      const CHUNK_SIZE = 3;
      for (let i = 0; i < SUPPORTED_PAIRS.length; i += CHUNK_SIZE) {
        const chunk = SUPPORTED_PAIRS.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(pair => syncSpecificPair(userId, portfolioId, pair)));
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000)); 
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
export async function getFXJudgmentsAction(userId: string, portfolioId: string): Promise<FXJudgment[]> {
  if (!userId || !portfolioId) return [];
  try {
    const path = `users/${userId}/portfolios/${portfolioId}/fx_judgments`;
    const snapshot = await getDocs(collection(db, path)).catch(err => {
      console.warn("[FX] Firestore read failed:", err);
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
        chartData: [],
        updatedAt: new Date().toISOString()
      } as FXJudgment;
    });

    // 件数が足りない場合、または全くない場合は同期を走らせる
    if (data.length < SUPPORTED_PAIRS.length) {
      console.log(`[FX] Data count incomplete (${data.length}/21).`);
      // バックグラウンド同期は userId が必要なため、ここではトリガーせず UI 側で制御
    }

    return JSON.parse(JSON.stringify(mergedData.sort((a, b) => b.totalScore - a.totalScore)));
  } catch (err) {
    console.error("Critical error in getFXJudgmentsAction:", err);
    return [];
  }
}

export async function generateFXDummyDataAction(userId: string, portfolioId: string): Promise<FXJudgment[]> {
  await syncFXRealData(userId, portfolioId);
  return getFXJudgmentsAction(userId, portfolioId);
}
