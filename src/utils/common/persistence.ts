/**
 * アプリケーション全体で使用するローカルストレージ・キャッシュユーティリティ
 * Firestore の読み取り回数削減と、起動時の表示速度向上のために使用
 */

const CACHE_PREFIX = "app_dashboard_cache_";

export const AppPersistence = {
  /**
   * データをキャッシュに保存
   */
  save<T>(key: string, data: T): void {
    if (typeof window === "undefined") return;
    try {
      const payload = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(payload));
    } catch (e) {
      console.warn(`Failed to save cache for ${key}`, e);
    }
  },

  /**
   * キャッシュからデータを復元
   * maxAge: キャッシュの有効期限 (ミリ秒) - デフォルト 24時間
   */
  load<T>(key: string, maxAge: number = 24 * 60 * 60 * 1000): T | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!raw) return null;

      const payload = JSON.parse(raw);
      const now = Date.now();

      // 有効期限チェック
      if (now - payload.timestamp > maxAge) {
        localStorage.removeItem(`${CACHE_PREFIX}${key}`);
        return null;
      }

      return payload.data as T;
    } catch (e) {
      console.warn(`Failed to load cache for ${key}`, e);
      return null;
    }
  },

  /**
   * キャッシュの削除
   */
  clear(key: string): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  }
};
