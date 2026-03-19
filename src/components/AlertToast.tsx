"use client";

import { useEffect, useState } from "react";
import { useAlert } from "@/context/AlertContext";
import { AlertNotification } from "@/types/alert";
import { X, AlertTriangle, AlertCircle, Info, BellRing, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const PriorityIcon = ({ priority }: { priority: AlertNotification["priority"] }) => {
  if (priority === "high") return <AlertTriangle className="w-4 h-4 shrink-0" />;
  if (priority === "medium") return <AlertCircle className="w-4 h-4 shrink-0" />;
  return <Info className="w-4 h-4 shrink-0" />;
};

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200",
  medium: "bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200",
  low: "bg-blue-50 dark:bg-blue-950/80 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200",
};

const ICON_STYLES: Record<string, string> = {
  high: "text-rose-500 dark:text-rose-400",
  medium: "text-amber-500 dark:text-amber-400",
  low: "text-blue-500 dark:text-blue-400",
};

interface ToastItemProps {
  notification: AlertNotification;
  onDismiss: (id: string) => void;
}

const ToastItem = ({ notification, onDismiss }: ToastItemProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // マウント後にアニメーション開始
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 w-full max-w-sm p-4 rounded-2xl border shadow-lg backdrop-blur-sm transition-all duration-300 ease-out",
        PRIORITY_STYLES[notification.priority],
        visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      <span className={cn("mt-0.5", ICON_STYLES[notification.priority])}>
        <PriorityIcon priority={notification.priority} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold mb-0.5">
          {notification.priority === "high" ? "⚠️ 重要アラート" : notification.priority === "medium" ? "📢 アラート" : "ℹ️ 通知"}
        </p>
        <p className="text-xs leading-relaxed">{notification.message}</p>
        <p className="text-[10px] opacity-60 mt-1">
          {new Date(notification.triggeredAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      <button
        onClick={handleDismiss}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const AlertToast = () => {
  const { notifications, dismissNotification, dismissAll } = useAlert();
  const visible = notifications.filter((n) => !n.dismissed);

  if (visible.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 items-end w-full max-w-sm pointer-events-none">
      {/* まとめて閉じるボタン（2件以上の時） */}
      {visible.length >= 2 && (
        <button
          onClick={dismissAll}
          className="pointer-events-auto flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm"
        >
          <XCircle className="w-3.5 h-3.5" />
          すべて閉じる ({visible.length})
        </button>
      )}

      {/* 最大5件表示 */}
      <div className="flex flex-col gap-2 w-full pointer-events-auto">
        {visible.slice(0, 5).map((n) => (
          <ToastItem key={n.id} notification={n} onDismiss={dismissNotification} />
        ))}
      </div>

      {visible.length > 5 && (
        <p className="text-[10px] text-slate-400 text-right">+{visible.length - 5}件の通知</p>
      )}
    </div>
  );
};

// アラートベルアイコン（ヘッダーなどで通知数を表示する用）
export const AlertBell = () => {
  const { notifications } = useAlert();
  const count = notifications.filter((n) => !n.dismissed).length;
  if (count === 0) return null;
  return (
    <div className="relative inline-flex items-center">
      <BellRing className="w-5 h-5 text-amber-500 animate-wiggle" />
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
        {count > 9 ? "9+" : count}
      </span>
    </div>
  );
};
