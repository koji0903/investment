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
      const q = query(collection(db, "japanese_stocks"), orderBy("totalScore", "desc"));
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => doc.data() as StockJudgment);
      
      if (results.length === 0) {
        // データがない場合は同期を実行
        console.log("No stock data found, triggering initial sync...");
        const syncResults = await StockService.syncRealData();
        if (syncResults.length === 0) {
          return await StockService.generateAndSaveDummyData();
        }
        return syncResults;
      }
      return results;
    } catch (error) {
      console.error("Error fetching stock judgments:", error);
      return await StockService.generateAndSaveDummyData().catch(() => []);
    }
  },

  /**
   * 実データを同期して取得 (Server Action呼び出し)
   */
  syncRealData: async (): Promise<StockJudgment[]> => {
    try {
      const res = await syncStockRealData();
      if (!res || res.count === 0) {
        return await StockService.generateAndSaveDummyData();
      }
      // 同期後に再取得
      const q = query(collection(db, "japanese_stocks"), orderBy("totalScore", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as StockJudgment);
    } catch (error) {
      console.error("Error syncing real stock data:", error);
      return await StockService.generateAndSaveDummyData().catch(() => []);
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
        fundamentalScore: score * 0.9,
        valuationScore: score * 0.7,
        shareholderReturnScore: score * 0.6,
        updatedAt: new Date().toISOString(),
        businessSummary: "AIによって自動生成されたサンプルデータです。",
        technicalTrend: "不明",
        fundamentalAnalysis: "分析中",
        valuationLabel: "中立",
        dividendProfile: "安定配当",
        reasons: {
          technical: ["サンプル"],
          fundamental: ["サンプル"],
          valuation: ["サンプル"],
          shareholderReturn: ["サンプル"]
        }
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
