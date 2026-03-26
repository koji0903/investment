import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  query, 
  orderBy, 
  Timestamp,
  getDoc,
  onSnapshot
} from "firebase/firestore";
import { 
  FXJudgment, 
  CurrencyCode,
  CurrencyFundamental,
  SUPPORTED_PAIRS
} from "@/types/fx";
import { analyzeTechnical } from "@/utils/fx/technical";
import { analyzeFundamental } from "@/utils/fx/fundamental";
import { evaluateSwap, calculateTotalJudgment } from "@/utils/fx/scoring";
import { syncFXRealData } from "@/lib/actions/fx";

// マスタ情報の定義は types/fx.ts に移動

/**
 * FX 投資判断エンジンのサービス層
 */
export const FXService = {
  async getPairs(userId: string, portfolioId: string): Promise<FXJudgment[]> {
    try {
      const { getFXJudgmentsAction } = await import("@/lib/actions/fx");
      return await getFXJudgmentsAction(userId, portfolioId);
    } catch (error) {
      console.error("Error fetching FX judgments:", error);
      return [];
    }
  },

  subscribePairs: (userId: string, portfolioId: string, callback: (data: FXJudgment[]) => void) => {
    if (!userId || !portfolioId) return () => {};
    const path = `users/${userId}/portfolios/${portfolioId}/fx_judgments`;
    const q = query(collection(db, path));
    return onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data() as FXJudgment);
        callback(data.sort((a, b) => b.totalScore - a.totalScore));
      },
      (error) => {
        console.error("[Firestore] FXService.subscribePairs error:", error);
      }
    );
  },

  async getJudgmentByPair(userId: string, portfolioId: string, pairCode: string): Promise<FXJudgment | null> {
    try {
      const path = `users/${userId}/portfolios/${portfolioId}/fx_judgments`;
      const docRef = doc(db, path, pairCode.replace("/", "-"));
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as FXJudgment) : null;
    } catch (error) {
      console.error(`Error fetching judgment for ${pairCode}:`, error);
      return null;
    }
  },

  async syncRealData(userId: string, portfolioId: string): Promise<FXJudgment[]> {
    try {
      // サーバーサイドでの一括同期は権限の問題で Firestore に保存できないため、
      // クライアント側で一括リクエストを行う形式に変更
      const results: FXJudgment[] = [];
      const CHUNK_SIZE = 3;
      
      for (let i = 0; i < SUPPORTED_PAIRS.length; i += CHUNK_SIZE) {
        const chunk = SUPPORTED_PAIRS.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(async (pair) => {
          const res = await FXService.syncPair(userId, portfolioId, pair.pairCode);
          if (res.success && res.data) results.push(res.data);
        }));
        // 短い待機を入れてレート制限を回避
        await new Promise(r => setTimeout(r, 1000));
      }
      
      return results;
    } catch (error) {
      console.error("Error syncing real FX data:", error);
      return [];
    }
  },

  async syncPair(userId: string, portfolioId: string, pairCode: string): Promise<{ success: boolean; data?: FXJudgment; message?: string }> {
    try {
      const { syncSpecificPairAction } = await import("@/lib/actions/fx");
      const result = await syncSpecificPairAction(userId, portfolioId, pairCode);
      
      if (result.success && result.data) {
        // クライアント側（認証済み）で保存を実行
        const path = `users/${userId}/portfolios/${portfolioId}/fx_judgments`;
        await setDoc(doc(db, path, pairCode.replace("/", "-")), result.data);
      }
      
      return result;
    } catch (error: any) {
      console.error(`Error syncing pair ${pairCode}:`, error);
      return { success: false, message: error.message };
    }
  },

  async setSyncing(userId: string, portfolioId: string, pairCode: string): Promise<boolean> {
    try {
      // クライアント側で即座にフラグを立てる
      if (userId && portfolioId) {
        const path = `users/${userId}/portfolios/${portfolioId}/fx_judgments`;
        await setDoc(doc(db, path, pairCode.replace("/", "-")), { 
          syncStatus: "syncing", 
          updatedAt: new Date().toISOString() 
        }, { merge: true });
      }

      const { setSyncingStatusAction } = await import("@/lib/actions/fx");
      await setSyncingStatusAction(userId, portfolioId, pairCode);
      return true;
    } catch (error) {
      console.error(`Error setting syncing status for ${pairCode}:`, error);
      return true; // 失敗しても続行
    }
  },

  /**
   * ダミーデータを生成して Firestore に保存 (初期化/テスト用)
   */
  async generateAndSaveDummyData(): Promise<FXJudgment[]> {
    const fundamentals = FXService.generateDummyFundamentals();
    const judgments: FXJudgment[] = [];

    // 通貨ファンダメンタルを保存
    for (const fund of Object.values(fundamentals)) {
      await setDoc(doc(db, "fx_currency_fundamentals", fund.currencyCode), {
        ...fund,
        updatedAt: new Date().toISOString()
      });
    }

    // 各通貨ペアの分析を実行
    for (const pair of SUPPORTED_PAIRS) {
      const prices = FXService.generateDummyPriceHistory(pair.pairCode);
      const currentPrice = prices[prices.length - 1];
      
      const technical = analyzeTechnical(prices, currentPrice);
      const fundamental = analyzeFundamental(
        fundamentals[pair.baseCurrency],
        fundamentals[pair.quoteCurrency]
      );
      
      // スワップ情報の生成 (ダミー)
      const swaps = FXService.getDummySwaps(pair.pairCode);
      const swapEval = evaluateSwap(swaps.buy, swaps.sell);
      
      const judgment = calculateTotalJudgment(
        pair.pairCode,
        pair.baseCurrency,
        pair.quoteCurrency,
        currentPrice,
        technical,
        fundamental,
        swapEval
      );

      // Firestore に保存 (ドキュメントIDにスラッシュは使わない方が良いので変換)
      await setDoc(doc(db, "fx_judgments", pair.pairCode.replace("/", "-")), judgment);
      judgments.push(judgment);
    }

    return judgments;
  },

  /**
   * 通貨ごとのファンダメンタルダミーデータ
   */
  generateDummyFundamentals(): Record<string, CurrencyFundamental> {
    const now = new Date().toISOString();
    return {
      USD: { currencyCode: "USD", interestRate: 5.5, inflationScore: 6, growthScore: 7, centralBankBias: "hawkish", riskSensitivity: 0, safeHavenScore: 8, commodityLinkedScore: 0, updatedAt: now },
      JPY: { currencyCode: "JPY", interestRate: 0.1, inflationScore: 2, growthScore: 1, centralBankBias: "dovish", riskSensitivity: 0, safeHavenScore: 10, commodityLinkedScore: 0, updatedAt: now },
      EUR: { currencyCode: "EUR", interestRate: 4.5, inflationScore: 5, growthScore: 3, centralBankBias: "neutral", riskSensitivity: 0, safeHavenScore: 5, commodityLinkedScore: 0, updatedAt: now },
      GBP: { currencyCode: "GBP", interestRate: 5.25, inflationScore: 7, growthScore: 4, centralBankBias: "hawkish", riskSensitivity: 0, safeHavenScore: 3, commodityLinkedScore: 0, updatedAt: now },
      AUD: { currencyCode: "AUD", interestRate: 4.35, inflationScore: 4, growthScore: 5, centralBankBias: "neutral", riskSensitivity: 8, safeHavenScore: 0, commodityLinkedScore: 9, updatedAt: now },
      NZD: { currencyCode: "NZD", interestRate: 5.5, inflationScore: 4, growthScore: 4, centralBankBias: "neutral", riskSensitivity: 8, safeHavenScore: 0, commodityLinkedScore: 7, updatedAt: now },
      CAD: { currencyCode: "CAD", interestRate: 5.0, inflationScore: 3, growthScore: 6, centralBankBias: "dovish", riskSensitivity: 5, safeHavenScore: 0, commodityLinkedScore: 8, updatedAt: now },
      CHF: { currencyCode: "CHF", interestRate: 1.5, inflationScore: 1, growthScore: 2, centralBankBias: "dovish", riskSensitivity: 0, safeHavenScore: 9, commodityLinkedScore: 0, updatedAt: now },
      ZAR: { currencyCode: "ZAR", interestRate: 8.25, inflationScore: 7, growthScore: 2, centralBankBias: "hawkish", riskSensitivity: 9, safeHavenScore: 0, commodityLinkedScore: 8, updatedAt: now },
      MXN: { currencyCode: "MXN", interestRate: 11.25, inflationScore: 5, growthScore: 4, centralBankBias: "hawkish", riskSensitivity: 7, safeHavenScore: 0, commodityLinkedScore: 6, updatedAt: now },
      TRY: { currencyCode: "TRY", interestRate: 45.0, inflationScore: 10, growthScore: 1, centralBankBias: "hawkish", riskSensitivity: 6, safeHavenScore: 0, commodityLinkedScore: 2, updatedAt: now },
    };
  },

  /**
   * 価格履歴のダミー生成
   */
  generateDummyPriceHistory(pair: string): number[] {
    let basePrice = 100;
    if (pair.includes("JPY")) basePrice = 150;
    if (pair.includes("EUR/USD")) basePrice = 1.08;
    if (pair.includes("GBP/USD")) basePrice = 1.25;

    const history: number[] = [];
    let current = basePrice;
    
    // 250日分のデータを生成 (トレンドを持たせる)
    const trend = (Math.random() - 0.45) * 0.1; // 若干の上昇バイアス
    
    for (let i = 0; i < 250; i++) {
      const volatility = current * 0.005;
      current += (Math.random() - 0.5) * volatility + trend;
      history.push(current);
    }
    return history;
  },

  /**
   * スワップポイントのダミー取得
   */
  getDummySwaps(pair: string): { buy: number; sell: number } {
    // 実際にはAPIやマスタから取得
    if (pair === "USD/JPY") return { buy: 230, sell: -250 };
    if (pair === "AUD/JPY") return { buy: 180, sell: -200 };
    if (pair.includes("JPY")) return { buy: 150, sell: -180 };
    if (pair.endsWith("USD")) return { buy: 10, sell: -20 };
    return { buy: -10, sell: -10 }; // どちらもマイナス
  }
};
