import { db } from "@/lib/firebase";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import { FXSimulation, FXTradeContext } from "@/types/fx";

export interface PatternStats {
  id: string;
  name: string;
  totalTrades: number;
  winRate: number;
  avgPips: number;
  expectedValue: number;
  strength: number; // 0 to 1
}

export interface AnalysisResult {
  topWinPatterns: PatternStats[];
  topLossPatterns: PatternStats[];
  environmentInsights: Record<string, string>;
  lastAnalyzedAt: string;
}

/**
 * トレード履歴分析・勝ちパターン抽出エンジン
 */
export const FXPatternAnalyzer = {
  /**
   * 過去のトレード履歴からパターン分析を実行
   */
  async analyzeTradePatterns(userId: string): Promise<AnalysisResult> {
    try {
      const q = query(
        collection(db, `users/${userId}/usdjpy/learning_history`),
        orderBy("recordedAt", "desc"),
        limit(100)
      );
      const snap = await getDocs(q);
      const history = snap.docs.map(d => d.data() as FXSimulation);

      if (history.length < 5) {
        return {
          topWinPatterns: [],
          topLossPatterns: [],
          environmentInsights: {},
          lastAnalyzedAt: new Date().toISOString()
        };
      }

      const stats: Record<string, { wins: number, total: number, pips: number }> = {};

      const addStat = (key: string, isWin: boolean, pips: number) => {
        if (!stats[key]) stats[key] = { wins: 0, total: 0, pips: 0 };
        stats[key].total++;
        if (isWin) stats[key].wins++;
        stats[key].pips += pips;
      };

      history.forEach(trade => {
        const ctx = trade.context;
        const isWin = trade.pnl > 0;
        const pips = trade.pnl * 100; // 簡易pips換算
        
        // 実運用データは重みを2倍にする
        const tradeWeight = trade.exitReason === "Real Execution" ? 2.0 : 1.0;

        const addStat = (key: string, isWin: boolean, pips: number) => {
          if (!stats[key]) stats[key] = { wins: 0, total: 0, pips: 0 };
          stats[key].total += tradeWeight;
          if (isWin) stats[key].wins += tradeWeight;
          stats[key].pips += (pips * tradeWeight);
        };

        // 1. 時間帯
        addStat(`SESSION_${ctx.timezone}`, isWin, pips);

        // 2. 環境
        addStat(`ENV_${ctx.environment}`, isWin, pips);

        // 3. トレンド一致度
        const alignment = ctx.trends.alignment;
        addStat(`ALIGNMENT_${alignment >= 3 ? "HIGH" : "LOW"}`, isWin, pips);

        // 4. ブレイク状態
        if (ctx.levels.isBreakout) {
          addStat("STRATEGY_BREAKOUT", isWin, pips);
        }

        // 5. 押し目買い
        if (ctx.setup.isPullback) {
          addStat("STRATEGY_PULLBACK", isWin, pips);
        }
      });

      const patternStats: PatternStats[] = Object.entries(stats)
        .filter(([_, data]) => data.total >= 3)
        .map(([id, data]) => ({
          id,
          name: this.getPatternName(id),
          totalTrades: data.total,
          winRate: data.wins / data.total,
          avgPips: data.pips / data.total,
          expectedValue: (data.wins / data.total) * (data.pips / data.total),
          strength: Math.min(data.total / 20, 1.0)
        }));

      return {
        topWinPatterns: patternStats.filter(p => p.winRate > 0.55).sort((a, b) => b.expectedValue - a.expectedValue),
        topLossPatterns: patternStats.filter(p => p.winRate < 0.45).sort((a, b) => a.expectedValue - b.expectedValue),
        environmentInsights: this.generateInsights(patternStats),
        lastAnalyzedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error("Analysis failed:", error);
      throw error;
    }
  },

  getPatternName(id: string): string {
    if (id.startsWith("SESSION_")) return `${id.replace("SESSION_", "")} 時間帯取引`;
    if (id.startsWith("ENV_")) return `${id.replace("ENV_", "")} 市場環境`;
    if (id.startsWith("ALIGNMENT_")) return `トレンド一致率: ${id.replace("ALIGNMENT_", "")}`;
    if (id === "STRATEGY_BREAKOUT") return "レンジブレイク戦略";
    if (id === "STRATEGY_PULLBACK") return "押し目買い/戻り売り戦略";
    return id;
  },

  generateInsights(stats: PatternStats[]): Record<string, string> {
    const insights: Record<string, string> = {};
    
    const best = stats.sort((a, b) => b.expectedValue - a.expectedValue)[0];
    if (best && best.winRate > 0.6) {
      insights["BEST_PERFORMER"] = `${best.name}は勝率${(best.winRate * 100).toFixed(0)}%と非常に安定しており、現在の主力パターンです。`;
    }

    const nySession = stats.find(s => s.id === "SESSION_NEWYORK");
    if (nySession && nySession.avgPips > 10) {
      insights["VOLATILITY"] = "NY時間は値動きが大きく、利幅を伸ばしやすい傾向にあります。";
    }

    return insights;
  }
};
