import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  source: string;
  category: "株式" | "為替" | "仮想通貨";
  importance: "high" | "medium" | "low";
  description: string;
}

// 重要度判定キーワード
const HIGH_KEYWORDS = ["暴落", "急騰", "破綻", "ショック", "緊急", "FOMC", "規制", "倒産", "パニック", "crash", "surge", "ban", "bankrupt", "emergency", "crisis", "spike"];
const MEDIUM_KEYWORDS = ["上昇", "下落", "利上げ", "利下げ", "業績", "決算", "発表", "警告", "loss", "gain", "rise", "fall", "warning", "earnings", "report", "rate", "inflation"];

function getImportance(title: string, desc: string): "high" | "medium" | "low" {
  const text = (title + " " + desc).toLowerCase();
  if (HIGH_KEYWORDS.some(kw => text.includes(kw.toLowerCase()))) return "high";
  if (MEDIUM_KEYWORDS.some(kw => text.includes(kw.toLowerCase()))) return "medium";
  return "low";
}

// RSSフィードの設定
const RSS_FEEDS = [
  // 株式ニュース
  { url: "https://feeds.finance.yahoo.com/rss/2.0/headline?s=^N225,^GSPC,^DJI&region=JP&lang=ja-JP", category: "株式" as const, source: "Yahoo Finance" },
  // 為替ニュース
  { url: "https://feeds.finance.yahoo.com/rss/2.0/headline?s=USDJPY=X,EURUSD=X&region=JP&lang=ja-JP", category: "為替" as const, source: "Yahoo Finance" },
  // 仮想通貨ニュース  
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", category: "仮想通貨" as const, source: "CoinDesk" },
];

async function fetchRSS(feedUrl: string, category: NewsItem["category"], source: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(feedUrl, {
      next: { revalidate: 300 }, // 5分キャッシュ
      headers: { "User-Agent": "Mozilla/5.0 (compatible; InvestmentApp/1.0)" },
    });

    if (!res.ok) return [];

    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const result = parser.parse(xml);

    const items = result?.rss?.channel?.item ?? result?.feed?.entry ?? [];
    const itemArray = Array.isArray(items) ? items : [items];

    return itemArray.slice(0, 10).map((item: Record<string, unknown>, i: number) => {
      const title = String(item.title ?? "");
      const link = String(item.link ?? item.guid ?? "");
      const pubDate = String(item.pubDate ?? item.updated ?? item.published ?? new Date().toISOString());
      const description = String(item.description ?? item.summary ?? "").replace(/<[^>]*>/g, "").slice(0, 150);

      return {
        id: `${category}-${i}-${Date.now()}`,
        title: title.replace(/<!\[CDATA\[|\]\]>/g, "").trim(),
        url: link,
        publishedAt: pubDate,
        source,
        category,
        importance: getImportance(title, description),
        description: description.trim(),
      };
    });
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const allNewsArrays = await Promise.allSettled(
      RSS_FEEDS.map(feed => fetchRSS(feed.url, feed.category, feed.source))
    );

    const news: NewsItem[] = allNewsArrays
      .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === "fulfilled")
      .flatMap(r => r.value);

    // 重要度 > 日時の順でソート
    const importanceOrder = { high: 0, medium: 1, low: 2 };
    news.sort((a, b) => {
      const impDiff = importanceOrder[a.importance] - importanceOrder[b.importance];
      if (impDiff !== 0) return impDiff;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    return NextResponse.json({ news, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ error: String(e), news: [] }, { status: 500 });
  }
}
