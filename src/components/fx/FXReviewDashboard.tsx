"use client";

import React, { useEffect, useState } from "react";
import { FXTradingReview } from "@/types/fx";
import { generateFXReviewAction, getFXReviewsAction } from "@/lib/actions/fxReview";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  BarChart3,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const FXReviewDashboard = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<FXTradingReview[]>([]);
  const [selectedReview, setSelectedReview] = useState<FXTradingReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadReviews();
    }
  }, [user?.uid]);

  const loadReviews = async () => {
    if (!user?.uid) return;
    setLoading(true);
    const data = await getFXReviewsAction(user.uid);
    setReviews(data);
    if (data.length > 0) setSelectedReview(data[0]);
    setLoading(false);
  };

  const handleGenerateReview = async (period: "daily" | "weekly") => {
    if (!user?.uid) return;
    setGenerating(true);
    const result = await generateFXReviewAction(user.uid, period);
    if (result.success && result.data) {
      setReviews(prev => [result.data!, ...prev.filter(r => r.id !== result.data!.id)]);
      setSelectedReview(result.data);
    }
    setGenerating(false);
  };

  if (loading) {
    return <div className="p-12 text-center animate-pulse text-slate-400 font-bold">レビューを読み込み中...</div>;
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Review Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[18px] bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Trophy size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">運用レビュー・分析</h2>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Performance AI Insights</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleGenerateReview("daily")}
            disabled={generating}
            className="px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {generating ? <Zap size={14} className="animate-spin" /> : <Calendar size={14} />}
            日次レビュー生成
          </button>
          <button 
             onClick={() => handleGenerateReview("weekly")}
             disabled={generating}
             className="px-5 py-2.5 rounded-2xl bg-indigo-500 text-white text-xs font-black hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            週次レビュー生成
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: History */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">履歴</h3>
          <div className="space-y-2">
            {reviews.length === 0 ? (
              <p className="text-xs font-bold text-slate-400 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dotted border-slate-200 dark:border-slate-800">レビュー履歴がありません</p>
            ) : (
              reviews.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReview(r)}
                  className={cn(
                    "w-full p-4 rounded-2xl text-left transition-all border group",
                    selectedReview?.id === r.id 
                      ? "bg-white dark:bg-slate-900 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/10" 
                      : "bg-transparent border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase",
                      r.period === "daily" ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" : "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400"
                    )}>
                      {r.period === "daily" ? "Daily" : "Weekly"}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{new Date(r.startDate).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200 truncate group-hover:text-indigo-500 transition-colors">
                    {r.period === "daily" ? "日次運用分析" : "週次運用分析"}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Content: Review Details */}
        <div className="lg:col-span-3 space-y-8">
          <AnimatePresence mode="wait">
            {selectedReview ? (
              <motion.div 
                key={selectedReview.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Summary Card */}
                <div className="p-8 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none">
                    <BarChart3 size={160} />
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{selectedReview.period === "daily" ? "本日" : "今週"}の総括</h3>
                      <p className="text-sm font-bold text-slate-500 mt-2 leading-relaxed max-w-2xl">{selectedReview.summary}</p>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 min-w-[100px]">
                         <p className="text-[9px] font-black text-slate-400 uppercase mb-1">勝率</p>
                         <p className="text-2xl font-black text-slate-800 dark:text-white">{Math.round(selectedReview.stats.winRate)}%</p>
                       </div>
                       <div className="text-center p-4 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20 min-w-[100px] text-white">
                         <p className="text-[9px] font-black opacity-70 uppercase mb-1">獲得pips</p>
                         <p className="text-2xl font-black tabular-nums">{selectedReview.stats.totalPnl.toFixed(1)}</p>
                       </div>
                    </div>
                  </div>

                  {/* Detail Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-50 dark:border-slate-800/50">
                    <StatItem label="トレード数" value={selectedReview.stats.totalTrades} />
                    <StatItem label="PF" value={selectedReview.stats.profitFactor.toFixed(2)} />
                    <StatItem label="平均利益" value={`${selectedReview.stats.averageProfit.toFixed(1)} pips`} />
                    <StatItem label="平均損失" value={`${selectedReview.stats.averageLoss.toFixed(1)} pips`} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Pattern Analysis */}
                  <div className="p-6 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <CheckCircle2 size={18} />
                      </div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">勝ちパターン</h4>
                    </div>
                    <div className="space-y-3">
                      {selectedReview.patterns.winning.map((p, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-2xl border border-emerald-100/50 dark:border-emerald-500/10">
                          <ArrowRight size={14} className="text-emerald-500 mt-0.5" />
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">{p}</p>
                        </div>
                      ))}
                      {selectedReview.patterns.winning.length === 0 && <p className="text-xs text-slate-400 font-bold italic">データ収集中...</p>}
                    </div>

                    <div className="flex items-center gap-3 mt-8">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                        <AlertCircle size={18} />
                      </div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">負けパターン</h4>
                    </div>
                    <div className="space-y-3">
                      {selectedReview.patterns.losing.map((p, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-rose-50/50 dark:bg-rose-500/5 rounded-2xl border border-rose-100/50 dark:border-rose-500/10">
                          <AlertCircle size={14} className="text-rose-500 mt-0.5" />
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">{p}</p>
                        </div>
                      ))}
                      {selectedReview.patterns.losing.length === 0 && <p className="text-xs text-slate-400 font-bold italic">目立った負けパターンの兆候はありません</p>}
                    </div>
                  </div>

                  {/* AI Recommendations */}
                  <div className="p-6 bg-slate-900 text-white rounded-[32px] shadow-xl space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 text-indigo-500/20">
                      <Lightbulb size={120} />
                    </div>
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white">
                        <Zap size={18} fill="currentColor" />
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-wider">AI 次の改善ステップ</h4>
                    </div>
                    
                    <div className="space-y-4 relative z-10">
                      {selectedReview.aiRecommendations.map((rec, i) => (
                        <div key={i} className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 space-y-2">
                           <div className="flex items-center gap-2">
                             <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-[10px] font-black">
                               {i + 1}
                             </div>
                             <span className="text-[10px] font-black text-amber-500 uppercase">Focus Area</span>
                           </div>
                           <p className="text-xs font-bold text-slate-200 leading-relaxed">{rec}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
                       <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-slate-400 uppercase">ルール遵守度</span>
                         <span className="text-sm font-black text-emerald-400">{selectedReview.compliance.score}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-white/10 rounded-full mt-2 overflow-hidden">
                         <div 
                           className="h-full bg-emerald-500 rounded-full"
                           style={{ width: `${selectedReview.compliance.score}%` }}
                         />
                       </div>
                    </div>
                  </div>
                </div>

                {/* Sentiment Correlation */}
                <div className="p-6 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">地合いと成績の相関分析</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sentiment Correlation</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                       <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-slate-600 dark:text-slate-400">「追い風（地合い一致）」時の勝率</span>
                         <span className="text-sm font-black text-emerald-500">{Math.round(selectedReview.sentimentCorrelations.tailwindWinRate)}%</span>
                       </div>
                       <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                            style={{ width: `${selectedReview.sentimentCorrelations.tailwindWinRate}%` }}
                          />
                       </div>
                     </div>
                     <div className="space-y-4">
                       <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-slate-600 dark:text-slate-400">「逆風（地合い乖離）」時の勝率</span>
                         <span className="text-sm font-black text-rose-500">{Math.round(selectedReview.sentimentCorrelations.headwindWinRate)}%</span>
                       </div>
                       <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-rose-500 to-orange-400 rounded-full"
                            style={{ width: `${selectedReview.sentimentCorrelations.headwindWinRate}%` }}
                          />
                       </div>
                     </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/10">
                    <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      <Zap size={14} className="inline mr-2 mb-0.5" />
                      分析結果：{selectedReview.sentimentCorrelations.tailwindWinRate > selectedReview.sentimentCorrelations.headwindWinRate 
                        ? "地合いに順応したトレードが高い勝率を支えています。引き続き追い風時を狙いましょう。" 
                        : "地合いに関わらず勝率が安定していますが、逆風時の損失幅に注意が必要です。"}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center p-20 text-center space-y-4 bg-slate-50 dark:bg-slate-800/10 rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                <BarChart3 size={48} className="text-slate-300" />
                <div className="space-y-1">
                  <p className="text-lg font-black text-slate-400">レビューデータがまだありません</p>
                  <p className="text-sm font-bold text-slate-300">本日のトレードを終了したらレビューを生成しましょう</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const StatItem = ({ label, value }: { label: string, value: string | number }) => (
  <div className="flex flex-col">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">{label}</span>
    <span className="text-sm font-black text-slate-800 dark:text-slate-200 tabular-nums">{value}</span>
  </div>
);
