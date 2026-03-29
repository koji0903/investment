"use server";

import YahooFinance from "yahoo-finance2";
const yf = new YahooFinance();
import { calculateMarketSentiment } from "@/utils/fx/sentiment";
import { FXMarketSentiment } from "@/types/fx";

// シンプルなメモリ内キャッシュ (サーバー実行時のみ有効)
let sentimentCache: { data: FXMarketSentiment; timestamp: number } | null = null;
const CACHE_DURATION = 15 * 60 * 1000; // 15分

/**
 * 複数通貨ペアのマーケットデータを取得し、地合いを判定する
 */
export async function getMarketSentimentAction(): Promise<FXMarketSentiment> {
  const now = Date.now();
  if (sentimentCache && (now - sentimentCache.timestamp < CACHE_DURATION)) {
    return sentimentCache.data;
  }

  const targetPairs = [
    "USD/JPY", "EUR/USD", "GBP/USD", "AUD/USD", "USD/CHF", 
    "EUR/JPY", "GBP/JPY", "AUD/JPY"
  ];

  const priceData: Record<string, { current: number; prev24h: number }> = {};

  try {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 3); // 確実に24時間前のデータが含まれるように3日前から取得

    // 並列で取得
    await Promise.all(targetPairs.map(async (pair) => {
      const symbol = pair.replace("/", "") + "=X";
      try {
        const result = await yf.historical(symbol, { 
          period1: start, 
          period2: end, 
          interval: "1d" 
        });

        if (result && result.length >= 2) {
          const sorted = result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          priceData[pair] = {
            current: sorted[0].close || 0,
            prev24h: sorted[1].close || 0
          };
        }
      } catch (err) {
        console.error(`Error fetching sentiment data for ${pair}:`, err);
      }
    }));

    const sentiment = calculateMarketSentiment(priceData);
    sentimentCache = { data: sentiment, timestamp: now };
    
    return JSON.parse(JSON.stringify(sentiment));
  } catch (error) {
    console.error("Critical error in getMarketSentimentAction:", error);
    // デフォルト値を返す
    return {
      usdStrength: 50,
      usdLabel: "中立",
      jpyStrength: 50,
      jpyLabel: "中立",
      crossYenSentiment: "neutral",
      overallBias: "NEUTRAL",
      integratedScore: 50,
      reasons: ["マーケットデータの取得に失敗しました。"],
      updatedAt: new Date().toISOString()
    };
  }
}
