import { AssetCalculated } from "@/types";

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface CompositionData {
  name: string;
  value: number;
  color: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "株": "#3b82f6",     // blue-500
  "FX": "#22c55e",     // green-500
  "仮想通貨": "#f59e0b", // amber-500
  "投資信託": "#8b5cf6", // violet-500
};

export const getCompositionData = (assets: AssetCalculated[]): CompositionData[] => {
  const map = new Map<string, number>();
  
  assets.forEach(asset => {
    const current = map.get(asset.category) || 0;
    map.set(asset.category, current + Math.max(0, asset.evaluatedValue));
  });

  return Array.from(map.entries()).map(([name, value]) => ({
    name,
    value,
    color: CATEGORY_COLORS[name] || "#94a3b8",
  })).filter(data => data.value > 0);
};

export const generateTrendData = (currentTotal: number, days: number = 30): ChartDataPoint[] => {
  if (currentTotal <= 0) return [];

  const data: ChartDataPoint[] = [];
  let currentValue = currentTotal;
  
  // 末尾（現在）から逆算して過去データを生成
  const tempValues = [currentTotal];
  
  for (let i = 1; i < days; i++) {
    // -1.5% 〜 +1.5% のランダムな乱高下を設定
    const changePercent = (Math.random() * 3 - 1.5) / 100;
    currentValue = currentValue / (1 + changePercent);
    tempValues.push(currentValue);
  }
  
  // 日付順（古い順）に反転させる
  tempValues.reverse();
  
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - i));
    
    data.push({
      date: date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" }),
      value: Math.floor(tempValues[i]),
    });
  }
  
  return data;
};
