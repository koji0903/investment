import { Asset, AssetCalculated } from "@/types";

export const dummyAssets: Asset[] = [
  { id: "1", symbol: "AAPL", name: "Apple Inc.", category: "外国株", currentPrice: 190.5, quantity: 50, averageCost: 175.2, currency: "USD" },
  { id: "2", symbol: "7203.T", name: "トヨタ自動車", category: "日本株", currentPrice: 3850, quantity: 400, averageCost: 3200, currency: "JPY" },
  { id: "3", symbol: "USDJPY=X", name: "USD/JPY", category: "FX", currentPrice: 151.20, quantity: 10000, averageCost: 145.50, currency: "JPY" },
  { id: "4", symbol: "BTC-USD", name: "Bitcoin", category: "仮想通貨", currentPrice: 65000, quantity: 0.15, averageCost: 55000, currency: "USD" },
  { id: "5", symbol: "EMAXIS-SLIM", name: "eMAXIS Slim 全世界株式", category: "投資信託", currentPrice: 25000, quantity: 150, averageCost: 20000, currency: "JPY" },
];

export const calculateAssetValues = (asset: Asset, usdJpyRate: number = 150): AssetCalculated => {
  // 通貨がUSDの場合は円換算する
  const rate = asset.currency === "USD" ? usdJpyRate : 1;
  
  const currentPriceYen = asset.currentPrice * rate;
  const averageCostYen = asset.averageCost * rate;

  const totalNotional = currentPriceYen * asset.quantity;
  const totalCost = averageCostYen * asset.quantity;
  const pricePnL = totalNotional - totalCost;
  const profitAndLoss = pricePnL + (asset.swapPoints || 0);
  const profitPercentage = totalCost !== 0 ? (profitAndLoss / Math.abs(totalCost)) * 100 : 0;

  let evaluatedValue = totalNotional;

  // FXの場合は「数量×必要証拠金 + 評価損益」を評価額とする（実効的な持分）
  if (asset.category === "FX") {
    // 日本国内の個人FXレバレッジ25倍（証拠金率4%）を基準に自動算出
    // 外貨ペア（EUR/USD等）の場合も currentPriceYen は既に円換算されているため適用可能
    const autoMarginPerUnit = currentPriceYen * 0.04; 
    const margin = Math.abs(asset.quantity) * (asset.requiredMargin || autoMarginPerUnit);
    evaluatedValue = margin + profitAndLoss;
  }

  // デモ用に前日比をシミュレーション (1%〜3%の変動)
  const seed = (asset.id || asset.symbol).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const dailyChangePercentage = ((seed % 50) / 10) - 2.5; // -2.5% 〜 +2.5%
  const dailyChange = Math.abs(evaluatedValue) * (dailyChangePercentage / 100);

  return {
    ...asset,
    evaluatedValue,
    profitAndLoss,
    profitPercentage,
    dailyChange,
    dailyChangePercentage,
    exchangeRate: asset.currency === "USD" ? usdJpyRate : undefined,
  };
};

export const getCalculatedAssets = (usdJpyRate: number = 150): AssetCalculated[] => {
  return dummyAssets.map(asset => calculateAssetValues(asset, usdJpyRate));
};

export const getTotalAssetsValue = (assets: AssetCalculated[]): number => {
  return assets.reduce((total, asset) => total + asset.evaluatedValue, 0);
};

export const getTotalProfitAndLoss = (assets: AssetCalculated[]): number => {
  return assets.reduce((total, asset) => total + asset.profitAndLoss, 0);
};
