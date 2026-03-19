"use client";

import { useState } from "react";
import { useAlert } from "@/context/AlertContext";
import { usePortfolio } from "@/context/PortfolioContext";
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
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);

  const needsThreshold = form.condition !== "high_impact_news";
  const needsAsset = form.condition === "price_above" || form.condition === "price_below";

  const handleSubmit = () => {
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
      {/* ヘッダー（折りたたみ） */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <ShieldAlert className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">アラート設定</h3>
        {rules.filter((r) => r.enabled).length > 0 && (
          <span className="ml-1 text-xs bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full font-semibold">
            {rules.filter((r) => r.enabled).length}件有効
          </span>
        )}
        <span className="ml-auto text-slate-400">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 dark:border-slate-800">
          {/* アラートルール一覧 */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {rules.length === 0 && (
              <p className="px-6 py-4 text-sm text-slate-400 text-center">アラートが設定されていません</p>
            )}
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center gap-3 px-6 py-3">
                {/* ON/OFFトグル */}
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                    rule.enabled ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"
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

                <button
                  onClick={() => removeRule(rule.id)}
                  className="shrink-0 text-slate-400 hover:text-rose-500 transition-colors p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* 新規追加フォーム */}
          {showForm ? (
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">新しいアラートを追加</p>

              <input
                type="text"
                placeholder="アラート名（例：Bitcoin急落警告）"
                value={form.label}
                onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-400"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">条件</label>
                  <select
                    value={form.condition}
                    onChange={(e) => setForm((p) => ({ ...p, condition: e.target.value as AlertCondition }))}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-400"
                  >
                    {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">優先度</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as AlertPriority }))}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-400"
                  >
                    {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              {needsAsset && (
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">対象資産（任意）</label>
                  <select
                    value={form.assetId}
                    onChange={(e) => setForm((p) => ({ ...p, assetId: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-400"
                  >
                    <option value="">すべての資産</option>
                    {calculatedAssets.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {needsThreshold && (
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">
                    閾値 {form.condition.includes("price") ? "（円）" : "（%）"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.threshold}
                    onChange={(e) => setForm((p) => ({ ...p, threshold: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-400"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={!form.label.trim()}
                  className="flex-1 py-2 text-sm font-bold bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition disabled:opacity-50"
                >
                  追加する
                </button>
                <button
                  onClick={() => { setShowForm(false); setForm(DEFAULT_FORM); }}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
              >
                <Plus className="w-4 h-4" />
                アラートを追加
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
