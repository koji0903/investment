import { Asset, AssetCalculated } from "@/types";

export const dummyAssets: Asset[] = [
  { id: "1", name: "Apple Inc.", category: "株", currentPrice: 28500, quantity: 50, averageCost: 25000 },
  { id: "2", name: "トヨタ自動車", category: "株", currentPrice: 3850, quantity: 400, averageCost: 3200 },
  { id: "3", name: "USD/JPY", category: "FX", currentPrice: 151.20, quantity: 10000, averageCost: 145.50 },
  { id: "4", name: "Bitcoin", category: "仮想通貨", currentPrice: 10500000, quantity: 0.15, averageCost: 8000000 },
  { id: "5", name: "eMAXIS Slim 全世界株式", category: "投資信託", currentPrice: 25000, quantity: 150, averageCost: 20000 },
];

export const calculateAssetValues = (asset: Asset): AssetCalculated => {
  const evaluatedValue = asset.currentPrice * asset.quantity;
  const totalCost = asset.averageCost * asset.quantity;
  const profitAndLoss = evaluatedValue - totalCost;
  const profitPercentage = totalCost > 0 ? (profitAndLoss / totalCost) * 100 : 0;

  return {
    ...asset,
    evaluatedValue,
    profitAndLoss,
    profitPercentage,
  };
};

export const getCalculatedAssets = (): AssetCalculated[] => {
  return dummyAssets.map(calculateAssetValues);
};

export const getTotalAssetsValue = (assets: AssetCalculated[]): number => {
  return assets.reduce((total, asset) => total + asset.evaluatedValue, 0);
};

export const getTotalProfitAndLoss = (assets: AssetCalculated[]): number => {
  return assets.reduce((total, asset) => total + asset.profitAndLoss, 0);
};
