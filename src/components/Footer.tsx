"use client";

import React, { useState } from "react";
import { APP_VERSION, UPDATE_HISTORY } from "@/lib/updateHistory";
import { 
  Info, 
  History, 
  ExternalLink, 
  ChevronRight, 
  ShieldCheck, 
  X,
  Sparkles,
  Rocket,
  Wrench
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const Footer = () => {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <footer className="mt-20 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand & Version */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-black">
                A
              </div>
              <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Antigravity Invest</span>
            </div>
            <p className="text-xs font-bold text-slate-400 leading-relaxed">
              AIとデータを活用し、感情を排除した論理的な投資体験を提供します。
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">VERSION {APP_VERSION}</span>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform</h4>
            <ul className="space-y-2">
              <li>
                <button className="text-xs font-bold text-slate-500 hover:text-indigo-500 transition-colors flex items-center gap-2">
                  <ChevronRight size={12} /> チュートリアル
                </button>
              </li>
              <li>
                <button className="text-xs font-bold text-slate-500 hover:text-indigo-500 transition-colors flex items-center gap-2">
                  <ChevronRight size={12} /> リスク開示
                </button>
              </li>
              <li>
                <button className="text-xs font-bold text-slate-500 hover:text-indigo-500 transition-colors flex items-center gap-2">
                  <ChevronRight size={12} /> プライバシーポリシー
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Support</h4>
            <ul className="space-y-2">
              <li>
                <button className="text-xs font-bold text-slate-500 hover:text-indigo-500 transition-colors flex items-center gap-2">
                  <ChevronRight size={12} /> ヘルプセンター
                </button>
              </li>
              <li>
                <button className="text-xs font-bold text-slate-500 hover:text-indigo-500 transition-colors flex items-center gap-2">
                  <ChevronRight size={12} /> APIドキュメント
                </button>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Environment</h4>
            <button 
              onClick={() => setShowHistory(true)}
              className="w-full p-4 bg-indigo-500 rounded-2xl text-white font-black text-xs flex items-center justify-between group shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
            >
              <div className="flex items-center gap-2">
                <History size={16} />
                環境更新履歴
              </div>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <ShieldCheck size={18} className="text-emerald-500" />
              <span className="text-[10px] font-bold text-slate-500">デモ環境: データは24時間後にリセットされます</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-bold text-slate-400">
            © 2026 Antigravity Investment AI Engine. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <button className="text-[10px] font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">Term of Service</button>
            <button className="text-[10px] font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">Security Strategy</button>
          </div>
        </div>
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl max-h-[80vh] bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl z-[101] overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500 rounded-lg text-white">
                    <History size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white leading-none">環境更新記録</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Updates & Milestones</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto max-h-[calc(80vh-100px)] space-y-8">
                {UPDATE_HISTORY.map((log, i) => (
                  <div key={log.version} className="relative pl-8 border-l border-slate-200 dark:border-slate-800 pb-2">
                    {/* Circle */}
                    <div className={cn(
                      "absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900",
                      i === 0 ? "bg-indigo-500 scale-125" : "bg-slate-200 dark:bg-slate-700"
                    )} />
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">
                          v{log.version}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">{log.date}</span>
                        <span className={cn(
                          "text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
                          log.tag === "New" ? "bg-emerald-500 text-white" :
                          log.tag === "Fix" ? "bg-rose-500 text-white" : "bg-blue-500 text-white"
                        )}>
                          {log.tag}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white">{log.title}</h4>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                        {log.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </footer>
  );
};
