import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { StockJudgment, StockPairMaster } from "@/types/stock";
import { 
  getStockJudgmentsAction, 
  syncSpecificStockAction, 
  setStockSyncingAction,
  syncStockRealData
} from "@/lib/actions/stock";

export const MONITORING_STOCKS: StockPairMaster[] = [
  { ticker: "7203", name: "トヨタ", sector: "輸送用機器" },
  { ticker: "8306", name: "三菱UFJ", sector: "銀行業" },
  { ticker: "9984", name: "ソフトバンクG", sector: "情報・通信業" },
  { ticker: "9432", name: "NTT", sector: "情報・通信業" },
  { ticker: "8058", name: "三菱商事", sector: "卸売業" },
  { ticker: "8001", name: "伊藤忠", sector: "卸売業" },
  { ticker: "8031", name: "三井物産", sector: "卸売業" },
  { ticker: "8766", name: "東京海上", sector: "保険業" },
  { ticker: "8316", name: "三井住友FG", sector: "銀行業" },
  { ticker: "6758", name: "ソニーG", sector: "電気機器" },
];

export const StockService = {
  /**
   * リアルタイム購読
   */
  subscribeJudgments: (callback: (judgments: StockJudgment[]) => void) => {
    const q = query(collection(db, "japanese_stocks"), orderBy("totalScore", "desc"));
    return onSnapshot(q, (snapshot) => {
      const judgments = snapshot.docs.map(doc => ({
        ...doc.data()
      })) as StockJudgment[];
      callback(judgments);
    });
  },

  /**
   * 日本株判定一覧を取得
   */
  getJudgments: async (): Promise<StockJudgment[]> => {
    try {
      return await getStockJudgmentsAction();
    } catch (error) {
      console.error("Error fetching stock judgments:", error);
      return [];
    }
  },

  /**
   * 個別銘柄を同期
   */
  syncStock: async (ticker: string) => {
    try {
      return await syncSpecificStockAction(ticker);
    } catch (error) {
      console.error(`Error syncing stock ${ticker}:`, error);
      return { success: false, message: "同期エラーが発生しました" };
    }
  },

  /**
   * 同期中ステータスを設定
   */
  setSyncing: async (ticker: string) => {
    try {
      return await setStockSyncingAction(ticker);
    } catch (error) {
       console.error(`Error setting syncing status for ${ticker}:`, error);
       return { success: false };
    }
  },

  /**
   * 全銘柄のリアルデータ同期
   */
  syncRealData: async (): Promise<StockJudgment[]> => {
    try {
      const res = await syncStockRealData();
      return (res.data ?? []) as StockJudgment[];
    } catch (error) {
      console.error("Error syncing real stock data:", error);
      return [];
    }
  }
};
