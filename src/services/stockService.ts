import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  orderBy, 
  getDoc,
  setDoc
} from "firebase/firestore";
import { 
  StockJudgment, 
  StockPairMaster,
  StockFundamental
} from "@/types/stock";
import { syncStockRealData } from "@/lib/actions/stock";

// 初期監視銘柄リスト
export const MONITORING_STOCKS: StockPairMaster[] = [
  { ticker: "7203", name: "トヨタ自動車", sector: "輸送用機器" },
  { ticker: "8306", name: "三菱UFJフィナンシャル・グループ", sector: "銀行業" },
  { ticker: "9984", name: "ソフトバンクグループ", sector: "情報・通信業" },
  { ticker: "9432", name: "NTT", sector: "情報・通信業" },
  { ticker: "8058", name: "三菱商事", sector: "卸売業" },
  { ticker: "4063", name: "信越化学工業", sector: "化学" },
  { ticker: "6758", name: "ソニーグループ", sector: "電気機器" },
  { ticker: "2914", name: "JT", sector: "食料品" },
  { ticker: "1605", name: "INPEX", sector: "鉱業" },
  { ticker: "4502", name: "武田薬品工業", sector: "医薬品" },
];

export const StockService = {
  /**
   * 日本株判定一覧を取得
   */
  getJudgments: async (): Promise<StockJudgment[]> => {
    try {
      const { getStockJudgmentsAction } = await import("@/lib/actions/stockActions");
      return await getStockJudgmentsAction();
    } catch (error) {
      console.error("Error fetching stock judgments:", error);
      return [];
    }
  },

  /**
   * 実データを同期して取得 (Server Action呼び出し)
   */
  syncRealData: async (): Promise<StockJudgment[]> => {
    try {
      const { syncStockRealData } = await import("@/lib/actions/stock");
      const { getStockJudgmentsAction } = await import("@/lib/actions/stockActions");
      await syncStockRealData();
      return await getStockJudgmentsAction();
    } catch (error) {
      console.error("Error syncing real stock data:", error);
      const { generateStockDummyDataAction } = await import("@/lib/actions/stockActions");
      return await generateStockDummyDataAction().catch(() => []);
    }
  },

  /**
   * ダミーデータを生成して保存
   */
  generateAndSaveDummyData: async (): Promise<StockJudgment[]> => {
    const judgments: StockJudgment[] = MONITORING_STOCKS.map(s => {
      const score = 10 + Math.floor(Math.random() * 80);
      return {
        ticker: s.ticker,
        companyName: s.name,
        sector: s.sector,
        currentPrice: 1000 + Math.random() * 5000,
        totalScore: score,
        signalLabel: score > 70 ? "買い優勢" : score > 50 ? "やや買い" : score > 30 ? "中立" : "やや売り",
        
        technicalScore: score * 0.8,
        technicalTrend: score > 60 ? "bullish" : score < 40 ? "bearish" : "neutral",
        technicalReasons: ["移動平均線が上昇傾向です。", "RSIが中立圏内にあります。"],
        
        fundamentalScore: score * 0.9,
        growthProfile: score > 70 ? "growth" : "stable",
        financialHealth: "strong",
        fundamentalReasons: ["自己資本比率が安定しています。", "業績が堅調です。"],
        
        valuationScore: score * 0.7,
        valuationLabel: score > 60 ? "undervalued" : "fair",
        valuationReasons: ["過去のPER水準と比較して割安です。"],
        
        shareholderReturnScore: score * 0.6,
        dividendProfile: score > 60 ? "high_dividend" : "stable_dividend",
        holdSuitability: score > 50 ? "good_for_long_term" : "neutral",
        shareholderReasons: ["配当利回りが魅力的な水準です。"],
        
        confidence: "中",
        summaryComment: "サンプルデータです。実データの取得に失敗した際に表示されています。",
        updatedAt: new Date().toISOString(),
      } as StockJudgment;
    });

    for (const j of judgments) {
      await setDoc(doc(db, "japanese_stocks", j.ticker), j);
    }
    return judgments;
  },

  /**
   * 特定銘柄の判定を取得
   */
  getJudgmentByTicker: async (ticker: string): Promise<StockJudgment | null> => {
    try {
      const docRef = doc(db, "japanese_stocks", ticker);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as StockJudgment) : null;
    } catch (error) {
      console.error(`Error fetching judgment for ${ticker}:`, error);
      return null;
    }
  }
};
