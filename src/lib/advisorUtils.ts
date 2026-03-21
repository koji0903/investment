import { 
  RecommendedAsset, 
  AdvisorRecommendation, 
  StockIndicator, 
  FXIndicator, 
  CryptoIndicator,
  AdvisorCategory
} from "@/types/advisor";

// 指標の優しい解説データ
const INDICATOR_EXPLANATIONS: Record<string, string> = {
  per: "株価収益率。会社の利益に対して株価が割安か割高かを測る指標です。低いほど割安とされます。",
  pbr: "株価純資産倍率。会社の純資産に対して株価が妥当かを測る指標です。1倍を下回ると解散価値より安く、割安と判断されます。",
  roe: "自己資本利益率。投資家のお金をどれだけ効率よく利益（稼ぎ）に変えているかを示す指標です。高いほど効率が良いです。",
  dividendYield: "配当利回り。投資額に対して、1年間でどれだけの配当金を受け取れるかを示す指標です。",
  rsi: "相対力指数。買われすぎ、売られすぎを判断する指標です。一般に30%以下は売られすぎ、70%以上は買われすぎとされます。",
  swapPoint: "金利差。通貨ペアの2国間の金利差から得られる利益（または支払い）です。",
  dominance: "占有率。市場全体に対してその銘柄がどれだけのシェアを持っているか。市場の支配力を示します。",
};

const MOCK_STOCK_DATA: Partial<RecommendedAsset>[] = [
  {
    symbol: "7203.T",
    name: "トヨタ自動車",
    category: "日本株",
    price: 3820,
    change24h: 1.2,
    recommendationType: "buy",
    confidence: 85,
    reason: "堅調な業績とEV戦略の進展により、長期的な成長が期待されます。",
    rationale: "円安による輸出採算の改善に加え、次世代全固体電池等のR&D投資が実を結びつつあります。PBRも依然として歴史的低水準にあり、資本効率の向上が株価を押し上げる要因となります。",
    expectedGrowth: "今後12ヶ月で+15%〜20%の上昇を目指す展開。ハイブリッド車の世界的な需要増が収益の柱として安定成長を支える見込みです。",
    exitStrategy: "利確目標は4400円。撤退基準は終値ベースで3400円を割り込んだ場合、または円高が1ドル130円台まで急激に進んだ場合です。",
    indicators: { per: 12.5, pbr: 1.1, roe: 9.8, rsi: 45 },
    indicatorExplanations: { per: INDICATOR_EXPLANATIONS.per, pbr: INDICATOR_EXPLANATIONS.pbr, roe: INDICATOR_EXPLANATIONS.roe }
  },
  {
    symbol: "NVDA",
    name: "NVIDIA",
    category: "外国株",
    price: 924.5,
    change24h: 3.5,
    recommendationType: "buy",
    confidence: 90,
    reason: "AI市場の圧倒的なシェアと驚異的な利益成長率。",
    rationale: "データセンター向けGPU需要は依然として供給不足の状態が続いており、他社の追随を許さない圧倒的な参入障壁を構築。PERは高いものの、PEGレシオ（利益成長率を考慮した指標）で見ると正当化できる水準です。",
    expectedGrowth: "次世代チップ「Blackwell」の出荷開始により、次期決算でもポジティブサプライズの可能性大。短期で+10%の上振れを期待。",
    exitStrategy: "利確は1000ドルの大台。撤退は800ドルの心理的節目を下抜けた場合、または競合によるシェア侵食の兆しが見えた場合です。",
    indicators: { per: 35.2, roe: 45.5, rsi: 65 },
    indicatorExplanations: { per: INDICATOR_EXPLANATIONS.per, roe: INDICATOR_EXPLANATIONS.roe, rsi: INDICATOR_EXPLANATIONS.rsi }
  },
  {
    symbol: "USDJPY=X",
    name: "米ドル/円",
    category: "FX",
    price: 151.2,
    change24h: -0.1,
    recommendationType: "hold",
    confidence: 70,
    reason: "日米金利差の継続と、介入警戒感の交錯。",
    rationale: "米国のインフレ粘着性により、早期利下げ観測が後退。日本側も緩和的な金融環境の継続を強調しており、ファンダメンタルズは円安方向に維持されていますが、152円付近での意識的な売り（介入警戒）に注意が必要です。",
    expectedGrowth: "レンジ相場を想定。149円〜152円の幅で推移しつつ、スワップポイントを確実に享受する戦略。",
    exitStrategy: "155円タッチで一度利確。撤退は日銀によるサプライズ利上げ等のポリシーチェンジ、または148円割れによるトレンド転換時です。",
    indicators: { rsi: 58, swapPoint: 230, technicalSignal: "buy" } as FXIndicator,
    indicatorExplanations: { rsi: INDICATOR_EXPLANATIONS.rsi, swapPoint: INDICATOR_EXPLANATIONS.swapPoint }
  },
  {
    symbol: "BTC-USD",
    name: "ビットコイン",
    category: "仮想通貨",
    price: 9850000,
    change24h: 2.1,
    recommendationType: "buy",
    confidence: 75,
    reason: "現物ETFへの資金流入と、半減期後の供給制限局面。",
    rationale: "機関投資家からの断続的な流入が下値を支えています。歴史的なパターンから、供給が絞られる半減期後は価格が新高値を追う傾向が高く、ドミナンス（シェア）も堅調です。",
    expectedGrowth: "年末までに1500万円（約10万ドル）到達の可能性。一時的な押し目（10-20%の下落）は絶好の買い場となります。",
    exitStrategy: "利確の半分は1200万円付近。撤退はマクロ環境の急変（金融引き締め強化）や、800万円を明確に下抜けた場合です。",
    indicators: { rsi: 62, dominance: 52.5, trend: "bullish" } as CryptoIndicator,
    indicatorExplanations: { rsi: INDICATOR_EXPLANATIONS.rsi, dominance: INDICATOR_EXPLANATIONS.dominance }
  }
];

/**
 * プロフェッショナルな投資提案を生成するメインロジック
 */
export const generateProfessionalAdvice = (
  budget: number,
  riskPreference: "積極" | "安定" | "バランス"
): AdvisorRecommendation => {
  // リスク嗜好に応じたフィルタリングとスコアリング
  const filteredAssets = MOCK_STOCK_DATA.map(asset => {
    let score = (asset.confidence || 0);
    
    // リスク嗜好の補正
    if (riskPreference === "安定") {
      if (asset.category === "仮想通貨") score -= 20;
      if (asset.category === "FX") score -= 10;
      if (asset.indicators && (asset.indicators as any).per > 30) score -= 15;
    } else if (riskPreference === "積極") {
      if (asset.category === "仮想通貨") score += 10;
      if (asset.category === "外国株" && (asset.indicators as any).roe > 20) score += 15;
    }

    return { ...asset, finalScore: score };
  }).sort((a, b) => b.finalScore - a.finalScore);

  // 予算内でアセットを選択
  let currentBudget = budget;
  const selectedAssets: RecommendedAsset[] = [];

  for (const asset of filteredAssets) {
    if (selectedAssets.length >= 3) break;
    
    // シミュレーション用の一時的な価格・数量設定
    // 実際には1株単位や最小ロットを考慮するロジックが必要
    selectedAssets.push(asset as RecommendedAsset);
  }

  const marketSummary = `現在は主要国の金融政策の転換点にあり、ボラティリティが高まりやすい時期です。${riskPreference}重視の戦略として、以下のポートフォリオを提案します。`;

  return {
    summary: "多角的な指標に基づいた最適ポートフォリオ提案",
    budgetUsed: budget - currentBudget,
    remainingBudget: currentBudget,
    assets: selectedAssets,
    marketContext: marketSummary
  };
};
