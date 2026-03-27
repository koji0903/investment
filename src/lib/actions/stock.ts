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
import { performFinancialAnalysis } from "@/utils/stock/financialAnalysis";
import { calculateDecision } from "@/utils/investment/decisionEngine"; // 追加
import { PLData, BSData, CFData, FinancialStatementPayload } from "@/types/financial";
import { saveFinancialAnalysis, saveInvestmentDecision } from "@/lib/db"; // 追加

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
export async function syncSpecificStockAction(userId: string, portfolioId: string, ticker: string): Promise<{ success: boolean; data?: StockJudgment; message?: string }> {
  if (!userId || !portfolioId) return { success: false, message: "User ID required" };
  try {
    const sym = ticker.endsWith(".T") ? ticker : ticker + ".T";
    const plainTicker = ticker.replace(".T", "");
    let stk = STKS.find(s => s.ticker === plainTicker);
    if (!stk) {
      const basic = await getStockBasicInfoAction(plainTicker);
      if (!basic.success || !basic.data) return { success: false, message: "銘柄情報が取得できません" };
      stk = basic.data;
    }

    const path = `users/${userId}/portfolios/${portfolioId}/stock_judgments`;
    const docRef = doc(db, path, plainTicker);
    
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
        yf.chart(sym, { period1: start, period2: end, interval: "1d" }).catch(e => { 
          if (e.message.includes("No data found")) throw new Error("Chart: No data found (Symbol may be delisted)");
          throw new Error(`Chart: ${e.message}`); 
        }),
        yf.quoteSummary(sym, { 
          modules: [
            "defaultKeyStatistics", 
            "financialData", 
            "summaryDetail",
            "incomeStatementHistory",
            "balanceSheetHistory",
            "cashflowStatementHistory"
          ] 
        }).catch(e => {
          console.warn(`[Sync] Summary fetch soft failure for ${ticker}:`, e.message);
          syncError = `財務情報の取得に失敗しました(${e.message})`;
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
      const isDelisted = err.message.includes("No data found");
      
      if (isDelisted) {
        return {
          success: true,
          data: {
            ticker: plainTicker,
            companyName: stk?.name || plainTicker,
            sector: stk?.sector || "不明",
            currentPrice: 0,
            technicalScore: 0, technicalTrend: "neutral", technicalReasons: ["銘柄データが見つかりません"],
            fundamentalScore: 0, growthProfile: "weak", financialHealth: "weak", fundamentalReasons: ["データ取得不能"],
            valuationScore: 0, valuationLabel: "fair", valuationReasons: ["判定不能"],
            shareholderReturnScore: 0, dividendProfile: "low_dividend", holdSuitability: "neutral", shareholderReasons: ["情報なし"],
            totalScore: 0, signalLabel: "中立", certainty: 0, 
            summaryComment: "銘柄データが見つかりません。上場廃止またはティッカー変更の可能性があります。",
            syncStatus: "warning",
            syncError: "銘柄データが見つかりません（上場廃止の可能性があります）",
            updatedAt: new Date().toISOString(),
            chartData: [],
            valuationMetrics: { per: 0, pbr: 0, dividendYield: 0, roe: 0, equityRatio: 0 }
          } as StockJudgment
        };
      }

      return { 
        success: false, 
        message: `データ取得に失敗しました: ${err.message}` 
      };
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
    jud.minPurchaseAmount = currentPrice * 100;
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

    // 4. 財務諸表判定エンジンの実行
    try {
      if (summary) {
        const plHistory = (summary.incomeStatementHistory?.incomeStatementHistory || []) as any[];
        const bsHistory = (summary.balanceSheetHistory?.balanceSheetHistory || []) as any[];
        const cfHistory = (summary.cashflowStatementHistory?.cashflowStatementHistory || []) as any[];

        const mappedPL: PLData[] = plHistory.map(h => ({
          revenue: h.totalRevenue?.raw || 0,
          grossProfit: h.grossProfit?.raw || 0,
          operatingProfit: h.operatingIncome?.raw || 0,
          ordinaryProfit: h.operatingIncome?.raw || 0, // 簡易
          netIncome: h.netIncome?.raw || 0,
          eps: (h.netIncome?.raw || 0) / (summary.defaultKeyStatistics?.sharesOutstanding?.raw || 1),
          operatingMargin: ((h.operatingIncome?.raw || 0) / (h.totalRevenue?.raw || 1)) * 100,
          netMargin: ((h.netIncome?.raw || 0) / (h.totalRevenue?.raw || 1)) * 100,
          updatedAt: h.endDate?.fmt || new Date().toISOString()
        }));

        const mappedBS: BSData[] = bsHistory.map(h => ({
          totalAssets: h.totalAssets?.raw || 0,
          netAssets: h.totalStockholderEquity?.raw || 0,
          equity: h.totalStockholderEquity?.raw || 0,
          equityRatio: ((h.totalStockholderEquity?.raw || 0) / (h.totalAssets?.raw || 1)) * 100,
          retainedEarnings: h.retainedEarnings?.raw || 0,
          cashAndDeposits: h.cash?.raw || 0,
          interestBearingDebt: (h.shortLongTermDebt?.raw || 0) + (h.longTermDebt?.raw || 0),
          currentAssets: h.totalCurrentAssets?.raw || 0,
          currentLiabilities: h.totalCurrentLiabilities?.raw || 0,
          fixedLiabilities: (h.totalAssets?.raw || 0) - (h.totalCurrentAssets?.raw || 0), // 簡易計算
          updatedAt: h.endDate?.fmt || new Date().toISOString()
        }));

        const mappedCF: CFData[] = cfHistory.map(h => ({
          operatingCF: h.totalCashFromOperatingActivities?.raw || 0,
          investingCF: h.totalCashflowsFromInvestingActivities?.raw || 0,
          financingCF: h.totalCashflowsFromFinancingActivities?.raw || 0,
          freeCF: (h.totalCashFromOperatingActivities?.raw || 0) + (h.capitalExpenditures?.raw || 0),
          depreciation: h.depreciation?.raw || 0,
          updatedAt: h.endDate?.fmt || new Date().toISOString()
        }));

        const financialResult = performFinancialAnalysis(stk.ticker, stk.name, {
          pl: mappedPL,
          bs: mappedBS,
          cf: mappedCF
        });

        if (userId) {
          await saveFinancialAnalysis(userId, stk.ticker, financialResult).catch(e => console.error("FI Analysis save failed", e));
        }

        // --- 7. 意思決定エンジンの実行 & 保存 (プロ投資家レベル) ---
        // 既存の判断結果からパラメータを推定
        const estimatedWinRate = jud.totalScore > 70 ? 0.65 : jud.totalScore > 50 ? 0.55 : 0.45;
        const targetUpside = jud.valuationLabel === "undervalued" ? 1.25 : 1.15;
        const stopDownside = 0.93; // 7% stop loss as default for pro

        const decision = calculateDecision(stk.ticker, {
          winRate: estimatedWinRate,
          targetPrice: jud.currentPrice * targetUpside,
          stopPrice: jud.currentPrice * stopDownside,
          currentPrice: jud.currentPrice,
          currentDrawdown: 1.2, // 本来はポートフォリオ全体から取得するが、ここではデモ値
          sectorExposure: 15,    // 本来はポートフォリオ全体から取得するが、ここではデモ値
          trendStrength: jud.technicalScore
        });

        if (userId) {
          await saveInvestmentDecision(userId, stk.ticker, decision).catch(e => console.error("Investment Decision save failed", e));
        }
      }
    } catch (fiErr) {
      console.warn(`[Sync] Financial statement analysis failed for ${ticker}:`, fiErr);
    }

    // 3. Firestoreへの保存はクライアントサイド(Service層)で行うため、ここでは行わない

    return { success: true, data: JSON.parse(JSON.stringify(jud)) };
  } catch (err: any) {
    console.error(`[Stock] Critical sync error for ${ticker}:`, err);
    return { success: false, message: `致命的なエラー: ${err.message}` };
  }
}

export async function getStockJudgmentsAction(userId: string, portfolioId: string) {
  if (!userId || !portfolioId) return [];
  try {
    const path = `users/${userId}/portfolios/${portfolioId}/stock_judgments`;
    const colRef = collection(db, path);
    const q = query(colRef, orderBy("totalScore", "desc"));
    const snap = await getDocs(q).catch(err => {
      console.warn("[Stock] Firestore read failed:", err.message);
      return null;
    });

    if (!snap || snap.empty) return [];
    return snap.docs.map(d => d.data() as StockJudgment);
  } catch (err) {
    console.error("[Stock] getStockJudgmentsAction error:", err);
    return [];
  }
}

export async function setStockSyncingAction(userId: string, portfolioId: string, ticker: string) {
  // サーバー側での書き込みは権限エラーのため廃止。クライアント側でのみ実行。
  return { success: true };
}

export async function syncStockRealData(userId: string, portfolioId: string): Promise<{ success: boolean; count: number; data: StockJudgment[] }> {
  if (!userId || !portfolioId) return { success: false, count: 0, data: [] };
  const results: StockJudgment[] = [];
  for (const stk of STKS.slice(0, 15)) {
    const res = await syncSpecificStockAction(userId, portfolioId, stk.ticker);
    if (res.success && res.data) results.push(res.data);
  }
  return { success: true, count: results.length, data: results };
}
