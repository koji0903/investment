"use client";
import React from "react"; import Link from "next/link"; import { Search, ArrowRight } from "lucide-react"; import { motion } from "framer-motion";

export const RadarLinkCard = () => (
  <Link href="/market-radar">
    <motion.div whileHover={{ y: -5 }} className="p-8 rounded-[40px] bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-2xl relative overflow-hidden">
      <div className="relative z-10 space-y-4">
        <Search size={32} />
        <h2 className="text-3xl font-black">マーケット<br />レーダー</h2>
        <p className="text-xs text-slate-400">市場をスキャンし、AIが有望株をリアルタイムで捕捉。</p>
        <div className="flex justify-between items-center pt-4">
          <span className="text-[10px] uppercase font-black tracking-widest opacity-50">Market Radar</span>
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-900"><ArrowRight size={20} /></div>
        </div>
      </div>
    </motion.div>
  </Link>
);
