"use client";

import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from "react";
import { AlertRule, AlertNotification } from "@/types/alert";
import { evaluateAlerts } from "@/lib/alertEngine";
import { usePortfolio } from "@/context/PortfolioContext";
import { useAuth } from "@/context/AuthContext";
import { 
  subscribeAlerts, 
  saveAlert, 
  removeAlert as removeAlertDb, 
  updateAlertEnabled 
} from "@/lib/db";

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

interface AlertContextType {
  rules: AlertRule[];
  notifications: AlertNotification[];
  addRule: (rule: Omit<AlertRule, "id">) => Promise<void>;
  removeRule: (id: string) => Promise<void>;
  toggleRule: (id: string, enabled: boolean) => Promise<void>;
  dismissNotification: (id: string) => void;
  dismissAll: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { calculatedAssets, news } = usePortfolio();
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const hasHighImpactNewsRef = useRef(false);

  // Firestoreとの同期
  useEffect(() => {
    if (!user) {
      setRules([]);
      return;
    }

    const unsub = subscribeAlerts(user.uid, (data) => {
      if (data.length === 0) {
        // 初回ログイン時はデフォルトのルールをFirestoreに保存
        const defaults = getDefaultRules();
        defaults.forEach(rule => saveAlert(user.uid!, rule));
      } else {
        setRules(data);
      }
    });

    return () => unsub();
  }, [user]);

  // ニュース重要度チェック（PortfolioContextのニュースが更新された時に実行）
  useEffect(() => {
    if (!news) {
      hasHighImpactNewsRef.current = false;
      return;
    }
    hasHighImpactNewsRef.current = news.some((n: any) => n.importance === "high");
  }, [news]);

  // 資産価格が変化するたびにアラート評価
  useEffect(() => {
    if (!user || rules.length === 0 || calculatedAssets.length === 0) return;
    
    const { notifications: newNotifs, updatedRules } = evaluateAlerts(
      rules,
      calculatedAssets,
      hasHighImpactNewsRef.current
    );

    if (newNotifs.length > 0) {
      setNotifications((prev) => [...newNotifs, ...prev].slice(0, 20));
      // トリガーされた状態（クールダウン等）をFirestoreに反映
      updatedRules.forEach(rule => {
        const original = rules.find(r => r.id === rule.id);
        if (original && JSON.stringify(original) !== JSON.stringify(rule)) {
          saveAlert(user.uid, rule);
        }
      });
    }
  }, [calculatedAssets, user, rules]);

  const addRule = useCallback(async (rule: Omit<AlertRule, "id">) => {
    if (!user) return;
    const newRule: AlertRule = {
      ...rule,
      id: Math.random().toString(36).slice(2, 9),
    };
    await saveAlert(user.uid, newRule);
  }, [user]);

  const removeRule = useCallback(async (id: string) => {
    if (!user) return;
    await removeAlertDb(user.uid, id);
  }, [user]);

  const toggleRule = useCallback(async (id: string, enabled: boolean) => {
    if (!user) return;
    await updateAlertEnabled(user.uid, id, !enabled);
  }, [user]);

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
