"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ShieldCheck, ShieldAlert, Timer, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import { FXEconomicEvent } from "@/types/fx";

/**
 * 経済指標・イベント警戒バナー
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
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "px-6 py-2 border-b flex items-center justify-between sticky top-16 z-40 backdrop-blur-md transition-colors",
          status === "prohibited" ? "bg-rose-500/90 border-rose-400 text-white" :
          status === "caution" ? "bg-amber-500/90 border-amber-400 text-white" :
          "bg-slate-900/50 border-slate-800 text-slate-400"
        )}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {status === "prohibited" ? <ShieldAlert size={16} className="animate-pulse" /> :
             status === "caution" ? <AlertCircle size={16} className="animate-bounce" /> :
             <ShieldCheck size={16} className="text-emerald-500" />}
            <span className="text-[11px] font-black uppercase tracking-widest">
              {status === "normal" ? "System Safe" : "Market Alert"}
            </span>
          </div>
          
          <div className="h-4 w-px bg-current opacity-20" />
          
          <p className="text-xs font-bold tracking-tight">
            {message}
          </p>
        </div>

        {nextEvent && (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <BellRing size={14} className={cn(status !== "normal" && "animate-ring")} />
              <span className="text-[10px] font-black opacity-80 uppercase tracking-tighter">
                Next: {nextEvent.name}
              </span>
            </div>

            <div className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black border",
              status === "prohibited" ? "bg-white/20 border-white/30" : "bg-slate-950/30 border-slate-800"
            )}>
              <Timer size={12} />
              <span className="tabular-nums">
                {minutesToEvent && minutesToEvent > 0 ? `IN ${minutesToEvent}m` : "LIVE NOW"}
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
