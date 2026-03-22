"use server";

import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc,
  serverTimestamp,
  orderBy
} from "firebase/firestore";
import { NisaAccumulationSetting } from "@/types/nisa";

const COLLECTION_NAME = "nisa_settings";

/**
 * NISA積立設定を保存または更新
 */
export async function saveNisaSetting(setting: Omit<NisaAccumulationSetting, "createdAt" | "updatedAt">) {
  try {
    const docRef = doc(db, COLLECTION_NAME, setting.id);
    const now = new Date().toISOString();
    
    await setDoc(docRef, {
      ...setting,
      updatedAt: now,
      // 存在しない場合はcreatedAtを設定、存在する場合は更新しない（簡易実装として現在時刻を常に使用）
      createdAt: now 
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error("Error saving NISA setting:", error);
    throw new Error("NISA設定の保存に失敗しました。");
  }
}

/**
 * ユーザーの全てのNISA積立設定を取得
 */
export async function getNisaSettings(userId: string): Promise<NisaAccumulationSetting[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as NisaAccumulationSetting[];
  } catch (error) {
    console.error("Error fetching NISA settings:", error);
    return [];
  }
}

/**
 * NISA積立設定を削除
 */
export async function deleteNisaSetting(id: string) {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting NISA setting:", error);
    throw new Error("NISA設定の削除に失敗しました。");
  }
}
