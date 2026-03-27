import { 
  PLData, 
  BSData, 
  CFData, 
  FinancialAnalysisResult, 
  FinancialStatementPayload 
} from "@/types/financial";

/**
 * 財務諸表分析ユーティリティ
 */

// 1. PL分析
function analyzePL(pl: PLData[]): { score: number; label: "strong" | "normal" | "weak"; reasons: string[] } {
  if (pl.length === 0) return { score: 0, label: "weak", reasons: ["損益データがありません"] };
  
  const current = pl[0];
  const prev = pl.length > 1 ? pl[1] : null;
  const reasons: string[] = [];
  let score = 50;

  // 売上・利益成長率
  if (prev) {
    const revGrowth = ((current.revenue / prev.revenue) - 1) * 100;
    const opGrowth = ((current.operatingProfit / prev.operatingProfit) - 1) * 100;
    
    if (revGrowth > 10) { score += 10; reasons.push("売上高が10%以上成長しています"); }
    else if (revGrowth < 0) { score -= 10; reasons.push("売上高が減少しています"); }
    
    if (opGrowth > 20) { score += 15; reasons.push("営業利益が20%以上大幅に成長しています"); }
    else if (opGrowth < 0) { score -= 15; reasons.push("本業の儲け（営業利益）が減益です"); }
  }

  // 営業利益率
  if (current.operatingMargin > 15) { score += 15; reasons.push("営業利益率が15%超と高水準です"); }
  else if (current.operatingMargin < 5) { score -= 10; reasons.push("営業利益率が5%未満と低水準です"); }

  // ラベル判定
  let label: "strong" | "normal" | "weak" = "normal";
  if (score >= 70) label = "strong";
  else if (score < 40) label = "weak";

  return { score: Math.max(0, Math.min(100, score)), label, reasons };
}

// 2. BS分析
function analyzeBS(bs: BSData[]): { score: number; label: "safe" | "caution" | "risky"; reasons: string[] } {
  if (bs.length === 0) return { score: 0, label: "risky", reasons: ["貸借対照表データがありません"] };
  
  const current = bs[0];
  const reasons: string[] = [];
  let score = 60;

  // 自己資本比率
  if (current.equityRatio > 50) { score += 15; reasons.push("自己資本比率が50%超と財務基盤が強固です"); }
  else if (current.equityRatio < 20) { score -= 20; reasons.push("自己資本比率が20%未満と財務リスクがあります"); }

  // ネットキャッシュ判定 (現預金 - 有利子負債)
  const netCash = current.cashAndDeposits - current.interestBearingDebt;
  if (netCash > 0) { score += 15; reasons.push("実質無借金（ネットキャッシュ）経営です"); }
  else if (Math.abs(netCash) > current.netAssets * 0.5) { score -= 15; reasons.push("有利子負債が純資産に比して重いです"); }

  // 流動比率
  const currentRatio = (current.currentAssets / current.currentLiabilities) * 100;
  if (currentRatio > 200) { score += 10; reasons.push("流動比率が200%超と短期的な支払能力が高いです"); }
  else if (currentRatio < 100) { score -= 15; reasons.push("短期的な支払い能力（流動比率）に懸念があります"); }

  // ラベル判定
  let label: "safe" | "caution" | "risky" = "safe";
  if (score >= 75) label = "safe";
  else if (score < 45) label = "risky";
  else label = "caution";

  return { score: Math.max(0, Math.min(100, score)), label, reasons };
}

// 3. CF分析
function analyzeCF(cf: CFData[]): { score: number; label: "healthy" | "caution" | "unhealthy"; reasons: string[] } {
  if (cf.length === 0) return { score: 0, label: "unhealthy", reasons: ["キャッシュフローデータがありません"] };
  
  const current = cf[0];
  const reasons: string[] = [];
  let score = 55;

  // 営業CFの符号
  if (current.operatingCF > 0) { score += 20; reasons.push("営業活動で現金をしっかり創出できています"); }
  else { score -= 30; reasons.push("営業活動によるキャッシュフローが赤字です"); }

  // フリーキャッシュフロー
  if (current.freeCF > 0) { score += 15; reasons.push("設備投資後も現金が残る（FCFプラス）健全な構造です"); }
  else if (current.operatingCF > 0 && current.freeCF < 0) { reasons.push("成長のための積極的な設備投資を行っています"); }

  // ラベル判定
  let label: "healthy" | "caution" | "unhealthy" = "healthy";
  if (score >= 70) label = "healthy";
  else if (score < 40) label = "unhealthy";
  else label = "caution";

  return { score: Math.max(0, Math.min(100, score)), label, reasons };
}

// 4. 三表整合性 & 危険シグナル
function detectRisksAndConsistency(pl: PLData[], bs: BSData[], cf: CFData[]) {
  const currentPL = pl[0];
  const currentBS = bs[0];
  const currentCF = cf[0];
  const prevPL = pl.length > 1 ? pl[1] : null;

  const riskFlags: string[] = [];
  const consistencyFlags: string[] = [];
  let consistencyScore = 100;

  // 1. 売上増だが営業利益減
  if (prevPL && currentPL.revenue > prevPL.revenue && currentPL.operatingProfit < prevPL.operatingProfit) {
    consistencyFlags.push("revenue_up_profit_down");
    consistencyScore -= 20;
  }

  // 2. 純利益増だが営業CF減（粉飾や在庫過多の疑い）
  if (prevPL && currentPL.netIncome > prevPL.netIncome && currentCF.operatingCF < (prevPL.netIncome * 0.5)) {
    riskFlags.push("net_income_up_operating_cf_down");
    consistencyScore -= 30;
  }

  // 3. 営業CFが継続的にマイナス（要データ履歴）
  if (cf.length >= 2 && cf[0].operatingCF < 0 && cf[1].operatingCF < 0) {
    riskFlags.push("repeated_negative_operating_cf");
    consistencyScore -= 40;
  }

  // 4. 自己資本比率が危険水準
  if (currentBS.equityRatio < 10) {
    riskFlags.push("low_equity_ratio");
    consistencyScore -= 20;
  }

  // 5. 高配当だがCFが伴っていない（推定）
  // ※配当金額は別ルートで取得する必要があるが、ここではROEや利益に対するCF比率で代替検討
  if (currentCF.operatingCF < currentPL.netIncome * 0.3) {
    riskFlags.push("high_dividend_weak_cf_flag");
  }

  let riskLevel: "low" | "medium" | "high" = "low";
  if (riskFlags.length >= 3 || consistencyScore < 40) riskLevel = "high";
  else if (riskFlags.length >= 1 || consistencyScore < 70) riskLevel = "medium";

  return { riskFlags, consistencyFlags, consistencyScore, riskLevel };
}

export function performFinancialAnalysis(
  ticker: string, 
  companyName: string, 
  payload: FinancialStatementPayload
): FinancialAnalysisResult {
  const plResult = analyzePL(payload.pl);
  const bsResult = analyzeBS(payload.bs);
  const cfResult = analyzeCF(payload.cf);
  const riskResult = detectRisksAndConsistency(payload.pl, payload.bs, payload.cf);

  // 総合財務スコア
  const baseScore = (plResult.score * 0.35) + (bsResult.score * 0.30) + (cfResult.score * 0.35);
  const finalScore = Math.round(baseScore * (riskResult.consistencyScore / 100));

  // グレード判定
  let grade: "A" | "B" | "C" | "D" = "C";
  if (finalScore >= 80 && riskResult.riskLevel === "low") grade = "A";
  else if (finalScore >= 60) grade = "B";
  else if (finalScore < 40 || riskResult.riskLevel === "high") grade = "D";

  // 要約コメント
  let comment = "";
  if (grade === "A") comment = "極めて健全な財務内容です。収益性・安全性・現金創出力のすべてが高水準にあります。";
  else if (grade === "B") comment = "概ね良好な財務内容です。一部に注意点はありますが、投資対象として検討可能な水準です。";
  else if (grade === "C") comment = "財務面でいくつかの課題が見受けられます。事業環境や負債状況を詳しく確認する必要があります。";
  else comment = "財務的な懸念が強い状態です。資金繰りや本業の収益性に大きな課題がある可能性があります。";

  return {
    ticker,
    companyName,
    plScore: plResult.score,
    plLabel: plResult.label,
    plReasons: plResult.reasons,
    bsScore: bsResult.score,
    bsLabel: bsResult.label,
    bsReasons: bsResult.reasons,
    cfScore: cfResult.score,
    cfLabel: cfResult.label,
    cfReasons: cfResult.reasons,
    consistencyScore: riskResult.consistencyScore,
    consistencyFlags: riskResult.consistencyFlags,
    consistencyComment: "三表の整合性チェックに基づく評価", // 追加
    riskFlags: riskResult.riskFlags,
    riskLevel: riskResult.riskLevel,
    financialStatementScore: finalScore,
    financialGrade: grade,
    financialComment: comment,
    updatedAt: new Date().toISOString()
  };
}
