import { FXPseudoOrderBook, FXOrderBookEntry } from "@/types/fx";

/**
 * 擬似板情報・流動性解析サービス
 * 価格の滞留密度とスプレッドから、市場の「厚み」と「壁」を推定します。
 */
export const FXLiquidityService = {
  /**
   * 擬似板情報を生成
   */
  generatePseudoOrderBook(
    currentPrice: number,
    bid: number,
    ask: number,
    ohlc1m: any[],
    pairCode: string = "USD/JPY"
  ): FXPseudoOrderBook {
    const isJPY = pairCode.endsWith("JPY");
    const step = isJPY ? 0.01 : 0.0001; 
    
    // 1. 直近の値動きから「注文の厚み」を密度推定
    const densityMap = this.calculateDensity(ohlc1m, step);
    
    const bids: FXOrderBookEntry[] = [];
    const asks: FXOrderBookEntry[] = [];
    const resistance: number[] = [];
    const support: number[] = [];

    const precision = isJPY ? 2 : 5;

    // 指定レンジ内の価格帯を走査
    for (let i = -10; i <= 10; i++) {
        const price = parseFloat((currentPrice + i * step).toFixed(precision));
        const size = densityMap.get(price) || (Math.random() * 5 + 5); 
        const isWall = size > 25; 

        const entry: FXOrderBookEntry = { price, size, isWall };
        
        if (price < currentPrice) {
            bids.push(entry);
            if (isWall) support.push(price);
        } else if (price > currentPrice) {
            asks.push(entry);
            if (isWall) resistance.push(price);
        }
    }

    // 需給の偏り (imbalance)
    const bidTotal = bids.reduce((sum, b) => sum + b.size, 0);
    const askTotal = asks.reduce((sum, a) => sum + a.size, 0);
    const imbalance = (bidTotal - askTotal) / (bidTotal + askTotal);

    // 流動性スコアリング
    const spreadPips = isJPY ? (ask - bid) * 100 : (ask - bid) * 10000;
    let liquidityScore = 100;
    if (spreadPips > 0.3) liquidityScore -= 30; 
    if (spreadPips > 0.8) liquidityScore -= 50; 
    liquidityScore = Math.max(0, liquidityScore);

    return {
      bids: bids.sort((a, b) => b.price - a.price),
      asks: asks.sort((a, b) => a.price - b.price),
      imbalance,
      liquidityScore,
      walls: { resistance, support }
    };
  },

  /**
   * 価格帯ごとの滞留密度を算出
   */
  calculateDensity(data: any[], step: number): Map<number, number> {
    const map = new Map<number, number>();
    const precision = step < 0.001 ? 5 : 2;
    
    data.slice(-50).forEach(bar => {
        const startIdx = Math.round(bar.low / step);
        const endIdx = Math.round(bar.high / step);

        for (let idx = startIdx; idx <= endIdx; idx++) {
            const price = parseFloat((idx * step).toFixed(precision));
            map.set(price, (map.get(price) || 0) + 1);
        }
    });

    return map;
  }
};
