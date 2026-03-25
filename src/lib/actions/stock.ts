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
import { doc, setDoc } from "firebase/firestore";

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
];

export async function syncStockRealData() {
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 250);

    const tasks = STKS.map(async (stk) => {
      try {
        const sym = stk.ticker + ".T";
        
        let hist: any[] | null = null;
        try {
          const r = await yf.historical(sym, {
            period1: start,
            period2: end,
            interval: "1d"
          });
          hist = r as any[];
        } catch (e) {
          return null;
        }

        const tick: any = await yf.quote(sym).catch(() => null);
        
        const m1 = "defaultKeyStatistics";
        const m2 = "financialData";
        const m3 = "summaryDetail";
        
        const summs: any = await yf.quoteSummary(sym, {
          modules: [m1, m2, m3]
        }).catch(() => null);

        if (!tick || !hist || hist.length < 50) return null;

        const prcs = hist.map(h => h.close).filter(p => typeof p === "number");
        const price = tick.regularMarketPrice || prcs[prcs.length - 1];

        const s = summs?.[m1] || {};
        const f = summs?.[m2] || {};
        const d = summs?.[m3] || {};

        const data: StockFundamental = {
          ticker: stk.ticker,
          companyName: stk.name,
          sector: stk.sector,
          revenueGrowth: (f.revenueGrowth?.raw || 0) * 100,
          operatingProfitGrowth: 10,
          epsGrowth: (s.forwardEps?.raw / s.trailingEps?.raw - 1) * 100 || 5,
          roe: (f.returnOnEquity?.raw || 0) * 100,
          roa: (f.returnOnAssets?.raw || 0) * 100,
          operatingMargin: (f.operatingMargins?.raw || 0) * 100,
          equityRatio: 50,
          interestBearingDebt: 1000,
          operatingCashflow: f.operatingCashflow?.raw || 0,
          freeCashflow: f.freeCashflow?.raw || 0,
          per: tick.trailingPE || 15,
          pbr: tick.priceToBook || 1.2,
          evEbitda: s.enterpriseToEbitda?.raw || 10,
          avgPer5Year: d.trailingPE?.raw || 15,
          avgPbr5Year: 1.0, 
          dividendYield: (d.dividendYield?.raw || 0) * 100,
          payoutRatio: (s.payoutRatio?.raw || 0) * 100,
          dividendGrowthYears: 5,
          buybackFlag: false,
          updatedAt: new Date().toISOString()
        };

        const jud = calculateStockTotalJudgment(
          stk.ticker, stk.name, stk.sector, price,
          analyzeStockTechnical(prcs, price),
          analyzeStockFundamental(data),
          analyzeStockValuation(data),
          analyzeStockShareholderReturn(data)
        );

        await setDoc(doc(db, "japanese_stocks", stk.ticker), jud);
        await setDoc(doc(db, "japanese_stock_fundamentals", stk.ticker), data);
        
        return jud;
      } catch (err) {
        return null;
      }
    });

    const res = await Promise.all(tasks);
    const validResults = res.filter(r => r !== null) as StockJudgment[];
    return { 
      success: true, 
      count: validResults.length, 
      data: validResults.sort((a, b) => b.totalScore - a.totalScore),
      updatedAt: new Date().toISOString()
    };
  } catch (err) {
    return { success: false, count: 0, data: [], updatedAt: new Date().toISOString() };
  }
}
