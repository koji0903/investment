import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
const yf = new YahooFinance();
import { getTechnicalStatus } from "@/lib/technicalAnalysis";

// 銘柄コードの正規化ロジック
function normalizeSymbol(sym: string): string {
  if (!sym) return "";
  const s = sym.toUpperCase().trim();
  
  // 1. 日本株: 4桁数字のみ -> .T を付与
  if (/^\d{4}$/.test(s)) return `${s}.T`;
  
  // 2. 暗号資産: 日本円ペアを優先 (BTC -> BTC-JPY)
  if (["BTC", "ETH", "XRP", "LTC", "ADA", "SOL", "DOGE"].includes(s)) return `${s}-JPY`;
  
  // 3. 為替: 6桁のアルファベット (USDJPY -> USDJPY=X)
  if (/^[A-Z]{6}$/.test(s)) return `${s}=X`;
  
  // 既にサフィックスがある場合はそのまま
  return s;
}

// 共通のデータ取得ロジック
async function getMarketData(requestedSymbols: string[] = []) {
  try {
    // リクエストされたシンボルと正規化後のマッピングを作成
    const symbolMap = new Map<string, string>();
    requestedSymbols.forEach(orig => {
      symbolMap.set(orig, normalizeSymbol(orig));
    });

    // 取得対象銘柄 (基本銘柄)
    const baseSymbols = ["AAPL", "7203.T", "BTC-JPY", "^GSPC", "^N225", "^TNX", "JPY=X"];
    const fxPairs = [
      "JPY=X", "EURJPY=X", "GBPJPY=X", "AUDJPY=X", "NZDJPY=X", 
      "CADJPY=X", "CHFJPY=X", "ZARJPY=X", "MXNJPY=X", "EURUSD=X"
    ];
    
    // 全てのユニークな正規化シンボルを抽出
    const allNormalizedSymbols = [...new Set([
      ...baseSymbols, 
      ...fxPairs, 
      ...Array.from(symbolMap.values())
    ])].filter(Boolean);

    // 外部APIをチャンクに分けて実行 (一度に大量のリクエストを防ぐ)
    const CHUNK_SIZE = 10;
    const chunks = [];
    for (let i = 0; i < allNormalizedSymbols.length; i += CHUNK_SIZE) {
      chunks.push(allNormalizedSymbols.slice(i, i + CHUNK_SIZE));
    }

    const quoteResults: { symbol: string; price: number | null; currency: string | null; changePercent: number }[] = [];
    for (const chunk of chunks) {
      try {
        // yf.quote は配列を受け取りバルク取得が可能
        const results: any = await yf.quote(chunk);
        
        // 単体と配列の両方のレスポンス形式に対応
        const resultsArray = Array.isArray(results) ? results : [results];
        
        resultsArray.forEach(quote => {
          if (!quote) return;
          const price = quote.regularMarketPrice ?? quote.price ?? quote.regularMarketPreviousClose ?? quote.previousClose;
          quoteResults.push({
            symbol: quote.symbol,
            price: price,
            currency: quote.currency || (quote.symbol.endsWith(".T") ? "JPY" : "USD"),
            changePercent: quote.regularMarketChangePercent || 0
          });
        });
      } catch (e) {
        console.error(`Failed to fetch quotes for chunk: ${chunk.join(",")}`, e);
        // エラー時はフォールバックとしてnullを埋める
        chunk.forEach(sym => {
          if (!quoteResults.find(r => r.symbol === sym)) {
            quoteResults.push({ symbol: sym, price: null, currency: null, changePercent: 0 });
          }
        });
      }
    }

    // ドル円レートの取得 (変換用)
    const usdJpyResult = quoteResults.find(m => m.symbol === "JPY=X" || m.symbol === "USDJPY=X");
    const usdJpy = usdJpyResult?.price ?? 151.20;

    // レスポンス用の価格マップ (オリジナルシンボル -> 価格)
    const priceMap: Record<string, number> = {};
    
    // 1. 正規化されたシンボルでマッピング
    quoteResults.forEach(res => {
      if (res.price !== null) {
        priceMap[res.symbol] = res.price;
      }
    });

    // 2. オリジナルシンボルでマッピング (ユーザーが入力した形式で返却)
    symbolMap.forEach((normalized, original) => {
      const res = quoteResults.find(r => r.symbol === normalized);
      if (res && res.price !== null) {
        priceMap[original] = res.price;
        
        // 特殊対応: 日本株で .T を付け忘れた場合など、通貨変換が必要な場合は検討の余地あり
        // 現状は、正規化した結果の価格をそのまま返す
      }
    });

    // 3. 特殊なマッピング (US株の円換算エイリアス)
    if (priceMap["AAPL"]) priceMap["AAPL_JPY"] = priceMap["AAPL"] * usdJpy;

    // FXヒストリカルデータ取得
    const fxAnalysisPairs = ["JPY=X", "EURJPY=X", "GBPJPY=X", "EURUSD=X"];
    const fxAnalysis = await Promise.all(
      fxAnalysisPairs.map(async (pair) => {
        try {
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 40);

          const historical = await yf.historical(pair, {
            period1: startDate,
            period2: endDate,
            interval: "1d"
          });

          const prices = (historical as any[]).map(h => h.close).filter((p: any): p is number => p !== undefined);
          const lastPrice = prices[prices.length - 1];
          const tech = getTechnicalStatus(lastPrice, prices);

          const swapData: Record<string, { buy: number; sell: number }> = {
            "JPY=X": { buy: 232, sell: -251 },
            "EURJPY=X": { buy: 158, sell: -182 },
            "GBPJPY=X": { buy: 215, sell: -241 },
            "AUDJPY=X": { buy: 184, sell: -205 },
            "EURUSD=X": { buy: -125, sell: 102 },
            "CHFJPY=X": { buy: 135, sell: -155 }
          };

          return {
            pair,
            price: lastPrice,
            change: prices.length > 1 ? ((lastPrice - prices[prices.length - 2]) / prices[prices.length - 2]) * 100 : 0,
            technical: tech,
            swap: swapData[pair] || { buy: 0, sell: 0 },
            history: prices.slice(-20)
          };
        } catch (e) {
          return { pair, price: null, change: 0, technical: null, history: [] };
        }
      })
    );

    const macroData = ["^GSPC", "^N225", "^TNX", "JPY=X"].map(sym => {
      const r = quoteResults.find(res => res.symbol === sym);
      return {
        symbol: sym,
        price: r?.price ?? 0,
        changePercent: r?.changePercent ?? 0
      };
    });

    // 騰落率マップの作成
    const dailyChangeMap: Record<string, number> = {};
    symbolMap.forEach((normalized, original) => {
      const res = quoteResults.find(r => r.symbol === normalized);
      if (res) {
        dailyChangeMap[original] = res.changePercent;
      }
    });

    return { 
      prices: priceMap, 
      dailyChanges: dailyChangeMap,
      macro: macroData,
      fxAnalysis: fxAnalysis,
      timestamp: new Date().toISOString() 
    };
  } catch (error) {
    throw error;
  }
}

export async function GET() {
  try {
    const data = await getMarketData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET market-data:", error);
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const symbols = body.symbols || [];
    const data = await getMarketData(symbols);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in POST market-data:", error);
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}
