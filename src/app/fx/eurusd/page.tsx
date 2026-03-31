"use client";

import { useAuth } from "@/context/AuthContext";
import { IntegratedCommandCenter } from "@/components/fx/eurusd/IntegratedCommandCenter";
import { EURUSDIndicatorBanner } from "@/components/fx/eurusd/EURUSDIndicatorBanner";
import { useIntegratedCommandCenter } from "@/hooks/useIntegratedCommandCenter";
import { ShieldAlert, ArrowLeft, Cpu, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function EURUSDDashboardPage() {
  const { user, loading } = useAuth();
  
  // バナー表示用のデータを取得 (Command Center と共通のフック)
  const { 
    indicatorStatus, 
    upcomingEvents 
  } = useIntegratedCommandCenter("EUR/USD");

  const nextEvent = indicatorStatus?.nextEvent;
  const minutesToEvent = indicatorStatus?.minutesToEvent;
  
  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-indigo-500/20 rounded-full" />
        <div className="text-slate-500 font-black text-[10px] tracking-[0.3em] uppercase">Auth Syncing...</div>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-12 rounded-[48px] text-center space-y-6">
        <div className="w-20 h-20 bg-rose-500/10 rounded-[32px] flex items-center justify-center text-rose-500 mx-auto">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-2xl font-black text-white italic">アクセス制限</h1>
        <p className="text-slate-400 font-bold leading-relaxed">
          デイトレード・プロ EUR/USD を利用するには、ログインが必要です。
        </p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 font-sans">
      {/* EUR/USD 専用のインジケーターバナー */}
      <EURUSDIndicatorBanner 
        status={indicatorStatus?.status || "normal"} 
        message={indicatorStatus?.message || "通常運用"} 
        nextEvent={nextEvent}
        minutesToEvent={minutesToEvent}
      />
      
      <div className="max-w-[1600px] mx-auto px-6 pt-6 md:pt-20 pb-10">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12"
        >
          <div className="space-y-4">
            <Link 
              href="/fx-judgment" 
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-indigo-400 transition-colors group mb-2"
            >
              <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
              <span>判定一覧に戻る</span>
            </Link>
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic pr-4">
                  EUR/USD <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">DAYTRADE PRO</span>
                </h1>
              </div>
              <p className="text-xs md:text-sm font-bold text-slate-500 tracking-[0.2em] uppercase flex items-center gap-3 mt-2">
                <Cpu size={14} className="text-indigo-500/50" />
                Advanced Scalping Module v2.5
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-500/80">システム稼働中</span>
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-6">
            <div className="px-6 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-md flex items-center gap-4">
               <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                  <ShieldCheck size={20} />
               </div>
               <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">ステータス</p>
                  <p className="text-xs font-bold text-slate-200">正常稼働中</p>
               </div>
            </div>
          </div>
        </motion.header>

        {/* 統合コマンドセンター */}
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <IntegratedCommandCenter />
        </motion.div>
      </div>
    </main>
  );
}
