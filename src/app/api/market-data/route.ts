import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";
import { getTechnicalStatus } from "@/lib/technicalAnalysis";

export async function GET() {
  try {
    // 取得対象銘柄 (基本銘柄)
    const symbols = ["AAPL", "7203.T", "JPY=X", "BTC-JPY", "^GSPC", "^N225", "^TNX"];
    // FXペア (詳細分析用)
    const fxPairs = ["JPY=X", "EURJPY=X", "GBPJPY=X", "AUDJPY=X", "EURUSD=X"];
    
    // 外部APIを並列で実行 (現在の価格)
    const quoteResults = await Promise.all(
      symbols.map(async (sym) => {
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
    const fxAnalysis = await Promise.all(
      fxPairs.map(async (pair) => {
        try {
          // 直近30日分のデータを取得
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 40); // 余裕を持って40日前から取得

          const historical = await yahooFinance.historical(pair, {
            period1: startDate,
            period2: endDate,
            interval: "1d"
          });

          const prices = historical.map(h => h.close).filter((p): p is number => p !== undefined);
          const lastPrice = prices[prices.length - 1];
          const tech = getTechnicalStatus(lastPrice, prices);

          return {
            pair,
            price: lastPrice,
            change: prices.length > 1 ? ((lastPrice - prices[prices.length - 2]) / prices[prices.length - 2]) * 100 : 0,
            technical: tech,
            history: prices.slice(-20) // 直近20日分を返す
          };
        } catch (e) {
          console.error(`Failed to fetch history for ${pair}:`, e);
          return { pair, price: null, change: 0, technical: null, history: [] };
        }
      })
    );

    // マクロ指標のフォールバック
    const macroFallback: Record<string, number> = {
      "^GSPC": 5100,
      "^N225": 38500,
      "^TNX": 4.25,
      "JPY=X": 151.20
    };

    const macroData = ["^GSPC", "^N225", "^TNX", "JPY=X"].map(sym => {
      const r = quoteResults.find(res => res.symbol === sym);
      return {
        symbol: sym,
        price: r?.price ?? macroFallback[sym],
        changePercent: r?.changePercent ?? 0
      };
    });

    const usdJpy = macroData.find(m => m.symbol === "JPY=X")?.price ?? 151.20;
    
    // 資産価格の更新用Map
    const priceMap: Record<string, number> = {
      "1": (quoteResults.find(r => r.symbol === "AAPL")?.price ?? 190) * usdJpy,
      "2": quoteResults.find(r => r.symbol === "7203.T")?.price ?? 3850,
      "3": usdJpy,
      "4": quoteResults.find(r => r.symbol === "BTC-JPY")?.price ?? 10500000,
      "5": 25000,
    };

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
