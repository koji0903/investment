export type AssetCategory = "株" | "FX" | "仮想通貨" | "投資信託";

export interface Asset {
  id: string;
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
