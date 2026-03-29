import { FXRiskMetrics } from "@/types/fx";
import { USDJPYDecisionResult } from "./usdjpyDecision";

export interface TradePermissionResult {
  isAllowed: boolean;
  status: "normal" | "caution" | "stop";
  reason: string;
  cooldownRemaining?: number; // 秒
  dailyTradeRemaining: number;
}

/**
 * 運用ガバナンス・メンタル排除フィルター
 * システムの許可なしではトレードを物理的に不可とする
 */
export function checkTradePermission(
  metrics: FXRiskMetrics,
  decision: USDJPYDecisionResult | null,
  hasActivePosition: boolean
): TradePermissionResult {
  const MAX_DAILY_TRADES = 5;
  const MAX_DAILY_LOSS_PERCENT = -3.0;
  const COOLDOWN_MINUTES = 15;
  const HALT_DD_PERCENT = 15.0;

  let reason = "";
  let status: "normal" | "caution" | "stop" = "normal";
  let isAllowed = true;

  // 1. 同一方向・追加エントリーの禁止 (物理ブロック)
  if (hasActivePosition) {
    return {
      isAllowed: false,
      status: "stop",
      reason: "既存ポジションがあるため、追加エントリーは禁止されています（基本ルール遵守）",
      dailyTradeRemaining: MAX_DAILY_TRADES - metrics.dailyTradeCount
    };
  }

  // 2. ドローダウンによる強制停止 (15%超)
  if (metrics.drawdownPercent >= HALT_DD_PERCENT) {
    return {
      isAllowed: false,
      status: "stop",
      reason: `ドローダウンが${HALT_DD_PERCENT}%に達したため、資産保護のため強制停止中です`,
      dailyTradeRemaining: 0
    };
  }

  // 3. 日次制限 (回数・損失)
  if (metrics.dailyTradeCount >= MAX_DAILY_TRADES) {
    return {
      isAllowed: false,
      status: "stop",
      reason: "本日の最大トレード回数（5回）に達しました。明日の相場に備えましょう",
      dailyTradeRemaining: 0
    };
  }

  if (metrics.dailyPnlPercent <= MAX_DAILY_LOSS_PERCENT) {
    return {
      isAllowed: false,
      status: "stop",
      reason: `本日の損失許容額（${MAX_DAILY_LOSS_PERCENT}%）に達しました。強制休止モードです`,
      dailyTradeRemaining: 0
    };
  }

  // 4. クールダウン判定 (決済後 15分)
  const lastExitTime = new Date(metrics.lastExitTimestamp).getTime();
  const now = new Date().getTime();
  const diffMinutes = (now - lastExitTime) / (1000 * 60);

  if (diffMinutes < COOLDOWN_MINUTES) {
    const remaining = Math.ceil(COOLDOWN_MINUTES - diffMinutes);
    return {
      isAllowed: false,
      status: "caution",
      reason: `クールダウン中です。冷静さを取り戻すまであと ${remaining} 分待機してください`,
      cooldownRemaining: Math.max(0, Math.floor((COOLDOWN_MINUTES * 60) - ((now - lastExitTime) / 1000))),
      dailyTradeRemaining: MAX_DAILY_TRADES - metrics.dailyTradeCount
    };
  }

  // 5. 連敗による一時停止 (4連敗時)
  if (metrics.consecutiveLosses >= 4) {
    const lastTradeTime = new Date(metrics.lastTradeTimestamp).getTime();
    const haltDiffHours = (now - lastTradeTime) / (1000 * 60 * 60);
    if (haltDiffHours < 1) {
      return {
        isAllowed: false,
        status: "stop",
        reason: "4連敗を検知しました。相場観の修正のため1時間の強制休止中です",
        dailyTradeRemaining: MAX_DAILY_TRADES - metrics.dailyTradeCount
      };
    }
  }

  // 6. ロジック合致確認 (環境NGの場合)
  if (decision && !decision.isEntryAllowed) {
    return {
      isAllowed: false,
      status: "caution",
      reason: decision.reasons[0] || "分析エンジンのエントリー許可が下りていません",
      dailyTradeRemaining: MAX_DAILY_TRADES - metrics.dailyTradeCount
    };
  }

  // ステータスの決定 (注意喚起)
  if (metrics.consecutiveLosses >= 2 || metrics.drawdownPercent > 5) {
    status = "caution";
  }

  return {
    isAllowed,
    status,
    reason: isAllowed ? "すべてのルールを満たしています。エントリー可能です" : reason,
    dailyTradeRemaining: MAX_DAILY_TRADES - metrics.dailyTradeCount
  };
}
