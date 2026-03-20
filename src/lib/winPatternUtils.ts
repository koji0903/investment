import { AssetCalculated, WinPattern, AssetCategory } from "@/types";

/**
 * 勝ちトレードのパターンを分析し、インサイトを抽出する
 */
export const analyzeWinningPatterns = (assets: AssetCalculated[]): WinPattern[] => {
  const winningAssets = assets.filter(a => a.profitAndLoss > 0);
  if (winningAssets.length === 0) return [];

  const categories: AssetCategory[] = ["株", "FX", "仮想通貨", "投資信託"];
  const patterns: WinPattern[] = [];

  categories.forEach(cat => {
    const catWins = winningAssets.filter(a => a.category === cat);
    if (catWins.length === 0) return;

    const avgReturn = catWins.reduce((sum, a) => sum + a.profitPercentage, 0) / catWins.length;
    
    // 簡易的な要因分析 (モック要素含む)
    let commonFactor = "分散投資";
    let insight = "安定した利益に貢献しています。";

    if (cat === "投資信託") {
      commonFactor = "長期保有・積立";
      insight = "低ボラティリティ環境での継続的な保有が成功の鍵です。";
    } else if (cat === "仮想通貨") {
      commonFactor = "短期トレンドフォロー";
      insight = "ボラティリティを味方につけた機動的な取引が功を奏しています。";
    } else if (cat === "株") {
      commonFactor = "バリュー投資";
      insight = "割安圏での仕込みと、目標価格までの忍耐が利益に繋がっています。";
    }

    patterns.push({
      id: `win-${cat}`,
      category: cat,
      count: catWins.length,
      averageReturn: avgReturn,
      commonFactor,
      insight
    });
  });

  // リターン順にソート
  return patterns.sort((a, b) => b.averageReturn - a.averageReturn);
};

/**
 * 再現可能な戦略提案を生成する
 */
export const generateActionableStrategy = (patterns: WinPattern[]) => {
  if (patterns.length === 0) return "まずは少額から取引を開始し、データを蓄積しましょう。";

  const bestPattern = patterns[0];
  return `${bestPattern.category}での「${bestPattern.commonFactor}」が最も高いパフォーマンス（平均+${bestPattern.averageReturn.toFixed(1)}%）を記録しています。同様の条件下にある銘柄への集中、または既存ポジションの維持を推奨します。`;
};
