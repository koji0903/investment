import { getThisWeekEvents, EconomicEvent } from "./economicCalendarUtils";

/**
 * 経済カレンダーの取得 (エイリアス)
 */
export type EconomicIndicator = EconomicEvent;
export const getEconomicCalendar = (): EconomicIndicator[] => {
  return getThisWeekEvents(new Date());
};

/**
 * 通貨強弱（相対騰落率）の算出
 */
export const calculateCurrencyStrengthFromAnalysis = (fxAnalysis: any[]): any[] => {
  const currencies = ["JPY", "USD", "EUR", "GBP", "AUD"];
  const strengths = currencies.map(ccy => {
    let score = 0;
    let count = 0;
    
    fxAnalysis.forEach(item => {
      const pair = item.pair.replace("=X", "");
      if (pair.startsWith(ccy)) {
        score += item.change || 0;
        count++;
      } else if (pair.endsWith(ccy)) {
        score -= item.change || 0;
        count++;
      }
    });
    
    return {
      currency: ccy,
      strength: count > 0 ? parseFloat((score / count).toFixed(2)) : 0
    };
  });
  
  return strengths.sort((a, b) => b.strength - a.strength);
};

/**
 * FXマーケットアドバイスの生成
 */
export const generateFXAdviceFromData = (econ: EconomicIndicator[], fxAnalysis: any[]): string => {
  const highImpact = econ.filter(i => i.impact === "high");
  const topAdvantage = fxAnalysis.sort((a, b) => (b.technical?.score || 0) - (a.technical?.score || 0))[0];
  
  if (highImpact.length > 0) {
    return `今週は「${highImpact[0].name}」などの重要指標が控えており、ボラティリティの高まりが予想されます。特にテクニカルで${topAdvantage?.technical?.signal === 'strong_buy' ? '強い買い' : '注目'}シグナルが出ている ${topAdvantage?.pair.replace("=X", "")} は、指標後の動きを注視すべきでしょう。`;
  }
  
  return `現在は重要指標が少なく、テクニカル主導の展開です。${topAdvantage?.pair.replace("=X", "")} において${topAdvantage?.technical?.reason || '安定した推移'}が見られます。レンジ内での逆張り、またはトレンドフォローが有効な局面です。`;
};

/**
 * 通貨コードから対円レートを取得・合成する
 */
export const getJpyRate = (ccy: string, prices: Record<string, number>): number => {
  if (ccy === "JPY") return 1;
  const usdJpyRate = prices["JPY=X"] || prices["USDJPY=X"] || 151.2;
  
  // 1. 直接の対円レート (例: USDJPY, EURJPY)
  if (prices[`${ccy}JPY=X`]) return prices[`${ccy}JPY=X`];
  if (prices[`${ccy}JPY`]) return prices[`${ccy}JPY`];
  if (ccy === "USD") return usdJpyRate;
  
  // 2. 対ドルレートからの合成 (例: EURUSD * USDJPY)
  if (prices[`${ccy}USD=X`]) return prices[`${ccy}USD=X`] * usdJpyRate;
  if (prices[`${ccy}USD`]) return prices[`${ccy}USD`] * usdJpyRate;
  
  // 3. ドル対通貨からの合成 (例: USDJPY / USDCHF)
  if (prices[`USD${ccy}=X`]) return usdJpyRate / prices[`USD${ccy}=X`];
  if (prices[`USD${ccy}`]) return usdJpyRate / prices[`USD${ccy}`];

  // 4. 一般的なメジャー通貨のフォールバック
  const fallbackRates: Record<string, number> = {
    "EUR": 164.5,
    "GBP": 191.2,
    "AUD": 99.5,
    "CHF": 170.8,
    "CAD": 111.5
  };
  
  return fallbackRates[ccy] || usdJpyRate;
};

/**
 * FXペア名またはシンボルからベース通貨を取得する
 */
export const getBaseCurrency = (name: string, symbol: string): string => {
  if (name && name.includes("/")) return name.split("/")[0].trim();
  if (symbol && symbol.length >= 6) return symbol.substring(0, 3);
  return "USD";
};
