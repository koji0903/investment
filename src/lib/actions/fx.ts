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
import { consolidateJudgments } from "@/utils/fx/scoring";
import { calculateDecision } from "@/utils/investment/decisionEngine";
import { saveInvestmentDecision } from "@/lib/db";

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
      judgment.updatedAt = new Date().toISOString();

      // --- 投資意思決定エンジンの統合 ---
      try {
        if (userId && judgment.entryTimingAnalysis) {
          const entry = judgment.entryTimingAnalysis;
          const estimatedWinRate = judgment.totalScore > 70 ? 0.60 : judgment.totalScore > 50 ? 0.52 : 0.45;
          
          const decision = calculateDecision(pair.pairCode, {
            winRate: estimatedWinRate,
            targetPrice: entry.targetPrice || (currentPrice * 1.02),
            stopPrice: entry.invalidationPrice || (currentPrice * 0.99),
            currentPrice: currentPrice,
            currentDrawdown: 1.2, // デモ値
            sectorExposure: 10,    // デモ値（FXの場合は通貨露出として扱う）
            trendStrength: judgment.technicalScore
          });

          await saveInvestmentDecision(userId, pair.pairCode, decision);
        }
      } catch (decErr) {
        console.error(`[Decision] Decision engine failed for ${pair.pairCode}:`, decErr);
      }
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

  return judgment!;
}

/**
 * 同期開始フラグを立てる Server Action (空実装: クライアント側で処理)
 */
export async function setSyncingStatusAction(userId: string, portfolioId: string, pairCode: string) {
  return { success: true };
}

/**
 * 特定の通貨ペアのみを同期する Server Action (純粋な解析エンジンとして動作)
 */
export async function syncSpecificPairAction(userId: string, portfolioId: string, pairCode: string): Promise<{ success: boolean; data: FXJudgment; message?: string }> {
  if (!userId || !portfolioId) return { success: false, data: {} as any };
  const pair = SUPPORTED_PAIRS.find(p => p.pairCode === pairCode);
  if (!pair) return { success: false, data: {} as any };
  
  try {
    // サーバー側での DB チェック (getDoc) は権限エラーの原因となるため廃止。
    // クライアント側で同期の要否を判断してから呼び出されることを前提とする。
    const result = await syncSpecificPair(userId, portfolioId, pair);
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (err: any) {
    return { success: false, message: err.message, data: { pairCode, syncStatus: "failed", updatedAt: new Date().toISOString() } as any };
  }
}

/**
 * 実データを非同期に同期を開始する (バックグラウンド解析)
 */
export async function syncFXRealData(userId: string, portfolioId: string) {
  if (!userId || !portfolioId) return { success: false };
  // 解析のみを実行。保存は行わない。
  return { success: true, message: "Analysis engine ready" };
}

/**
 * 確実に全21件のデータを返す (初期プレースホルダー生成)
 */
export async function getFXJudgmentsAction(userId: string, portfolioId: string): Promise<FXJudgment[]> {
  if (!userId || !portfolioId) return [];
  try {
    // サーバー側での DB 読み取り (getDocs) も権限エラーの原因となるため廃止。
    // マスタ情報に基づいた初期リストのみを生成して返却する。
    // 実際のデータはクライアント側の onSnapshot で取得される。
    
    const initialData: FXJudgment[] = SUPPORTED_PAIRS.map(pair => {
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
        technicalReasons: ["解析中..."],
        fundamentalScore: fundamental.score,
        macroBias: fundamental.macroBias,
        fundamentalReasons: fundamental.reasons,
        buySwap: swaps.buy,
        sellSwap: swaps.sell,
        swapScore: 0,
        swapDirection: "neutral",
        swapComment: "分析準備中",
        holdingStyle: "short_term_only",
        totalScore: 0,
        signalLabel: "中立",
        confidence: "低",
        summaryComment: "データの読み込み、または同期を開始しています...",
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

    return JSON.parse(JSON.stringify(initialData));
  } catch (err) {
    console.error("Critical error in getFXJudgmentsAction:", err);
    return [];
  }
}

export async function generateFXDummyDataAction(userId: string, portfolioId: string): Promise<FXJudgment[]> {
  return getFXJudgmentsAction(userId, portfolioId);
}
