import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";
import { getTechnicalStatus } from "@/lib/technicalAnalysis";

export async function GET() {
  try {
    // 取得対象銘柄 (基本銘柄)
    const baseSymbols = ["AAPL", "7203.T", "BTC-JPY", "^GSPC", "^N225", "^TNX"];
    // FXペア (網羅的に取得)
    const fxPairs = [
      "JPY=X", "EURJPY=X", "GBPJPY=X", "AUDJPY=X", "NZDJPY=X", 
      "CADJPY=X", "CHFJPY=X", "ZARJPY=X", "MXNJPY=X", "EURUSD=X"
    ];
    
    // スワップポイント (1Lotあたりの参考値)
    const swapData: Record<string, { buy: number; sell: number }> = {
      "JPY=X": { buy: 232, sell: -251 },
      "EURJPY=X": { buy: 158, sell: -182 },
      "GBPJPY=X": { buy: 215, sell: -241 },
      "AUDJPY=X": { buy: 184, sell: -205 },
      "EURUSD=X": { buy: -125, sell: 102 },
      "CHFJPY=X": { buy: 135, sell: -155 }
    };
    
    // 全てのシンボルを結合
    const allSymbols = [...new Set([...baseSymbols, ...fxPairs])];

    // 外部APIを並列で実行 (現在の価格)
    const quoteResults = await Promise.all(
      allSymbols.map(async (sym) => {
        try {
          const quote: any = await yahooFinance.quote(sym);
          const price = quote.regularMarketPrice ?? quote.price ?? quote.regularMarketPreviousClose ?? quote.previousClose;
          return { 
            symbol: sym, 
            price: price,
            changePercent: quote.regularMarketChangePercent || 0
          };
        } catch (e) {
          console.error(`Failed to fetch quote for ${sym}:`, e);
          return { symbol: sym, price: null, changePercent: 0 };
        }
      })
    );

    // FXヒストリカルデータ取得 (テクニカル分析用)
    const fxAnalysisPairs = ["JPY=X", "EURJPY=X", "GBPJPY=X", "EURUSD=X"];
    const fxAnalysis = await Promise.all(
      fxAnalysisPairs.map(async (pair) => {
        try {
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 40);

          const historical = await yahooFinance.historical(pair, {
            period1: startDate,
            period2: endDate,
            interval: "1d"
          });

          const prices = (historical as any[]).map(h => h.close).filter((p: any): p is number => p !== undefined);
          const lastPrice = prices[prices.length - 1];
          const tech = getTechnicalStatus(lastPrice, prices);

          return {
            pair,
            price: lastPrice,
            change: prices.length > 1 ? ((lastPrice - prices[prices.length - 2]) / prices[prices.length - 2]) * 100 : 0,
            technical: tech,
            swap: swapData[pair] || { buy: 0, sell: 0 },
            history: prices.slice(-20)
          };
        } catch (e) {
          console.error(`Failed to fetch history for ${pair}:`, e);
          return { pair, price: null, change: 0, technical: null, history: [] };
        }
      })
    );

    const usdJpy = quoteResults.find(m => m.symbol === "JPY=X")?.price ?? 151.20;
    
    // 資産価格の更新用Map (シンボルをキーにする)
    const priceMap: Record<string, number> = {};
    quoteResults.forEach(res => {
      if (res.price !== null) {
        priceMap[res.symbol] = res.price;
      }
    });

    // 特殊なマッピング (US株の円換算など、シンボルが直接JYPでないもの用)
    if (priceMap["AAPL"]) priceMap["AAPL_JPY"] = priceMap["AAPL"] * usdJpy;

    // マクロ指標用データの整理
    const macroData = ["^GSPC", "^N225", "^TNX", "JPY=X"].map(sym => {
      const r = quoteResults.find(res => res.symbol === sym);
      return {
        symbol: sym,
        price: r?.price ?? 0,
        changePercent: r?.changePercent ?? 0
      };
    });

    return NextResponse.json({ 
      prices: priceMap, 
      macro: macroData,
      fxAnalysis: fxAnalysis,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error("Error fetching market data:", error);
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}
