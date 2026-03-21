/**
 * FX 関連のユーティリティ関数
 */

export interface EconomicIndicator {
  id: string;
  name: string;
  country: string;
  importance: "high" | "medium" | "low";
  date: string;
  forecast: string;
  previous: string;
  actual?: string;
}

/**
 * 経済指標カレンダーデータを取得（現在は economicCalendarUtils から取得することを推奨）
 */
import { getThisWeekEvents } from "./economicCalendarUtils";

export const getEconomicCalendar = (): EconomicIndicator[] => {
  const events = getThisWeekEvents(new Date());
  return events.map(e => ({
    id: e.id,
    name: e.name,
    country: e.country === "🇺🇸" ? "USD" : e.country === "🇯🇵" ? "JPY" : "EUR",
    importance: e.impact,
    date: e.date,
    forecast: e.forecast || "-",
    previous: e.previous || "-",
    actual: e.actual || undefined
  }));
};

/**
 * 通貨強弱データを計算
 * fxAnalysis データを元に、各通貨（USD, JPY, EUR, GBP, AUD）の相対的な強さを算出
 */
export const calculateCurrencyStrengthFromAnalysis = (fxAnalysis: any[]) => {
  // 各通貨のスコア（デフォルト0）
  const scores: Record<string, number> = {
    USD: 0, JPY: 0, EUR: 0, GBP: 0, AUD: 0
  };

  fxAnalysis.forEach(item => {
    const change = item.change || 0;
    
    // 例: "JPY=X" (USD/JPY)
    if (item.pair === "JPY=X") {
      // 値上がり = USD強 / JPY弱
      scores.USD += change;
      scores.JPY -= change;
    } else if (item.pair === "EURJPY=X") {
      scores.EUR += change;
      scores.JPY -= change;
    } else if (item.pair === "GBPJPY=X") {
      scores.GBP += change;
      scores.JPY -= change;
    } else if (item.pair === "AUDJPY=X") {
      scores.AUD += change;
      scores.JPY -= change;
    } else if (item.pair === "EURUSD=X") {
      scores.EUR += change;
      scores.USD -= change;
    }
  });

  return Object.entries(scores).map(([currency, strength]) => ({
    currency,
    strength: Number(strength.toFixed(2))
  })).sort((a, b) => b.strength - a.strength);
};

/**
 * FX 独自の AI アドバイスを生成
 */
export const generateFXAdviceFromData = (indicators: EconomicIndicator[], fxAnalysis: any[]) => {
  if (!fxAnalysis || fxAnalysis.length === 0) return "データの取得を待機中です...";

  const usdjpy = fxAnalysis.find(a => a.pair === "JPY=X");
  const strengths = calculateCurrencyStrengthFromAnalysis(fxAnalysis);
  const strongest = strengths[0];
  const weakest = strengths[strengths.length - 1];
  
  let advice = `現在は ${strongest.currency} が最強、${weakest.currency} が最弱の傾向にあります。`;
  
  if (usdjpy && usdjpy.technical) {
    const { signal, reason } = usdjpy.technical;
    advice += ` ドル円については、${reason}`;
    
    if (signal === "strong_buy") advice += " テクニカル的に絶好の買い場（ゴールデンクロス・売られすぎ）である可能性があります。";
    else if (signal === "buy") advice += " 短期的な押し目買いを検討できる水準です。";
    else if (signal === "strong_sell") advice += " 強い売りシグナル（デッドクロス・買われすぎ）が出ており、急落に警戒が必要です。";
    else if (signal === "sell") advice += " 戻り売りを警戒すべき局面です。";

    // スワップ情報の考慮
    if (usdjpy.swap && usdjpy.swap.buy > 0 && signal.includes("buy")) {
      advice += ` 買いスワップがプラス（${usdjpy.swap.buy}）であることも長期保有の追い風となります。`;
    }
  }

  const highImpact = indicators.filter(i => i.importance === "high");
  if (highImpact.length > 0) {
    const nextEvent = highImpact[0];
    advice += ` 直近では ${nextEvent.name} (${nextEvent.country}) が予定されており、相場急変のリスクがあります。`;
  }

  return advice;
};
