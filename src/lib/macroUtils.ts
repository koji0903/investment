/**
 * マクロ経済インジケーターの型定義とユーティリティ
 */

export interface MacroIndicator {
  id: string;
  name: string;
  symbol: string;
  category: "equity" | "rate" | "forex" | "inflation";
  value: number;
  change: number;      // 前日比 (%)
  unit: string;
  trend: "up" | "down" | "flat";
  insight: string;     // 投資への影響
}

/**
 * Yahoo Financeのインデックスシンボルを元に、表示名と単位、初期インサイトを取得
 */
export function getMacroMetadata(symbol: string) {
  switch (symbol) {
    case "^GSPC":
      return { name: "S&P 500", unit: "pt", category: "equity" };
    case "^N225":
      return { name: "日経225", unit: "円", category: "equity" };
    case "^TNX":
      return { name: "米10年債利回り", unit: "%", category: "rate" };
    case "JPY=X":
      return { name: "ドル円", unit: "円", category: "forex" };
    default:
      return { name: symbol, unit: "", category: "equity" };
  }
}

/**
 * 指標の値と動向から投資への影響（インサイト）を生成する
 */
export function generateMacroInsight(indicator: Omit<MacroIndicator, "insight">): string {
  const { category, trend, value } = indicator;

  if (category === "rate") {
    if (trend === "up") return "金利上昇はグロース株への逆風となりますが、銀行株には追い風です。";
    if (trend === "down") return "金利低下は株式市場全体（特にハイテク株）を支える要因となります。";
    return "金利は安定しており、株式市場への影響は中立的です。";
  }

  if (category === "forex") {
    if (value > 150 && trend === "up") return "円安が進行中。輸出企業にはプラスですが、輸入コスト増に注意。";
    if (value < 140 && trend === "down") return "円高へ。海外売上比率の高い企業の利益を圧迫する可能性があります。";
    return "為替は安定しており、輸出入への影響は限定的です。";
  }

  if (category === "equity") {
    if (trend === "up") return "市場は強気。リスクオンの姿勢が続いています。";
    if (trend === "down") return "警戒感が高まっています。押し目買いか静観かの判断が分かれます。";
    return "保ち合い相場。次の材料待ちの状態です。";
  }

  return "市場環境を注視し、ポートフォリオのリバランスを検討してください。";
}

/**
 * CPI（インフレ率）などの静的データを取得（本来はAPIから取得したいが今回は準静的）
 */
export function getInflationData(): MacroIndicator[] {
  return [
    {
      id: "cpi-us",
      name: "米国 CPI (前年比)",
      symbol: "CPI_US",
      category: "inflation",
      value: 2.4,
      change: -0.1,
      unit: "%",
      trend: "down",
      insight: "インフレ鈍化。FRBの利下げ期待を支える要因です。"
    },
    {
      id: "cpi-jp",
      name: "日本 CPI (前年比)",
      symbol: "CPI_JP",
      category: "inflation",
      value: 2.2,
      change: 0.1,
      unit: "%",
      trend: "up",
      insight: "緩やかなインフレ。日銀の追加利上げのタイミングが焦点です。"
    }
  ];
}
