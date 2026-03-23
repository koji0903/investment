// Client-side NISA actions

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

    // デモユーザーの場合はFirestoreには保存せず、成功を返す
    if (setting.userId === "demo-user-stable-id") {
      console.log("Mock saving NISA setting for demo user");
      return { success: true };
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
    // 権限エラーの場合の分かりやすいメッセージ
    if (error.code === 'permission-denied') {
      return { 
        success: false, 
        error: "アクセス権限がありません。ログインし直すか、デモモードの制約を確認してください。" 
      };
    }
    return { success: false, error: error.message || "データベースへの保存に失敗しました。" };
  }
}

/**
 * NISA積立設定に基づいて保有資産を同期する
 */
export async function syncNisaAccumulations(userId: string) {
  // 自動同期を一時的に無効化（ユーザーからの要請により、積立設定はシミュレーション用のみとし、保有資産への自動反映は行わない）
  console.log("NISA asset sync is currently disabled per user request.");
  return { success: true, syncResults: [] };
}

/**
 * ユーザーの全てのNISA積立設定を取得
 */
export async function getNisaSettings(userId: string): Promise<NisaAccumulationSetting[]> {
  // デモユーザー用のモックデータ
  if (userId === "demo-user-stable-id") {
    return [
      {
        id: "demo-1",
        userId: userId,
        accountType: "accumulation",
        symbol: "eMAXIS Slim 全世界株式",
        name: "eMAXIS Slim 全世界株式（オール・カントリー）",
        amount: 33333,
        dayOfMonth: 1,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "demo-2",
        userId: userId,
        accountType: "growth",
        symbol: "VOO",
        name: "バンガード S&P 500 ETF",
        amount: 50000,
        dayOfMonth: 15,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
  }

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

// Implementation Plan Update:
// - Remove `"use server"`: サーバーアクションでは Firebase Auth のコンテキストが引き継がれず、Firestore ルールで `permission-denied` になるため、クライアントサイドのユーティリティ関数に変更します。
// - `saveNisaSetting`, `getNisaSettings`, `deleteNisaSetting` をクライアントから直接呼び出せるようにし、ブラウザの認証セッションを利用します。
// - Disable Auto-Sync: 積立設定の登録時に、過去の積立分を自動で資産（Assets/Transactions）に反映する `syncNisaAccumulations` の動作を停止します。NISA設定はあくまでシミュレーション用のメタデータとして扱い、現在の保有資産を勝手に増やさないようにします。
// - Demo Mode Check: `userId === "demo-user-stable-id"` の場合は Firestore へのアクセスをスキップするロジックを維持します。

/**
 * NISA積立設定を削除
 */
export async function deleteNisaSetting(userId: string, settingId: string) {
  // デモユーザーの場合は何もしない
  if (userId === "demo-user-stable-id") {
    return { success: true };
  }

  try {
    const docRef = doc(getNisaCol(userId), settingId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting NISA setting:", error);
    return { success: false, error: "削除に失敗しました。" };
  }
}
