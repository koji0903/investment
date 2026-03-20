"use client";

import { useState, useEffect, useMemo } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import type { NewsItem } from "@/app/api/news/route";
import { Newspaper, Search, AlertTriangle, AlertCircle, MinusCircle, ExternalLink, RefreshCw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_TABS = ["すべて", "株式", "為替", "仮想通貨", "関連"] as const;
type TabType = typeof CATEGORY_TABS[number];

const ImportanceBadge = ({ importance }: { importance: NewsItem["importance"] }) => {
  if (importance === "high") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
      <AlertTriangle className="w-2.5 h-2.5" /> 重要度:高
    </span>
  );
  if (importance === "medium") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
      <AlertCircle className="w-2.5 h-2.5" /> 重要度:中
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400">
      <MinusCircle className="w-2.5 h-2.5" /> 重要度:低
    </span>
  );
};

const CategoryBadge = ({ category }: { category: NewsItem["category"] }) => {
  const colors: Record<string, string> = {
    "株式": "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    "為替": "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    "仮想通貨": "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", colors[category] ?? "bg-slate-100 text-slate-500")}>
      {category}
    </span>
  );
};

const formatRelativeTime = (dateStr: string) => {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}分前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}時間前`;
    return `${Math.floor(hours / 24)}日前`;
  } catch {
    return "";
  }
};

export const NewsPanel = () => {
  const { calculatedAssets } = usePortfolio();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("すべて");
  const [search, setSearch] = useState("");

  // 保有資産の銘柄名をキーワードとして使用
  const relatedKeywords = useMemo(() => 
    calculatedAssets.map(a => a.name).filter(Boolean), 
    [calculatedAssets]
  );

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/news");
      const data = await res.json();
      setNews(data.news ?? []);
      setFetchedAt(data.fetchedAt);
    } catch {
      // フェッチ失敗時はダミーデータを利用
      setNews(getDummyNews());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 5 * 60 * 1000); // 5分ごと自動更新
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    let items = news;
    if (activeTab === "関連") {
      items = items.filter(n =>
        relatedKeywords.some(kw => kw && (n.title.includes(kw) || n.description.includes(kw)))
      );
    } else if (activeTab !== "すべて") {
      items = items.filter(n => n.category === activeTab);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(n => n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q));
    }
    return items;
  }, [news, activeTab, search, relatedKeywords]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[var(--radius-card)] shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Newspaper className="w-5 h-5 text-slate-600 dark:text-slate-300 shrink-0" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">マーケットニュース</h3>
          {fetchedAt && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400 ml-2 shrink-0">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(fetchedAt)} 更新
            </span>
          )}
        </div>
        {/* 検索バー */}
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="銘柄・キーワード検索..."
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 border border-transparent focus:border-indigo-300 dark:focus:border-indigo-600 focus:outline-none transition"
          />
        </div>
        <button
          onClick={fetchNews}
          disabled={isLoading}
          className="shrink-0 p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-40"
          title="ニュースを更新"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </button>
      </div>

      {/* タブ */}
      <div className="flex gap-1 px-6 pt-3 pb-0">
        {CATEGORY_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-t-lg border-b-2 transition-colors",
              activeTab === tab
                ? "text-indigo-600 dark:text-indigo-400 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10"
                : "text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            {tab}{tab === "関連" && <span className="ml-1 text-[9px] opacity-70">★</span>}
          </button>
        ))}
      </div>

      {/* ニュース一覧 */}
      <div className="p-4 max-h-[520px] overflow-y-auto space-y-3 custom-scrollbar">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-100 dark:bg-slate-800/50 rounded-xl h-24" />
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Newspaper className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">該当するニュースが見つかりませんでした</p>
          </div>
        ) : (
          filtered.map(item => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-2 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/30 hover:border-indigo-200 dark:hover:border-indigo-700/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all duration-200"
            >
              <div className="flex flex-wrap items-center gap-2">
                <CategoryBadge category={item.category} />
                <ImportanceBadge importance={item.importance} />
                <span className="text-[10px] text-slate-400 ml-auto flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {formatRelativeTime(item.publishedAt)}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors line-clamp-2">
                {item.title}
                <ExternalLink className="inline w-3 h-3 ml-1 opacity-0 group-hover:opacity-60 transition-opacity" />
              </p>
              {item.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              )}
              <p className="text-[10px] text-slate-400 font-medium">{item.source}</p>
            </a>
          ))
        )}
      </div>
    </div>
  );
};

// RSSが取得できない場合のダミーデータ
function getDummyNews(): NewsItem[] {
  return [
    { id: "1", title: "日経平均が小反発、米株高を受けて買い先行", url: "#", publishedAt: new Date().toISOString(), source: "Yahoo Finance", category: "株式", importance: "medium", sentiment: "positive", description: "東京株式市場で日経平均株価は小幅に反発。前日の米国株式市場での上昇を受けて買い注文が先行した。" },
    { id: "2", title: "ドル円、145円台で推移 FRBの発言に注目", url: "#", publishedAt: new Date(Date.now() - 3600000).toISOString(), source: "Yahoo Finance", category: "為替", importance: "medium", sentiment: "neutral", description: "外国為替市場でドル円は145円台で取引されている。市場では米連邦準備制度理事会の動向に注目が集まっている。" },
    { id: "3", title: "ビットコイン、70,000ドル台を回復 機関投資家の流入が続く", url: "#", publishedAt: new Date(Date.now() - 7200000).toISOString(), source: "CoinDesk", category: "仮想通貨", importance: "high", sentiment: "positive", description: "ビットコインが70,000ドル台を回復した。機関投資家からの資金流入が継続しており、市場の強気ムードが続いている。" },
    { id: "4", title: "米国株先物、小幅安で推移", url: "#", publishedAt: new Date(Date.now() - 10800000).toISOString(), source: "Yahoo Finance", category: "株式", importance: "low", sentiment: "negative", description: "米国株先物市場では主要指数の先物がいずれも小幅安で推移している。" },
    { id: "5", title: "ユーロドル、ECBの政策発表を控えて様子見", url: "#", publishedAt: new Date(Date.now() - 14400000).toISOString(), source: "Yahoo Finance", category: "為替", importance: "low", sentiment: "neutral", description: "欧州中央銀行の政策発表を控え、ユーロドルは様子見の展開となっている。" },
  ];
}
