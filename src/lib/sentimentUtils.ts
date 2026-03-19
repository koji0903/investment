/**
 * 市場センチメント分析ユーティリティ
 * ニュースのタイトルや内容からポジティブ/ネガティブなキーワードを抽出し、スコア化します。
 */

export type SentimentType = "bullish" | "neutral" | "bearish";

export interface SentimentResult {
  score: number; // 0 - 100
  type: SentimentType;
  label: string;
}

// ポジティブなキーワード
const POSITIVE_KEYWORDS = [
  "上昇", "最高値", "反発", "緩和", "好感", "期待", "改善", "プラス", "強気", "買い",
  "成長", "利益", "上方修正", "拡大", "好景気", "bullish", "jump", "surge", "gain", "up",
  "rally", "growth", "positive", "buy", "outperform"
];

// ネガティブなキーワード
const NEGATIVE_KEYWORDS = [
  "下落", "暴落", "最安値", "懸念", "悪化", "マイナス", "弱気", "売り", "後退", "減少",
  "下方修正", "縮小", "不況", "ショック", "bearish", "crash", "plunge", "loss", "down",
  "drop", "recession", "negative", "sell", "underperform", "risk"
];

/**
 * テキストからセンチメントを解析する
 */
export function analyzeSentiment(title: string, description: string): "positive" | "negative" | "neutral" {
  const text = (title + " " + description).toLowerCase();
  
  let posCount = 0;
  let negCount = 0;

  POSITIVE_KEYWORDS.forEach(kw => {
    if (text.includes(kw.toLowerCase())) posCount++;
  });

  NEGATIVE_KEYWORDS.forEach(kw => {
    if (text.includes(kw.toLowerCase())) negCount++;
  });

  if (posCount > negCount) return "positive";
  if (negCount > posCount) return "negative";
  return "neutral";
}

/**
 * ニュースリストから全体のセンチメントスコアを算出する
 */
export function calculateOverallSentiment(newsItems: any[]): SentimentResult {
  if (!newsItems || newsItems.length === 0) {
    return { score: 50, type: "neutral", label: "中立" };
  }

  let totalScore = 0;
  newsItems.forEach(item => {
    if (item.sentiment === "positive") totalScore += 100;
    else if (item.sentiment === "negative") totalScore += 0;
    else totalScore += 50;
  });

  const averageScore = Math.round(totalScore / newsItems.length);

  let type: SentimentType = "neutral";
  let label = "中立";

  if (averageScore >= 70) {
    type = "bullish";
    label = "強気";
  } else if (averageScore < 40) {
    type = "bearish";
    label = "弱気";
  }

  return { score: averageScore, type, label };
}

/**
 * 特定のキーワード（資産名など）に関連するニュースからセンチメントを抽出
 */
export function getAssetSentiment(assetName: string, newsItems: any[]): SentimentResult {
  const relatedNews = newsItems.filter(n => 
    n.title.includes(assetName) || (n.description && n.description.includes(assetName))
  );

  return calculateOverallSentiment(relatedNews);
}
