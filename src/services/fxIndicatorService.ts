import { FXEconomicEvent } from "@/types/fx";

/**
 * 経済指標・イベント管理サービス
 * 発表前後のボラティリティ急増リスクを管理します。
 */
export const FXIndicatorService = {
  /**
   * 近日中の重要指標を取得 (モック/管理用)
   * 将来的には外部APIとの連携を想定
   */
  async getUpcomingEvents(): Promise<FXEconomicEvent[]> {
    const now = new Date();
    // デモ用: 今日・明日のダミー重要指標を生成
    return [
      {
        id: "evt_usd_cpi",
        name: "米・消費者物価指数 (CPI)",
        timestamp: new Date(now.getTime() + 1000 * 60 * 45).toISOString(), // 45分後
        importance: "high",
        currency: "USD"
      },
      {
        id: "evt_jpy_boj",
        name: "日銀・政策金利発表",
        timestamp: new Date(now.getTime() + 1000 * 60 * 60 * 3).toISOString(), // 3時間後
        importance: "high",
        currency: "JPY"
      },
      {
        id: "evt_usd_fomc",
        name: "FOMC議事要旨公開",
        timestamp: new Date(now.getTime() + 1000 * 60 * 60 * 24).toISOString(), // 24時間後
        importance: "medium",
        currency: "USD"
      }
    ];
  },

  /**
   * 現在の時刻が指標による「制限・警戒」期間内かどうかを判定
   */
  async getEventStatus(): Promise<{ 
    status: "normal" | "caution" | "prohibited";
    message: string;
    nextEvent?: FXEconomicEvent;
    minutesToEvent?: number;
  }> {
    const events = await this.getUpcomingEvents();
    const now = new Date().getTime();
    
    // 直近のイベント（未来のもの）から順にチェック
    const futureEvents = events
      .filter(e => new Date(e.timestamp).getTime() > now - 1000 * 60 * 30) // 終了後30分以内も含む
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (futureEvents.length === 0) {
      return { status: "normal", message: "経済指標による制限はありません" };
    }

    const nextEvt = futureEvents[0];
    const eventTime = new Date(nextEvt.timestamp).getTime();
    const diffMin = (eventTime - now) / (1000 * 60);

    // PROHIBITED (指標発表前後 30分 - 重要度 高)
    if (nextEvt.importance === "high" && diffMin <= 30 && diffMin >= -30) {
      return { 
        status: "prohibited", 
        message: `【禁止】${nextEvt.name} の発表直前・直後です`, 
        nextEvent: nextEvt,
        minutesToEvent: Math.round(diffMin)
      };
    }

    // CAUTION (指標発表前後 15分 - 重要度 中 / 指標発表まで 60分以内 - 重要度 高)
    if (
      (nextEvt.importance === "medium" && diffMin <= 15 && diffMin >= -15) ||
      (nextEvt.importance === "high" && diffMin <= 60)
    ) {
      return { 
        status: "caution", 
        message: `【警戒】${nextEvt.name} の発表が近づいています`, 
        nextEvent: nextEvt,
        minutesToEvent: Math.round(diffMin)
      };
    }

    return { 
      status: "normal", 
      message: "通常運用", 
      nextEvent: nextEvt,
      minutesToEvent: Math.round(diffMin)
    };
  }
};
