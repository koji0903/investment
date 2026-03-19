"use client";

import React from "react";
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar,
  Zap,
  RotateCcw,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

const STORY_EVENTS = [
  {
    date: "2022年4月",
    title: "投資開始",
    description: "リスクを抑え、まずは投資信託（S&P500）を中心に月3万円の積立を開始。",
    icon: <Calendar className="w-4 h-4" />,
    type: "neutral"
  },
  {
    date: "2022年11月",
    title: "仮想通貨への挑戦",
    description: "ビットコイン(BTC)が安値圏にあると判断し、初のスポット購入。これが大きな利益に。",
    icon: <Zap className="w-4 h-4 text-amber-500" />,
    type: "success"
  },
  {
    date: "2023年6月",
    title: "個別株での失敗",
    description: "SNSで話題の成長株に飛び乗るも、決算後に急落。損切りが遅れ、資産の10%を失う。",
    icon: <RotateCcw className="w-4 h-4 text-rose-500" />,
    type: "failure"
  },
  {
    date: "2024年1月",
    title: "ポートフォリオ再構築",
    description: "リスク許容度を「バランス」に見直し。高配当株とFXのヘッジを組み合わせ、安定化を図る。",
    icon: <Target className="w-4 h-4 text-indigo-500" />,
    type: "neutral"
  }
];

export const DemoStory = () => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[var(--radius-card)] shadow-sm overflow-hidden flex flex-col lg:flex-row animate-in fade-in duration-700">
      {/* タイムラインセクション */}
      <div className="lg:w-2/3 p-6 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-6">
          <History className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Investor's Story: 2年の歩み</h3>
        </div>
        
        <div className="relative space-y-6 before:absolute before:inset-0 before:left-2 before:h-full before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800 before:content-['']">
          {STORY_EVENTS.map((event, idx) => (
            <div key={idx} className="relative pl-10">
              <div className={cn(
                "absolute left-0 top-1 p-1 bg-white dark:bg-slate-900 border-2 rounded-full z-10 translate-x-[-1px]",
                event.type === "success" ? "border-emerald-500" : 
                event.type === "failure" ? "border-rose-500" : 
                "border-slate-300 dark:border-slate-700"
              )}>
                {event.icon}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{event.date}</span>
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    event.type === "success" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : 
                    event.type === "failure" ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" : 
                    "bg-slate-50 text-slate-500 dark:bg-slate-800"
                  )}>
                    {event.title}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
                  "{event.description}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 分析セクション */}
      <div className="lg:w-1/3 p-6 bg-slate-50/50 dark:bg-slate-800/20 space-y-6">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            成功と教訓
          </h4>
          <ul className="space-y-2">
            <li className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
              <span className="text-emerald-500 font-bold">•</span>
              徹底した分散: 4資産クラスへの分散が暴落時のクッションに。
            </li>
            <li className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
              <span className="text-emerald-500 font-bold">•</span>
              複利の効果: 2年間の配当再投資が現在の含み益の柱となった。
            </li>
          </ul>
        </div>

        <div>
          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
            <TrendingDown className="w-4 h-4 text-rose-500" />
            失敗と反省
          </h4>
          <ul className="space-y-2">
            <li className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
              <span className="text-rose-500 font-bold">•</span>
              感情的な売買: 2023年の損切り遅れは、価格への執着が原因。
            </li>
          </ul>
        </div>

        <div>
          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            現在の課題
          </h4>
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              仮想通貨の評価額が上昇しすぎたため、全体のボラティリティが増大。適切な利益確定とリバランスが急務。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
