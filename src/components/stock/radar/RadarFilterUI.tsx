"use client";

import React, { useState } from "react";
import { RadarFilter } from "@/types/radar";
import { X, Check, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";

export const RadarFilterUI = ({ initialFilter, onApply, onClose }: any) => {
  const [f, setF] = useState(initialFilter);
  const sectors = ["情報・通信業", "電気機器", "輸送用機器", "銀行業", "卸売業", "化学", "医薬品"];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl bg-white dark:bg-slate-950 rounded-[40px] shadow-2xl overflow-hidden border border-white/20">
        <div className="flex items-center justify-between p-8 border-b">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl"><SlidersHorizontal size={24} /></div>
            <h2 className="text-2xl font-black dark:text-white tracking-tight">探索フィルタ</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"><X size={24} /></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">最低時価総額</label><input type="number" value={f.minMarketCap} onChange={e=>setF({...f, minMarketCap: Number(e.target.value)})} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl font-bold" /></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">PER 上限</label><input type="number" value={f.perRange[1]} onChange={e=>setF({...f, perRange: [0, Number(e.target.value)]})} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl font-bold" /></div>
          </div>
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">重点セクター</label>
             <div className="flex flex-wrap gap-2">
               {sectors.map(s => <button key={s} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-500">{s}</button>)}
             </div>
          </div>
        </div>
        <div className="p-8 border-t bg-slate-50 dark:bg-slate-900/50">
          <button onClick={() => onApply(f)} className="w-full py-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl font-black shadow-xl flex items-center justify-center gap-2"><Check size={18} /> フィルタ適用</button>
        </div>
      </motion.div>
    </div>
  );
};
