"use server";

import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from "firebase/firestore";
import { FXSimulation, FXTradingReview } from "@/types/fx";
import { generateTradingReview } from "@/utils/fx/review";
import { FXSimulationService } from "@/services/fxSimulationService";

/**
 * 指定された期間のトレードレビューを生成・保存する
 */
export async function generateFXReviewAction(
  userId: string, 
  period: "daily" | "weekly"
): Promise<{ success: boolean; data?: FXTradingReview; message?: string }> {
  try {
    if (!userId) return { success: false, message: "User ID is required" };

    const now = new Date();
    let start = new Date();
    
    if (period === "daily") {
      start.setHours(0, 0, 0, 0);
    } else {
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    }

    const startISO = start.toISOString();
    const endISO = now.toISOString();

    const trades = await FXSimulationService.getSimulationsByDateRange(userId, startISO, endISO);
    
    const review = generateTradingReview(trades, period, startISO, endISO);
    review.userId = userId;

    // Firestore に保存
    const reviewId = `${period}-${startISO.split('T')[0]}`;
    const docRef = doc(db, `users/${userId}/usdjpy/reviews`, reviewId);
    await setDoc(docRef, {
      ...review,
      updatedAt: new Date().toISOString()
    });

    return { success: true, data: JSON.parse(JSON.stringify(review)) };
  } catch (error: any) {
    console.error("Error generating FX review:", error);
    return { success: false, message: error.message };
  }
}

/**
 * 保存されたレビューを取得する
 */
export async function getFXReviewsAction(
  userId: string,
  limitCount: number = 10
): Promise<FXTradingReview[]> {
  try {
    const q = query(
      collection(db, `users/${userId}/usdjpy/reviews`),
      orderBy("startDate", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as FXTradingReview).slice(0, limitCount);
  } catch (error) {
    console.error("Error fetching FX reviews:", error);
    return [];
  }
}
