import { NotificationSettings } from "@/types";

/**
 * 通知送信のリクエストをシミュレーションする
 * 実際には Cloud Functions などのバックエンドを経由して送信する
 */
export const sendNotification = async (
  uid: string,
  settings: NotificationSettings,
  type: "alerts" | "strategy" | "market",
  content: { title: string; body: string }
) => {
  // トリガーが有効でない場合は何もしない
  if (!settings.triggers[type]) return;

  const timestamp = new Date().toLocaleString("ja-JP");
  const prefix = `【Antigravity ${type === "alerts" ? "重要アラート" : type === "strategy" ? "戦略提案" : "市場変化"}】`;

  // LINE通知のシミュレーション
  if (settings.lineEnabled && settings.lineToken) {
    console.log(`[LINE NOTIFY] Sending to token ${settings.lineToken.substring(0, 5)}...`);
    console.log(`${prefix}\n${content.title}\n${content.body}\n時間: ${timestamp}`);
  }

  // メール通知のシミュレーション
  if (settings.emailEnabled && settings.emailAddress) {
    console.log(`[EMAIL] Sending to ${settings.emailAddress}...`);
    console.log(`Subject: ${prefix} ${content.title}`);
    console.log(`${content.body}\n\n送信時刻: ${timestamp}`);
  }

  // デモ用のトースト表示などのために true を返す
  return true;
};
