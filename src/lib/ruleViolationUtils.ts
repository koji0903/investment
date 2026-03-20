import { Transaction, RuleViolation } from "@/types";

/**
 * 投資ルール違反を検知する
 */
export const detectRuleViolations = (transactions: Transaction[]): RuleViolation[] => {
  const violations: RuleViolation[] = [];
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // 1. ナンピン検知 (同一銘柄で、前回より低い価格での連続買い)
  const buyTransactions = transactions.filter(t => t.type === "buy");
  const assetGroups: Record<string, Transaction[]> = {};
  
  buyTransactions.forEach(t => {
    if (!assetGroups[t.assetSymbol]) assetGroups[t.assetSymbol] = [];
    assetGroups[t.assetSymbol].push(t);
  });

  Object.entries(assetGroups).forEach(([symbol, ts]) => {
    const sortedTs = ts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    for (let i = 1; i < sortedTs.length; i++) {
      const prev = sortedTs[i-1];
      const curr = sortedTs[i];
      
      // 価格が下がっている状態での買い増し
      if (curr.price < prev.price) {
        violations.push({
          id: `nanpin-${symbol}-${curr.id}`,
          type: "nanpin",
          severity: "medium",
          message: `${symbol} のナンピン買いを検知`,
          details: `前回提示価格 (${prev.price}円) より低い価格 (${curr.price}円) で買い増しされています。根拠のないナンピンは損失拡大のリスクがあります。`,
          createdAt: curr.createdAt
        });
        break; // 1銘柄につき1つの警告に留める
      }
    }
  });

  // 2. 過剰トレード検知 (24時間以内の取引回数)
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const recentTransactions = transactions.filter(t => new Date(t.createdAt) > oneDayAgo);

  if (recentTransactions.length > 5) {
    violations.push({
      id: "overtrading-24h",
      type: "overtrading",
      severity: "high",
      message: "過剰トレードの可能性",
      details: `過去24時間以内に ${recentTransactions.length} 回の取引が行われています。ポジポジ病（常にポジションを持っていないと落ち着かない状態）に陥っている可能性があります。一旦画面を閉じ、冷静になりましょう。`,
      createdAt: now.toISOString()
    });
  }

  return violations;
};
