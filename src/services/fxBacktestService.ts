import { 
  FXSimulation, 
  FXBacktestResult, 
  MarketRegimeType 
} from "@/types/fx";
import { calculateUSDJPYDecision } from "@/utils/fx/usdjpyDecision";

/**
 * 過去データ検証・バックテスト サービス
 */
export const FXBacktestService = {
  /**
   * 指定されたOHLCデータに対して、判定ロジックをバックテスト実行
   */
  async runBacktest(
    userId: string,
    ohlcHistory: Record<string, any[]>,
    options: {
      maPeriod: number,
      confidenceThreshold: number,
      tpPips: number,
      slPips: number
    }
  ): Promise<FXBacktestResult> {
    const data1m = ohlcHistory["1m"];
    const results: { pips: number, regime: MarketRegimeType }[] = [];
    
    // バックテスト実行 (簡易スライディングウィンドウ)
    // 実際には 1分ごとに判定を回すと重いため、5分おきなどに判定
    const step = 5; 
    const windowSize = 300; // 分析に必要な最小データ数

    for (let i = windowSize; i < data1m.length - 120; i += step) {
      // 過去データから「その時」のコンテキストを抽出
      const currentSlice: Record<string, any[]> = {
        "1m": data1m.slice(i - 200, i),
        "5m": ohlcHistory["5m"].slice(Math.floor((i - 500) / 5), Math.floor(i / 5)),
        "15m": ohlcHistory["15m"].slice(Math.floor((i - 1000) / 15), Math.floor(i / 15)),
        "1h": ohlcHistory["1h"].slice(Math.floor((i - 2000) / 60), Math.floor(i / 60)),
      };

      if (!currentSlice["1h"].length) continue;

      const decision = calculateUSDJPYDecision(currentSlice, [], true);
      
      if (decision.isEntryAllowed && decision.confidence >= options.confidenceThreshold) {
        // エントリー発生 -> 簡易的に将来の結果を確認 (未来予知によるシミュレート)
        const entryPrice = data1m[i].close;
        const side = decision.signal === "buy" ? 1 : -1;
        
        // 決済判定 (最大2時間 = 120分)
        let pips = -options.slPips; // デフォルト損切り
        for (let j = 1; j <= 120; j++) {
          const futurePrice = data1m[i + j].close;
          const currentPips = (futurePrice - entryPrice) * 100 * side;
          
          if (currentPips >= options.tpPips) {
            pips = options.tpPips;
            break;
          }
          if (currentPips <= -options.slPips) {
            pips = -options.slPips;
            break;
          }
        }
        
        results.push({ 
          pips, 
          regime: decision.regime.type 
        });
      }
    }

    // メトリクス集計
    const totalTrades = results.length;
    const wins = results.filter(r => r.pips > 0).length;
    const losses = totalTrades - wins;
    const netProfit = results.reduce((sum, r) => sum + r.pips, 0);
    const winRate = totalTrades > 0 ? wins / totalTrades : 0;
    
    const profitFactor = results.length > 0 ? 
      (results.filter(r => r.pips > 0).reduce((s, r) => s + r.pips, 0) / 
       Math.abs(results.filter(r => r.pips < 0).reduce((s, r) => s + r.pips, 0) || 1)) : 0;

    // レジーム別集計
    const regimePerformance: Record<string, number> = {};
    const regimeTypes: MarketRegimeType[] = ["TREND_UP", "TREND_DOWN", "RANGE", "HIGH_VOLATILITY", "LOW_VOLATILITY", "INSTABILITY"];
    
    regimeTypes.forEach(type => {
      const typeResults = results.filter(r => r.regime === type);
      const typeWinRate = typeResults.length > 0 ? typeResults.filter(r => r.pips > 0).length / typeResults.length : 0;
      regimePerformance[type] = typeWinRate;
    });

    return {
      id: `bt_${Date.now()}`,
      userId,
      parameters: options,
      metrics: {
        totalTrades,
        winRate,
        profitFactor,
        maxDrawdown: 0, // 簡易版のため
        expectedValue: totalTrades > 0 ? netProfit / totalTrades : 0,
        netProfit
      },
      regimePerformance: regimePerformance as Record<MarketRegimeType, number>,
      executedAt: new Date().toISOString()
    };
  }
};
