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
    const baseTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    
    // カレンダー表示用に数日分のダミー指標を生成
    const baseEvents: Omit<FXEconomicEvent, "timestamp">[] = [
      { id: "usd_cpi", name: "米・消費者物価指数", importance: "high", currency: "USD" },
      { id: "jpy_boj", name: "日銀・政策金利", importance: "high", currency: "JPY" },
      { id: "eur_ecb", name: "欧州中央銀行(ECB)政策金利", importance: "high", currency: "EUR" },
      { id: "usd_pce", name: "米・PCEデフレーター", importance: "high", currency: "USD" },
      { id: "usd_job", name: "米・雇用統計", importance: "high", currency: "USD" },
      { id: "jpy_tankan", name: "日銀短観", importance: "medium", currency: "JPY" },
      { id: "eur_ger_pmi", name: "独・製造業PMI", importance: "medium", currency: "EUR" },
    ];

    const results: FXEconomicEvent[] = [];
    
    // 今日
    results.push({ ...baseEvents[0], timestamp: new Date(now.getTime() + 1000 * 60 * 45).toISOString() });
    results.push({ ...baseEvents[1], timestamp: new Date(now.getTime() + 1000 * 60 * 60 * 3).toISOString() });
    results.push({ ...baseEvents[2], timestamp: new Date(now.getTime() + 1000 * 60 * 60 * 5).toISOString() });

    // 明日
    const tomorrow = new Date(baseTime.getTime() + 1000 * 60 * 60 * 24);
    results.push({ ...baseEvents[3], timestamp: new Date(tomorrow.setHours(21, 30)).toISOString() });

    // 明後日
    const dayAfter = new Date(baseTime.getTime() + 1000 * 60 * 60 * 48);
    results.push({ ...baseEvents[4], timestamp: new Date(dayAfter.setHours(21, 30)).toISOString() });
    results.push({ ...baseEvents[5], timestamp: new Date(dayAfter.setHours(8, 50)).toISOString() });
    results.push({ ...baseEvents[6], timestamp: new Date(dayAfter.setHours(16, 30)).toISOString() });

    return results;
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
