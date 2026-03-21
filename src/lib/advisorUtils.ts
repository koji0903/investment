import { 
  RecommendedAsset, 
  AdvisorRecommendation, 
  StockIndicator, 
  FXIndicator, 
  CryptoIndicator 
} from "@/types/advisor";

const MOCK_STOCK_DATA: Partial<RecommendedAsset>[] = [
  {
    symbol: "7203.T",
    name: "トヨタ自動車",
    category: "日本株",
    price: 2650,
    minPurchaseAmount: 265000, // 100株
    indicators: { per: 10.5, pbr: 1.2, roe: 12.0, dividendYield: 2.8, rsi: 45 } as StockIndicator,
    reason: "PBRが1倍台と割安感があり、堅調な業績を背景に長期的な株価上昇が期待できます。円安メリットも享受しやすい銘柄です。",
    priority: "high"
  },
  {
    symbol: "9984.T",
    name: "ソフトバンクグループ",
    category: "日本株",
    price: 8900,
    minPurchaseAmount: 890000,
    indicators: { per: 15.0, pbr: 0.8, roe: 5.5, dividendYield: 0.5, rsi: 65 } as StockIndicator,
    reason: "保有資産価値に対して株価が大幅にディスカウントされており、AI関連投資の進展に伴う上値余地が大きいです。",
    priority: "medium"
  },
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    category: "外国株",
    price: 35000, // 換算後
    minPurchaseAmount: 35000, // 1株単位
    indicators: { per: 28.5, pbr: 45.0, roe: 150, dividendYield: 0.5, rsi: 55 } as StockIndicator,
    reason: "圧倒的なキャッシュフローと自社株買いにより、マーケットの不確実性が高い時期でも底堅い推移が期待できるディフェンシブな成長株です。",
    priority: "high"
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    category: "外国株",
    price: 180000,
    minPurchaseAmount: 180000,
    indicators: { per: 65.0, pbr: 35.0, roe: 95.0, dividendYield: 0.02, rsi: 72 } as StockIndicator,
    reason: "生成AI市場の爆発的成長を牽引しており、短期的な過熱感はあるものの、中長期的な成長性は他を圧倒しています。",
    priority: "medium"
  }
];

const MOCK_FX_DATA: Partial<RecommendedAsset>[] = [
  {
    symbol: "USD/JPY",
    name: "米国ドル / 日本円",
    category: "FX",
    price: 151.5,
    minPurchaseAmount: 151500, // 1000通貨想定
    indicators: { rsi: 58, swapPoint: 220, technicalSignal: "buy" } as FXIndicator,
    reason: "日米金利差の継続を背景に、押し目買い意欲が強いペアです。スワップポイントによるインカムゲインも期待できます。",
    priority: "high"
  },
  {
    symbol: "EUR/USD",
    name: "ユーロ / 米国ドル",
    category: "FX",
    price: 1.08,
    minPurchaseAmount: 165000,
    indicators: { rsi: 42, swapPoint: -120, technicalSignal: "neutral" } as FXIndicator,
    reason: "ECBの金融政策見通しと米FRBの動向が交錯しており、レンジ内での推移が予想されます。逆張り戦略が有効な局面です。",
    priority: "medium"
  }
];

const MOCK_CRYPTO_DATA: Partial<RecommendedAsset>[] = [
  {
    symbol: "BTC",
    name: "ビットコイン",
    category: "仮想通貨",
    price: 10500000,
    minPurchaseAmount: 10000, // 少額から
    indicators: { rsi: 62, dominance: 52.5, trend: "bullish" } as CryptoIndicator,
    reason: "ETFへの資金流入が継続しており、デジタルゴールドとしての地位が盤石となっています。ポートフォリオの1-5%程度の保有を推奨します。",
    priority: "high"
  },
  {
    symbol: "ETH",
    name: "イーサリアム",
    category: "仮想通貨",
    price: 550000,
    minPurchaseAmount: 5000,
    indicators: { rsi: 54, dominance: 17.2, trend: "sideways" } as CryptoIndicator,
    reason: "大型アップデートを経てスケーラビリティが向上しており、DeFiやNFT市場の再活発化に伴う需要増が見込まれます。",
    priority: "medium"
  }
];

export const generateProfessionalAdvice = (
  budget: number, 
  riskPreference: "aggressive" | "conservative" | "balanced" = "balanced"
): AdvisorRecommendation => {
  // 1. 市場環境のサマリー生成
  const marketContext = "現在、主要国の中央銀行による金融政策の転換点にあり、ボラティリティが高まりやすい時期です。米国株はAI関連を中心に選別買いが進む一方、日本株は円安の恩恵とインフレへの移行が意識される展開となっています。";

  // 2. 予算に応じたフィルタリングと選択
  // コンサバなら債券（投資信託に代用）や安定株、アグレッシブなら仮想通貨や成長株
  const allCandidate = [...MOCK_STOCK_DATA, ...MOCK_FX_DATA, ...MOCK_CRYPTO_DATA] as RecommendedAsset[];
  
  let selectedAssets: RecommendedAsset[] = [];
  let remainingBudget = budget;

  // 高優先度のものから予算の許す限り追加
  const prioritized = allCandidate.sort((a, b) => {
    const pRank = { high: 0, medium: 1, low: 2 };
    return pRank[a.priority] - pRank[b.priority];
  });

  for (const asset of prioritized) {
    if (remainingBudget >= asset.minPurchaseAmount) {
      // フィルタリング: リスク嗜好に合わせる
      if (riskPreference === "conservative" && (asset.category === "仮想通貨" || asset.category === "FX")) {
        continue;
      }
      
      selectedAssets.push(asset);
      remainingBudget -= asset.minPurchaseAmount;
    }
  }

  const summary = `ご提示いただいた予算 ${budget.toLocaleString()}円に対し、${selectedAssets.length}件の最適な投資対象を選定しました。${riskPreference === "aggressive" ? "高リターンを狙える銘柄を重点的に配置しており、" : "リスク分散を重視しつつ、"}着実な資産形成を目指す構成です。`;

  return {
    summary,
    budgetUsed: budget - remainingBudget,
    remainingBudget,
    assets: selectedAssets,
    marketContext
  };
};
