"use server";

import yahooFinance from "yahoo-finance2";
import { FXPairMaster, FXJudgment } from "@/types/fx";
import { analyzeTechnical } from "@/utils/fx/technical";
import { analyzeFundamental } from "@/utils/fx/fundamental";
import { evaluateSwap, calculateTotalJudgment } from "@/utils/fx/scoring";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

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

    // 2. 通貨ペアごとに実データを取得して分析
    for (const pair of SUPPORTED_PAIRS) {
      const symbol = toYahooSymbol(pair.pairCode);
      
      try {
        // ヒストリカルデータ取得
        const historical = await yahooFinance.historical(symbol, {
          period1: startDate,
          period2: endDate,
          interval: "1d"
        }) as any[];

        if (!historical || (historical as any[]).length < 50) {
          console.warn(`Insufficient data for ${symbol}`);
          continue;
        }

        const prices = (historical as any[]).map(h => h.close).filter(p => typeof p === "number");
        const currentPrice = prices[prices.length - 1];

        // テクニカル分析
        const technical = analyzeTechnical(prices, currentPrice);
        
        // ファンダメンタル分析 (Firestore から取得したマスターデータを使用)
        const fundamental = analyzeFundamental(
          fundamentals[pair.baseCurrency],
          fundamentals[pair.quoteCurrency]
        );

        // スワップ評価 (一旦ダミーベースだが、金利差に応じた動的評価も可能)
        // ここでは既存のロジックを使用 (FXService.getDummySwaps相当を簡易化)
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
        results.push(judgment);

      } catch (err) {
        console.error(`Failed to Sync ${symbol}:`, err);
      }
    }

    return { success: true, count: results.length };

  } catch (error) {
    console.error("Sync Error:", error);
    throw error;
  }
}

/**
 * 各国金利差からスワップポイントを推定 (簡易計算)
 */
function getSemiRealSwaps(pair: string, baseRate: number = 0, quoteRate: number = 0) {
  const diff = baseRate - quoteRate;
  const factor = 40; // スワップの規模感調整
  const buy = diff * factor;
  const sell = -diff * factor - 20; // スプレッド分マイナス
  
  return { buy: Math.round(buy), sell: Math.round(sell) };
}
