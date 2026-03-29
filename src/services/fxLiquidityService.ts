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
    ohlc1m: any[]
  ): FXPseudoOrderBook {
    const step = 0.01; // USDJPY 1pips刻み
    const range = 0.10; // 前後10pips
    
    // 1. 直近の値動きから「注文の厚み」を密度推定
    const densityMap = this.calculateDensity(ohlc1m, step);
    
    const bids: FXOrderBookEntry[] = [];
    const asks: FXOrderBookEntry[] = [];
    const resistance: number[] = [];
    const support: number[] = [];

    // 指定レンジ内の価格帯を走査
    for (let i = -10; i <= 10; i++) {
        const price = Math.round((currentPrice + i * step) * 100) / 100;
        const size = densityMap.get(price) || (Math.random() * 5 + 5); // 基礎流動性 + 停滞密度
        const isWall = size > 25; // 閾値超えで「壁」判定

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
    const spreadPips = (ask - bid) * 100;
    let liquidityScore = 100;
    if (spreadPips > 0.3) liquidityScore -= 30; // 通常より広い
    if (spreadPips > 0.8) liquidityScore -= 50; // 危険な広さ
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
   * 価格帯ごとの滞留密度（過去の出来高に近い概念）を算出
   */
  calculateDensity(data: any[], step: number): Map<number, number> {
    const map = new Map<number, number>();
    
    // 直近50本の1分足を分析
    data.slice(-50).forEach(bar => {
        // High-Low間の価格はすべて「触れた」とみなしてカウント
        const low = Math.round(bar.low / step) * step;
        const high = Math.round(bar.high / step) * step;
        
        for (let p = low; p <= high; p += step) {
            const price = Math.round(p * 100) / 100;
            map.set(price, (map.get(price) || 0) + 1);
        }
    });

    return map;
  }
};
