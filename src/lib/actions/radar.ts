"use server";

import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { RadarResult, RadarFilter, RadarCategory, RadarDashboardData } from "@/types/radar";
import { categorizeStock, generateRadarComment } from "@/utils/stock/radarLogic";
import { 
  analyzeStockTechnical, 
  analyzeStockFundamental, 
  analyzeStockValuation, 
  analyzeStockShareholderReturn, 
  calculateStockTotalJudgment 
} from "@/utils/stock/stock_utils_bridge";

import { TSE_PRIME_MASTER } from "@/data/tse_prime_master";

import YahooFinance from "yahoo-finance2";
const yf = new YahooFinance();

const MAJOR_TICKERS = [
  "7203", "8306", "9984", "9432", "8058", "4063", "6758", "2914", "1605", "4502",
  "6501", "8031", "6954", "6367", "6098", "6178", "7751", "6752", "4568", "8316",
  "9022", "9101", "8801", "8267", "6981", "6861", "4519", "7011", "9020", "8001",
  "4503", "6301", "7267", "6902", "8053", "8308", "8309", "8766", "8802", "9433"
];

export async function executeRadar(filter: RadarFilter, forceRefresh = false): Promise<RadarDashboardData> {
  // 1. 鮮度チェック (1 hour check)
  if (!forceRefresh) {
    try {
      const latestDoc = doc(db, "market_radar", "latest");
      const snap = await getDoc(latestDoc);
      if (snap.exists()) {
        const data = snap.data() as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        const lastScanned = new Date(data.lastScannedAt || 0).getTime();
        const oneHour = 60 * 60 * 1000;
        
        if (Date.now() - lastScanned < oneHour && data.fullResults) {
          return data.fullResults as RadarDashboardData;
        }
      }
    } catch (e) {
      console.warn("[Radar] Failed to check freshness:", e);
    }
  }

  const results: RadarResult[] = [];
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 150);

  const fetchTasks = MAJOR_TICKERS.map(async (ticker) => {
    try {
      const sym = ticker + ".T";
      const masterInfo = TSE_PRIME_MASTER.find(m => m.ticker === ticker);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tick: any = await yf.quote(sym).catch(() => null);
      if (!tick) return null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const summs: any = await yf.quoteSummary(sym, {
        modules: ["defaultKeyStatistics", "financialData", "summaryDetail"]
      }).catch(() => null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hist: any[] = await yf.historical(sym, {
        period1: start, period2: end, interval: "1d"
      }).catch(() => []);

      if (!summs || hist.length < 20) return null;

      const s = summs.defaultKeyStatistics || {};
      const f = summs.financialData || {};
      const d = summs.summaryDetail || {};

      const stockData = {
        ticker,
        companyName: masterInfo?.name || tick.longName || tick.shortName || ticker,
        sector: masterInfo?.sector || tick.sector || "主要銘柄",
        currentPrice: tick.regularMarketPrice,
        marketCap: (tick.marketCap || 0) / 1000000000000, 
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

      const capInOkuyen = stockData.marketCap * 10000;
      if (capInOkuyen < filter.minMarketCap) return null;

      // 最低購入金額フィルタ (現在値 * 100株)
      const buyPrice = stockData.currentPrice * 100;
      if (filter.maxInvestment && buyPrice > filter.maxInvestment) return null;

      const prices = hist.map(h => h.close).filter(p => typeof p === "number");
      const tech = analyzeStockTechnical(prices, stockData.currentPrice);
      const fund = analyzeStockFundamental(stockData as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const val = analyzeStockValuation(stockData as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const divReturn = analyzeStockShareholderReturn(stockData as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      
      const judgment = calculateStockTotalJudgment(
        ticker, stockData.companyName, stockData.sector, stockData.currentPrice,
        tech, fund, val, divReturn
      );

      const tags = categorizeStock({ ...stockData, ...tech, totalScore: judgment.totalScore } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const comm = generateRadarComment(tags, judgment.totalScore);

      return { 
        ...judgment, 
        ...stockData, 
        categoryTags: tags, 
        summaryComment: comm,
        technicalScore: judgment.technicalScore || 0,
        fundamentalScore: judgment.fundamentalScore || 0
      } as RadarResult;
    } catch (e) {
      return null;
    }
  });

  const allFetched = await Promise.all(fetchTasks);
  const screened = allFetched.filter(r => r !== null) as RadarResult[];

  const sectorMap: Record<string, { totalReturn: number; count: number; marketCap: number }> = {};
  screened.forEach(s => {
    const sec = s.sector || "その他";
    if (!sectorMap[sec]) sectorMap[sec] = { totalReturn: 0, count: 0, marketCap: 0 };
    sectorMap[sec].totalReturn += s.totalScore;
    sectorMap[sec].count += 1;
    sectorMap[sec].marketCap += s.marketCap;
  });

  const sectors = Object.entries(sectorMap).map(([name, data]) => ({
    name,
    avgReturn: data.totalReturn / data.count,
    count: data.count,
    marketCap: data.marketCap
  })).sort((a, b) => b.marketCap - a.marketCap);

  const totalScoreAvg = screened.reduce((sum, r) => sum + r.totalScore, 0) / (screened.length || 1);
  const bullishCount = screened.filter(r => r.totalScore > 20).length;
  const bearishCount = screened.filter(r => r.totalScore < -20).length;
  const neutralCount = screened.length - bullishCount - bearishCount;
  
  const sentimentScore = Math.min(100, Math.max(0, 50 + (totalScoreAvg * 1.5)));
  const sentimentLabel = sentimentScore > 70 ? "強気" : sentimentScore > 40 ? "中立" : "弱気";

  const getCat = (cat: RadarCategory) => screened.filter(r => r.categoryTags.includes(cat)).slice(0, 6);

  const dashboardData: RadarDashboardData = {
    recommendations: { growth: getCat("growth"), value: getCat("value"), dividend: getCat("dividend"), trend: getCat("trend"), rebound: getCat("rebound") },
    rankings: {
      total: [...screened].sort((a, b) => b.totalScore - a.totalScore).slice(0, 5),
      growth: [...screened].sort((a, b) => b.revenueGrowth - a.revenueGrowth).slice(0, 5),
      value: [...screened].sort((a, b) => a.per - b.per).slice(0, 5),
      dividend: [...screened].sort((a, b) => b.dividendYield - a.dividendYield).slice(0, 5),
      trend: [...screened].sort((a, b) => b.technicalScore - a.technicalScore).slice(0, 5),
    },
    todayFocus: screened.sort((a, b) => b.totalScore - a.totalScore).slice(0, 3),
    marketOverview: {
      sentiment: { score: sentimentScore, label: sentimentLabel, bullishCount, bearishCount, neutralCount },
      sectors,
      topGainers: [...screened].sort((a, b) => b.totalScore - a.totalScore).slice(0, 5),
      topVolume: [...screened].sort((a, b) => b.volume - a.volume).slice(0, 5),
    },
    lastScannedAt: new Date().toISOString()
  };

  try {
    if (screened.length > 0) {
      const latestDoc = doc(db, "market_radar", "latest");
      await setDoc(latestDoc, {
        screenedCount: screened.length,
        sentiment: { score: sentimentScore, label: sentimentLabel, bullishCount, bearishCount, neutralCount },
        sectors,
        lastScannedAt: dashboardData.lastScannedAt,
        fullResults: dashboardData
      }, { merge: true });
    }
  } catch (err) {
    console.warn("[Radar] Failed to save latest summary to Firestore:", err);
  }

  return dashboardData;
}

export async function getLatestRadarAction(): Promise<RadarDashboardData | null> {
  try {
    const latestDoc = doc(db, "market_radar", "latest");
    const snap = await getDoc(latestDoc);
    if (snap.exists()) {
      return (snap.data() as any).fullResults || null; // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  } catch (e) {
    console.error("[Radar] Failed to fetch latest radar:", e);
  }
  return null;
}