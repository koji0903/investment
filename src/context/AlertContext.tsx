"use client";

import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from "react";
import { AlertRule, AlertNotification } from "@/types/alert";
import { evaluateAlerts } from "@/lib/alertEngine";
import { usePortfolio } from "@/context/PortfolioContext";

interface AlertContextType {
  rules: AlertRule[];
  notifications: AlertNotification[];
  addRule: (rule: Omit<AlertRule, "id">) => void;
  removeRule: (id: string) => void;
  toggleRule: (id: string) => void;
  dismissNotification: (id: string) => void;
  dismissAll: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

const LS_RULES_KEY = "investment_alert_rules_v1";

function loadRules(): AlertRule[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_RULES_KEY);
    return raw ? JSON.parse(raw) : getDefaultRules();
  } catch {
    return getDefaultRules();
  }
}

function getDefaultRules(): AlertRule[] {
  return [
    {
      id: "default-loss",
      label: "損失警告 (-10%)",
      condition: "loss_below",
      threshold: 10,
      priority: "high",
      enabled: true,
    },
    {
      id: "default-profit",
      label: "利益確定サイン (+20%)",
      condition: "profit_above",
      threshold: 20,
      priority: "medium",
      enabled: true,
    },
    {
      id: "default-news",
      label: "重要ニュース通知",
      condition: "high_impact_news",
      threshold: 0,
      priority: "medium",
      enabled: true,
    },
  ];
}

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const { calculatedAssets } = usePortfolio();
  const [rules, setRules] = useState<AlertRule[]>(loadRules);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  // 重要ニュース検知のためのフラグ（NewsPanelとの連携に依存しないよう5分ごとにAPIから取得）
  const hasHighImpactNewsRef = useRef(false);

  // ルールが変わったらlocalStorageに保存
  useEffect(() => {
    localStorage.setItem(LS_RULES_KEY, JSON.stringify(rules));
  }, [rules]);

  // 定期的なニュース重要度チェック（5分ごと）
  useEffect(() => {
    const checkNews = async () => {
      try {
        const res = await fetch("/api/news");
        const data = await res.json();
        const news: { importance: string }[] = data.news ?? [];
        hasHighImpactNewsRef.current = news.some((n) => n.importance === "high");
      } catch {
        hasHighImpactNewsRef.current = false;
      }
    };
    checkNews();
    const interval = setInterval(checkNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 資産価格が変化するたびにアラート評価
  useEffect(() => {
    if (calculatedAssets.length === 0) return;
    const { notifications: newNotifs, updatedRules } = evaluateAlerts(
      rules,
      calculatedAssets,
      hasHighImpactNewsRef.current
    );
    if (newNotifs.length > 0) {
      setNotifications((prev) => [...newNotifs, ...prev].slice(0, 20));
      setRules(updatedRules);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculatedAssets]);

  const addRule = useCallback((rule: Omit<AlertRule, "id">) => {
    setRules((prev) => [
      ...prev,
      { ...rule, id: Math.random().toString(36).slice(2, 9) },
    ]);
  }, []);

  const removeRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const toggleRule = useCallback((id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const dismissAll = useCallback(() => setNotifications([]), []);

  return (
    <AlertContext.Provider value={{
      rules, notifications, addRule, removeRule, toggleRule,
      dismissNotification, dismissAll,
    }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used within AlertProvider");
  return ctx;
};
