import { Asset, AssetCalculated } from "@/types";
import { getJpyRate, getBaseCurrency } from "./fxUtils";

export const dummyAssets: Asset[] = [
  { id: "1", symbol: "AAPL", name: "Apple Inc.", category: "外国株", currentPrice: 190.5, quantity: 50, averageCost: 175.2, currency: "USD" },
  { id: "2", symbol: "7203.T", name: "トヨタ自動車", category: "日本株", currentPrice: 3850, quantity: 400, averageCost: 3200, currency: "JPY" },
  { id: "3", symbol: "USDJPY=X", name: "USD/JPY", category: "FX", currentPrice: 151.20, quantity: 10000, averageCost: 145.50, currency: "JPY" },
  { id: "4", symbol: "BTC-USD", name: "Bitcoin", category: "仮想通貨", currentPrice: 65000, quantity: 0.15, averageCost: 55000, currency: "USD" },
  { id: "5", symbol: "EMAXIS-SLIM", name: "eMAXIS Slim 全世界株式", category: "投資信託", currentPrice: 25000, quantity: 150, averageCost: 20000, currency: "JPY" },
];

export const calculateAssetValues = (asset: Asset, prices: Record<string, number> = {}): AssetCalculated => {
  // 対円レート取得
  const usdJpyRate = prices["JPY=X"] || prices["USDJPY=X"] || 151.2;
  
  // デフォルトのレート設定 (非FX用)
  let rate = asset.currency === "USD" ? usdJpyRate : 1;
  let currentPriceYen = asset.currentPrice * rate;
  let averageCostYen = asset.averageCost * rate;

  let pricePnL = (currentPriceYen - averageCostYen) * asset.quantity;
  let evaluatedValue = currentPriceYen * asset.quantity;
  
  // FXの場合は特殊な計算 (クロス通貨対応)
  if (asset.category === "FX") {
    // シンボルまたは名前からベース通貨を解析
    const base = getBaseCurrency(asset.name, asset.symbol);
    
    // 対価通貨 (Counter Currency) を特定
    let counter = "JPY";
    if (asset.symbol && asset.symbol.endsWith("=X")) {
      const pair = asset.symbol.replace("=X", "");
      if (pair.length === 6) counter = pair.substring(3, 6);
    } else if (asset.name.includes("/")) {
      counter = asset.name.split("/")[1].trim();
    }

    const baseRate = getJpyRate(base, prices);
    
    // 対価通貨レートを取得
    let counterRate = getJpyRate(counter, prices);
    if (!counterRate && asset.currentPrice > 0) {
      counterRate = baseRate / asset.currentPrice;
    }
    if (!counterRate) counterRate = 1;

    // FXの損益計算: (評価レート - 取得レート) * (数量 * ロット単位) * 対価通貨の対円レート
    const FX_LOT_SIZE = 10000;
    const totalQuantity = asset.quantity * FX_LOT_SIZE;
    const pips = asset.currentPrice - asset.averageCost;
    pricePnL = pips * totalQuantity * counterRate;
    
    // 証拠金計算: (数量 * 1単位あたりの価格) * 証拠金率(4%) * ベース通貨の対円レート
    const nominalYen = Math.abs(totalQuantity) * baseRate;
    const margin = nominalYen * 0.04; 
    
    evaluatedValue = (asset.depositMargin || 0) + pricePnL + (asset.swapPoints || 0);
    
    // 表示用により正確な情報をセット
    currentPriceYen = asset.currentPrice * counterRate;
    averageCostYen = asset.averageCost * counterRate;
  }

  const profitAndLoss = pricePnL + (asset.swapPoints || 0);
  
  // 騰落率の計算 (FXの場合は預託証拠金を分母とする)
  const marginForDenominator = asset.category === "FX" 
    ? (asset.depositMargin || (Math.abs(asset.quantity * 10000) * (getJpyRate(getBaseCurrency(asset.name, asset.symbol), prices) || usdJpyRate) * 0.04))
    : (Math.abs(asset.quantity) * averageCostYen);
    
  const profitPercentage = marginForDenominator > 0 ? (profitAndLoss / marginForDenominator) * 100 : 0;

  // デモ用に前日比をシミュレーション
  const seed = (asset.id || asset.symbol || asset.name).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const dailyChangePercentage = ((seed % 50) / 10) - 2.5; 
  const dailyChange = Math.abs(evaluatedValue) * (dailyChangePercentage / 100);

  return {
    ...asset,
    evaluatedValue: isNaN(evaluatedValue) ? 0 : evaluatedValue,
    profitAndLoss: isNaN(profitAndLoss) ? 0 : profitAndLoss,
    profitPercentage: isNaN(profitPercentage) ? 0 : profitPercentage,
    dailyChange: isNaN(dailyChange) ? 0 : dailyChange,
    dailyChangePercentage: isNaN(dailyChangePercentage) ? 0 : dailyChangePercentage,
    exchangeRate: asset.category === "FX" ? undefined : (asset.currency === "USD" ? usdJpyRate : undefined),
  };
};

export const getCalculatedAssets = (prices: Record<string, number> = {}): AssetCalculated[] => {
  return dummyAssets.map(asset => calculateAssetValues(asset, prices));
};

export const getTotalAssetsValue = (assets: AssetCalculated[]): number => {
  return assets.reduce((total, asset) => total + asset.evaluatedValue, 0);
};

export const getTotalProfitAndLoss = (assets: AssetCalculated[]): number => {
  return assets.reduce((total, asset) => total + asset.profitAndLoss, 0);
};
