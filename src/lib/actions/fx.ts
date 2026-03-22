"use server";

import yahooFinance from "yahoo-finance2";
import { FXPairMaster, FXJudgment } from "@/types/fx";
import { analyzeTechnical } from "@/utils/fx/technical";
import { analyzeFundamental } from "@/utils/fx/fundamental";
import { evaluateSwap, calculateTotalJudgment } from "@/utils/fx/scoring";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, query, getDocs, orderBy } from "firebase/firestore";

// 対象とする通貨ペア
const SUPPORTED_PAIRS: FXPairMaster[] = [
  { pairCode: "USD/JPY", baseCurrency: "USD", quoteCurrency: "JPY" },
  { pairCode: "EUR/JPY", baseCurrency: "EUR", quoteCurrency: "JPY" },
  { pairCode: "GBP/JPY", baseCurrency: "GBP", quoteCurrency: "JPY" },
  { pairCode: "AUD/JPY", baseCurrency: "AUD", quoteCurrency: "JPY" },
  { pairCode: "NZD/JPY", baseCurrency: "NZD", quoteCurrency: "JPY" },
  { pairCode: "CAD/JPY", baseCurrency: "CAD", quoteCurrency: "JPY" },
  { pairCode: "CHF/JPY", baseCurrency: "CHF", quoteCurrency: "JPY" },
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

/**
 * Yahoo Finance のシンボルに変換
 */
function toYahooSymbol(pairCode: string): string {
  if (pairCode === "USD/JPY") return "JPY=X";
  return pairCode.replace("/", "") + "=X";
}

/**
 * 実データを取得して Firestore を更新する Server Action
 */
export async function syncFXRealData() {
  try {
    console.log("Starting FX Real Data Sync...");
    
    // 1. 各国のファンダメンタル指標を取得 (簡易化のため一旦 Firestore から最新を取得)
    // 本来はマクロ経済系のAPIから動的に取得したいが、現状は Firestore に保存されているマスターを使用
    const fundamentals: any = {};
    const currencies = ["USD", "JPY", "EUR", "GBP", "AUD", "NZD", "CAD", "CHF"];
    
    for (const cur of currencies) {
      const docSnap = await getDoc(doc(db, "fx_currency_fundamentals", cur));
      if (docSnap.exists()) {
        fundamentals[cur] = docSnap.data();
      } else {
        // デフォルト値 (初期化用)
        fundamentals[cur] = {
           currencyCode: cur,
           interestRate: 0,
           inflationScore: 5,
           growthScore: 5,
           centralBankBias: "neutral",
           safeHavenScore: 5
        };
      }
    }

    const results: FXJudgment[] = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 250); // テクニカル分析用に多めに取得

    const syncTasks = SUPPORTED_PAIRS.map(async (pair) => {
      const symbol = toYahooSymbol(pair.pairCode);
      
      try {
        // ヒストリカルデータ取得 (タイムアウトを考慮し並列処理)
        let historical: any[] = [];
        try {
          historical = await yahooFinance.historical(symbol, {
            period1: startDate,
            period2: endDate,
            interval: "1d"
          }) as any[];
        } catch (hErr) {
          console.error(`History fetch error for ${symbol}:`, hErr);
          return null;
        }

        if (!historical || historical.length < 50) {
          return null;
        }

        const prices = historical.map(h => h.close).filter(p => typeof p === "number");
        const currentPrice = prices[prices.length - 1];

        // テクニカル分析
        const technical = analyzeTechnical(prices, currentPrice);
        
        // ファンダメンタル分析
        const fundamental = analyzeFundamental(
          fundamentals[pair.baseCurrency],
          fundamentals[pair.quoteCurrency]
        );

        // スワップ評価
        const dummySwaps = getSemiRealSwaps(pair.pairCode, fundamentals[pair.baseCurrency]?.interestRate, fundamentals[pair.quoteCurrency]?.interestRate);
        const swapEval = evaluateSwap(dummySwaps.buy, dummySwaps.sell);

        // 総合判定
        const judgment = calculateTotalJudgment(
          pair.pairCode,
          pair.baseCurrency,
          pair.quoteCurrency,
          currentPrice,
          technical,
          fundamental,
          swapEval
        );

        // 3. Firestore に保存
        await setDoc(doc(db, "fx_judgments", pair.pairCode.replace("/", "-")), judgment);
        return judgment;

      } catch (err) {
        console.error(`Failed to Sync ${symbol}:`, err);
        return null;
      }
    });

    const syncResults = await Promise.all(syncTasks);
    const successCount = syncResults.filter(r => r !== null).length;

    console.log(`FX Sync Completed: ${successCount} pairs successful.`);
    return { success: true, count: successCount };

  } catch (error) {
    console.error("Sync Error:", error);
    throw error;
  }
}

/**
 * FX判定データを取得するサーバーアクション (確実な取得・フォールバックのため)
 */

const STATIC_FX_DUMMY: FXJudgment[] = [
  {
    pairCode: "USD/JPY", baseCurrency: "USD", quoteCurrency: "JPY", currentPrice: 153.20,
    technicalScore: 45, technicalTrend: "bullish", technicalReasons: ["上昇トレンド継続中"],
    fundamentalScore: 60, macroBias: "bullish", fundamentalReasons: ["日米金利差の拡大"],
    buySwap: 230, sellSwap: -250, swapScore: 40, swapDirection: "long_positive",
    swapComment: "買いスワップ有利", holdingStyle: "medium_term_long",
    totalScore: 55, signalLabel: "買い優勢", confidence: "高",
    summaryComment: "安定的な上昇トレンドにあり、金利差も支援材料です。",
    shortTermSignal: "買い優勢", mediumTermSignal: "買い優勢", suitability: "短期・中長期共に良好",
    updatedAt: new Date().toISOString()
  },
  {
    pairCode: "EUR/JPY", baseCurrency: "EUR", quoteCurrency: "JPY", currentPrice: 162.50,
    technicalScore: 20, technicalTrend: "neutral", technicalReasons: ["レンジ圏での推移"],
    fundamentalScore: 10, macroBias: "neutral", fundamentalReasons: ["ECBの緩和継続姿勢"],
    buySwap: 180, sellSwap: -210, swapScore: 25, swapDirection: "long_positive",
    swapComment: "スワップ受取可能", holdingStyle: "medium_term_long",
    totalScore: 15, signalLabel: "中立", confidence: "中",
    summaryComment: "明確な方向性に欠けますが、スワップ目的のロングは検討可能です。",
    shortTermSignal: "中立", mediumTermSignal: "中立", suitability: "中長期保有向き",
    updatedAt: new Date().toISOString()
  }
];

export async function getFXJudgmentsAction(): Promise<FXJudgment[]> {
  try {
    const q = query(collection(db, "fx_judgments"), orderBy("totalScore", "desc"));
    const snapshot = await getDocs(q).catch(() => null);
    
    if (!snapshot || snapshot.empty) {
      console.log("[Server] No FX data in Firestore, generating...");
      try {
        const syncRes = await syncFXRealData();
        if (syncRes && syncRes.count > 0) {
          const snapshot2 = await getDocs(q);
          if (!snapshot2.empty) {
            return JSON.parse(JSON.stringify(snapshot2.docs.map(doc => doc.data())));
          }
        }
        // 同期が失敗または空ならサーバー側ダミー
        return await generateFXDummyDataAction();
      } catch (err) {
        return STATIC_FX_DUMMY;
      }
    }
    return JSON.parse(JSON.stringify(snapshot.docs.map(doc => doc.data())));
  } catch (err) {
    console.error("[Server Action Error] getFXJudgmentsAction:", err);
    return STATIC_FX_DUMMY;
  }
}

/**
 * サーバー側でFXダミーデータを生成・保存
 */
export async function generateFXDummyDataAction(): Promise<FXJudgment[]> {
  const judgments: FXJudgment[] = SUPPORTED_PAIRS.map(pair => {
    const score = Math.floor(Math.random() * 140) - 70;
    return {
      pairCode: pair.pairCode,
      baseCurrency: pair.baseCurrency,
      quoteCurrency: pair.quoteCurrency,
      currentPrice: 150.0,
      technicalScore: score,
      technicalTrend: score > 30 ? "bullish" : score < -30 ? "bearish" : "neutral",
      technicalReasons: ["サーバー側生成"],
      fundamentalScore: score,
      macroBias: score > 30 ? "bullish" : score < -30 ? "bearish" : "neutral",
      fundamentalReasons: ["サーバー側生成"],
      buySwap: 100,
      sellSwap: -120,
      swapScore: 20,
      swapDirection: "long_positive",
      swapComment: "スワップ良好",
      holdingStyle: "medium_term_long",
      totalScore: score,
      signalLabel: score > 50 ? "買い優勢" : score < -50 ? "売り優勢" : "中立",
      confidence: "中",
      summaryComment: "バックアップ用ダミーデータです。",
      shortTermSignal: "中立",
      mediumTermSignal: "中立",
      suitability: "様子見推奨",
      updatedAt: new Date().toISOString()
    } as FXJudgment;
  });

  for (const j of judgments) {
    await setDoc(doc(db, "fx_judgments", j.pairCode.replace("/", "-")), j);
  }
  return JSON.parse(JSON.stringify(judgments));
}

function getSemiRealSwaps(pair: string, baseRate: number = 0, quoteRate: number = 0) {
  const diff = baseRate - quoteRate;
  const factor = 40; 
  const buy = diff * factor;
  const sell = -diff * factor - 20; 
  return { buy: Math.round(buy), sell: Math.round(sell) };
}
