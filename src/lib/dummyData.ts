import { Asset, AssetCalculated } from "@/types";

export const dummyAssets: Asset[] = [
  { id: "1", symbol: "AAPL", name: "Apple Inc.", category: "外国株", currentPrice: 190.5, quantity: 50, averageCost: 175.2, currency: "USD" },
  { id: "2", symbol: "7203.T", name: "トヨタ自動車", category: "日本株", currentPrice: 3850, quantity: 400, averageCost: 3200, currency: "JPY" },
  { id: "3", symbol: "USDJPY=X", name: "USD/JPY", category: "FX", currentPrice: 151.20, quantity: 10000, averageCost: 145.50, currency: "JPY" },
  { id: "4", symbol: "BTC-USD", name: "Bitcoin", category: "仮想通貨", currentPrice: 65000, quantity: 0.15, averageCost: 55000, currency: "USD" },
  { id: "5", symbol: "EMAXIS-SLIM", name: "eMAXIS Slim 全世界株式", category: "投資信託", currentPrice: 25000, quantity: 150, averageCost: 20000, currency: "JPY" },
];

export const calculateAssetValues = (asset: Asset, prices: Record<string, number> = {}): AssetCalculated => {
  const usdJpyRate = prices["JPY=X"] || 151.2;
  
  // デフォルトのレート設定 (非FX用)
  let rate = asset.currency === "USD" ? usdJpyRate : 1;
  let currentPriceYen = asset.currentPrice * rate;
  let averageCostYen = asset.averageCost * rate;

  let totalNotional = currentPriceYen * asset.quantity;
  let totalCost = averageCostYen * asset.quantity;
  let pricePnL = totalNotional - totalCost;
  
  let evaluatedValue = totalNotional;

  // FXの場合は特殊な計算 (クロス通貨対応)
  if (asset.category === "FX") {
    // シンボルから通貨を解析 (例: EURCHF=X -> Base: EUR, Counter: CHF)
    let base = "USD";
    let counter = "JPY";
    
    if (asset.symbol && asset.symbol.endsWith("=X")) {
      const pair = asset.symbol.replace("=X", "");
      if (pair.length === 6) {
        base = pair.substring(0, 3);
        counter = pair.substring(3, 6);
      }
    } else if (asset.name.includes("/")) {
      const parts = asset.name.split("/");
      base = parts[0].trim();
      counter = parts[1].trim();
    }

    // 各通貨の対円レートを取得
    const getJpyRate = (ccy: string) => {
      if (ccy === "JPY") return 1;
      if (prices[`${ccy}JPY=X`]) return prices[`${ccy}JPY=X`];
      // クロスレートの合成 (例: CHF -> CHFUSD * USDJPY)
      if (prices[`${ccy}USD=X`]) return prices[`${ccy}USD=X`] * usdJpyRate;
      if (ccy === "USD") return usdJpyRate;
      return 1;
    };

    const baseRate = getJpyRate(base);
    const counterRate = getJpyRate(counter);
    const FX_LOT_SIZE = 10000; // 1ロット = 10,000通貨単位 (国内標準)

    // FXの損益計算: (評価レート - 取得レート) * (数量 * ロット単位) * 対価通貨の対円レート
    const totalQuantity = asset.quantity * FX_LOT_SIZE;
    const pips = asset.currentPrice - asset.averageCost;
    pricePnL = pips * totalQuantity * counterRate;
    
    // 証拠金計算: (数量 * 1単位あたりの価格) * 証拠金率(4%) * ベース通貨の対円レート
    const nominalYen = Math.abs(totalQuantity) * baseRate;
    const margin = nominalYen * 0.04; 
    
    // ユーザーの期待（評価額がマイナスになるはず）に合わせ、FXの evaluatedValue は損益を主とする
    // ただし、ポートフォリオ全体では「証拠金 + 損益」が資産価値となるため、ここでは P/L + Swap のみを evaluatedValue とし、
    // 必要証拠金は別途管理・表示する設計に変更
    evaluatedValue = pricePnL + (asset.swapPoints || 0);
    
    // 表示用により正確な情報をセット (FXの場合は対価通貨の円換算値を単価とする)
    currentPriceYen = asset.currentPrice * counterRate;
    averageCostYen = asset.averageCost * counterRate;
  }

  const profitAndLoss = pricePnL + (asset.swapPoints || 0);
  
  // 騰落率の計算 (FXの場合は必要証拠金を分母とする)
  // 分母は「取得時のベース通貨価値 * 0.04」
  const marginForDenominator = asset.category === "FX" 
    ? (Math.abs(asset.quantity * 10000) * (prices[asset.symbol.substring(0,3)+"JPY=X"] || usdJpyRate) * 0.04)
    : (Math.abs(asset.quantity) * averageCostYen);
    
  const profitPercentage = marginForDenominator > 0 ? (profitAndLoss / marginForDenominator) * 100 : 0;

  // デモ用に前日比をシミュレーション
  const seed = (asset.id || asset.symbol || asset.name).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const dailyChangePercentage = ((seed % 50) / 10) - 2.5; 
  const dailyChange = Math.abs(evaluatedValue) * (dailyChangePercentage / 100);

  return {
    ...asset,
    evaluatedValue,
    profitAndLoss,
    profitPercentage: isNaN(profitPercentage) ? 0 : profitPercentage,
    dailyChange,
    dailyChangePercentage,
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
