import { StockJudgment } from "./stock";

export type RadarCategory = "growth" | "value" | "dividend" | "trend" | "rebound";

export interface RadarFilter {
  minMarketCap: number; 
  minVolume: number;
  perRange: [number, number];
  pbrRange: [number, number];
  minRoe: number;
  minRevenueGrowth: number;
  minDividendYield: number;
  sectors: string[];
}

export interface RadarResult extends StockJudgment {
  categoryTags: RadarCategory[];
  marketCap: number;
  volume: number;
  revenueGrowth: number;
  epsGrowth: number;
  roe: number;
  per: number;
  pbr: number;
  dividendYield: number;
}

export interface SectorPerformance {
  name: string;
  avgReturn: number;
  count: number;
  marketCap: number; // 兆円
}

export interface MarketSentiment {
  score: number; // 0-100
  label: string;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
}

export interface RadarDashboardData {
  recommendations: Record<RadarCategory, RadarResult[]>;
  rankings: {
    total: RadarResult[];
    growth: RadarResult[];
    value: RadarResult[];
    dividend: RadarResult[];
    trend: RadarResult[];
  };
  todayFocus: RadarResult[];
  marketOverview: {
    sentiment: MarketSentiment;
    sectors: SectorPerformance[];
    topGainers: RadarResult[];
    topVolume: RadarResult[];
  };
  lastScannedAt: string;
}
