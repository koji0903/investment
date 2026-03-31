"use client";

import { useAuth } from "@/context/AuthContext";
import { IntegratedCommandCenter } from "@/components/fx/eurusd/IntegratedCommandCenter";
import { EURUSDIndicatorBanner } from "@/components/fx/eurusd/EURUSDIndicatorBanner";
import { useIntegratedCommandCenter } from "@/hooks/useIntegratedCommandCenter";
import { ShieldAlert } from "lucide-react";

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
    <main className="min-h-screen bg-[#020617] text-slate-200">
      {/* EUR/USD 専用のインジケーターバナー */}
      <EURUSDIndicatorBanner 
        status={indicatorStatus?.status || "normal"} 
        message={indicatorStatus?.message || "通常運用"} 
        nextEvent={nextEvent}
        minutesToEvent={minutesToEvent}
      />
      
      <div className="py-12 px-6">
        <header className="max-w-[1600px] mx-auto mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-1 bg-indigo-500 rounded-full" />
                 <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Advanced Scalping Module</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-[1000] tracking-tighter italic text-white leading-none">
                 EUR/USD <span className="text-indigo-500">DAYTRADE PRO</span>
              </h1>
              <p className="text-slate-500 font-bold max-w-2xl leading-relaxed">
                 ユーロドルの高い流動性とテクニカルの整合性を最大限に活用する、プロフェッショナル向け執行ダッシュボード。
              </p>
           </div>
           
           <div className="flex items-center gap-6 pb-2">
              <div className="text-right">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Status</p>
                 <p className="text-sm font-black text-emerald-400 uppercase">Operational</p>
              </div>
              <div className="w-px h-10 bg-slate-800" />
              <div className="text-right">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pair</p>
                 <p className="text-sm font-black text-white uppercase">EUR/USD</p>
              </div>
           </div>
        </header>

        {/* 統合コマンドセンター */}
        <IntegratedCommandCenter />
      </div>
    </main>
  );
}
