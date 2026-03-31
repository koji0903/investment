import { FXEconomicEvent } from "@/types/fx";

/**
 * 経済指標・イベント管理サービス
 * 発表前後のボラティリティ急増リスクを管理します。
 */
export const FXIndicatorService = {
  /**
   * 近日中の重要指標を取得 (モック/管理用)
   */
  async getUpcomingEvents(pairCode: string = "USD/JPY"): Promise<FXEconomicEvent[]> {
    const now = new Date();
    
    // 2026年3月末〜4月の主要指標スケジュール (実在する予定に基づく)
    const masterSchedule: FXEconomicEvent[] = [
      { id: "usd_cb_cc", name: "米・消費者信頼感指数", importance: "high", currency: "USD", timestamp: "2026-03-31T14:00:00Z" }, // 23:00 JST
      { id: "jpy_tankan", name: "日銀短観 (1-3月期)", importance: "high", currency: "JPY", timestamp: "2026-03-31T23:50:00Z" }, // 08:50 JST (4/1)
      { id: "eur_ger_pmi", name: "独・製造業PMI (確定値)", importance: "medium", currency: "EUR", timestamp: "2026-04-01T07:55:00Z" }, // 16:55 JST
      { id: "usd_adp", name: "米・ADP雇用統計", importance: "high", currency: "USD", timestamp: "2026-04-01T12:15:00Z" }, // 21:15 JST
      { id: "usd_ism_m", name: "米・ISM製造業景況指数", importance: "high", currency: "USD", timestamp: "2026-04-01T14:00:00Z" }, // 23:00 JST
      { id: "usd_jobless", name: "米・新規失業保険申請件数", importance: "medium", currency: "USD", timestamp: "2026-04-02T12:30:00Z" }, // 21:30 JST
      { id: "usd_nfp", name: "米・雇用統計 (非農業部門雇用者数)", importance: "high", currency: "USD", timestamp: "2026-04-03T12:30:00Z" }, // 21:30 JST
      { id: "usd_unemp", name: "米・失業率", importance: "high", currency: "USD", timestamp: "2026-04-03T12:30:00Z" }, // 21:30 JST
    ];

    // フィルタリング: 発表時刻を過ぎたものは除外 (カレンダー表示用)
    // ユーザー要望「過去のものが表示されないように」に従い厳密に現在以降のみ返す
    return masterSchedule.filter(e => new Date(e.timestamp).getTime() > now.getTime());
  },

  /**
   * 現在の時刻が指標による「制限・警戒」期間内かどうかを判定
   */
  async getEventStatus(pairCode: string = "USD/JPY"): Promise<{ 
    status: "normal" | "caution" | "prohibited";
    message: string;
    nextEvent?: FXEconomicEvent;
    minutesToEvent?: number;
  }> {
    const events = await this.getUpcomingEvents(pairCode);
    const now = new Date().getTime();
    
    // 通貨ペアに関連するイベントのみを抽出 (e.g. USD/JPY なら USD, JPY)
    const currencies = pairCode.split("/");
    const relevantEvents = events.filter(e => 
      currencies.includes(e.currency) || e.currency === "USD" // USDは常に共通
    );

    // 直近のイベント（未来のもの）から順にチェック
    const futureEvents = relevantEvents
      .filter(e => new Date(e.timestamp).getTime() > now - 1000 * 60 * 30) 
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (futureEvents.length === 0) {
      return { status: "normal", message: "対象通貨に関連する制限はありません" };
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

    // CAUTION
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
