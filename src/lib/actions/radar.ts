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

function generateMockMarketData(): any[] {
  const sectors = ["情報・通信業", "電気機器", "輸送用機器", "銀行業", "卸売業", "化学", "医薬品"];
  const mocks: any[] = [];
  for (let i = 0; i < 50; i++) {
    const ticker = (1000 + Math.floor(Math.random() * 8000)).toString();
    const sector = sectors[Math.floor(Math.random() * sectors.length)];
    const price = 500 + Math.random() * 5000;
    mocks.push({
      ticker,
      companyName: `Company ${ticker}`,
      sector,
      currentPrice: Math.round(price),
      marketCap: 100 + Math.random() * 5000,
      volume: 10000 + Math.random() * 1000000,
      per: 5 + Math.random() * 30,
      pbr: 0.5 + Math.random() * 3,
      roe: 5 + Math.random() * 15,
      revenueGrowth: 5 + Math.random() * 20,
      epsGrowth: 5 + Math.random() * 20,
      dividendYield: 1 + Math.random() * 4,
      payoutRatio: 20 + Math.random() * 40,
    });
  }
  return mocks;
}

export async function executeRadar(filter: RadarFilter): Promise<RadarDashboardData> {
  const rawData = generateMockMarketData();
  const screened = rawData.filter(d => {
    if (d.marketCap < filter.minMarketCap) return false;
    if (d.per < filter.perRange[0] || d.per > filter.perRange[1]) return false;
    return true;
  });

  const results: RadarResult[] = screened.map(d => {
    const prices = Array.from({ length: 200 }, () => d.currentPrice * (0.9 + Math.random() * 0.2));
    const tech = analyzeStockTechnical(prices, d.currentPrice);
    const fundData = { ...d, updatedAt: new Date().toISOString() };
    const fund = analyzeStockFundamental(fundData);
    const val = analyzeStockValuation(fundData);
    const div = analyzeStockShareholderReturn(fundData);
    const judgment = calculateStockTotalJudgment(d.ticker, d.companyName, d.sector, d.currentPrice, tech, fund, val, div);
    const tags = categorizeStock({ ...d, ...tech, totalScore: judgment.totalScore });
    const comm = generateRadarComment(tags, judgment.totalScore);
    return { ...judgment, ...d, categoryTags: tags, summaryComment: comm };
  });

  const saveTasks = results.slice(0, 10).map(async (res) => {
    const docId = res.ticker + "_" + new Date().toISOString().split('T')[0];
    await (setDoc as any)(doc(db, "market_scans", docId), {
      ...res,
      updatedAt: new Date().toISOString()
    });
  });
  await Promise.all(saveTasks);

  const getCat = (cat: RadarCategory) => results.filter(r => r.categoryTags.includes(cat)).slice(0, 4);
  return {
    recommendations: { growth: getCat("growth"), value: getCat("value"), dividend: getCat("dividend"), trend: getCat("trend"), rebound: getCat("rebound") },
    rankings: {
      total: [...results].sort((a, b) => b.totalScore - a.totalScore).slice(0, 5),
      growth: [...results].sort((a, b) => b.revenueGrowth - a.revenueGrowth).slice(0, 5),
      value: [...results].sort((a, b) => a.per - b.per).slice(0, 5),
      dividend: [...results].sort((a, b) => b.dividendYield - a.dividendYield).slice(0, 5),
      trend: [...results].sort((a, b) => b.technicalScore - a.technicalScore).slice(0, 5),
    },
    todayFocus: results.sort((a, b) => b.totalScore - a.totalScore).slice(0, 3)
  };
}
