"use server";

import { db } from "@/lib/firebase";
import { collection, doc, setDoc, writeBatch, getDocs, query, limit } from "firebase/firestore";
import { StockPairMaster } from "@/types/stock";

import { getLocalStockMasterData } from "@/lib/server/stockData";

/**
 * 東証プライム市場の全銘柄データをFirestoreの `stock_master` コレクションにシード（一括登録）する
 */
export async function seedStockMasterAction() {
  try {
    const allStocks = getLocalStockMasterData();

    console.log(`Starting seed for ${allStocks.length} stocks...`);

    // Firestoreのバッチ処理（最大500件ずつ）
    const BATCH_SIZE = 500;
    let count = 0;

    for (let i = 0; i < allStocks.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = allStocks.slice(i, i + BATCH_SIZE);

      chunk.forEach((stock) => {
        const docRef = doc(db, "stock_master", stock.ticker);
        batch.set(docRef, {
          ticker: stock.ticker,
          name: stock.name,
          sector: stock.sector,
          market: "Prime",
          updatedAt: new Date().toISOString(),
        });
      });

      await batch.commit();
      count += chunk.length;
      console.log(`Committed ${count} items...`);
    }

    return { 
      success: true, 
      message: `${count}件の銘柄データを正常にシードしました。`,
      count 
    };
  } catch (error: any) {
    console.error("Error seeding stock master:", error);
    return { 
      success: false, 
      message: `シード処理に失敗しました: ${error.message}` 
    };
  }
}

/**
 * Firestoreから銘柄マスタを取得する
 */
export async function getStockMasterAction() {
  try {
    const q = query(collection(db, "stock_master"));
    const querySnapshot = await getDocs(q);
    
    const stocks = querySnapshot.docs.map(doc => doc.data() as (StockPairMaster & { market: string }));
    
    return {
      success: true,
      data: stocks
    };
  } catch (error: any) {
    console.error("Error fetching stock master:", error);
    return {
      success: false,
      message: "銘柄マスタの取得に失敗しました。"
    };
  }
}
