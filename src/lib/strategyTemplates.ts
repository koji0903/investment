import { StrategyTemplate } from "@/types";

export const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    id: "core-satellite",
    name: "コア・サテライト戦略",
    description: "資産の70%を安定した投資信託（コア）で運用し、30%を個別株や仮想通貨（サテライト）で積極的に運用する王道の戦略です。",
    allocation: {
      "投資信託": 70,
      "株": 20,
      "仮想通貨": 10,
    },
    riskLevel: "moderate",
  },
  {
    id: "conservative",
    name: "インカム重視（保守的）",
    description: "定期的な分配金や配当を重視し、資産の大部分を低リスクな投資信託や債券代替資産で構成します。安定した成長を望む方向けです。",
    allocation: {
      "投資信託": 85,
      "株": 15,
    },
    riskLevel: "low",
  },
  {
    id: "aggressive",
    name: "成長重視（積極的）",
    description: "大きなキャピタルゲインを狙い、個別株や仮想通貨の比率を高めます。市場の変動を許容し、長期的な資産の最大化を目指します。",
    allocation: {
      "株": 50,
      "仮想通貨": 30,
      "投資信託": 20,
    },
    riskLevel: "high",
  },
  {
    id: "balance-plus",
    name: "バランス+（ミドルリスク）",
    description: "各資産クラスをバランスよく配分しつつ、少量の仮想通貨でスパイスを加えます。リスクを抑えつつ市場平均以上のリターンを狙います。",
    allocation: {
      "投資信託": 50,
      "株": 35,
      "仮想通貨": 10,
      "FX": 5,
    },
    riskLevel: "moderate",
  },
];
