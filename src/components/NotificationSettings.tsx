"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { subscribeNotificationSettings, updateNotificationSettings } from "@/lib/db";
import { useNotify } from "@/context/NotificationContext";
import { Bell, Mail, MessageCircle, Shield, Zap, TrendingUp, Check, Info, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationSettings } from "@/types";
import { sendNotification } from "@/lib/notificationUtils";

export const NotificationSettingsComponent = () => {
  const { user, isDemo } = useAuth();
  const { notify } = useNotify();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeNotificationSettings(user.uid, (data) => {
      setSettings(data);
    });
    return () => unsubscribe();
  }, [user]);

  const handleUpdate = async (update: Partial<NotificationSettings>) => {
    if (isDemo || !user || !settings) return;
    setIsUpdating(true);
    try {
      await updateNotificationSettings(user.uid, update);
      notify({
        type: "success",
        title: "設定を保存しました",
        message: "通知設定を更新しました。",
      });
    } catch (error) {
      notify({
        type: "error",
        title: "保存失敗",
        message: "設定の保存に失敗しました。",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTestNotification = async (type: "line" | "email") => {
    if (!user || !settings) return;
    
    notify({
      type: "info",
      title: "テスト通知を送信中...",
      message: `${type === "line" ? "LINE" : "メール"}へテストメッセージを送っています。`,
    });

    const success = await sendNotification(user.uid, settings, "alerts", {
      title: "テスト通知",
      body: "これは Antigravity 資産運用管理システムからのテスト通知です。正常に連携されています。"
    });

    if (success) {
      notify({
        type: "success",
        title: "送信完了",
        message: "テスト通知を送信しました（コンソールを確認してください）。",
      });
    }
  };

  if (!settings) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-sm overflow-hidden mt-8">
      <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-xl text-white">
            <Bell size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white">通知・アラート連携</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Notification Channels</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-10">
        {/* LINE Notify Settings */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg text-white">
                <MessageCircle size={18} />
              </div>
              <h4 className="text-sm font-black text-slate-800 dark:text-white">LINE Notify 連携</h4>
            </div>
            <button
              onClick={() => handleUpdate({ lineEnabled: !settings.lineEnabled })}
              className={cn(
                "w-12 h-6 rounded-full relative transition-colors",
                settings.lineEnabled ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                settings.lineEnabled ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          <div className={cn("space-y-4 transition-all", !settings.lineEnabled && "opacity-50 pointer-events-none")}>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Access Token</label>
              <div className="relative group">
                <input
                  type="password"
                  value={settings.lineToken}
                  onChange={(e) => setSettings({ ...settings, lineToken: e.target.value })}
                  onBlur={() => handleUpdate({ lineToken: settings.lineToken })}
                  placeholder="LINE Notifyのトークンを入力"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-bold focus:outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-400 px-1">
                ※ LINE Notify公式サイトで発行したトークンを貼り付けてください。
              </p>
            </div>
            {settings.lineEnabled && settings.lineToken && (
              <button
                onClick={() => handleTestNotification("line")}
                className="text-[10px] font-black text-emerald-600 hover:text-emerald-500 flex items-center gap-1.5 transition-colors px-1"
              >
                <Send size={12} />
                LINEテスト通知を送信
              </button>
            )}
          </div>
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800" />

        {/* Email Settings */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500 rounded-lg text-white">
                <Mail size={18} />
              </div>
              <h4 className="text-sm font-black text-slate-800 dark:text-white">メール通知</h4>
            </div>
            <button
              onClick={() => handleUpdate({ emailEnabled: !settings.emailEnabled })}
              className={cn(
                "w-12 h-6 rounded-full relative transition-colors",
                settings.emailEnabled ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                settings.emailEnabled ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          <div className={cn("space-y-4 transition-all", !settings.emailEnabled && "opacity-50 pointer-events-none")}>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Email Address</label>
              <input
                type="email"
                value={settings.emailAddress}
                onChange={(e) => setSettings({ ...settings, emailAddress: e.target.value })}
                onBlur={() => handleUpdate({ emailAddress: settings.emailAddress })}
                placeholder="example@mail.com"
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-bold focus:outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>
            {settings.emailEnabled && settings.emailAddress && (
              <button
                onClick={() => handleTestNotification("email")}
                className="text-[10px] font-black text-indigo-600 hover:text-indigo-500 flex items-center gap-1.5 transition-colors px-1"
              >
                <Send size={12} />
                メールテスト通知を送信
              </button>
            )}
          </div>
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800" />

        {/* Trigger Settings */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg text-white">
              <Zap size={18} />
            </div>
            <h4 className="text-sm font-black text-slate-800 dark:text-white">通知トリガー設定</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: "alerts" as const, label: "重要アラート", icon: Shield, color: "text-rose-500", desc: "急騰・急落時の警告" },
              { id: "strategy" as const, label: "戦略提案", icon: Zap, color: "text-amber-500", desc: "AIによる売買提案" },
              { id: "market" as const, label: "市場変化", icon: TrendingUp, color: "text-indigo-500", desc: "市場概況の定期報告" },
            ].map((trigger) => (
              <button
                key={trigger.id}
                onClick={() => handleUpdate({ 
                  triggers: { ...settings.triggers, [trigger.id]: !settings.triggers[trigger.id] } 
                })}
                className={cn(
                  "p-4 rounded-[24px] border-2 text-left transition-all group",
                  settings.triggers[trigger.id]
                    ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    : "border-slate-50 dark:border-slate-800/50 bg-transparent opacity-60"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm", trigger.color)}>
                    <trigger.icon size={16} />
                  </div>
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                    settings.triggers[trigger.id] ? "bg-indigo-500 border-indigo-500" : "border-slate-200 dark:border-slate-700"
                  )}>
                    {settings.triggers[trigger.id] && <Check size={10} className="text-white" strokeWidth={4} />}
                  </div>
                </div>
                <p className="text-xs font-black text-slate-800 dark:text-white mb-1">{trigger.label}</p>
                <p className="text-[10px] font-bold text-slate-400">{trigger.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-4 p-5 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-3xl border border-indigo-100 dark:border-indigo-500/20">
          <Info className="text-indigo-500 mt-0.5 shrink-0" size={18} />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
            Antigravityの通知機能は、あなたの資産を24時間守ります。
            LINE連携を行うと、外出中でもAIの重要な気づきをキャッチし、ワンタップで意思決定が可能になります。
          </p>
        </div>
      </div>
    </div>
  );
};
