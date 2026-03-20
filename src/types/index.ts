export type AssetCategory = "株" | "FX" | "仮想通貨" | "投資信託";

export type TransactionType = "buy" | "sell";

export interface Transaction {
  id: string;
  assetId: string;
  type: TransactionType;
  quantity: number;
  price: number;
  date: string;
}

export interface Asset {
  id: string;
  symbol: string; // 価格取得用のシンボル (AAPL, 7203.T等)
  name: string;
  category: AssetCategory;
  currentPrice: number;
  quantity: number;
  averageCost: number;
}

export interface AssetCalculated extends Asset {
  evaluatedValue: number;
  profitAndLoss: number;
  profitPercentage: number;
  dailyChange: number;
  dailyChangePercentage: number;
}

export type ProposalStatus = "pending" | "executed" | "rejected";

export interface TradeProposal {
  id: string;
  assetSymbol: string;
  assetName: string;
  type: TransactionType;
  quantity: number;
  price: number;
  reason: string;
  status: ProposalStatus;
  createdAt: string;
}

export interface InvestmentReport {
  id: string;
  type: "weekly" | "monthly";
  date: string;         // レポート対象日
  totalValue: number;
  performancePct: number;
  profitAndLoss: number;
  summary: string;
  advice: { title: string; text: string }[];
  assetDistribution: { name: string; value: number }[];
  createdAt: string;
}

export interface NotificationSettings {
  lineEnabled: boolean;
  lineToken: string;
  emailEnabled: boolean;
  emailAddress: string;
  triggers: {
    alerts: boolean;
    strategy: boolean;
    market: boolean;
  };
}

export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  allocation: Partial<Record<AssetCategory, number>>;
  riskLevel: "low" | "moderate" | "high";
}

export interface RiskRule {
  maxLossPct: number;
  stopLossPct: number;
  maxDrawdownPct: number;
  enabled: boolean;
  actionType: "alert" | "suggest_sell";
}
