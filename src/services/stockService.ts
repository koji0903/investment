import { db, saveStockJudgment, updateStockSyncingStatus } from "@/lib/db";
import { collection, query, onSnapshot, orderBy, doc, getDoc } from "firebase/firestore";
import { StockJudgment, StockPairMaster } from "@/types/stock";
import { DEMO_USER_ID } from "@/context/AuthContext";
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
  getJudgments: async (userId: string, portfolioId: string): Promise<StockJudgment[]> => {
    try {
      return await getStockJudgmentsAction(userId, portfolioId);
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

  syncStock: async (userId: string, portfolioId: string, ticker: string) => {
    try {
      if (!userId || !portfolioId) return { success: false, message: "Authentication required" };

      // 1. クライアント側でキャッシュチェック
      const path = `users/${userId}/portfolios/${portfolioId}/stock_judgments`;
      const docRef = doc(db, path, ticker);
      const cachedDoc = await getDoc(docRef);
      
      if (cachedDoc.exists()) {
        const existingData = cachedDoc.data() as StockJudgment;
        const lastUpdated = new Date(existingData.updatedAt || 0).getTime();
        const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
        
        // 24時間以内の完了データがあれば、サーバー負荷軽減のため再利用
        if (Date.now() - lastUpdated < twentyFourHoursInMs && existingData.syncStatus === 'completed') {
          return { success: true, data: existingData };
        }
      }

      // 2. サーバーサイドで解析実行
      const result = await syncSpecificStockAction(userId, portfolioId, ticker);
      if (result.success && result.data) {
        // クライアント側（認証済み、デモガード付き）で保存を実行
        await saveStockJudgment(userId, portfolioId, ticker, result.data);
      }
      return result;
    } catch (error) {
      console.error(`Error syncing stock ${ticker}:`, error);
      return { success: false, message: "同期エラーが発生しました" };
    }
  },

  setSyncing: async (userId: string, portfolioId: string, ticker: string) => {
    try {
      // クライアント側で即座にフラグを立てる (デモガード付き)
      await updateStockSyncingStatus(userId, portfolioId, ticker);
      
      return await setStockSyncingAction(userId, portfolioId, ticker);
    } catch (error) {
       console.error(`Error setting syncing status for ${ticker}:`, error);
       return { success: false };
    }
  },

  /**
   * 全銘柄のリアルデータ同期
   */
  syncRealData: async (userId: string, portfolioId: string): Promise<StockJudgment[]> => {
    try {
      // サーバー側の一括同期は権限の問題で Firestore 保存できないため、クライアント側で順次実行
      const results: StockJudgment[] = [];
      const targets = MONITORING_STOCKS.slice(0, 15); // パフォーマンスのため上位15件
      
      for (const stk of targets) {
        const res = await StockService.syncStock(userId, portfolioId, stk.ticker);
        if (res.success && res.data) results.push(res.data as StockJudgment);
        // 短い待機を入れてレート制限を回避
        await new Promise(r => setTimeout(r, 800));
      }
      
      return results;
    } catch (error) {
      console.error("Error syncing real stock data:", error);
      return [];
    }
  }
};
