// アラート通知機能の型定義

export type AlertPriority = "high" | "medium" | "low";
export type AlertCondition =
  | "price_above"       // 価格が閾値を上回った
  | "price_below"       // 価格が閾値を下回った
  | "profit_above"      // 損益率が閾値を上回った（利益）
  | "loss_below"        // 損益率が閾値を下回った（損失）
  | "high_impact_news"; // 重要度:高のニュース発生

export interface AlertRule {
  id: string;
  label: string;
  assetId?: string;      // 対象資産ID（price系のみ）
  condition: AlertCondition;
  threshold: number;     // 価格 or 損益率(%)
  priority: AlertPriority;
  enabled: boolean;
  firedAt?: string;      // 最後にトリガーされた日時（クールダウン用）
}

export interface AlertNotification {
  id: string;
  ruleId: string;
  message: string;
  priority: AlertPriority;
  triggeredAt: string;
  dismissed: boolean;
}
