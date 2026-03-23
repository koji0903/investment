export type NisaAccountType = "accumulation" | "growth";

export interface NisaAccumulationSetting {
  id: string;
  userId: string;
  accountType: NisaAccountType;
  symbol: string;
  name: string;
  amount: number; // 毎月の積立額 (円)
  dayOfMonth: number; // 積立日 (1-28)
  status: "active" | "paused";
  lastProcessedMonth?: string; // "YYYY-MM"
  createdAt: string;
  updatedAt: string;
}



export interface NisaProgress {
  totalAccumulated: number; // 累計積立額 (生涯合計)
  currentYearAccumulated: number; // 本年度の積立額
  growthYearlyUsage: number; // 成長投資枠の今年度使用額
  accumulationYearlyUsage: number; // つみたて投資枠の今年度使用額
  
  // NISA Limits (2024 New NISA Rules)
  limits: {
    yearlyGrowth: number; // 240万円
    yearlyAccumulation: number; // 120万円
    yearlyTotal: number; // 360万円
    lifetimeTotal: number; // 1800万円
  };
}
