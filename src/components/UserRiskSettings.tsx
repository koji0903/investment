"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateRiskTolerance, subscribeRiskTolerance } from "@/lib/db";
import { Shield, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type RiskLevel = "low" | "moderate" | "high";

const RISK_LEVELS: { id: RiskLevel; label: string; desc: string; color: string }[] = [
  { 
    id: "low", 
    label: "堅実（低リスク）", 
    desc: "元本割れを極力避け、着実な利益確定を優先します。早めの損切りを提案します。", 
    color: "text-emerald-600 bg-emerald-50 border-emerald-200" 
  },
  { 
    id: "moderate", 
    label: "バランス（中リスク）", 
    desc: "市場平均程度の変動を許容し、リスクとリターンのバランスを重視します。", 
    color: "text-amber-600 bg-amber-50 border-amber-200" 
  },
  { 
    id: "high", 
    label: "積極（高リスク）", 
    desc: "大きな利益を狙い、一時的な大幅下落も許容します。ナンピンや利伸ばしを提案します。", 
    color: "text-rose-600 bg-rose-50 border-rose-200" 
  },
];

export const UserRiskSettings = () => {
  const { user } = useAuth();
  const [risk, setRisk] = useState<RiskLevel>("moderate");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeRiskTolerance(user.uid, (val: any) => {
      setRisk(val as RiskLevel);
    });
    return () => unsub();
  }, [user]);

  const handleUpdate = async (level: RiskLevel) => {
    if (!user) return;
    setIsUpdating(true);
    try {
      await updateRiskTolerance(user.uid, level);
    } catch (error) {
      console.error("Failed to update risk tolerance", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[var(--radius-card)] shadow-sm overflow-hidden mt-6">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
        <Shield className="w-5 h-5 text-indigo-500" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">AI戦略設定</h3>
      </div>
      
      <div className="p-6 space-y-4">
        <div>
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-3">
            あなたのリスク許容度
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {RISK_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => handleUpdate(level.id)}
                disabled={isUpdating}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all relative group",
                  risk === level.id 
                    ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/10" 
                    : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30"
                )}
              >
                {risk === level.id && (
                  <div className="absolute top-2 right-2 bg-indigo-500 text-white rounded-full p-0.5">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
                <div className={cn("text-sm font-bold mb-1", risk === level.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400")}>
                  {level.label}
                </div>
                <div className="text-[10px] text-slate-400 leading-relaxed group-hover:text-slate-500 dark:group-hover:text-slate-300">
                  {level.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
          <Info size={14} className="text-slate-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            設定したリスク許容度に基づいて、AIがあなたのポートフォリオに対する推奨アクション（買い/売り/保持）をカスタマイズします。
          </p>
        </div>
      </div>
    </div>
  );
};
