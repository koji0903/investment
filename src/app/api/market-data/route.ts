import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export async function GET() {
  try {
    // 取得対象銘柄 (資産 + マクロ指標)
    const symbols = ["AAPL", "7203.T", "JPY=X", "BTC-JPY", "^GSPC", "^N225", "^TNX"];
    
    // 外部APIを並列で実行
    const results = await Promise.all(
      symbols.map(async (sym) => {
        try {
          const quote: any = await yahooFinance.quote(sym);
          // 価格取得の優先順位: 1.取引時間中価格, 2.終値, 3.前日終値
          const price = quote.regularMarketPrice ?? quote.price ?? quote.regularMarketPreviousClose ?? quote.previousClose;
          return { 
            symbol: sym, 
            price: price,
            changePercent: quote.regularMarketChangePercent || 0
          };
        } catch (e) {
          console.error(`Failed to fetch ${sym}:`, e);
          return { symbol: sym, price: null, changePercent: 0 };
        }
      })
    );

    // マクロ指標のフォールバック (APIがnullを返した時用)
    const macroFallback: Record<string, number> = {
      "^GSPC": 5100,
      "^N225": 38500,
      "^TNX": 4.25,
      "JPY=X": 151.20
    };

    // マクロデータの整理
    const macroData = ["^GSPC", "^N225", "^TNX", "JPY=X"].map(sym => {
      const r = results.find(res => res.symbol === sym);
      return {
        symbol: sym,
        price: r?.price ?? macroFallback[sym],
        changePercent: r?.changePercent ?? 0
      };
    });

    const usdJpyRaw = macroData.find(m => m.symbol === "JPY=X")?.price;
    const usdJpy = usdJpyRaw ?? 151.20;
    
    // 資産価格の更新 (価格Mapの作成)
    const priceMap: Record<string, number> = {
      "1": (results.find(r => r.symbol === "AAPL")?.price ?? 190) * usdJpy,
      "2": results.find(r => r.symbol === "7203.T")?.price ?? 3850,
      "3": usdJpy,
      "4": results.find(r => r.symbol === "BTC-JPY")?.price ?? 10500000,
      "5": 25000 + (Math.random() * 200 - 100),
    };

    return NextResponse.json({ 
      prices: priceMap, 
      macro: macroData,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error("Error fetching market data:", error);
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}
