"use server";

import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  doc, 
  setDoc, 
  deleteDoc,
  serverTimestamp,
  orderBy
} from "firebase/firestore";
import { NisaAccumulationSetting } from "@/types/nisa";

// ユーザーごとのNISA設定コレクションへの参照を取得
const getNisaCol = (userId: string) => collection(db, "users", userId, "nisa_settings");

/**
 * NISA積立設定を保存または更新
 */
export async function saveNisaSetting(setting: Omit<NisaAccumulationSetting, "createdAt" | "updatedAt">) {
  console.log("Saving NISA setting to user-nested path - Data:", JSON.stringify(setting));
  
  if (!setting.userId) {
    console.error("Missing userId in setting");
    return { success: false, error: "ユーザーIDが不足しています。" };
  }

  try {
    const colRef = getNisaCol(setting.userId);
    const docRef = doc(colRef, setting.id);
    const docSnap = await getDoc(docRef);
    const now = new Date().toISOString();
    
    // クリーンなデータオブジェクトを作成（undefinedを除外）
    const data: any = {
      id: setting.id,
      accountType: setting.accountType,
      name: setting.name,
      symbol: setting.symbol || "",
      amount: setting.amount,
      dayOfMonth: setting.dayOfMonth,
      status: setting.status || "active",
      assetId: setting.assetId || "",
      lastProcessedMonth: setting.lastProcessedMonth || "",
      userId: setting.userId,
      updatedAt: now
    };

    if (!docSnap.exists()) {
      data.createdAt = now;
    }

    await setDoc(docRef, data, { merge: true });
    
    console.log("Successfully saved NISA setting to user path:", setting.id);
    return { success: true };
  } catch (error: any) {
    console.error("Error saving NISA setting:", error);
    return { success: false, error: error.message || "データベースへの保存に失敗しました（権限エラーの可能性があります）。" };
  }
}

/**
 * NISA積立設定に基づいて保有資産を同期する
 */
export async function syncNisaAccumulations(userId: string) {
  try {
    const settings = await getNisaSettings(userId);
    const activeSettings = settings.filter(s => s.status === "active");
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentDay = now.getDate();
    
    const results = [];

    for (const setting of activeSettings) {
      const lastProcessed = setting.lastProcessedMonth; // "YYYY-MM" or empty
      let [lastYear, lastMonth] = lastProcessed ? lastProcessed.split("-").map(Number) : [0, 0];
      
      // 開始月を決定（設定がない場合は作成月から開始）
      if (!lastYear) {
        const created = new Date(setting.createdAt);
        lastYear = created.getFullYear();
        lastMonth = created.getMonth(); // その月の1ヶ月前から開始扱いに
      }

      let year = lastYear;
      let month = lastMonth + 1;
      const transactionsToCreate = [];

      while (year < currentYear || (year === currentYear && month <= currentMonth)) {
        // 当月の場合、積立日を過ぎているかチェック
        if (year === currentYear && month === currentMonth && currentDay < setting.dayOfMonth) {
          break;
        }

        const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
        transactionsToCreate.push({
          month: monthStr,
          date: new Date(year, month - 1, setting.dayOfMonth).toISOString()
        });

        month++;
        if (month > 12) {
          month = 1;
          year++;
        }
      }

      if (transactionsToCreate.length > 0) {
        // 資産の取得または作成
        const portfolioId = "default";
        const assetsCol = collection(db, "users", userId, "portfolios", portfolioId, "assets");
        const transCol = collection(db, "users", userId, "portfolios", portfolioId, "transactions");
        
        // IDまたは名前でアセットを決定
        let assetDocData: any = null;
        let assetId = setting.assetId || "";
        
        if (assetId) {
          const assetDoc = await getDoc(doc(assetsCol, assetId));
          if (assetDoc.exists()) {
            assetDocData = assetDoc.data();
          } else {
            // ID指定があるが見つからない場合は名前でフォールバック
            const q = query(assetsCol, where("name", "==", setting.name));
            const assetSnap = await getDocs(q);
            if (!assetSnap.empty) {
              const foundDoc = assetSnap.docs[0];
              assetId = foundDoc.id;
              assetDocData = foundDoc.data();
            }
          }
        } else {
          // 名前でアセットを検索（後方互換性）
          const q = query(assetsCol, where("name", "==", setting.name));
          const assetSnap = await getDocs(q);
          if (!assetSnap.empty) {
            const foundDoc = assetSnap.docs[0];
            assetId = foundDoc.id;
            assetDocData = foundDoc.data();
          }
        }
        
        let currentQty = 0;
        let currentAvgCost = 0;

        if (assetDocData) {
          currentQty = assetDocData.quantity || 0;
          currentAvgCost = assetDocData.averageCost || 0;
        } else {
          // 新規アセット作成
          const newAssetRef = assetId ? doc(assetsCol, assetId) : doc(assetsCol);
          assetId = newAssetRef.id;
          await setDoc(newAssetRef, {
            name: setting.name,
            symbol: setting.symbol || setting.name,
            category: "投資信託",
            quantity: 0,
            averageCost: 0,
            currentPrice: 1, // 初期値
            nisaAccountType: setting.accountType,
            updatedAt: new Date().toISOString()
          });
        }

        // トランザクション生成とアセット更新
        let totalAddedQty = 0;
        let totalCost = currentQty * currentAvgCost;

        for (const txData of transactionsToCreate) {
          // 簡易的に価格1として数量=金額で登録（投信の口数計算の代わり）
          const qty = setting.amount;
          const price = 1;
          
          await setDoc(doc(transCol), {
            assetId: assetId,
            type: "buy",
            quantity: qty,
            price: price,
            date: txData.date,
            memo: `${txData.month} NISA積立`,
            isAutoGenerated: true
          });

          totalAddedQty += qty;
          totalCost += (qty * price);
        }

        const newQty = currentQty + totalAddedQty;
        const newAvgCost = newQty > 0 ? totalCost / newQty : 0;

        await setDoc(doc(assetsCol, assetId), {
          quantity: newQty,
          averageCost: newAvgCost,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // NISA設定の最終処理月を更新
        const lastMonthProcessed = transactionsToCreate[transactionsToCreate.length - 1].month;
        const nisaDocRef = doc(getNisaCol(userId), setting.id);
        await setDoc(nisaDocRef, {
          lastProcessedMonth: lastMonthProcessed,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        results.push({ name: setting.name, months: transactionsToCreate.length });
      }
    }

    return { success: true, syncResults: results };
  } catch (error) {
    console.error("Error syncing NISA accumulations:", error);
    return { success: false, error: "積立同期に失敗しました。" };
  }
}

/**
 * ユーザーの全てのNISA積立設定を取得
 */
export async function getNisaSettings(userId: string): Promise<NisaAccumulationSetting[]> {
  try {
    const q = query(
      getNisaCol(userId), 
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as NisaAccumulationSetting[];
  } catch (error) {
    console.error("Error fetching NISA settings from user path:", error);
    return [];
  }
}

/**
 * NISA積立設定を削除
 */
export async function deleteNisaSetting(userId: string, id: string) {
  try {
    await deleteDoc(doc(getNisaCol(userId), id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting NISA setting:", error);
    throw new Error("NISA設定の削除に失敗しました。");
  }
}
