import { LucideIcon } from "lucide-react";

export type IndustryTrend = "sunny" | "cloudy" | "rainy" | "stormy"; // 四季報風の天気予報

export interface CompanyInfo {
  id: string;
  name: string;
  symbol: string;
  marketCap: number; // 兆円
  revenue: number[]; // 直近数年の売上推移
  profit: number[];  // 直近数年の営業利益推移
  description: string;
  sentiment: "bullish" | "bearish" | "neutral";
}

export interface IndustryRelation {
  from: string; // Company ID
  to: string;   // Company ID
  type: "subsidiary" | "partnership" | "competitor" | "supplier";
  label: string;
}

export interface IndustryAnalysis {
  id: string;
  name: string;
  iconName: string; // Lucide icon name
  trend: IndustryTrend;
  trendReason: string;
  overview: string;
  companies: CompanyInfo[];
  relations: IndustryRelation[];
}
