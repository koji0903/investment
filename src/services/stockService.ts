import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { StockJudgment, StockPairMaster } from "@/types/stock";
import { 
  getStockJudgmentsAction, 
  syncSpecificStockAction, 
  setStockSyncingAction,
  syncStockRealData,
  getStockBasicInfoAction
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
  { ticker: "6861", name: "キーエンス", sector: "電気機器" },
  { ticker: "8035", name: "東エレク", sector: "電気機器" },
  { ticker: "9101", name: "日本郵船", sector: "海運業" },
  { ticker: "9104", name: "商船三井", sector: "海運業" },
  { ticker: "6501", name: "日立", sector: "電気機器" },
  { ticker: "7974", name: "任天堂", sector: "その他製品" },
  { ticker: "4063", name: "信越化", sector: "化学" },
  { ticker: "4502", name: "武田薬", sector: "医薬品" },
  { ticker: "2914", name: "JT", sector: "食料品" },
  { ticker: "8411", name: "みずほ", sector: "銀行業" },
  { ticker: "6981", name: "村田製", sector: "電気機器" },
  { ticker: "4519", name: "中外薬", sector: "医薬品" },
  { ticker: "3382", name: "セブン＆アイ", sector: "小売業" },
  { ticker: "6954", name: "ファナック", sector: "電気機器" },
  { ticker: "6273", name: "ＳＭＣ", sector: "機械" },
  { ticker: "6367", name: "ダイキン", sector: "機械" },
  { ticker: "7267", name: "ホンダ", sector: "輸送用機器" },
  { ticker: "4901", name: "富士フイルム", sector: "化学" },
  { ticker: "4568", name: "第一三共", sector: "医薬品" },
  { ticker: "7741", name: "ＨＯＹＡ", sector: "精密機器" },
  { ticker: "6146", name: "ディスコ", sector: "機械" },
  { ticker: "6723", name: "ルネサス", sector: "電気機器" },
  { ticker: "7011", name: "三菱重", sector: "機械" },
  { ticker: "9020", name: "ＪＲ東日本", sector: "陸運業" },
  { ticker: "9022", name: "ＪＲ東海", sector: "陸運業" },
  { ticker: "9201", name: "日本航空", sector: "空運業" },
  { ticker: "9202", name: "ＡＮＡ", sector: "空運業" },
  { ticker: "2802", name: "味の素", sector: "食料品" },
  { ticker: "1925", name: "大和ハウス", sector: "建設業" },
  { ticker: "1928", name: "積水ハウス", sector: "建設業" },
  { ticker: "1605", name: "ＩＮＰＥＸ", sector: "鉱業" },
  { ticker: "9433", name: "ＫＤＤＩ", sector: "情報・通信業" },
  { ticker: "3407", name: "旭化成", sector: "化学" },
  { ticker: "6701", name: "日本電気", sector: "電気機器" },
  { ticker: "6098", name: "リクルート", sector: "サービス業" },
];

export const StockService = {
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
   * 銘柄の基本情報を取得（オンデマンド追加用）
   */
  getBasicInfo: async (ticker: string) => {
    try {
      return await getStockBasicInfoAction(ticker);
    } catch (error) {
      console.error(`Error fetching basic info for ${ticker}:`, error);
      return { success: false, message: "情報取得エラー" };
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
