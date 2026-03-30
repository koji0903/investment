"use client";

import React from "react";
import { motion } from "framer-motion";
import { Box, ArrowUpRight, ArrowDownLeft, ShieldAlert, BarChart3, Info, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { FXPseudoOrderBook } from "@/types/fx";

/**
 * 擬似板情報モニター
 */
export const USDJPYPseudoOrderBook = ({ 
  orderBook 
}: { 
  orderBook: FXPseudoOrderBook | null 
}) => {
  if (!orderBook) return null;

  const maxDepth = Math.max(
    ...orderBook.bids.map(b => b.size),
    ...orderBook.asks.map(a => a.size)
  );

  return (
    <div className="p-8 bg-slate-900 border border-slate-800 rounded-[48px] space-y-8 shadow-2xl relative overflow-hidden group">
      {/* Imbalance Meter */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
           <span className="flex items-center gap-2"><BarChart3 size={14} /> 需給バランス</span>
           <span className={cn(
             "tabular-nums",
             orderBook.imbalance > 0 ? "text-emerald-400" : "text-rose-400"
           )}>
              {orderBook.imbalance > 0 ? "+" : ""}{(orderBook.imbalance * 100).toFixed(1)}%
           </span>
        </div>
        <div className="h-2 w-full bg-slate-800/50 rounded-full flex overflow-hidden border border-slate-800 p-0.5">
           <motion.div 
             initial={{ width: "50%" }}
             animate={{ width: `${50 + (orderBook.imbalance * 50)}%` }}
             className={cn(
               "h-full rounded-full transition-all duration-700",
               orderBook.imbalance > 0.1 ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]" : 
               orderBook.imbalance < -0.1 ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]" : "bg-slate-600"
             )}
           />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-slate-800/30 rounded-3xl overflow-hidden border border-slate-800/50">
        {/* Bids (Buy side) */}
        <div className="bg-slate-900 px-6 py-4 space-y-3">
           <h4 className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-1.5 border-b border-emerald-500/10 pb-2 mb-4">
             <ArrowUpRight size={10} /> 買い注文の強さ
           </h4>
           <div className="space-y-2">
              {orderBook.bids.slice(0, 6).map((bid, i) => (
                <div key={i} className="group/item relative h-6 flex items-center justify-end pr-2 overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${(bid.size / maxDepth) * 100}%` }}
                     className={cn(
                       "absolute right-0 top-0 h-full opacity-10 transition-colors",
                       bid.isWall ? "bg-emerald-500 opacity-20" : "bg-emerald-600"
                     )}
                   />
                   <div className="relative z-10 flex items-center gap-3">
                      {bid.isWall && <div className="text-[8px] font-black text-emerald-400 bg-emerald-400/10 px-1 rounded border border-emerald-400/20">厚い壁</div>}
                      <span className="text-[10px] font-black tabular-nums text-slate-300 tracking-tighter">{bid.price}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Asks (Sell side) */}
        <div className="bg-slate-900 px-6 py-4 space-y-3">
           <h4 className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-1.5 border-b border-rose-500/10 pb-2 mb-4">
             <ArrowDownLeft size={10} /> 売り注文の強さ
           </h4>
           <div className="space-y-2">
              {orderBook.asks.slice(0, 6).map((ask, i) => (
                <div key={i} className="group/item relative h-6 flex items-center justify-start pl-2 overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${(ask.size / maxDepth) * 100}%` }}
                     className={cn(
                       "absolute left-0 top-0 h-full opacity-10 transition-colors",
                       ask.isWall ? "bg-rose-500 opacity-20" : "bg-rose-600"
                     )}
                   />
                   <div className="relative z-10 flex items-center gap-3">
                      <span className="text-[10px] font-black tabular-nums text-slate-300 tracking-tighter">{ask.price}</span>
                      {ask.isWall && <div className="text-[8px] font-black text-rose-400 bg-rose-400/10 px-1 rounded border border-rose-400/20">厚い壁</div>}
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Support/Resistance Summary */}
        <div className="flex flex-wrap gap-2">
           {orderBook.walls.resistance.slice(0, 2).map((price, i) => (
             <div key={i} className="px-3 py-1.5 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-center gap-2">
                <ShieldAlert size={10} className="text-rose-400" />
                <span className="text-[9px] font-black text-rose-400 italic">レジスタンス（抵抗帯）: {price}</span>
             </div>
           ))}
           {orderBook.walls.support.slice(0, 2).map((price, i) => (
             <div key={i} className="px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                <Box size={10} className="text-emerald-400" />
                <span className="text-[9px] font-black text-emerald-400 italic">サポート（支持帯）: {price}</span>
             </div>
           ))}
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-3xl flex items-center gap-4">
           <div className={cn(
             "w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0",
             orderBook.liquidityScore >= 70 ? "bg-indigo-500 shadow-xl shadow-indigo-500/20" : "bg-amber-500 shadow-xl shadow-amber-500/20"
           )}>
             <Zap size={18} fill="currentColor" />
           </div>
           <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">流動性の健全性</p>
              <div className="flex items-baseline gap-2">
                 <h4 className="text-lg font-black text-white">{orderBook.liquidityScore}%</h4>
                 <span className="text-[10px] font-bold text-slate-500 italic">
                   {orderBook.liquidityScore >= 80 ? "執行に最適な状態" : "薄い市場を検出"}
                 </span>
              </div>
           </div>
        </div>
      </div>

      <div className="mt-2 p-3 bg-indigo-500/5 rounded-2xl flex items-center gap-3">
         <Info size={14} className="text-indigo-400 shrink-0" />
         <p className="text-[9px] font-bold text-slate-500 leading-tight uppercase italic">
            注文の密集は主要な反転ゾーンを示唆しています。大きな注文の壁には注意が必要です。
         </p>
      </div>
    </div>
  );
};
