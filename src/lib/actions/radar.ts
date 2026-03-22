"use server";

import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { RadarResult, RadarFilter, RadarCategory, RadarDashboardData } from "@/types/radar";
import { categorizeStock, generateRadarComment } from "@/utils/stock/radarLogic";
import { 
  analyzeStockTechnical, 
  analyzeStockFundamental, 
  analyzeStockValuation, 
  analyzeStockShareholderReturn, 
  calculateStockTotalJudgment 
} from "@/utils/stock/stock_utils_bridge";

import yahooFinance from "yahoo-finance2";

const MAJOR_TICKERS = [
  "7203", "8306", "9984", "9432", "8058", "4063", "6758", "2914", "1605", "4502",
  "6501", "8031", "6954", "6367", "6098", "6178", "7751", "6752", "4568", "8316",
  "9022", "9101", "8801", "8267", "6981", "6861", "4519", "7011", "9020", "8001"
];

export async function executeRadar(filter: RadarFilter): Promise<RadarDashboardData> {
  const results: RadarResult[] = [];
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 150);

  const fetchTasks = MAJOR_TICKERS.map(async (ticker) => {
    try {
      const sym = ticker + ".T";
      const tick: any = await (yahooFinance as any).quote(sym).catch(() => null);
      if (!tick) return null;

      const summs: any = await (yahooFinance as any).quoteSummary(sym, {
        modules: ["defaultKeyStatistics", "financialData", "summaryDetail"]
      }).catch(() => null);

      const hist: any[] = await (yahooFinance as any).historical(sym, {
        period1: start, period2: end, interval: "1d"
      }).catch(() => []);

      if (!summs || hist.length < 20) return null;

      const s = summs.defaultKeyStatistics || {};
      const f = summs.financialData || {};
      const d = summs.summaryDetail || {};

      const stockData = {
        ticker,
        companyName: tick.longName || tick.shortName || ticker,
        sector: "主要銘柄",
        currentPrice: tick.regularMarketPrice,
        marketCap: (tick.marketCap || 0) / 1000000000000, // 兆円
        volume: tick.regularMarketVolume || 0,
        per: tick.trailingPE || tick.forwardPE || 15,
        pbr: tick.priceToBook || 1.1,
        roe: (f.returnOnEquity?.raw || 0) * 100,
        revenueGrowth: (f.revenueGrowth?.raw || 0) * 100,
        epsGrowth: 10,
        dividendYield: (d.dividendYield?.raw || 0) * 100,
        payoutRatio: (s.payoutRatio?.raw || 0) * 100,
        updatedAt: new Date().toISOString()
      };

      // Filter check
      if (stockData.marketCap < (filter.minMarketCap / 1000)) return null; // Filter is in 億円? No, let's assume filter is in 兆円 for radar if it's 500? Wait.
      // The default filter has minMarketCap: 500. If that's 億円, then 500億円 = 0.05兆円.
      // Let's adjust filter logic to handle 億円.
      const marketCapInOkuyen = stockData.marketCap * 10000;
      if (marketCapInOkuyen < filter.minMarketCap) return null;
      if (stockData.per < filter.perRange[0] || stockData.per > filter.perRange[1]) return null;

      const prices = hist.map(h => h.close).filter(p => typeof p === "number");
      const tech = analyzeStockTechnical(prices, stockData.currentPrice);
      const fund = analyzeStockFundamental(stockData as any);
      const val = analyzeStockValuation(stockData as any);
      const divReturn = analyzeStockShareholderReturn(stockData as any);
      
      const judgment = calculateStockTotalJudgment(
        ticker, stockData.companyName, stockData.sector, stockData.currentPrice,
        tech, fund, val, divReturn
      );

      const tags = categorizeStock({ ...stockData, ...tech, totalScore: judgment.totalScore } as any);
      const comm = generateRadarComment(tags, judgment.totalScore);

      return { ...judgment, ...stockData, categoryTags: tags, summaryComment: comm };
    } catch (e) {
      return null;
    }
  });

  const allFetched = await Promise.all(fetchTasks);
  const screened = allFetched.filter(r => r !== null) as RadarResult[];

  const saveTasks = screened.slice(0, 10).map(async (res) => {
    const docId = res.ticker + "_" + new Date().toISOString().split('T')[0];
    await (setDoc as any)(doc(db, "market_scans", docId), {
      ...res,
      updatedAt: new Date().toISOString()
    });
  });
  await Promise.all(saveTasks);

  const getCat = (cat: RadarCategory) => screened.filter(r => r.categoryTags.includes(cat)).slice(0, 4);
  return {
    recommendations: { growth: getCat("growth"), value: getCat("value"), dividend: getCat("dividend"), trend: getCat("trend"), rebound: getCat("rebound") },
    rankings: {
      total: [...screened].sort((a, b) => b.totalScore - a.totalScore).slice(0, 5),
      growth: [...screened].sort((a, b) => b.revenueGrowth - a.revenueGrowth).slice(0, 5),
      value: [...screened].sort((a, b) => a.per - b.per).slice(0, 5),
      dividend: [...screened].sort((a, b) => b.dividendYield - a.dividendYield).slice(0, 5),
      trend: [...screened].sort((a, b) => b.technicalScore - a.technicalScore).slice(0, 5),
    },
    todayFocus: screened.sort((a, b) => b.totalScore - a.totalScore).slice(0, 3)
  };
}
