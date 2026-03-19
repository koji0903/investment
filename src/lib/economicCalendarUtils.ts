// 経済指標イベントの型定義と静的データ
// current: 2026-03-20

export type ImpactLevel = "high" | "medium" | "low";
export type EventCategory = "雇用" | "物価" | "金融政策" | "景気" | "貿易" | "住宅";

export interface EconomicEvent {
  id: string;
  name: string;
  nameEn: string;
  date: string; // ISO date "YYYY-MM-DD"
  time: string; // "HH:MM JST" or "未定"
  country: string; // "🇺🇸" | "🇯🇵" | "🇪🇺"
  category: EventCategory;
  impact: ImpactLevel;
  forecast: string | null;
  previous: string | null;
  actual: string | null;
  description: string;
}

// FOMCの固定日程 (2026年)
export const FOMC_DATES_2026 = [
  "2026-01-28", "2026-03-18", "2026-05-06", "2026-06-17",
  "2026-07-29", "2026-09-16", "2026-11-04", "2026-12-16",
];

// 日銀金融政策決定会合の固定日程 (2026年)
export const BOJ_DATES_2026 = [
  "2026-01-24", "2026-03-19", "2026-04-30", "2026-06-17",
  "2026-07-31", "2026-09-18", "2026-10-30", "2026-12-19",
];

// 発表済みの実績データ（月ごとに追記していく）
const ACTUAL_DATA: Record<string, { actual: string; forecast: string; previous: string }> = {
  // 2026年2月の結果
  "nfp-2026-03-06": { actual: "151K", forecast: "160K", previous: "307K" },
  "cpi-2026-03-12": { actual: "+2.8%", forecast: "+2.9%", previous: "+3.0%" },
  "fomc-2026-01-28": { actual: "4.25-4.50%", forecast: "4.25-4.50%", previous: "4.25-4.50%" },
  "boj-2026-01-24": { actual: "0.5%", forecast: "0.5%", previous: "0.25%" },
  "boj-2026-03-19": { actual: "0.5%", forecast: "0.5%", previous: "0.5%" },
};

// 今週の範囲（月〜金）を算出
export function getThisWeekRange(now: Date): { start: Date; end: Date } {
  const d = new Date(now);
  const day = d.getDay(); // 0=日, 1=月, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);
  return { start: monday, end: friday };
}

// Nthを使って月の第N曜日を算出 (weekday: 0=日, 1=月 ... 5=金, 6=土)
function getNthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): Date {
  const d = new Date(year, month, 1);
  let count = 0;
  while (true) {
    if (d.getDay() === weekday) {
      count++;
      if (count === nth) return new Date(d);
    }
    d.setDate(d.getDate() + 1);
    if (d.getMonth() !== month) break;
  }
  return new Date(year, month, 1); // フォールバック
}

function fmt(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// 今週のイベントを動的生成
export function getThisWeekEvents(now: Date): EconomicEvent[] {
  const { start, end } = getThisWeekRange(now);
  const events: EconomicEvent[] = [];
  const y = start.getFullYear();
  const m = start.getMonth(); // 0-indexed

  // --- 米・雇用統計（毎月第1金曜日） ---
  const nfpDate = getNthWeekdayOfMonth(y, m, 5, 1);
  const nfpId = `nfp-${fmt(nfpDate)}`;
  if (nfpDate >= start && nfpDate <= end) {
    const d = ACTUAL_DATA[nfpId];
    events.push({
      id: nfpId, name: "米・非農業部門雇用者数", nameEn: "Non-Farm Payrolls",
      date: fmt(nfpDate), time: "22:30 JST", country: "🇺🇸",
      category: "雇用", impact: "high",
      forecast: d?.forecast ?? "+160K", previous: d?.previous ?? "前月比",
      actual: d?.actual ?? null,
      description: "米国の雇用市場の健全性を示す最重要指標。予想から大きく外れると為替・株式が大きく動く。",
    });
  }

  // --- 米・CPI（毎月第2火曜） ---
  const cpiDate = getNthWeekdayOfMonth(y, m, 2, 2);
  const cpiId = `cpi-${fmt(cpiDate)}`;
  if (cpiDate >= start && cpiDate <= end) {
    const d = ACTUAL_DATA[cpiId];
    events.push({
      id: cpiId, name: "米・消費者物価指数（CPI）", nameEn: "CPI",
      date: fmt(cpiDate), time: "22:30 JST", country: "🇺🇸",
      category: "物価", impact: "high",
      forecast: d?.forecast ?? "+2.9%", previous: d?.previous ?? "前年同月比",
      actual: d?.actual ?? null,
      description: "インフレ率の主要指標。FRBの利上げ/利下げ判断に直結するため、相場への影響が極めて大きい。",
    });
  }

  // --- FOMC（固定日程） ---
  for (const dateStr of FOMC_DATES_2026) {
    const fomcDate = new Date(dateStr + "T00:00:00");
    if (fomcDate >= start && fomcDate <= end) {
      const d = ACTUAL_DATA[`fomc-${dateStr}`];
      events.push({
        id: `fomc-${dateStr}`, name: "米・FOMC政策金利", nameEn: "FOMC Rate Decision",
        date: dateStr, time: "04:00 JST", country: "🇺🇸",
        category: "金融政策", impact: "high",
        forecast: d?.forecast ?? "4.25-4.50%", previous: d?.previous ?? "4.25-4.50%",
        actual: d?.actual ?? null,
        description: "米連邦公開市場委員会による政策金利の決定。全世界の金融市場を揺るがす最重要イベント。",
      });
    }
  }

  // --- 日銀・金融政策決定会合（固定日程） ---
  for (const dateStr of BOJ_DATES_2026) {
    const bojDate = new Date(dateStr + "T00:00:00");
    if (bojDate >= start && bojDate <= end) {
      const d = ACTUAL_DATA[`boj-${dateStr}`];
      events.push({
        id: `boj-${dateStr}`, name: "日銀・金融政策決定会合", nameEn: "BOJ Rate Decision",
        date: dateStr, time: "12:00 JST", country: "🇯🇵",
        category: "金融政策", impact: "high",
        forecast: d?.forecast ?? "0.5%", previous: d?.previous ?? "0.5%",
        actual: d?.actual ?? null,
        description: "日本銀行による政策金利の決定。円の価値と日本株全体に大きな影響を与える。",
      });
    }
  }

  // --- 米・GDP（第一次速報: 各四半期末翌月第4木曜あたり） ---
  // 簡易: Q1=4月、Q2=7月、Q3=10月、Q4=1月 の最終木曜日週
  const gdpMonths = [0, 3, 6, 9]; // 1月,4月,7月,10月
  for (const gm of gdpMonths) {
    if (gm === m) {
      const lastDay = new Date(y, gm + 1, 0);
      // 当月末から2週前の木曜を探す簡易ロジック
      const godDate = new Date(y, gm, 25);
      godDate.setDate(25 + ((4 - godDate.getDay() + 7) % 7));
      if (godDate >= start && godDate <= end) {
        events.push({
          id: `gdp-${y}-${gm}`, name: "米・GDP（速報値）", nameEn: "GDP (Advance)",
          date: fmt(godDate), time: "22:30 JST", country: "🇺🇸",
          category: "景気", impact: "medium",
          forecast: "+2.3%", previous: "+3.1%", actual: null,
          description: "米国経済の成長率を示す四半期データ。トレンド転換の重要シグナルになることがある。",
        });
      }
      break; // 1つのみ
    }
  }

  // --- 米・PPI（CPIの翌日=第2水曜あたり） ---
  const ppiDate = getNthWeekdayOfMonth(y, m, 3, 2); // 第2水曜
  if (ppiDate >= start && ppiDate <= end) {
    events.push({
      id: `ppi-${fmt(ppiDate)}`, name: "米・生産者物価指数（PPI）", nameEn: "PPI",
      date: fmt(ppiDate), time: "22:30 JST", country: "🇺🇸",
      category: "物価", impact: "medium",
      forecast: "+3.2%", previous: "+3.5%", actual: null,
      description: "企業が受け取る製品・サービスの価格変動を測ったインフレ先行指標。",
    });
  }

  // 日付昇順にソート
  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}

export const WEEKDAY_JP = ["日", "月", "火", "水", "木", "金", "土"];
