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
}
