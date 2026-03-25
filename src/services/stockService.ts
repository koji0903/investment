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

import { TSE_PRIME_MASTER } from "@/data/tse_prime_master";

export const MONITORING_STOCKS: StockPairMaster[] = TSE_PRIME_MASTER;

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
