import { IndustryAnalysis } from "@/types/market";

export const MARKET_ANALYSIS_DATA: IndustryAnalysis[] = [
  {
    id: "auto",
    name: "自動車",
    iconName: "Car",
    trend: "sunny",
    trendReason: "円安による輸出採算の改善と、EVシフトへの投資加速。部材不足の解消により生産が回復基調。",
    overview: "日本の基幹産業。電動化(EV)や自動運転技術への対応が急務。トヨタを筆頭に系列を超えた再編が進む。",
    companies: [
      {
        id: "toyota",
        name: "トヨタ自動車",
        symbol: "7203.T",
        marketCap: 62.5,
        revenue: [31.4, 37.2, 45.1, 52.4],
        profit: [2.9, 2.7, 5.3, 6.2],
        description: "世界トップの販売台数を誇る。全方位戦略でEV・水素・HVを展開。",
        sentiment: "bullish"
      },
      {
        id: "honda",
        name: "本田技研工業",
        symbol: "7267.T",
        marketCap: 8.8,
        revenue: [14.5, 16.9, 19.8, 20.2],
        profit: [0.8, 0.7, 1.3, 1.2],
        description: "二輪車世界首位。EV専売化を他社に先駆けて宣言。",
        sentiment: "neutral"
      },
      {
        id: "nissan",
        name: "日産自動車",
        symbol: "7201.T",
        marketCap: 2.1,
        revenue: [8.4, 10.5, 12.6, 13.1],
        profit: [0.2, 0.3, 0.5, 0.6],
        description: "ルノー・三菱自とのアライアンスを維持。e-POWERが強み。",
        sentiment: "bearish"
      }
    ],
    relations: [
      { from: "toyota", to: "honda", type: "competitor", label: "シェア争い" },
      { from: "toyota", to: "nissan", type: "competitor", label: "シェア争い" },
      { from: "nissan", to: "mitsubishi", type: "partnership", label: "アライアンス" }
    ]
  },
  {
    id: "tech",
    name: "IT・半導体",
    iconName: "Cpu",
    trend: "sunny",
    trendReason: "生成AI需要の爆発により、製造装置・材料メーカーが過去最高益を更新中。デジタル・トランスフォーメーション投資も堅調。",
    overview: "日本が世界シェアを握る製造装置や、生成AI・クラウド市場の拡大が牽引。技術革新スピードが極めて速い。",
    companies: [
      {
        id: "tel",
        name: "東京エレクトロン",
        symbol: "8035.T",
        marketCap: 17.2,
        revenue: [2.0, 2.2, 1.8, 2.5],
        profit: [0.6, 0.6, 0.4, 0.8],
        description: "半導体製造装置で世界3位。前工程の露光以外で圧倒的な強み。",
        sentiment: "bullish"
      },
      {
        id: "advantest",
        name: "アドバンテスト",
        symbol: "6857.T",
        marketCap: 5.4,
        revenue: [0.4, 0.5, 0.6, 0.7],
        profit: [0.1, 0.1, 0.1, 0.2],
        description: "半導体テスターで世界首位級。AI半導体向けが高成長。",
        sentiment: "bullish"
      },
      {
        id: "renesas",
        name: "ルネサスエレクトロニクス",
        symbol: "6723.T",
        marketCap: 4.8,
        revenue: [0.9, 1.5, 1.4, 1.6],
        profit: [0.2, 0.4, 0.4, 0.5],
        description: "車載半導体で世界大手。買収により製品群を拡充。",
        sentiment: "neutral"
      }
    ],
    relations: [
      { from: "tel", to: "advantest", type: "partnership", label: "製造サプライチェーン" },
      { from: "tel", to: "renesas", type: "supplier", label: "装置供給" }
    ]
  },
  {
    id: "finance",
    name: "金融・銀行",
    iconName: "Banknote",
    trend: "cloudy",
    trendReason: "日銀の政策修正による利上げ期待が追い風だが、海外市場の不確実性とデジタル化競争が課題。",
    overview: "マイナス金利解除後の利ざや改善が期待される。非対面チャネルの拡充と海外展開が成長のカギ。",
    companies: [
      {
        id: "mufg",
        name: "三菱UFJフィナンシャルG",
        symbol: "8306.T",
        marketCap: 19.8,
        revenue: [6.1, 9.2, 10.1, 11.5],
        profit: [1.1, 1.5, 1.7, 2.1],
        description: "国内最大手の金融グループ。米モルガン・スタンレーとの親密な提携。",
        sentiment: "bullish"
      },
      {
        id: "smfg",
        name: "三井住友フィナンシャルG",
        symbol: "8316.T",
        marketCap: 12.4,
        revenue: [4.1, 6.1, 6.8, 7.5],
        profit: [0.9, 1.1, 1.2, 1.4],
        description: "効率的な経営が強み。Olive等のリテール戦略を加速。",
        sentiment: "bullish"
      }
    ],
    relations: [
      { from: "mufg", to: "smfg", type: "competitor", label: "メガバンク競争" }
    ]
  }
];
