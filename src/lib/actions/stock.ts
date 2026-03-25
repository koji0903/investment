"use server";

import YahooFinance from "yahoo-finance2";
const yf = new YahooFinance();
import { StockJudgment, StockFundamental, StockPairMaster } from "@/types/stock";
import { analyzeStockTechnical } from "@/utils/stock/technical";
import { analyzeStockFundamental } from "@/utils/stock/fundamental";
import { analyzeStockValuation } from "@/utils/stock/valuation";
import { analyzeStockShareholderReturn } from "@/utils/stock/shareholder";
import { calculateStockTotalJudgment } from "@/utils/stock/scoring";
import { TSE_PRIME_MASTER } from "@/data/tse_prime_master";
import { db } from "@/lib/firebase";
import { 
  doc,
  setDoc,
  collection,
  query,
  getDocs,
  getDoc, 
  orderBy 
} from "firebase/firestore";
import { isConfigValid } from "@/lib/firebase";

// 主要銘柄マスターを使用
const STKS = TSE_PRIME_MASTER;

export async function getStockBasicInfoAction(ticker: string): Promise<{ success: boolean; data?: StockPairMaster; message?: string }> {
  try {
    const sym = ticker.endsWith(".T") ? ticker : ticker + ".T";
    const plainTicker = ticker.replace(".T", "");
    const existing = STKS.find(s => s.ticker === plainTicker);
    if (existing) return { success: true, data: existing };
    const info = await yf.quote(sym).catch(() => null);
    if (!info) return { success: false, message: "銘柄が見つかりませんでした" };
    return { success: true, data: { ticker: plainTicker, name: info.longName || info.shortName || plainTicker, sector: (info as any).sector || "その他" } };
  } catch (err: any) { return { success: false, message: err.message }; }
}

/**
 * 特定の銘柄を同期・分析する (Server Action) - Robust Version
 */
export async function syncSpecificStockAction(ticker: string): Promise<{ success: boolean; data?: StockJudgment; message?: string }> {
  try {
    const sym = ticker.endsWith(".T") ? ticker : ticker + ".T";
    const plainTicker = ticker.replace(".T", "");
    let stk = STKS.find(s => s.ticker === plainTicker);
    if (!stk) {
      const basic = await getStockBasicInfoAction(plainTicker);
      if (!basic.success || !basic.data) return { success: false, message: "銘柄情報が取得できません" };
      stk = basic.data;
    }

    const docRef = doc(db, "japanese_stocks", plainTicker);
    
    // キャッシュチェック (Soft Fail: 権限エラーでも解析へ進む)
    let docSnap = null;
    try {
      docSnap = await getDoc(docRef);
    } catch (readErr) {
      console.warn(`[Stock] Cache read skipped for ${ticker}:`, (readErr as any).message);
    }

    if (docSnap && docSnap.exists()) {
      const existing = docSnap.data() as StockJudgment;
      const lastUpdated = new Date(existing.updatedAt).getTime();
      const oneHour = 1 * 60 * 60 * 1000;
      if (Date.now() - lastUpdated < oneHour && existing.syncStatus === 'completed') {
        return { success: true, data: JSON.parse(JSON.stringify(existing)) };
      }
    }

    // 1. 株価チャートと財務サマリーを並列取得 (サーバ側でもタイムアウトを設定)
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 365);
    
    let chartRes: any = null;
    let summary: any = null;
    let syncError: string | undefined = undefined;

    try {
      // サーバー機能全体のタイムアウト対策として Promise.race をサーバー側でも実行
      const fetchPromise = Promise.all([
        yf.chart(sym, { period1: start, period2: end, interval: "1d" }).catch(e => { throw new Error(`Chart: ${e.message}`); }),
        yf.quoteSummary(sym, { modules: ["defaultKeyStatistics", "financialData", "summaryDetail"] }).catch(e => {
          console.warn(`[Sync] Summary fetch soft failure for ${ticker}:`, e.message);
          syncError = `財務情報の取得に失敗しました(${e.message})。テクニカル判定のみ実行します。`;
          return null;
        })
      ]);

      const serverTimeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Yahoo Finance API response timeout")), 45000)
      );

      const [cResult, sResult] = await Promise.race([fetchPromise, serverTimeout]) as any[];
      chartRes = cResult;
      summary = sResult;
    } catch (err: any) {
      console.error(`[Sync] Critical fetch error for ${ticker}:`, err.message);
      return { success: false, message: `データ取得に失敗しました: ${err.message}` };
    }

    if (!chartRes || !chartRes.quotes || chartRes.quotes.length < 5) {
      return { success: false, message: "有効な株価データがありませんでした" };
    }

    const quotes = chartRes.quotes.filter((q: any) => q && q.close !== null && q.close !== undefined && q.date);
    if (quotes.length === 0) return { success: false, message: "有効な価格履歴がありません" };
    
    const prices = quotes.map((q: any) => q.close as number);
    const currentPrice = prices[prices.length - 1];

    if (!currentPrice || isNaN(currentPrice)) {
        return { success: false, message: "現在の株価が取得できませんでした" };
    }

    const s = (summary?.defaultKeyStatistics || {}) as any;
    const f = (summary?.financialData || {}) as any;
    const d = (summary?.summaryDetail || {}) as any;

    const fundamentalData: StockFundamental = {
      ticker: stk.ticker, companyName: stk.name, sector: stk.sector,
      revenueGrowth: (f.revenueGrowth?.raw || 0) * 100,
      operatingProfitGrowth: (f.ebitdaMargins?.raw || 0.1) * 100,
      epsGrowth: (s.forwardEps?.raw / (s.trailingEps?.raw || 1) - 1) * 100 || 5,
      roe: (f.returnOnEquity?.raw || 0) * 100,
      roa: (f.returnOnAssets?.raw || 0) * 100,
      operatingMargin: (f.operatingMargins?.raw || 0) * 100,
      equityRatio: (f.totalCash?.raw / (f.totalDebt?.raw || 1) * 100) || 50,
      interestBearingDebt: f.totalDebt?.raw || 0,
      operatingCashflow: f.operatingCashflow?.raw || 0,
      freeCashflow: f.freeCashflow?.raw || 0,
      per: d.trailingPE?.raw || d.forwardPE?.raw || 15,
      pbr: d.priceToBook?.raw || 1.2,
      evEbitda: s.enterpriseToEbitda?.raw || 10,
      avgPer5Year: d.trailingPE?.raw || 15,
      avgPbr5Year: d.priceToBook?.raw || 1.0,
      dividendYield: (d.dividendYield?.raw || 0) * 100,
      payoutRatio: (s.payoutRatio?.raw || 0) * 100,
      dividendGrowthYears: 5,
      buybackFlag: (s.netIncomeToCommon?.raw < s.totalCashFromOperatingActivities?.raw),
      updatedAt: new Date().toISOString()
    };

    const jud = calculateStockTotalJudgment(
      stk.ticker, stk.name, stk.sector, currentPrice,
      analyzeStockTechnical(prices, currentPrice),
      analyzeStockFundamental(fundamentalData),
      analyzeStockValuation(fundamentalData),
      analyzeStockShareholderReturn(fundamentalData)
    );

    jud.chartData = quotes.slice(-180).map((q: any) => ({ 
      date: new Date(q.date).toISOString().split('T')[0], 
      value: q.close as number 
    }));
    jud.valuationMetrics = { 
      per: fundamentalData.per, 
      pbr: fundamentalData.pbr, 
      dividendYield: fundamentalData.dividendYield, 
      roe: fundamentalData.roe, 
      equityRatio: fundamentalData.equityRatio 
    };
    jud.syncStatus = "completed";
    jud.syncError = syncError;
    jud.updatedAt = new Date().toISOString();

    // 3. Firestoreへの保存 (Soft Fail: 権限エラー等で失敗しても解析結果は返す)
    try {
      if (isConfigValid) {
        await setDoc(docRef, jud);
        await setDoc(doc(db, "japanese_stock_fundamentals", stk.ticker), fundamentalData);
      }
    } catch (fsErr: any) {
      console.warn(`[Stock] Firestore save skipped or failed for ${ticker} (likely permission):`, fsErr.message);
      // 特権エラーがあっても、メモリ上の解析結果はUIへ戻す
    }

    return { success: true, data: JSON.parse(JSON.stringify(jud)) };
  } catch (err: any) {
    console.error(`[Stock] Critical sync error for ${ticker}:`, err);
    return { success: false, message: `致命的なエラー: ${err.message}` };
  }
}

export async function getStockJudgmentsAction() {
  try {
    const colRef = collection(db, "japanese_stocks");
    const q = query(colRef, orderBy("totalScore", "desc"));
    const snap = await getDocs(q).catch(err => {
      console.warn("[Stock] Firestore read failed (likely permission):", err.message);
      return null;
    });

    if (!snap || snap.empty) return [];
    return snap.docs.map(d => d.data() as StockJudgment);
  } catch (err) {
    console.error("[Stock] getStockJudgmentsAction error:", err);
    return [];
  }
}

export async function setStockSyncingAction(ticker: string) {
  try {
    const docRef = doc(db, "japanese_stocks", ticker);
    await setDoc(docRef, { syncStatus: "syncing", syncError: null, updatedAt: new Date().toISOString() }, { merge: true })
      .catch(err => console.warn(`[Stock] setStockSyncingAction failed for ${ticker}:`, err.message));
    return { success: true };
  } catch (err) { return { success: false }; }
}

export async function syncStockRealData(): Promise<{ success: boolean; count: number; data: StockJudgment[] }> {
  // 実運用リストの上位15銘柄を同期
  const results: StockJudgment[] = [];
  for (const stk of STKS.slice(0, 15)) {
    const res = await syncSpecificStockAction(stk.ticker);
    if (res.success && res.data) results.push(res.data);
  }
  return { success: true, count: results.length, data: results };
}
