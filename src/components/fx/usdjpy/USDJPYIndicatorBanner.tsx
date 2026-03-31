"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertCircle, 
  ShieldCheck, 
  ShieldAlert, 
  Timer, 
  BellRing, 
  ChevronDown, 
  ChevronUp,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FXEconomicEvent } from "@/types/fx";

/**
 * 経済指標・イベント警戒インジケーター (Floating Version)
 */
export const USDJPYIndicatorBanner = ({ 
  status, 
  message, 
  nextEvent, 
  minutesToEvent 
}: { 
  status: "normal" | "caution" | "prohibited";
  message: string;
  nextEvent?: FXEconomicEvent;
  minutesToEvent?: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // ステータスに応じたテーマ設定
  const themes = {
    prohibited: {
      bg: "bg-rose-500/90",
      border: "border-rose-400/50",
      text: "text-white",
      glow: "shadow-[0_0_20px_rgba(244,63,94,0.3)]",
      icon: <ShieldAlert size={18} className="animate-pulse" />
    },
    caution: {
      bg: "bg-amber-500/90",
      border: "border-amber-400/50",
      text: "text-white",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.3)]",
      icon: <AlertCircle size={18} className="animate-bounce" />
    },
    normal: {
      bg: "bg-slate-900/80",
      border: "border-slate-800",
      text: "text-slate-300",
      glow: "shadow-xl",
      icon: <ShieldCheck size={18} className="text-emerald-500" />
    }
  };

  const currentTheme = themes[status];

  return (
    <div className="sticky top-0 md:fixed md:top-6 md:right-6 z-[100] w-full md:w-auto p-4 md:p-0 flex flex-col items-center md:items-end gap-3 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          className="pointer-events-auto"
        >
          {/* メインチップ */}
          <motion.div 
            onClick={() => setIsExpanded(!isExpanded)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "cursor-pointer backdrop-blur-xl border rounded-[22px] px-4 py-2.5 flex items-center gap-3 transition-all duration-500",
              currentTheme.bg,
              currentTheme.border,
              currentTheme.text,
              currentTheme.glow
            )}
          >
            <div className="flex items-center gap-2">
              {currentTheme.icon}
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-0.5">
                  {status === "normal" ? "System Safe" : "Market Alert"}
                </span>
                <span className="text-[12px] font-bold tracking-tight">
                  {status === "normal" ? "通常運用" : message.replace(/【.*?】/, "")}
                </span>
              </div>
            </div>

            {(nextEvent || status !== "normal") && (
              <div className="flex items-center gap-2 pl-2 border-l border-current/20 ml-1">
                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-1.5 font-black tabular-nums">
                      <Timer size={12} className="opacity-70" />
                      <span className="text-[11px]">
                        {minutesToEvent !== undefined ? 
                          (minutesToEvent > 0 ? `${minutesToEvent}m` : "LIVE") 
                          : "--"}
                      </span>
                   </div>
                </div>
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            )}
          </motion.div>

          {/* 展開時詳細パネル */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={cn(
                  "mt-3 w-72 backdrop-blur-2xl border rounded-[32px] p-5 shadow-2xl",
                  "bg-slate-900/95 border-slate-800 text-slate-300"
                )}
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      status === "prohibited" ? "bg-rose-500/20 text-rose-400" :
                      status === "caution" ? "bg-amber-500/20 text-amber-400" :
                      "bg-emerald-500/20 text-emerald-400"
                    )}>
                      <Info size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status Details</p>
                      <p className="text-xs font-bold leading-relaxed">{message}</p>
                    </div>
                  </div>

                  {nextEvent && (
                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
                       <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                          <BellRing size={12} />
                          <span>Upcoming Metric</span>
                       </div>
                       <p className="text-[11px] font-bold text-white">{nextEvent.name}</p>
                       <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-slate-500">Importance</span>
                          <span className={cn(
                            "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                            nextEvent.importance === "high" ? "bg-rose-500/20 text-rose-400" : "bg-blue-500/20 text-blue-400"
                          )}>
                            {nextEvent.importance}
                          </span>
                       </div>
                    </div>
                  )}

                  <p className="text-[9px] text-center text-slate-500 font-bold italic">
                    ※ 指標発表前後のハイボラティリティに注意してください。
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
