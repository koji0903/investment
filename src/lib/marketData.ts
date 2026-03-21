import { IndustryAnalysis } from "@/types/market";

export const MARKET_ANALYSIS_DATA: IndustryAnalysis[] = [
  {
    id: "auto-mech",
    name: "自動車・機械・造船",
    iconName: "Car",
    trend: "sunny",
    trendReason: "円安による輸出採算改善と、自動運転・EV投資の加速。防衛需要による造船・重電の回復。",
    overview: "日本の基幹産業。自動車から建設機械、産業用ロボット、造船まで含み、電動化と自動化が共通テーマ。",
    companies: [
      { id: "toyota", name: "トヨタ自動車", symbol: "7203.T", marketCap: 62.1, revenue: [31.4, 37.2, 45.1, 52.4], profit: [2.9, 2.7, 5.3, 6.2], description: "世界トップの販売台数。EV・水素・HVの全方位戦略。", sentiment: "bullish" },
      { id: "denso", name: "デンソー", symbol: "6902.T", marketCap: 8.2, revenue: [5.5, 6.4, 7.1, 7.5], profit: [0.3, 0.4, 0.4, 0.5], description: "自動車部品世界トップクラス。xEV向けシステムが成長。", sentiment: "bullish" },
      { id: "komatsu", name: "小松製作所", symbol: "6301.T", marketCap: 4.8, revenue: [2.8, 3.5, 3.8, 4.1], profit: [0.3, 0.5, 0.6, 0.6], description: "建設機械世界2位。スマートコンストラクションを推進。", sentiment: "neutral" },
      { id: "fanuc", name: "ファナック", symbol: "6954.T", marketCap: 4.2, revenue: [0.7, 0.8, 0.8, 0.9], profit: [0.2, 0.2, 0.2, 0.2], description: "産業用ロボット・NC装置で世界首位級。工場自動化の要。", sentiment: "neutral" },
      { id: "mhi", name: "三菱重工業", symbol: "7011.T", marketCap: 9.5, revenue: [3.7, 4.2, 4.6, 4.9], profit: [0.1, 0.2, 0.3, 0.4], description: "総合重機首位。防衛・宇宙・脱炭素関連が好調。", sentiment: "bullish" }
    ],
    relations: [
      { from: "toyota", to: "denso", type: "subsidiary", label: "系列・供給" },
      { from: "mhi", to: "toyota", type: "partnership", label: "水素・防衛" },
      { from: "komatsu", to: "fanuc", type: "partnership", label: "自動化連携" }
    ]
  },
  {
    id: "it-comm",
    name: "IT・情報通信",
    iconName: "Cpu",
    trend: "sunny",
    trendReason: "生成AI需要によるデータセンター投資と半導体需要の爆発。DX投資の継続的な拡大。",
    overview: "半導体、クラウド、通信、ソフト、ネットサービスを網羅。AIの社会実装が最大の成長ドライバー。",
    companies: [
      { id: "tel", name: "東京エレクトロン", symbol: "8035.T", marketCap: 16.5, revenue: [2.0, 2.2, 1.8, 2.5], profit: [0.6, 0.6, 0.4, 0.8], description: "半導体製造装置世界大手。AI半導体向けが好調。", sentiment: "bullish" },
      { id: "softbank", name: "ソフトバンクグループ", symbol: "9984.T", marketCap: 14.8, revenue: [6.2, 6.5, 6.7, 7.1], profit: [0.4, -1.2, -0.9, 0.8], description: "投資会社。傘下のArmがAI時代の核心を握る。", sentiment: "neutral" },
      { id: "ntt", name: "日本電信電話", symbol: "9432.T", marketCap: 15.2, revenue: [12.1, 12.6, 13.3, 13.8], profit: [1.7, 1.8, 1.9, 2.0], description: "通信最大手。IOWN構想で次世代光通信を主導。", sentiment: "bullish" },
      { id: "sony", name: "ソニーグループ", symbol: "6758.T", marketCap: 16.2, revenue: [9.9, 11.5, 12.9, 13.5], profit: [1.2, 1.2, 1.1, 1.3], description: "CMOSセンサ、ゲーム、エンタメの複合企業。", sentiment: "bullish" },
      { id: "z-holdings", name: "LINEヤフー", symbol: "4689.T", marketCap: 3.1, revenue: [1.5, 1.6, 1.8, 1.9], profit: [0.2, 0.3, 0.3, 0.3], description: "ネットサービス最大手。AI・広告・コマースを統合。", sentiment: "neutral" }
    ],
    relations: [
      { from: "softbank", to: "ntt", type: "competitor", label: "通信・AI競争" },
      { from: "sony", to: "tel", type: "partnership", label: "半導体供給網" }
    ]
  },
  {
    id: "resources",
    name: "資源・素材・化学",
    iconName: "Flame",
    trend: "cloudy",
    trendReason: "エネルギー価格の高止まりと中国景気の不透明感。脱炭素投資へのコスト負担が重荷。",
    overview: "化学、鉄鋼、石油、非鉄、紙パルプ。環境規制への対応と高付加価値化が勝負所。",
    companies: [
      { id: "nippon-steel", name: "日本製鉄", symbol: "5401.T", marketCap: 3.2, revenue: [6.8, 7.9, 8.5, 9.1], profit: [0.9, 0.9, 0.8, 0.8], description: "鉄鋼国内最大手。高級鋼材「電磁鋼板」でEV需要狙う。", sentiment: "neutral" },
      { id: "shinetsu", name: "信越化学工業", symbol: "4063.T", marketCap: 12.5, revenue: [2.0, 2.8, 2.4, 2.7], profit: [0.6, 1.0, 0.8, 0.9], description: "塩ビ・半導体シリコンで世界首位。圧倒的な収益力。", sentiment: "bullish" },
      { id: "eneos", name: "ENEOSホールディングス", symbol: "5020.T", marketCap: 2.1, revenue: [10.9, 13.8, 14.5, 15.2], profit: [0.4, 0.5, 0.3, 0.4], description: "石油元売り首位。水素・合成燃料への転換を急ぐ。", sentiment: "bearish" },
      { id: "mitsubishi-chem", name: "三菱ケミカルG", symbol: "4188.T", marketCap: 1.3, revenue: [3.9, 4.6, 4.8, 4.9], profit: [0.2, 0.2, 0.3, 0.3], description: "総合化学国内首位。事業再編と特選化を推進中。", sentiment: "neutral" },
      { id: "asahi-kasei", name: "旭化成", symbol: "3407.T", marketCap: 1.4, revenue: [2.1, 2.7, 2.9, 3.1], profit: [0.1, 0.2, 0.2, 0.2], description: "多角化経営の模範。リチウムイオン電池部材が強み。", sentiment: "bullish" }
    ],
    relations: [
      { from: "nippon-steel", to: "eneos", type: "partnership", label: "脱炭素・水素" },
      { from: "shinetsu", to: "asahi-kasei", type: "competitor", label: "素材シェア" }
    ]
  },
  {
    id: "consumer",
    name: "生活・食品・小売",
    iconName: "ShoppingBag",
    trend: "sunny",
    trendReason: "インバウンド需要の爆発的な増加。富裕層向け消費の堅調さと値上げの浸透。",
    overview: "食品、衣料、化粧品、医薬品、スーパー。価格転嫁の成否と訪日客需要の取り込みがカギ。",
    companies: [
      { id: "fast-retailing", name: "ファーストリテイリング", symbol: "9983.T", marketCap: 14.2, revenue: [2.3, 2.7, 3.1, 3.5], profit: [0.3, 0.3, 0.4, 0.5], description: "ユニクロを展開。海外事業が収益成長を牽引。", sentiment: "bullish" },
      { id: "seven-i", name: "セブン&アイHLDGS", symbol: "3382.T", marketCap: 6.5, revenue: [11.8, 14.2, 15.5, 16.1], profit: [0.5, 0.5, 0.5, 0.6], description: "コンビニ最大手。北米を中心としたグローバル展開。", sentiment: "neutral" },
      { id: "shiseido", name: "資生堂", symbol: "4911.T", marketCap: 1.8, revenue: [1.0, 1.1, 1.0, 1.1], profit: [0.1, 0.1, 0.1, 0.1], description: "化粧品国内1位。中国市場の停滞を欧米・旅販で補う。", sentiment: "bearish" },
      { id: "nissin", name: "日清食品HLDGS", symbol: "2897.T", marketCap: 1.5, revenue: [0.5, 0.6, 0.7, 0.8], profit: [0.05, 0.06, 0.07, 0.08], description: "カップ麺首位。即席麺のグローバル展開を加速。", sentiment: "bullish" },
      { id: "kose", name: "コーセー", symbol: "4922.T", marketCap: 0.6, revenue: [0.2, 0.3, 0.3, 0.3], profit: [0.02, 0.03, 0.03, 0.03], description: "高級化粧品に強み。北米・欧州市場を強化。", sentiment: "neutral" }
    ],
    relations: [
      { from: "seven-i", to: "fast-retailing", type: "competitor", label: "リテールシェア" },
      { from: "shiseido", to: "kose", type: "competitor", label: "化粧品シェア" }
    ]
  },
  {
    id: "finance",
    name: "金融・証券",
    iconName: "Banknote",
    trend: "sunny",
    trendReason: "日銀の政策修正に伴う利ざや改善期待。新NISA導入による証券・投信への資金流入。",
    overview: "銀行、証券、保険、フィンテック。金利のある世界への回帰とデジタル金融が焦点。",
    companies: [
      { id: "mufg", name: "三菱UFJフィナンシャルG", symbol: "8306.T", marketCap: 19.5, revenue: [6.1, 9.2, 10.1, 11.5], profit: [1.1, 1.3, 1.5, 1.9], description: "国内最大手。米モルガン・スタンレー等との提携強み。", sentiment: "bullish" },
      { id: "nomura", name: "野村ホールディングス", symbol: "8604.T", marketCap: 2.8, revenue: [1.4, 1.3, 1.5, 1.7], profit: [0.2, 0.1, 0.2, 0.3], description: "証券国内首位。ウェルスマネジメント部門を強化。", sentiment: "neutral" },
      { id: "tokio-marine", name: "東京海上HLDGS", symbol: "8766.T", marketCap: 10.2, revenue: [5.8, 6.6, 7.2, 7.8], profit: [0.4, 0.5, 0.6, 0.7], description: "損保首位。海外Ｍ＆Ａにより利益成長を継続。", sentiment: "bullish" },
      { id: "msad", name: "MS&ADインシュアランス", symbol: "8725.T", marketCap: 5.2, revenue: [4.5, 5.1, 5.5, 5.8], profit: [0.3, 0.3, 0.4, 0.5], description: "損保大手。三井住友海上・あいおいニッセイ同和傘下。", sentiment: "neutral" }
    ],
    relations: [
      { from: "mufg", to: "nomura", type: "competitor", label: "金融資本競争" }
    ]
  },
  {
    id: "infra",
    name: "建設・不動産・運輸",
    iconName: "Building",
    trend: "cloudy",
    trendReason: "資材・労務コストの上昇が重荷。都市再開発の継続性は高いが、物流・建設の「2024年問題」が課題。",
    overview: "ゼネコン、不動産、鉄道、航空。インフラ老朽化対策とスマートシティ、インバウンド輸送が軸。",
    companies: [
      { id: "mitsui-fudosan", name: "三井不動産", symbol: "8801.T", marketCap: 4.5, revenue: [2.1, 2.2, 2.4, 2.6], profit: [0.2, 0.3, 0.3, 0.4], description: "不動産首位。ビル・商業施設に強み。海外展開加速。", sentiment: "bullish" },
      { id: "obayashi", name: "大林組", symbol: "1802.T", marketCap: 1.1, revenue: [1.9, 2.0, 2.2, 2.4], profit: [0.1, 0.1, 0.1, 0.1], description: "スーパーゼネコン大手。非建設事業を拡大中。", sentiment: "neutral" },
      { id: "ana", name: "ANAホールディングス", symbol: "9202.T", marketCap: 1.5, revenue: [1.0, 1.7, 2.0, 2.2], profit: [0.0, 0.1, 0.2, 0.2], description: "航空首位。インバウンド需要と国際線回復が追い風。", sentiment: "bullish" },
      { id: "jr-east", name: "JR東日本", symbol: "9020.T", marketCap: 3.2, revenue: [2.1, 2.4, 2.6, 2.8], profit: [0.1, 0.2, 0.3, 0.3], description: "鉄道最大手。不動産・Suica経済圏の収益化急ぐ。", sentiment: "neutral" }
    ],
    relations: [
      { from: "mitsui-fudosan", to: "obayashi", type: "partnership", label: "都市開発・施工" }
    ]
  },
  {
    id: "media-edu",
    name: "メディア・広告・教育",
    iconName: "MonitorPlay",
    trend: "cloudy",
    trendReason: "ネット広告市場は拡大続くが、既存メディアの苦戦。リスキリング・DX教育への投資意欲は高い。",
    overview: "出版、広告、テレビ、人材、ゲーム、教育。コンテンツのIP化とデジタルトランスフォーメーションが必須。",
    companies: [
      { id: "nintendo", name: "任天堂", symbol: "7974.T", marketCap: 10.8, revenue: [1.6, 1.6, 1.7, 1.8], profit: [0.6, 0.5, 0.6, 0.6], description: "ゲーム機・ソフト世界大手。IP(知的財産)活用を強化。", sentiment: "bullish" },
      { id: "recruit", name: "リクルートHLDGS", symbol: "6098.T", marketCap: 12.1, revenue: [2.8, 3.4, 3.6, 3.8], profit: [0.4, 0.4, 0.5, 0.5], description: "人材、販促の世界的大手。Indeedが収益の柱。", sentiment: "bullish" },
      { id: "dentsu", name: "電通グループ", symbol: "4324.T", marketCap: 1.2, revenue: [1.0, 1.2, 1.3, 1.4], profit: [0.1, 0.1, 0.1, 0.1], description: "広告国内首位。海外事業の収益改善が課題。", sentiment: "bearish" },
      { id: "cyberagent", name: "サイバーエージェント", symbol: "4751.T", marketCap: 0.5, revenue: [0.6, 0.7, 0.7, 0.8], profit: [0.1, 0.05, 0.02, 0.05], description: "ネット広告・ゲーム大手。ABEMAへの投資続く。", sentiment: "neutral" },
      { id: "kadokawa", name: "KADOKAWA", symbol: "9468.T", marketCap: 0.4, revenue: [0.2, 0.2, 0.3, 0.3], profit: [0.02, 0.03, 0.03, 0.04], description: "出版・アニメ・ゲームの総合メディア企業。", sentiment: "bullish" }
    ],
    relations: [
      { from: "dentsu", to: "recruit", type: "partnership", label: "マーケティング支援" },
      { from: "nintendo", to: "kadokawa", type: "competitor", label: "エンタメIP" }
    ]
  }
];
