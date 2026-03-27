"use client";

import React from "react";
import { InvestmentDecision, Scenario } from "@/types/decision";
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  Activity, 
  Info,
  ChevronRight,
  Zap,
  PieChart,
  Lock,
  Unlock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DecisionEngineCardProps {
  decision: InvestmentDecision;
}

export const DecisionEngineCard: React.FC<DecisionEngineCardProps> = ({ decision }) => {
  const getEVColor = (label: string) => {
    switch (label) {
      case "positive": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "negative": return "text-rose-500 bg-rose-500/10 border-rose-500/20";
      default: return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    }
  };

  const getRiskModeBadge = (mode: string) => {
    switch (mode) {
      case "risk_off": return { label: "リスクオフ", color: "bg-rose-500 text-white", icon: <Lock size={12} /> };
      case "caution": return { label: "警戒モード", color: "bg-amber-500 text-white", icon: <AlertTriangle size={12} /> };
      default: return { label: "通常運転", color: "bg-emerald-500 text-white", icon: <Unlock size={12} /> };
    }
  };

  const riskBadge = getRiskModeBadge(decision.riskMode);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 space-y-8 shadow-2xl overflow-hidden relative group">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-[100px] pointer-events-none" />
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/5 text-white rounded-2xl border border-white/10">
            <Zap size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">意思決定エンジン <span className="text-white/30">PRO</span></h3>
            <span className="text-[10px] font-bold text-white/40 italic">Global Strategy Optimizer v1.0</span>
          </div>
        </div>
        <div className={cn("px-4 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-tight shadow-lg", riskBadge.color)}>
          {riskBadge.icon}
          {riskBadge.label}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: Expected Value & Scenarios */}
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
             <div className="flex items-center gap-2">
                <Target size={16} className="text-indigo-500" />
                <span className="text-xs font-black text-white/60 uppercase tracking-widest">期待値 (EV) 分析</span>
             </div>
             <div className={cn("p-6 rounded-3xl border space-y-3", getEVColor(decision.evLabel))}>
                <div className="flex items-baseline gap-2">
                   <span className="text-4xl font-black">{decision.expectedValue > 0 ? "+" : ""}{decision.expectedValue.toFixed(2)}</span>
                   <span className="text-xs font-bold opacity-60">% / trade</span>
                </div>
                <p className="text-xs font-bold leading-relaxed opacity-90">
                  {decision.evComment}
                </p>
             </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center gap-2">
                <PieChart size={16} className="text-blue-500" />
                <span className="text-xs font-black text-white/60 uppercase tracking-widest">シナリオ分布</span>
             </div>
             <div className="space-y-3">
                {decision.scenarios.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-black uppercase">
                        <span className="text-white/80">{s.name}</span>
                        <span className="text-white/40">{(s.probability * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-1000", i === 0 ? "bg-emerald-500" : i === 1 ? "bg-blue-500" : "bg-rose-500")} 
                          style={{ width: `${s.probability * 100}%` }} 
                        />
                      </div>
                    </div>
                    <div className="w-12 text-right">
                      <span className={cn("text-xs font-black", s.expectedProfit > 0 ? "text-emerald-500" : "text-rose-500")}>
                        {s.expectedProfit > 0 ? "+" : ""}{s.expectedProfit.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Right Side: Portfolio Risk & Control */}
        <div className="space-y-6">
           <div className="p-6 bg-white/5 border border-white/10 rounded-[32px] space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/60">
                  <ShieldAlert size={16} />
                  <span className="text-xs font-black uppercase tracking-widest">資産管理ステータス</span>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight",
                  decision.entryPermission === "allow" ? "bg-emerald-500/20 text-emerald-500" :
                  decision.entryPermission === "caution" ? "bg-amber-500/20 text-amber-500" : "bg-rose-500/20 text-rose-500"
                )}>
                  Entry: {decision.entryPermission}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Current Drawdown</span>
                  <div className="text-xl font-black text-white tabular-nums">-{decision.currentDrawdown.toFixed(2)}%</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Portfolio Risk Score</span>
                  <div className="text-xl font-black text-white tabular-nums">{decision.portfolioRiskScore}/100</div>
                </div>
              </div>

              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between group/advice">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-500/20">
                    <Activity size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Profit Strategy</span>
                    <span className="text-xs font-bold text-white">{decision.takeProfitStrategy}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-indigo-500 group-hover/advice:translate-x-1 transition-transform" />
              </div>
           </div>

           <div className="p-5 bg-white/5 border border-white/10 rounded-[32px] flex items-start gap-4">
              <div className="p-2.5 bg-white/5 text-white/60 rounded-xl">
                 <Info size={16} />
              </div>
              <div className="space-y-1">
                 <h5 className="text-[10px] font-black text-white/60 uppercase tracking-widest">Decision Protocol Advice</h5>
                 <p className="text-[11px] font-medium text-white/40 leading-relaxed italic">
                   「{decision.riskMode === "risk_off" ? "資金管理を最優先。新規エントリーを厳しく制限し、既存ポジションのドローダウン回復を待ちます。" : 
                     decision.riskMode === "caution" ? "ポジションサイズを半分に抑制。逆行時の早期撤退を意識した運用を推奨。" : 
                     "期待値・リスク量共に健全。戦略通りのポジションサイズで執行可能です。"}」
                 </p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};
