import { AssetCalculated } from "@/types";
import { AlertRule, AlertNotification, AlertPriority } from "@/types/alert";

// 1時間クールダウン（同じルールの連続発火防止）
const COOLDOWN_MS = 60 * 60 * 1000;

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function makeNotification(
  rule: AlertRule,
  message: string
): AlertNotification {
  return {
    id: makeId(),
    ruleId: rule.id,
    message,
    priority: rule.priority,
    triggeredAt: new Date().toISOString(),
    dismissed: false,
  };
}

function isCooledDown(rule: AlertRule): boolean {
  if (!rule.firedAt) return true;
  return Date.now() - new Date(rule.firedAt).getTime() > COOLDOWN_MS;
}

export function evaluateAlerts(
  rules: AlertRule[],
  assets: AssetCalculated[],
  hasHighImpactNews: boolean
): { notifications: AlertNotification[]; updatedRules: AlertRule[] } {
  const notifications: AlertNotification[] = [];
  const updatedRules: AlertRule[] = rules.map((rule) => ({ ...rule }));

  for (let i = 0; i < updatedRules.length; i++) {
    const rule = updatedRules[i];
    if (!rule.enabled || !isCooledDown(rule)) continue;

    let triggered = false;
    let message = "";

    if (rule.condition === "price_above" || rule.condition === "price_below") {
      // 対象資産を特定（assetIdが未設定なら全資産を対象）
      const targets = rule.assetId
        ? assets.filter((a) => a.id === rule.assetId)
        : assets;

      for (const asset of targets) {
        if (rule.condition === "price_above" && asset.currentPrice >= rule.threshold) {
          triggered = true;
          message = `📈 ${asset.name} の価格が ¥${asset.currentPrice.toLocaleString()} に達しました（設定値: ¥${rule.threshold.toLocaleString()}）`;
          break;
        }
        if (rule.condition === "price_below" && asset.currentPrice <= rule.threshold) {
          triggered = true;
          message = `📉 ${asset.name} の価格が ¥${asset.currentPrice.toLocaleString()} に下落しました（設定値: ¥${rule.threshold.toLocaleString()}）`;
          break;
        }
      }
    } else if (rule.condition === "profit_above" || rule.condition === "loss_below") {
      // 対象資産の損益率を評価
      const targets = rule.assetId
        ? assets.filter((a) => a.id === rule.assetId)
        : assets;

      for (const asset of targets) {
        if (rule.condition === "profit_above" && asset.profitPercentage >= rule.threshold) {
          triggered = true;
          message = `💰 ${asset.name} の損益率が +${asset.profitPercentage.toFixed(1)}% に到達しました（設定値: +${rule.threshold}%）`;
          break;
        }
        if (rule.condition === "loss_below" && asset.profitPercentage <= -rule.threshold) {
          triggered = true;
          message = `⚠️ ${asset.name} の損益率が ${asset.profitPercentage.toFixed(1)}% まで悪化しました（設定値: -${rule.threshold}%）`;
          break;
        }
      }
    } else if (rule.condition === "high_impact_news" && hasHighImpactNews) {
      triggered = true;
      message = `🚨 重要度の高いマーケットニュースが発生しています。投資ポジションをご確認ください。`;
    }

    if (triggered) {
      notifications.push(makeNotification(rule, message));
      updatedRules[i] = { ...rule, firedAt: new Date().toISOString() };
    }
  }

  return { notifications, updatedRules };
}
