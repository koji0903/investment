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
}
