"use server";

import YahooFinance from "yahoo-finance2";
const yf = new YahooFinance();
import { StockJudgment, StockFundamental, StockPairMaster } from "@/types/stock";
import { analyzeStockTechnical } from "@/utils/stock/technical";
import { analyzeStockFundamental } from "@/utils/stock/fundamental";
import { analyzeStockValuation } from "@/utils/stock/valuation";
import { analyzeStockShareholderReturn } from "@/utils/stock/shareholder";
import { calculateStockTotalJudgment } from "@/utils/stock/scoring";
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

const STKS: StockPairMaster[] = [
  { ticker: "7203", name: "トヨタ", sector: "輸送用機器" },
  { ticker: "8306", name: "三菱UFJ", sector: "銀行業" },
  { ticker: "9984", name: "ソフトバンクG", sector: "情報・通信業" },
  { ticker: "9432", name: "NTT", sector: "情報・通信業" },
  { ticker: "8058", name: "三菱商事", sector: "卸売業" },
  { ticker: "4063", name: "信越化学", sector: "化学" },
  { ticker: "6758", name: "ソニーG", sector: "電気機器" },
  { ticker: "2914", name: "JT", sector: "食料品" },
  { ticker: "1605", name: "INPEX", sector: "鉱業" },
  { ticker: "4502", name: "武田薬品", sector: "医薬品" },
  { ticker: "8001", name: "伊藤忠", sector: "卸売業" },
  { ticker: "8031", name: "三井物産", sector: "卸売業" },
  { ticker: "8766", name: "東京海上", sector: "保険業" },
  { ticker: "8316", name: "三井住友FG", sector: "銀行業" },
  { ticker: "9101", name: "日本郵船", sector: "海運業" },
  { ticker: "7267", name: "ホンダ", sector: "輸送用機器" },
  { ticker: "6501", name: "日立制作所", sector: "電気機器" },
  { ticker: "6981", name: "村田製作所", sector: "電気機器" },
  { ticker: "4503", name: "アステラス製薬", sector: "医薬品" },
  { ticker: "8802", name: "三菱地所", sector: "不動産業" },
  { ticker: "9020", name: "JR東日本", sector: "陸運業" },
  { ticker: "9202", name: "ANA", sector: "空運業" },
  { ticker: "6367", name: "ダイキン", sector: "機械" },
  { ticker: "4061", name: "デンカ", sector: "化学" },
  { ticker: "7741", name: "HOYA", sector: "精密機器" },
];

/**
 * 特定の銘柄を同期・分析する (Server Action)
 */
export async function syncSpecificStockAction(ticker: string): Promise<{ success: boolean; data?: StockJudgment; message?: string }> {
  try {
    const stk = STKS.find(s => s.ticker === ticker);
    if (!stk) return { success: false, message: "銘柄が見つかりません" };

    const sym = ticker + ".T";
    const docRef = doc(db, "japanese_stocks", ticker);
    const docSnap = await getDoc(docRef);

    // 6時間キャッシュチェック
    if (docSnap.exists()) {
      const existing = docSnap.data() as StockJudgment;
      const lastUpdated = new Date(existing.updatedAt).getTime();
      const sixHours = 6 * 60 * 60 * 1000;
      if (Date.now() - lastUpdated < sixHours && existing.syncStatus === 'completed') {
        return { success: true, data: JSON.parse(JSON.stringify(existing)) };
      }
    }

    // 1年間のチャートデータ取得 (テクニカル分析用)
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 365);

    const chartRes = await yf.chart(sym, {
      period1: start,
      period2: end,
      interval: "1d"
    }).catch(() => null);

    if (!chartRes || !chartRes.quotes || chartRes.quotes.length < 50) {
      return { success: false, message: "株価データの取得に失敗しました" };
    }

    const quotes = chartRes.quotes.filter(q => q.close !== null && q.close !== undefined);
    const prices = quotes.map(q => q.close as number);
    const currentPrice = prices[prices.length - 1];

    // 財務サマリーの取得
    const m1 = "defaultKeyStatistics";
    const m2 = "financialData";
    const m3 = "summaryDetail";
    const summary = await yf.quoteSummary(sym, {
      modules: [m1, m2, m3]
    }).catch(() => null);

    const s = (summary?.[m1] || {}) as any;
    const f = (summary?.[m2] || {}) as any;
    const d = (summary?.[m3] || {}) as any;

    const fundamentalData: StockFundamental = {
      ticker: stk.ticker,
      companyName: stk.name,
      sector: stk.sector,
      revenueGrowth: (f.revenueGrowth?.raw || 0) * 100,
      operatingProfitGrowth: (f.ebitdaMargins?.raw || 0.1) * 100,
      epsGrowth: (s.forwardEps?.raw / (s.trailingEps?.raw || 1) - 1) * 100 || 5,
      roe: (f.returnOnEquity?.raw || 0) * 100,
      roa: (f.returnOnAssets?.raw || 0) * 100,
      operatingMargin: (f.operatingMargins?.raw || 0) * 100,
      equityRatio: 50,
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

    // チャートデータ (UI用: 180日分)
    jud.chartData = quotes.slice(-180).map(q => ({
      date: q.date.toISOString().split('T')[0],
      value: q.close as number
    }));

    // バリュエーションメトリクス (UI表示用)
    jud.valuationMetrics = {
      per: fundamentalData.per,
      pbr: fundamentalData.pbr,
      dividendYield: fundamentalData.dividendYield,
      roe: fundamentalData.roe,
      equityRatio: fundamentalData.equityRatio
    };

    await setDoc(docRef, jud);
    await setDoc(doc(db, "japanese_stock_fundamentals", stk.ticker), fundamentalData);

    return { success: true, data: JSON.parse(JSON.stringify(jud)) };
  } catch (err: any) {
    console.error(`[Stock] Sync error for ${ticker}:`, err);
    return { success: false, message: err.message };
  }
}

export async function getStockJudgmentsAction() {
  try {
    const colRef = collection(db, "japanese_stocks");
    const q = query(colRef, orderBy("totalScore", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as StockJudgment);
  } catch (err) {
    console.error("[Stock] Fetch error:", err);
    return [];
  }
}

export async function setStockSyncingAction(ticker: string) {
  try {
    const docRef = doc(db, "japanese_stocks", ticker);
    await setDoc(docRef, { syncStatus: "syncing", updatedAt: new Date().toISOString() }, { merge: true });
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}

export async function syncStockRealData(): Promise<{ success: boolean; count: number; data: StockJudgment[] }> {
  const results: StockJudgment[] = [];
  for (const stk of STKS.slice(0, 10)) {
    const res = await syncSpecificStockAction(stk.ticker);
    if (res.success && res.data) {
      results.push(res.data);
    }
  }
  return { success: true, count: results.length, data: results };
}
