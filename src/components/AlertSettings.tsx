"use client";

import { useState } from "react";
import { useAlert } from "@/context/AlertContext";
import { usePortfolio } from "@/context/PortfolioContext";
import { useAuth } from "@/context/AuthContext";
import { AlertRule, AlertCondition, AlertPriority } from "@/types/alert";
import { Plus, Trash2, ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const CONDITION_LABELS: Record<AlertCondition, string> = {
  price_above: "価格が以上になったら",
  price_below: "価格が以下になったら",
  profit_above: "損益率が+%以上になったら",
  loss_below: "損益率が-%以下になったら",
  high_impact_news: "重要ニュースが発生したら",
};

const PRIORITY_LABELS: Record<AlertPriority, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const PRIORITY_BADGE: Record<AlertPriority, string> = {
  high: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  low: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
};

const DEFAULT_FORM = {
  label: "",
  assetId: "",
  condition: "loss_below" as AlertCondition,
  threshold: 10,
  priority: "medium" as AlertPriority,
};

export const AlertSettings = () => {
  const { rules, addRule, removeRule, toggleRule } = useAlert();
  const { calculatedAssets } = usePortfolio();
  const { isDemo } = useAuth();
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);

  const needsThreshold = form.condition !== "high_impact_news";
  const needsAsset = form.condition === "price_above" || form.condition === "price_below";

  const handleSubmit = () => {
    if (isDemo) {
      alert("デモモードではアラートの設定は制限されています。");
      return;
    }
    if (!form.label.trim()) return;
    addRule({
      label: form.label,
      assetId: needsAsset && form.assetId ? form.assetId : undefined,
      condition: form.condition,
      threshold: form.threshold,
      priority: form.priority,
      enabled: true,
    });
    setForm(DEFAULT_FORM);
    setShowForm(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[var(--radius-card)] shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <ShieldAlert className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">アラート設定</h3>
        {isDemo && (
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
            閲覧のみ
          </span>
        )}
        <span className="ml-auto text-slate-400">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 dark:border-slate-800">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {rules.length === 0 && (
              <p className="px-6 py-4 text-sm text-slate-400 text-center">アラートが設定されていません</p>
            )}
            {rules.map((rule) => (
              <div key={rule.id} className={cn("flex items-center gap-3 px-6 py-3", isDemo && "opacity-75")}>
                <button
                  onClick={() => !isDemo && toggleRule(rule.id, rule.enabled)}
                  disabled={isDemo}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                    rule.enabled ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600",
                    isDemo && "cursor-not-allowed"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform",
                    rule.enabled ? "translate-x-4" : "translate-x-0"
                  )} />
                </button>

                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-semibold truncate", !rule.enabled && "text-slate-400 line-through")}>
                    {rule.label}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {CONDITION_LABELS[rule.condition]}
                    {rule.threshold > 0 && ` (${rule.threshold}${rule.condition.includes("price") ? "円" : "%"})`}
                  </p>
                </div>

                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", PRIORITY_BADGE[rule.priority])}>
                  優先度:{PRIORITY_LABELS[rule.priority]}
                </span>

                {!isDemo && (
                  <button
                    onClick={() => removeRule(rule.id)}
                    className="shrink-0 text-slate-400 hover:text-rose-500 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {!isDemo && (
            showForm ? (
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">新しいアラートを追加</p>
                {/* ... (Form inputs - kept simplified for the tool) */}
                <input
                  type="text" placeholder="アラート名" value={form.label}
                  onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button onClick={handleSubmit} className="flex-1 py-2 text-sm font-bold bg-indigo-500 text-white rounded-xl">追加する</button>
                  <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-bold text-slate-500 rounded-xl">キャンセル</button>
                </div>
              </div>
            ) : (
              <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400"
                >
                  <Plus className="w-4 h-4" />
                  アラートを追加
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
