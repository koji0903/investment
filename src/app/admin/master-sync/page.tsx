"use client";

import React, { useState, useEffect } from "react";
import { seedStockMasterAction } from "@/lib/actions/stockMaster";
import { StockService } from "@/services/stockService";
import { 
  Database, 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  BarChart4
} from "lucide-react";
import { motion } from "framer-motion";

export default function MasterSyncPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState({ totalDocs: 0, cached: false });

  const loadStats = async (forceRemote = false) => {
    try {
      const list = await StockService.getMasterList(forceRemote);
      setStats(prev => ({ ...prev, totalDocs: list.length }));
      
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem("stock_master_cache");
        setStats(prev => ({ ...prev, cached: !!cached }));
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleSeed = async () => {
    if (!confirm("Firestoreの銘柄マスタを更新しますか？\n(src/data/tse_prime_all.json から読み込まれます)")) return;
    setStatus("loading");
    setMessage("シード処理を実行中...");
    
    try {
      const res = await seedStockMasterAction();
      if (res.success) {
        setStatus("success");
        setMessage(res.message || "シード処理が完了しました。");
        // キャッシュも更新するためにリモートから再取得
        await loadStats(true);
      } else {
        setStatus("error");
        setMessage(res.message || "シード処理に失敗しました。");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "不明なエラーが発生しました。");
    }
  };

  const handleClearCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("stock_master_cache");
      localStorage.removeItem("stock_master_cache_time");
      loadStats();
      alert("ローカルキャッシュをクリアしました。");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 md:p-20 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-4 text-center">
          <div className="inline-flex p-4 bg-indigo-600 rounded-3xl text-white shadow-2xl shadow-indigo-600/30 mb-4 transition-transform hover:scale-110">
            <Database size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">銘柄マスタ管理ポータル</h1>
          <p className="text-slate-500 font-bold">東証プライム 1,600銘柄の同期・メンテナンス用ダッシュボード</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AdminCard 
            title="Firestore 同期" 
            description="ローカルデータ (JSON) から Firestore の stock_master コレクションを更新します。バッチ処理で高速に一括登録を行います。"
            icon={<RefreshCw className={status === "loading" ? "animate-spin" : ""} />}
            onClick={handleSeed}
            variant="indigo"
            disabled={status === "loading"}
          />
          <AdminCard 
            title="キャッシュクリア" 
            description="ブラウザの localStorage に保存されている銘柄リストキャッシュを削除し、次回のダッシュボード表示時に最新データを読み込ませます。"
            icon={<Trash2 />}
            onClick={handleClearCache}
            variant="slate"
          />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-10 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black flex items-center gap-3">
              <BarChart4 className="text-indigo-500" />
              システムステータス
            </h2>
            <button onClick={() => loadStats(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <RefreshCw size={18} className="text-slate-400" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StatRow label="Firestore 登録銘柄数" value={`${stats.totalDocs} 銘柄`} />
            <StatRow label="ローカルキャッシュ状態" value={stats.cached ? "有効 (キャッシュ中)" : "なし (未キャッシュ)"} highlight={stats.cached} />
          </div>

          {status !== "idle" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-6 rounded-3xl flex items-start gap-4 ${
                status === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                status === "error" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                "bg-indigo-50 text-indigo-700 border border-indigo-100"
              }`}
            >
              <div className="mt-1">
                {status === "success" ? <CheckCircle className="shrink-0" /> : 
                 status === "error" ? <AlertCircle className="shrink-0" /> : 
                 <RefreshCw className="animate-spin shrink-0" />}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black">{status === "loading" ? "処理中" : status === "success" ? "成功" : "エラー"}</p>
                <p className="text-xs font-bold opacity-80">{message}</p>
              </div>
            </motion.div>
          )}
        </div>
        
        <div className="text-center pt-8">
          <a href="/stock-judgment" className="text-indigo-600 font-black text-sm hover:underline">
            ← ダッシュボードに戻る
          </a>
        </div>
      </div>
    </div>
  );
}

const AdminCard = ({ title, description, icon, onClick, variant, disabled }: any) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`flex flex-col items-start text-left p-10 rounded-[40px] border-2 transition-all active:scale-[0.98] disabled:opacity-50 group relative overflow-hidden ${
      variant === "indigo" 
        ? "bg-indigo-600 border-indigo-600 text-white shadow-2xl shadow-indigo-600/20 hover:bg-indigo-700" 
        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white hover:border-indigo-200"
    }`}
  >
    <div className={`p-4 rounded-2xl mb-8 shadow-xl transition-transform group-hover:scale-110 ${
      variant === "indigo" ? "bg-white/20" : "bg-slate-50 dark:bg-slate-800 group-hover:bg-indigo-50"
    }`}>
      {React.cloneElement(icon as React.ReactElement<any>, { size: 32 })}
    </div>
    <h3 className="text-xl font-black mb-3">{title}</h3>
    <p className={`text-xs font-bold leading-relaxed opacity-70 ${
      variant === "indigo" ? "text-indigo-50" : "text-slate-500"
    }`}>
      {description}
    </p>
  </button>
);

const StatRow = ({ label, value, highlight }: any) => (
  <div className="flex flex-col gap-2 p-6 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-100 dark:border-slate-800">
    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className={`text-xl font-black ${highlight ? "text-indigo-600" : "text-slate-800 dark:text-white"}`}>{value}</span>
  </div>
);
