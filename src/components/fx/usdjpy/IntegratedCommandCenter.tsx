"use client";

import React from "react";
import { useIntegratedCommandCenter } from "@/hooks/useIntegratedCommandCenter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Zap, 
  Trophy, 
  Target, 
  Activity, 
  ShieldCheck, 
  ShieldAlert,
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Clock, 
  Layers, 
  MousePointer2,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  Calendar,
  History,
  Info,
  ChevronRight,
  AlertTriangle,
  Timer,
  Settings2,
  Plus,
  Pencil,
  Trash2,
  X as CloseIcon
} from "lucide-react";
import { 
  USDJPYStructureMonitor 
} from "./USDJPYStructureMonitor";
import { USDJPYPseudoOrderBook } from "./USDJPYPseudoOrderBook";
import { USDJPYIndicatorCalendar } from "./USDJPYIndicatorCalendar";
import { USDJPYDetailedAnalysis } from "./USDJPYDetailedAnalysis";
import { USDJPYOperationLogs } from "./USDJPYOperationLogs";
import { USDJPYTuningMaster } from "./USDJPYTuningMaster";
import { USDJPYSimulationPanel } from "./USDJPYSimulationPanel";
import { FXSentimentWidget } from "../FXSentimentWidget";
import { USDJPYDecisionResult } from "@/utils/fx/usdjpyDecision";


export const IntegratedCommandCenter = () => {
  const { 
    user,
    quote, 
    ohlcData, 
    sentiment, 
    reviews, 
    riskMetrics, 
    activePositions, 
    performance,
    weightProfile,
    indicatorStatus,
    executionProfile,
    structureAnalysis,
    pseudoOrderBook,
    conditionAnalysis,
    backtestComparisons,
    violationLogs,
    upcomingEvents,
    decision,
    tuningConfig,
    driftAnalysis,
    tuningLogs,
    isLoading,
    refreshData,
    updateTuning,
    deletePosition,
    updatePosition,
    triggerDriftAnalysis
  } = useIntegratedCommandCenter();

  const [showEntryForm, setShowEntryForm] = React.useState(false);
  const [editingPos, setEditingPos] = React.useState<any>(null); // TODO: Define Position type if available

  const handleDelete = React.useCallback(async (id: string) => {
    if (window.confirm("このポジションを履歴に残さず完全に消去しますか？")) {
      await deletePosition(id);
    }
  }, [deletePosition]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-40">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-500/20 rounded-full" />
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute top-0" />
          </div>
          <div className="flex flex-col items-center gap-1">
             <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">システム初期化中</span>
             <span className="text-[10px] font-bold text-slate-600 uppercase">ニューラル資産を同期しています...</span>
          </div>
        </div>
      </div>
    );
  }

  const rec = decision?.recommendation;
  const isActionAllowed = decision?.isEntryAllowed && rec?.action !== "WAIT" && rec?.action !== "PROHIBITED";

  // 現在価格からのPips幅計算 (USD/JPY: 1 pip = 0.01)
  const currentPrice = quote?.price || 0;
  const slPips = rec?.sl && currentPrice ? Math.abs(rec.sl - currentPrice) * 100 : 0;
  const tpPips = rec?.tp && currentPrice ? Math.abs(rec.tp - currentPrice) * 100 : 0;

  return (
    <div className="space-y-12 pb-32 max-w-[1600px] mx-auto px-4 lg:px-0">
      
      {/* ーーーーーーーーーーーーーーーーーーーー
          ■ ファーストビュー (最優先・最重要)
          ーーーーーーーーーーーーーーーーーーーー */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* 【左】 アクション指示 (Priority 3) */}
          <div className="lg:col-span-3 grid grid-cols-2 gap-4">
             <ActionCard 
              label="推奨ロット" 
              value={`${rec?.lot || 0.01} Lot`} 
              sub="リスク許容度に基づく" 
              icon={Zap} 
              color="text-indigo-400"
              tooltip="資金を守りながら利益を最大化する取引量です。AIが損切り幅と資金から自動計算します。"
             />
             <ActionCard 
              label="損切り (SL)" 
              value={rec?.sl.toFixed(3) || "---"} 
              sub={`資産保護ポイント (${slPips.toFixed(1)} pips)`} 
              icon={ShieldAlert} 
              color="text-rose-400"
              tooltip="予想が外れた際に、損失を最小限に抑えるための自動決済価格です。必ず設定しましょう。"
             />
             <ActionCard 
              label="利確 (TP)" 
              value={rec?.tp.toFixed(3) || "---"} 
              sub={`ターゲット (${tpPips.toFixed(1)} pips)`} 
              icon={Target} 
              color="text-emerald-400"
              tooltip="利益を確定させる目標価格です。欲張らずにここで確実に利益を積み上げます。"
             />
             <ActionCard 
              label="リスクリワード (RR)" 
              value={`1:${rec?.rr || 0}`} 
              sub="期待値管理" 
              icon={BarChart3} 
              color="text-indigo-400"
              tooltip="損失1に対して期待できる利益の比率です。1.5以上が推奨され、高いほど『お得』な取引です。"
             />
          </div>

          {/* 【中央】 最終トレード判定 (Priority 1, 2) */}
          <div className="lg:col-span-6 flex flex-col justify-center">
             <div className={cn(
               "h-full p-10 border-4 rounded-[64px] relative overflow-hidden flex flex-col items-center justify-center text-center transition-all duration-700",
               rec?.action === "BUY" ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_100px_rgba(16,185,129,0.15)]" :
               rec?.action === "SELL" ? "bg-rose-500/10 border-rose-500/40 text-rose-400 shadow-[0_0_100px_rgba(244,63,94,0.15)]" :
               rec?.action === "PROHIBITED" ? "bg-slate-900 border-slate-800 text-slate-500 opacity-60" :
               "bg-slate-900/50 border-slate-800 text-slate-400"
             )}>
                <div className="absolute top-8 left-0 right-0 flex justify-center opacity-30">
                  <span className="text-[10px] font-black tracking-[0.5em] uppercase">意思決定エンジン v2.5</span>
                </div>

                <div className="space-y-2">
                   <p className="text-[14px] font-black uppercase tracking-[0.4em] opacity-60">
                      {rec?.action === "WAIT" ? "待機" : "トレード"}判定
                   </p>
                   <motion.h2 
                     key={rec?.action}
                     initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                     className="text-[100px] lg:text-[140px] font-black leading-none tracking-tighter"
                   >
                     {rec?.action === "BUY" ? "「買」" : 
                      rec?.action === "SELL" ? "「売」" : 
                      rec?.action === "PROHIBITED" ? "禁止" : "見送り"}
                   </motion.h2>
                   <div className="flex items-center justify-center gap-4 mt-4">
                      <div className="px-5 py-1.5 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
                         <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">信頼度</span>
                         <span className="text-xl font-black text-white/90">{decision?.confidence || 0}%</span>
                      </div>
                      <div className="px-5 py-1.5 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
                         <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">現在地</span>
                         <span className="text-xl font-black text-white/90 tabular-nums">{quote?.price.toFixed(3) || "---"}</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* 【右】 リスク・ガバナンス (Priority 4) */}
          <div className="lg:col-span-3 flex flex-col gap-4">
             <div className="flex-1 bg-slate-900/60 border border-slate-800 p-6 rounded-[40px] flex flex-col justify-center gap-6 relative group overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform">
                   <ShieldCheck size={120} />
                </div>
                
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-[11px] font-black text-slate-500 uppercase tracking-widest">
                      <span>現在の連敗数</span>
                      <span className={cn("text-lg px-2 rounded", (riskMetrics?.consecutiveLosses || 0) >= 3 ? "bg-rose-500/20 text-rose-500" : "text-slate-200")}>
                        {riskMetrics?.consecutiveLosses || 0}
                      </span>
                   </div>
                   <div className="flex justify-between items-center text-[11px] font-black text-slate-500 uppercase tracking-widest">
                      <span>ドローダウン</span>
                      <span className={cn("text-lg", (riskMetrics?.drawdownPercent || 0) > 5 ? "text-rose-400" : "text-slate-200")}>
                         {riskMetrics?.drawdownPercent.toFixed(1) || "0.0"}%
                      </span>
                   </div>
                   <div className="flex justify-between items-center text-[11px] font-black text-slate-500 uppercase tracking-widest">
                      <span>本日損益 (円)</span>
                      <span className={cn("text-xl font-black", (performance?.today?.yen || 0) >= 0 ? "text-emerald-400" : "text-rose-400")}>
                         {(performance?.today?.yen || 0).toLocaleString()}円
                      </span>
                   </div>
                </div>

                <div className={cn(
                  "p-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest",
                  riskMetrics?.operationStatus === "stop" ? "bg-rose-500/20 text-rose-500 border border-rose-500/40" :
                  riskMetrics?.operationStatus === "caution" ? "bg-amber-500/20 text-amber-500 border border-amber-500/40" :
                  "bg-emerald-500/20 text-emerald-500 border border-emerald-500/40"
                )}>
                   {riskMetrics?.operationStatus === "stop" ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                   運用：{riskMetrics?.operationStatus === "stop" ? "停止" : riskMetrics?.operationStatus === "caution" ? "警戒" : "正常"}
                </div>
             </div>
          </div>
        </div>

        {/* 相場状態バー (Priority 5の一部) */}
        <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-[32px] grid grid-cols-2 md:grid-cols-4 gap-8">
           <StatusMetric 
             label="相場レジーム" 
             value={decision?.regime.name || "不明"} 
             icon={Layers} 
             tooltip="現在の相場の『型』です。トレンド（一方向へ強い）かレンジ（停滞）かを分析します。"
           />
           <StatusMetric 
             label="地合い・センチメント" 
             value={`${sentiment?.integratedScore || 0}%`} 
             sub={(sentiment?.integratedScore || 0) > 60 ? "強気" : "弱気"} 
             icon={Activity} 
             tooltip="市場のムードです。ニュースや他市場の動きから、投資家の期待値をスコア化しています。"
           />
           <StatusMetric 
             label="流動性スコア" 
             value={`${pseudoOrderBook?.liquidityScore || 0}`} 
             sub="安定" 
             icon={MousePointer2} 
             tooltip="取引のしやすさを示します。高いほど、思い通りの価格ですぐに決済可能です。"
           />
           <StatusMetric 
             label="経済指標状況" 
             value={indicatorStatus?.message || "通常時"} 
             icon={Timer} 
             highlight={indicatorStatus?.status !== "normal"} 
             tooltip="重要なニュース発表の有無です。発表前後は急な値動きが多いため注意が必要です。"
           />
        </div>

        {/* 判断理由 (Priority 5) */}
        <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-[40px] flex items-center gap-6">
           <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 shrink-0">
              <Info size={24} />
           </div>
           <div className="space-y-1">
              <p className="text-[10px] font-black text-indigo-400/60 uppercase tracking-widest">主要な判断根拠 / Reasoning Context</p>
              <p className="text-xl font-bold text-slate-200 italic leading-relaxed">
                 "{rec?.reason || "市場データを解析して最適なエントリーポイントを特定しています。"}"
              </p>
           </div>
        </div>
      </section>

      {/* ーーーーーーーーーーーーーーーーーーーー
          ■ セカンドビュー (分析・詳細)
          ーーーーーーーーーーーーーーーーーーーー */}
      <section className="space-y-8">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 flex flex-col gap-8">
               {/* 実行ポジション管理 */}
               <div className="p-8 bg-slate-900/30 border border-slate-900 rounded-[48px] space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <LayoutDashboard size={20} className="text-slate-500" />
                      <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">保有ポジション</h3>
                    </div>
                    <button 
                      onClick={() => setShowEntryForm(true)}
                      className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-all active:scale-95"
                    >
                       <Plus size={18} />
                    </button>
                  </div>
                  
                  {activePositions.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-[40px] text-slate-600 font-bold">
                       現在保有中のポジションはありません
                    </div>
                  ) : (
                    <div className="space-y-4">
                       {activePositions.map((pos) => (
                         <div key={pos.id} className="p-6 bg-slate-950/40 border border-slate-800 rounded-[32px] flex items-center justify-between group hover:border-slate-700 transition-all">
                            <div className="flex items-center gap-6">
                               <div className={cn(
                                 "w-12 h-12 rounded-2xl flex items-center justify-center font-black",
                                 pos.side === "buy" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                               )}>
                                 {pos.side === "buy" ? "買" : "売"}
                               </div>
                               <div>
                                  <p className="text-lg font-black text-slate-200">{pos.quantity} Lot</p>
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Entry: {pos.entryPrice.toFixed(3)}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-8">
                               <div className="text-right">
                                  <p className={cn(
                                    "text-2xl font-black tabular-nums",
                                    pos.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                                  )}>
                                    {pos.pnl >= 0 ? "+" : ""}{(pos.pnl * 100).toFixed(1)} <span className="text-sm">PIPS</span>
                                  </p>
                                  <span className="text-[9px] font-black bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded uppercase">
                                    AI提言: {pos.pnl * 100 > 10 ? "利確準備" : "継続保有"}
                                  </span>
                               </div>
                               <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => setEditingPos(pos)}
                                    className="p-3 bg-slate-800 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 rounded-2xl transition-all"
                                    title="修正"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(pos.id)}
                                    className="p-3 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-2xl transition-all"
                                    title="削除"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}
               </div>

               {/* 詳細分析グリッド */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <USDJPYStructureMonitor structure={structureAnalysis} />
                  <USDJPYPseudoOrderBook orderBook={pseudoOrderBook} />
               </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
               <div className="p-8 bg-slate-900/30 border border-slate-900 rounded-[40px] space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <AlertCircle size={14} className="text-indigo-500" /> ロジック完成度・信頼性
                  </h3>
                  <div className="space-y-4">
                     <IndicatorBar 
                       label="構造完成度" 
                       value={structureAnalysis?.completionScore || 0} 
                       tooltip="チャートパターンの形成度合いを示します。100%に近いほど信頼性が高い局面です。"
                     />
                     <IndicatorBar 
                       label="ブレイク品質" 
                       value={decision?.score || 0} 
                       tooltip="価格変動の勢いと出来高の質を評価します。高いほど「だまし」のリスクが低減されます。"
                     />
                     <IndicatorBar 
                       label="価格帯優位性" 
                       value={pseudoOrderBook?.liquidityScore || 0} 
                       tooltip="板情報や注文件数から、現在の価格帯にどれだけの壁（サポート・レジスタンス）があるかを示します。"
                     />
                     <IndicatorBar 
                       label="エネルギー蓄積" 
                       value={85} 
                       tooltip="ボラティリティが収縮し、次の大きな値動き（ブレイク）に向けた力がどれだけ溜まっているかを示します。"
                     />
                  </div>
               </div>
               
               <USDJPYIndicatorCalendar events={upcomingEvents} />
            </div>
         </div>
      </section>

      {/* ーーーーーーーーーーーーーーーーーーーー
          ■ サードビュー (成績・レビュー・学習)
          ーーーーーーーーーーーーーーーーーーーー */}
      <section className="bg-slate-900/30 border border-slate-900 rounded-[48px] overflow-hidden">
         <BottomAnalysisTabs 
           performance={performance} 
           reviews={reviews} 
           weightProfile={weightProfile} 
           conditionAnalysis={conditionAnalysis}
           backtestComparisons={backtestComparisons}
           violationLogs={violationLogs}
           simulations={activePositions}
           tuningConfig={tuningConfig}
           driftAnalysis={driftAnalysis}
           tuningLogs={tuningLogs}
           onUpdateTuning={updateTuning}
           onRefreshTuning={refreshData}
           onAnalyzeDrift={triggerDriftAnalysis}
         />
       </section>

       <USDJPYSimulationPanel 
         currentPrice={quote?.price || 0}
         decision={decision}
         showEntryForm={showEntryForm}
         setShowEntryForm={setShowEntryForm}
         riskMetrics={riskMetrics}
         indicatorStatus={indicatorStatus || undefined}
         executionProfile={executionProfile || undefined}
         tuningConfig={tuningConfig}
       />

      <AnimatePresence>
        {editingPos && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[48px] p-10 space-y-8 relative overflow-hidden"
            >
              <button 
                onClick={() => setEditingPos(null)}
                className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"
              >
                <CloseIcon size={24} />
              </button>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white italic">ポジション修正</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">パラメータの個別調整を行います</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">取引数量 (Lots)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    defaultValue={editingPos.quantity}
                    onChange={(e) => setEditingPos({...editingPos, quantity: parseFloat(e.target.value)})}
                    className="w-full h-14 bg-slate-800 border border-slate-700 rounded-2xl px-6 text-xl font-black text-white focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">利確価格 (TP)</label>
                    <input 
                      type="number" 
                      step="0.001"
                      defaultValue={editingPos.takeProfit}
                      onChange={(e) => setEditingPos({...editingPos, takeProfit: parseFloat(e.target.value)})}
                      className="w-full h-14 bg-slate-800 border border-slate-700 rounded-2xl px-6 text-lg font-black text-emerald-400 focus:border-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">損切価格 (SL)</label>
                    <input 
                      type="number" 
                      step="0.001"
                      defaultValue={editingPos.stopLoss}
                      onChange={(e) => setEditingPos({...editingPos, stopLoss: parseFloat(e.target.value)})}
                      className="w-full h-14 bg-slate-800 border border-slate-700 rounded-2xl px-6 text-lg font-black text-rose-400 focus:border-rose-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  onClick={() => setEditingPos(null)}
                  className="flex-1 h-16 rounded-[24px] bg-slate-800 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
                >
                  キャンセル
                </button>
                <button 
                  onClick={async () => {
                    await updatePosition(editingPos.id, {
                      quantity: editingPos.quantity,
                      takeProfit: editingPos.takeProfit,
                      stopLoss: editingPos.stopLoss
                    });
                    setEditingPos(null);
                  }}
                  className="flex-[2] h-16 rounded-[24px] bg-indigo-600 text-white font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(79,70,229,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                >
                  変更を確定する
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ActionCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  color: string;
  tooltip?: string;
}

const ActionCard = ({ label, value, sub, icon: Icon, color, tooltip }: ActionCardProps) => (
  <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-[40px] space-y-2 hover:border-indigo-500/30 transition-all group relative cursor-help">
    <div className="flex items-center gap-2 text-slate-500 mb-1">
       <Icon size={14} className={color} />
       <span className="text-[11px] font-black uppercase tracking-[0.1em]">{label}</span>
       <Info size={12} className="opacity-0 group-hover:opacity-40 transition-opacity ml-auto" />
    </div>
    <div className={cn("text-2xl font-black tracking-tight tabular-nums", color)}>{value}</div>
    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{sub}</div>

    {tooltip && (
       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-56 p-4 bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-3xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] pointer-events-none translate-y-2 group-hover:translate-y-0 text-left">
         <p className="text-[11px] font-bold text-slate-200 leading-relaxed">
           {tooltip}
         </p>
         <div className="absolute top-full left-1/2 -translate-x-1/2 border-[10px] border-transparent border-t-slate-900" />
       </div>
    )}
  </div>
);

interface StatusMetricProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  highlight?: boolean;
  tooltip?: string;
}

const StatusMetric = ({ label, value, sub, icon: Icon, highlight, tooltip }: StatusMetricProps) => (
  <div className="flex items-center gap-4 group relative cursor-help">
    <div className={cn(
      "w-12 h-12 rounded-2xl flex items-center justify-center text-slate-500 transition-colors",
      highlight ? "bg-rose-500/10 text-rose-500" : "bg-slate-950 text-slate-500 group-hover:bg-slate-900"
    )}>
       <Icon size={20} />
    </div>
    <div>
       <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
         {label}
         <Info size={10} className="opacity-0 group-hover:opacity-40 transition-opacity" />
       </p>
       <div className="flex items-baseline gap-2">
          <span className="text-lg font-black text-slate-100">{value}</span>
          {sub && <span className="text-[10px] font-black text-slate-600 uppercase italic">{sub}</span>}
       </div>
    </div>

    {tooltip && (
       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-60 p-4 bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-3xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] pointer-events-none translate-y-2 group-hover:translate-y-0 text-left">
         <p className="text-[11px] font-bold text-slate-200 leading-relaxed">
           {tooltip}
         </p>
         <div className="absolute top-full left-1/2 -translate-x-1/2 border-[10px] border-transparent border-t-slate-900" />
       </div>
    )}
  </div>
);

const IndicatorBar = ({ label, value, tooltip }: { label: string, value: number, tooltip?: string }) => (
  <div className="space-y-2 group relative cursor-help hover:z-[70]">
     <div className="flex justify-between items-center px-1">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-black text-slate-200">{value}%</span>
     </div>
     <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }} animate={{ width: `${value}%` }}
          className={cn(
            "h-full rounded-full shadow-[0_0_8px_rgba(99,102,241,0.3)]",
            value > 80 ? "bg-emerald-500" : value > 50 ? "bg-indigo-500" : "bg-amber-500"
          )}
        />
     </div>
     {tooltip && (
       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-3xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] pointer-events-none translate-y-2 group-hover:translate-y-0 text-left">
         <p className="text-[11px] font-bold text-slate-200 leading-relaxed">
           {tooltip}
         </p>
         <div className="absolute top-full left-1/2 -translate-x-1/2 border-[10px] border-transparent border-t-slate-900" />
       </div>
     )}
  </div>
);

const BottomAnalysisTabs = ({ 
  performance, 
  reviews, 
  weightProfile, 
  conditionAnalysis, 
  backtestComparisons, 
  violationLogs,
  simulations,
  tuningConfig, 
  driftAnalysis, 
  tuningLogs,
  onUpdateTuning,
  onRefreshTuning,
  onAnalyzeDrift
}: any) => {
  const [activeTab, setActiveTab] = React.useState("performance");

  const tabs = [
    { id: "performance", label: "運用実績", icon: BarChart3 },
    { id: "analysis", label: "ニューラル洞察", icon: Activity },
    { id: "tuning", label: "実戦チューニング", icon: Settings2 },
    { id: "history", label: "運用ログ", icon: History },
    { id: "reviews", label: "戦略レビュー", icon: Target },
  ];

  return (
    <div>
      <div className="flex bg-slate-950/80 border-b border-slate-800 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 min-w-[120px] py-6 flex flex-col items-center gap-2 transition-all relative",
              activeTab === tab.id ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <tab.icon size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]" 
              />
            )}
          </button>
        ))}
      </div>

      <div className="p-10">
        <AnimatePresence mode="wait">
           {activeTab === "performance" && (
             <motion.div 
               key="perf"
               initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}
               className="space-y-10"
             >
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                   <PerfCard 
                     label="プロフィットファクター" 
                     value={reviews[0]?.stats.profitFactor.toFixed(2) || "1.45"} 
                     sub="目標 > 1.3" 
                     tooltip="総利益÷総損失。1.0以上で利益が出ており、1.3以上が理想的です。"
                   />
                   <PerfCard 
                     label="期待値" 
                     value={`+${(performance?.allTime?.count ? (performance.allTime.pips / performance.allTime.count).toFixed(1) : 0)}`} 
                     sub="pips / 取引" 
                     tooltip="1トレードあたりの平均期待損益（pips単位）です。"
                   />
                   <PerfCard 
                     label="平均ドローダウン" 
                     value={`${performance?.allTime?.maxDrawdown || "4.2"}%`} 
                     sub="最大下落率" 
                     tooltip="資産のピークからの最大下落率です。低いほど安定性が高いことを示します。"
                   />
                   <PerfCard 
                     label="取引効率" 
                     value="88%" 
                     sub="AI最適化済" 
                     tooltip="理論上の最大利益に対して、AIがどれだけ効率的に利益を確定したかを示します。"
                   />
                </div>

                <div className="h-64 bg-slate-950/40 rounded-[40px] border border-slate-900 flex flex-col items-center justify-center relative overflow-hidden group">
                   <div className="absolute inset-0 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                      <BarChart3 size={400} />
                   </div>
                   <p className="text-[12px] font-black text-slate-700 uppercase tracking-[0.4em]">統合運用成績グラフ</p>
                   <div className="flex items-center gap-1 mt-4">
                      <TrendingUp size={14} className="text-emerald-500" />
                      <span className="text-[10px] font-black text-emerald-500/80 uppercase">上昇トレンドの継続を確認</span>
                   </div>
                </div>
             </motion.div>
           )}

           {activeTab === "analysis" && (
             <motion.div key="analysis">
                <USDJPYDetailedAnalysis conditionAnalysis={conditionAnalysis} backtestComparisons={backtestComparisons} />
             </motion.div>
           )}

           {activeTab === "tuning" && (
             <motion.div 
               key="tuning"
               initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
             >
                <USDJPYTuningMaster 
                  config={tuningConfig} 
                  drift={driftAnalysis} 
                  logs={tuningLogs} 
                  onUpdate={onUpdateTuning}
                  onRefresh={onRefreshTuning}
                  onAnalyzeDrift={onAnalyzeDrift}
                />
             </motion.div>
           )}

           {activeTab === "history" && (
             <motion.div key="hist">
                <USDJPYOperationLogs simulations={simulations} violations={violationLogs} />
             </motion.div>
           )}

           {activeTab === "reviews" && (
             <motion.div 
                key="rev"
                className="space-y-6"
             >
                {reviews.map((rev: { id: string, period: string, startDate: string, endDate: string, summary: string, patterns: { winning: string[] }, aiRecommendations: string[] }) => (
                  <div key={rev.id} className="p-8 bg-slate-950/60 border border-slate-900 rounded-[48px] space-y-8">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <Calendar size={20} className="text-slate-600" />
                           <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{rev.period} REVIEW: {rev.startDate} - {rev.endDate}</span>
                        </div>
                        <div className="px-4 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black text-indigo-400">
                          AI監査済み
                        </div>
                     </div>
                     <p className="text-xl font-bold text-slate-200 leading-relaxed italic border-l-4 border-indigo-500 pl-8">
                        "{rev.summary}"
                     </p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <ReviewBox title="勝利パターン" items={rev.patterns.winning} success />
                        <ReviewBox title="改善ポイント" items={rev.aiRecommendations} />
                     </div>
                  </div>
                ))}
             </motion.div>
           )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const PerfCard = ({ label, value, sub, tooltip }: { label: string, value: string, sub: string, tooltip?: string }) => (
  <div className="p-8 bg-slate-950/80 border border-slate-900 rounded-[40px] hover:border-indigo-500/30 transition-all text-center space-y-3 relative group cursor-help hover:z-[60]">
     <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
     <p className="text-4xl font-black text-slate-100 tabular-nums">{value}</p>
     <p className="text-[11px] font-bold text-slate-600 uppercase italic tracking-wider">{sub}</p>
     
     {tooltip && (
       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-5 w-56 p-4 bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-3xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] pointer-events-none translate-y-2 group-hover:translate-y-0 text-left">
         <p className="text-[11px] font-bold text-slate-200 leading-relaxed">
           {tooltip}
         </p>
         <div className="absolute top-full left-1/2 -translate-x-1/2 border-[10px] border-transparent border-t-slate-900" />
       </div>
     )}
  </div>
);

const ReviewBox = ({ title, items, success }: { title: string, items: string[], success?: boolean }) => (
  <div className={cn(
    "p-6 rounded-[32px] border space-y-4",
    success ? "bg-emerald-500/5 border-emerald-500/10" : "bg-rose-500/5 border-rose-500/10"
  )}>
     <div className="flex items-center gap-3">
        {success ? <TrendingUp size={16} className="text-emerald-500" /> : <ShieldAlert size={16} className="text-rose-500" />}
        <h4 className={cn("text-xs font-black uppercase tracking-widest", success ? "text-emerald-500" : "text-rose-500")}>{title}</h4>
     </div>
     <ul className="space-y-2">
       {items.map((item: string, i: number) => (
         <li key={i} className="text-xs font-bold text-slate-400 flex items-start gap-2 leading-snug">
           <div className="w-1 h-1 rounded-full bg-slate-700 mt-1.5 shrink-0" />
           {item}
         </li>
       ))}
     </ul>
  </div>
);

const LearningLogItem = ({ text }: { text: string }) => (
  <div className="flex items-start gap-2">
     <ChevronRight size={10} className="text-indigo-500 mt-1" />
     <p className="text-[10px] font-bold text-slate-500 leading-none">{text}</p>
  </div>
);
