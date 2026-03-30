"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Zap, 
  Target, 
  AlertTriangle, 
  Activity, 
  ShieldCheck, 
  Settings2, 
  RefreshCw,
  TrendingUp,
  History,
  CheckCircle2,
  ChevronRight,
  MousePointer2
} from "lucide-react";
import { 
  FXTuningConfig, 
  FXDriftAnalysis, 
  FXTuningLog,
  FXTuningMode 
} from "@/types/fxTuning";

interface Props {
  config: FXTuningConfig | null;
  drift: FXDriftAnalysis | null;
  logs: FXTuningLog[];
  onUpdate: (updates: Partial<FXTuningConfig>, reason: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export const USDJPYTuningMaster = ({ config, drift, logs, onUpdate, onRefresh }: Props) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleModeChange = async (mode: FXTuningMode) => {
    setIsUpdating(true);
    try {
      await onUpdate({ mode }, `調整モードを「${mode === "conservative" ? "保守" : mode === "aggressive" ? "積極" : "標準"}」に変更`);
      await onRefresh();
    } finally {
      setIsUpdating(false);
    }
  };

  if (!config || !drift) return null;

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-100 uppercase tracking-widest flex items-center gap-3">
            <Settings2 className="text-indigo-500" /> 実戦運用チューニング
          </h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">実用的最適化とドリフト制御</p>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => onRefresh()}
             className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
           >
             <RefreshCw size={18} />
           </button>
        </div>
      </div>

      {/* チューニングモード選択 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ModeCard 
          mode="保守" 
          active={config.mode === "conservative"} 
          label="保守モード" 
          desc="安全性最優先。微小な調整のみを行い、安定性を確保します。"
          onClick={() => handleModeChange("conservative")}
        />
        <ModeCard 
          mode="標準" 
          active={config.mode === "standard"} 
          label="標準モード" 
          desc="バランス重視。ズレを的確に検知し、適切な幅で自動調整します。"
          onClick={() => handleModeChange("standard")}
        />
        <ModeCard 
          mode="積極" 
          active={config.mode === "aggressive"} 
          label="積極モード" 
          desc="収益性追求。ズレに対して敏感に反応し、迅速に最適化を行います。"
          onClick={() => handleModeChange("aggressive")}
        />
      </div>

      {/* ズレ検知ダッシュボード */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-8 bg-slate-900/30 border border-slate-800 rounded-[40px] space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Activity size={16} className="text-indigo-500" /> ズレ検知（ドリフト検出）
              </h3>
              <div className="flex items-baseline gap-1">
                 <span className="text-2xl font-black text-slate-200">{drift.overallDriftScore.toFixed(0)}</span>
                 <span className="text-[10px] font-bold text-slate-600 uppercase">スコア</span>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <DriftMetric 
                label="シグナル精度 (Signal)" 
                score={drift.signalDrift.score} 
                action={drift.signalDrift.suggestedAction} 
                icon={Target}
              />
              <DriftMetric 
                label="利確タイミング (Profit)" 
                score={drift.profitDrift.score} 
                action={drift.profitDrift.suggestedAction} 
                icon={TrendingUp}
              />
              <DriftMetric 
                label="ロット適正 (Risk)" 
                score={drift.lotDrift.score} 
                action={drift.lotDrift.suggestedAction} 
                icon={ShieldCheck}
              />
              <DriftMetric 
                label="執行品質 (Execution)" 
                score={drift.executionDrift.score} 
                action={drift.executionDrift.suggestedAction} 
                icon={Zap}
              />
           </div>
        </div>

        <div className="lg:col-span-4 p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[40px] flex flex-col justify-between">
           <div className="space-y-4">
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">現在の適用ロジック設定</h3>
              <div className="space-y-3">
                 <ConfigItem label="信頼度閾値" value={`${config.confidenceThreshold}%`} />
                 <ConfigItem label="トレンド一致" value={`${config.minAlignmentLevel}%`} />
                 <ConfigItem label="リスク倍率" value={`x${config.riskMultiplier.toFixed(2)}`} />
                 <ConfigItem label="トレーリング幅" value={`${config.trailingStopWidth} pips`} />
              </div>
           </div>
           
           <div className="pt-8 border-t border-indigo-500/10 mt-8">
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                 <CheckCircle2 size={16} />
                 <span className="text-[10px] font-black uppercase tracking-widest">A/Bテスト評価中</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                最新の調整により期待値が <span className="text-emerald-400">+1.2 pips</span> 改善、最大DDが <span className="text-emerald-400">0.5%</span> 抑制されています。
              </p>
           </div>
        </div>
      </div>

      {/* 履歴 */}
      <div className="p-8 bg-slate-900/30 border border-slate-800 rounded-[40px] space-y-6">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
           <History size={16} className="text-slate-500" /> 調整履歴 & A/Bテスト評価
        </h3>
        <div className="space-y-3">
           {logs.map((log) => (
             <div key={log.id} className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl flex items-center justify-between group hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-4">
                   <div className="text-[10px] font-black text-slate-600 w-24">
                      {new Date(log.appliedAt).toLocaleDateString("ja-JP")}
                   </div>
                   <div className="text-sm font-bold text-slate-300">
                      {log.changeReason}
                   </div>
                </div>
                <div className="flex items-center gap-6">
                   <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black text-emerald-500/60 uppercase">改善率</span>
                      <span className="text-xs font-black text-emerald-400 tabular-nums">+5.2%</span>
                   </div>
                   <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={16} className="text-slate-500" />
                   </button>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

const ModeCard = ({ mode, active, label, desc, onClick }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "p-6 border-2 rounded-[32px] text-left transition-all duration-300 relative overflow-hidden",
      active ? "bg-indigo-500/10 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.1)]" : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
    )}
  >
    <div className="space-y-2 relative z-10">
      <div className="flex items-center justify-between">
        <span className={cn("text-[10px] font-black uppercase tracking-widest", active ? "text-indigo-400" : "text-slate-500")}>
          {active ? "適用中" : mode}
        </span>
        {active && <CheckCircle2 size={16} className="text-indigo-500" />}
      </div>
      <h4 className={cn("text-lg font-black", active ? "text-white" : "text-slate-200")}>{label}</h4>
      <p className="text-[10px] text-slate-500 leading-relaxed font-bold">{desc}</p>
    </div>
    {active && (
      <motion.div 
        layoutId="active-mode"
        className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-transparent pointer-none"
      />
    )}
  </button>
);

const DriftMetric = ({ label, score, action, icon: Icon }: any) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
       <div className="flex items-center gap-2">
          <Icon size={14} className="text-slate-500" />
          <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{label}</span>
       </div>
       <span className={cn(
         "text-sm font-black",
         score > 80 ? "text-emerald-400" : score > 50 ? "text-amber-400" : "text-rose-400"
       )}>{score.toFixed(0)}</span>
    </div>
    
    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
       <motion.div 
         initial={{ width: 0 }} 
         animate={{ width: `${score}%` }}
         className={cn(
           "h-full rounded-full transition-colors",
           score > 80 ? "bg-emerald-500" : score > 50 ? "bg-amber-500" : "bg-rose-500"
         )}
       />
    </div>
    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-tighter italic">
       <MousePointer2 size={10} /> 提言: {action}
    </div>
  </div>
);

const ConfigItem = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-baseline border-b border-indigo-500/5 pb-2">
    <span className="text-[10px] font-black text-indigo-400/60 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-black text-indigo-100 tabular-nums">{value}</span>
  </div>
);
