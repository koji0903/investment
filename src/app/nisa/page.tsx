"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { 
  getNisaSettings, 
  saveNisaSetting, 
  deleteNisaSetting 
} from "@/lib/actions/nisa";
import { NisaAccumulationSetting, NisaProgress } from "@/types/nisa";
import { NisaStatusCard } from "@/components/nisa/NisaStatusCard";
import { NisaAccumulationForm } from "@/components/nisa/NisaAccumulationForm";
import { DashboardHeader } from "@/components/DashboardHeader";
import { usePortfolio } from "@/context/PortfolioContext";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Pause, 
  Play, 
  ChevronRight, 
  Info,
  Wallet,
  Calendar,
  Layers
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function NisaPage() {
  const { user } = useAuth();
  const { totalAssetsValue, totalProfitAndLoss } = usePortfolio();
  const [settings, setSettings] = useState<NisaAccumulationSetting[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSetting, setEditingSetting] = useState<NisaAccumulationSetting | null>(null);
  const [loading, setLoading] = useState(true);

  // 初回データ取得
  useEffect(() => {
    if (user?.uid) {
      fetchSettings();
    }
  }, [user?.uid]);

  const fetchSettings = async () => {
    setLoading(true);
    if (user?.uid) {
      const data = await getNisaSettings(user.uid);
      setSettings(data);
    }
    setLoading(false);
  };

  const handleSave = async (setting: Omit<NisaAccumulationSetting, "createdAt" | "updatedAt">) => {
    if (user?.uid) {
      await saveNisaSetting({ ...setting, userId: user.uid });
      await fetchSettings();
      setShowForm(false);
      setEditingSetting(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("この積立設定を削除しますか？")) {
      await deleteNisaSetting(id);
      await fetchSettings();
    }
  };

  const toggleStatus = async (setting: NisaAccumulationSetting) => {
    if (user?.uid) {
      const newStatus = setting.status === "active" ? "paused" : "active";
      await saveNisaSetting({ ...setting, status: newStatus });
      await fetchSettings();
    }
  };

  // 進捗状況の計算
  const progress = useMemo((): NisaProgress => {
    const activeSettings = settings.filter(s => s.status === "active");
    const growthYearlyUsage = activeSettings
      .filter(s => s.accountType === "growth")
      .reduce((acc, s) => acc + (s.amount * 12), 0);
    const accumulationYearlyUsage = activeSettings
      .filter(s => s.accountType === "accumulation")
      .reduce((acc, s) => acc + (s.amount * 12), 0);
    
    // 簡易的な合計計算 (実際には過去の実績をFirestoreから集計する必要があるが、ここでは設定ベース)
    const totalAccumulated = growthYearlyUsage + accumulationYearlyUsage; 

    return {
      totalAccumulated,
      currentYearAccumulated: growthYearlyUsage + accumulationYearlyUsage,
      growthYearlyUsage,
      accumulationYearlyUsage,
      limits: {
        yearlyGrowth: 2400000,
        yearlyAccumulation: 1200000,
        yearlyTotal: 3600000,
        lifetimeTotal: 18000000
      }
    };
  }, [settings]);

  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
        <DashboardHeader 
          totalAssets={totalAssetsValue} 
          totalProfitAndLoss={totalProfitAndLoss}
          hideAuth
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-12">
          {/* Page Title */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">NISA 管理・積立</h1>
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-4">NISA Portfolio & Accumulation</p>
            </div>
            <button 
              onClick={() => {
                setEditingSetting(null);
                setShowForm(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <Plus size={20} />
              新規積立設定を追加
            </button>
          </div>

          {/* Status Cards */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Layers size={18} className="text-indigo-500" />
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">非課税枠の充足状況</h2>
            </div>
            <NisaStatusCard progress={progress} />
          </section>

          {/* Settings List */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Calendar size={18} className="text-indigo-500" />
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">現在の積立設定一覧</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {settings.map((setting) => (
                  <motion.div
                    key={setting.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "group bg-white dark:bg-slate-900 rounded-[2rem] p-6 border transition-all relative overflow-hidden",
                      setting.status === "active" 
                        ? "border-slate-200 dark:border-slate-800 shadow-sm" 
                        : "border-slate-200/50 dark:border-slate-800/50 opacity-60 grayscale-[0.5]"
                    )}
                  >
                    <div className="relative z-10 space-y-5">
                      <div className="flex items-start justify-between">
                        <div className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                          setting.accountType === "growth" 
                            ? "bg-indigo-500/10 text-indigo-500" 
                            : "bg-emerald-500/10 text-emerald-500"
                        )}>
                          {setting.accountType === "growth" ? "成長投資枠" : "つみたて枠"}
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => {
                              setEditingSetting(setting);
                              setShowForm(true);
                            }}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(setting.id)}
                            className="p-2 rounded-lg hover:bg-rose-500/10 transition-colors text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white line-clamp-1">{setting.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{setting.symbol || "NO SYMBOL"}</p>
                      </div>

                      <div className="flex items-end justify-between pt-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">毎月積立額</span>
                          <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                            {formatCurrency(setting.amount)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">積立日</span>
                          <div className="text-sm font-black text-slate-600 dark:text-slate-400">毎月 {setting.dayOfMonth} 日</div>
                        </div>
                      </div>

                      <div className="pt-4 flex items-center gap-3">
                        <button
                          onClick={() => toggleStatus(setting)}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all",
                            setting.status === "active"
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-500/10 hover:text-amber-500"
                              : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                          )}
                        >
                          {setting.status === "active" ? (
                            <>
                              <Pause size={14} /> 一時停止
                            </>
                          ) : (
                            <>
                              <Play size={14} /> 積立を再開
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Background icon */}
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-125 transition-all duration-700 pointer-events-none">
                      <Wallet size={120} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {settings.length === 0 && !loading && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-white/50 dark:bg-slate-900/50">
                  <p className="text-lg font-black text-slate-400 uppercase tracking-tight">積立設定がありません</p>
                  <button 
                    onClick={() => setShowForm(true)}
                    className="mt-6 text-indigo-500 font-black flex items-center gap-2 mx-auto hover:underline"
                  >
                    <Plus size={20} />
                    最初の積立を設定する
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Guide / Info */}
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Info className="text-indigo-500" size={24} />
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">新NISAのポイント</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <InfoItem 
                title="非課税保有期間が無期限"
                text="新NISAでは、投資で得られた利益にかかる税金が一生涯ゼロになります。長期投資に非常に有利な制度です。"
              />
              <InfoItem 
                title="年間投資枠の拡大"
                text="つみたて投資枠120万円、成長投資枠240万円の合計360万円まで年間で投資可能です。"
              />
              <InfoItem 
                title="生涯投資枠の再利用"
                text="売却すると翌年以降に非課税枠が復活（再利用可能）するため、柔軟な資産形成が可能です。"
              />
            </div>
          </section>
        </div>

        {/* Modal Overlay for Form */}
        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowForm(false)}
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              />
              <NisaAccumulationForm 
                onSave={handleSave} 
                onCancel={() => {
                  setShowForm(false);
                  setEditingSetting(null);
                }} 
                initialData={editingSetting || undefined}
              />
            </div>
          )}
        </AnimatePresence>
      </main>
    </AuthGuard>
  );
}

function InfoItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-black text-slate-800 dark:text-indigo-400 uppercase tracking-tight">{title}</h4>
      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 font-medium">{text}</p>
    </div>
  );
}
