"use client";

import React from "react";
import { FXMarketSentiment } from "@/types/fx";
import { motion } from "framer-motion";
import { Zap, TrendingUp, TrendingDown, Gauge, ShieldCheck, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface FXSentimentWidgetProps {
  sentiment: FXMarketSentiment;
  className?: string;
}

export const FXSentimentWidget: React.FC<FXSentimentWidgetProps> = ({ sentiment, className }) => {
  if (!sentiment) return null;

  return (
    <div className={cn("bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative", className)}>
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full -ml-12 -mb-12 blur-2xl" />

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Activity size={18} className="text-indigo-500" />
            </div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
              広域マーケット地合い
            </h3>
          </div>
          <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-500 dark:text-slate-400">
            {new Date(sentiment.updatedAt).toLocaleTimeString()} 更新
          </div>
        </div>

        {/* Strength Gauges */}
        <div className="grid grid-cols-2 gap-4">
          <StrengthMeter 
            label="USD 強弱" 
            value={sentiment.usdStrength} 
            status={sentiment.usdLabel}
            color="indigo"
          />
          <StrengthMeter 
            label="JPY 強弱" 
            value={sentiment.jpyStrength} 
            status={sentiment.jpyLabel}
            color="rose"
          />
        </div>

        {/* Integrated status */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
             <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">USD/JPY への影響</span>
             <div className={cn(
               "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black shadow-sm",
               sentiment.integratedScore > 65 ? "bg-emerald-500 text-white" :
               sentiment.integratedScore < 35 ? "bg-rose-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
             )}>
               {sentiment.integratedScore > 65 ? <TrendingUp size={14} /> : 
                sentiment.integratedScore < 35 ? <TrendingDown size={14} /> : <Zap size={14} />}
               <span>{sentiment.integratedScore > 65 ? "強力な追い風" : sentiment.integratedScore < 35 ? "強い逆風" : "中立"}</span>
             </div>
          </div>
          
          <div className="space-y-2">
            {sentiment.reasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-tight">
                  {reason}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Cross Yen Status */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800/50">
           <div className="flex items-center gap-2">
             <span className="text-[10px] font-black text-slate-400 uppercase">クロス円全体の方向性</span>
             <ShieldCheck size={12} className="text-slate-300" />
           </div>
           <span className={cn(
             "text-xs font-black px-2 py-0.5 rounded-md",
             sentiment.crossYenSentiment === "bullish" ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" :
             sentiment.crossYenSentiment === "bearish" ? "text-rose-500 bg-rose-50 dark:bg-rose-500/10" :
             "text-slate-400 bg-slate-50 dark:bg-slate-800/50"
           )}>
             {sentiment.crossYenSentiment === "bullish" ? "強気" : 
              sentiment.crossYenSentiment === "bearish" ? "弱気" : "中立"}
           </span>
        </div>
      </div>
    </div>
  );
};

const StrengthMeter = ({ label, value, status, color }: { label: string, value: number, status: string, color: "indigo" | "rose" }) => {
  const isIndigo = color === "indigo";
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-400 uppercase">{label}</span>
        <span className={cn(
          "text-[10px] font-black",
          isIndigo ? "text-indigo-500" : "text-rose-500"
        )}>{status}</span>
      </div>
      <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full shadow-sm",
            isIndigo ? "bg-indigo-500" : "bg-rose-500"
          )}
        />
        {/* Center Marker */}
        <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white/30 -ml-[1px]" />
      </div>
      <div className="flex justify-between items-center mt-0.5">
        <span className="text-[9px] font-bold text-slate-300">弱</span>
        <span className="text-[10px] font-black tabular-nums text-slate-500">{Math.round(value)}</span>
        <span className="text-[9px] font-bold text-slate-300">強</span>
      </div>
    </div>
  );
};
