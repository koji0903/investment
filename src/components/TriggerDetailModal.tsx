"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Info, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Activity, 
  PieChart, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Zap
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { ActionTrigger } from "@/lib/analyticsUtils";
import Link from "next/link";

interface MetricCardProps {
  label: string;
  value: number | string;
  unit: string;
  icon: React.ReactNode;
  description: string;
  progress?: number;
  isPercent?: boolean;
  decimals?: number;
}

interface TriggerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: ActionTrigger | null;
}

export const TriggerDetailModal = ({
  isOpen,
  onClose,
  trigger
}: TriggerDetailModalProps) => {
  if (!trigger) return null;

  // 判定タイプに応じたメタデータ
  const typeMap = {
    opportunity: {
      label: "投資チャンス",
      icon: Zap,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      description: "市場の歪みや一時的な調整を検知しました。"
    },
    warning: {
      label: "リスク警戒",
      icon: AlertCircle,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      description: "資産価値を守るための防衛アクションを推奨します。"
    },
    strategic: {
      label: "戦略的リバランス",
      icon: Activity,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
      description: "ポートフォリオの重心を最適化するタイミングです。"
    }
  };

  const currentMetadata = typeMap[trigger.type as keyof typeof typeMap] || typeMap.strategic;

  const Icon = currentMetadata.icon;
  
  // 遷移先の決定
  const href = trigger.assetName === "USD/JPY" || trigger.assetName.includes("円") 
    ? "/fx/usdjpy" 
    : "/stock-judgment";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            {/* AI Scanner Background Effect */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse" />

            {/* Header */}
            <div className="p-8 pb-4 flex items-start justify-between">
              <div className="flex gap-5">
                <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 shadow-lg", currentMetadata.bg, currentMetadata.color)}>
                  <Icon size={32} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md", currentMetadata.bg, currentMetadata.color)}>
                      {currentMetadata.label}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      AI Logic v2.4
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
                    {trigger.title}
                  </h2>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={24} />
              </button>
            </div>

            {/* Analysis Body */}
            <div className="p-8 pt-4 space-y-8">
              
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic border-l-4 border-slate-200 dark:border-slate-700 pl-4">
                「{trigger.reason}」
              </p>

              {/* Logic Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard 
                  label="市場環境スコア" 
                  value={trigger.marketScore || 50} 
                  unit="pts"
                  icon={<Activity size={16} />}
                  description={trigger.marketScore && trigger.marketScore > 60 ? "強気相場継続" : "警戒・中立"}
                  progress={(trigger.marketScore || 50)}
                  decimals={0}
                />
                <MetricCard 
                  label="銘柄騰落（判定時）" 
                  value={trigger.assetChange || 0} 
                  unit="%"
                  icon={<TrendingUp size={16} />}
                  description={trigger.assetChange && trigger.assetChange < 0 ? "安値圏の変動" : "堅調に推移"}
                  isPercent
                  decimals={2}
                />
                <MetricCard 
                  label="保有占有率" 
                  value={trigger.currentWeight || 0} 
                  unit="%"
                  icon={<PieChart size={16} />}
                  description="目標比率とのギャップ"
                  progress={(trigger.currentWeight || 0) * 10} // 雑なスケーリング
                  decimals={1}
                />
              </div>

              {/* AI Reasoning Text */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-indigo-500" />
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">AIの思考プロセス</h3>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300 leading-bold space-y-3">
                  <p>
                    このアラートは、あなたの**リスク許容度設定**と**リアルタイムの市場センチメント**を多角的に分析した結果生成されました。
                  </p>
                  <p>
                    {trigger.type === "opportunity" && "市場が強気に転換する中で、主要サポートライン付近での価格反発の可能性が非常に高いと判断されています。現在の保有ウエイトが低いため、中長期的なパフォーマンス向上のための買い増しチャンスです。"}
                    {trigger.type === "warning" && "弱気相場の下落トレンドが加速しており、負のボラティリティが増大しています。資産保護の観点から、あらかじめ設定された損切りラインに基づき、早急なポジション調整を検討すべき局面です。"}
                    {trigger.type === "strategic" && "ポートフォリオ内の特定の資産が、目標配分率を大幅に上回っています。市場環境が変化する前に、利益確定を通じて現金比率を高め、資産全体のバランスを再構築することを推奨します。"}
                  </p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href={href} className="flex-1">
                  <button className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[24px] text-sm font-black transition-all shadow-xl shadow-indigo-500/20 active:scale-95 group">
                    <span>詳細な分析ページへ</span>
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <button 
                  onClick={onClose}
                  className="px-8 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-[24px] text-sm font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const MetricCard = ({ 
  label, 
  value, 
  unit, 
  icon, 
  description, 
  progress, 
  isPercent, 
  decimals = 0 
}: MetricCardProps) => {
  const formattedValue = typeof value === "number" ? value.toFixed(decimals) : value;
  const numValue = typeof value === "number" ? value : parseFloat(String(value));

  return (
    <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-3 shadow-sm">
      <div className="flex items-center justify-between text-slate-400">
        <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span className={cn(
            "text-2xl font-black tabular-nums",
            isPercent && numValue > 0 ? "text-emerald-500" : isPercent && numValue < 0 ? "text-rose-500" : "text-slate-800 dark:text-white"
          )}>
            {isPercent && numValue > 0 ? "+" : ""}{formattedValue}
          </span>
          <span className="text-[10px] font-bold text-slate-400">{unit}</span>
        </div>
        <span className="text-[10px] font-bold text-slate-400 mt-1">{description}</span>
      </div>
      {typeof progress === "number" && (
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            className={cn(
              "h-full rounded-full",
              progress > 70 ? "bg-emerald-500" : progress > 40 ? "bg-indigo-500" : "bg-rose-500"
            )}
          />
        </div>
      )}
    </div>
  );
};
