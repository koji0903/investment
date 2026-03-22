"use client";

import { RadarResult, RadarCategory } from "@/types/radar";
import { TrendingUp, BarChart, Coins, Zap, ArrowDownCircle, ChevronRight, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RadarRecommendationsProps {
  data?: Record<RadarCategory, RadarResult[]>;
}

export const RadarRecommendations: React.FC<RadarRecommendationsProps> = ({ data }) => {
  if (!data) return null;

  const categories = [
    { id: "growth", label: "グロース候補", desc: "売上・利益が急成長中", icon: <TrendingUp size={24} />, color: "from-indigo-500 to-blue-500", stocks: data.growth },
    { id: "value", label: "割安株候補", desc: "実力に対し株価が低迷", icon: <BarChart size={24} />, color: "from-emerald-500 to-teal-500", stocks: data.value },
    { id: "dividend", label: "高配当株候補", desc: "利回りと還元意欲を重視", icon: <Coins size={24} />, color: "from-amber-500 to-orange-500", stocks: data.dividend },
    { id: "trend", label: "トレンド強銘柄", desc: "上昇チャートの波に乗る", icon: <Zap size={24} />, color: "from-rose-500 to-pink-500", stocks: data.trend },
    { id: "rebound", label: "リバウンド候補", desc: "売られすぎからの回復狙い", icon: <ArrowDownCircle size={24} />, color: "from-purple-500 to-violet-500", stocks: data.rebound },
  ];

  return (
    <div className="space-y-12">
      {categories.map((cat) => (
        <section key={cat.id} className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", `bg-gradient-to-br ${cat.color}`)}>{cat.icon}</div>
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{cat.label}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{cat.desc}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {cat.stocks.map((stk) => <SmallStockCard key={stk.ticker} stock={stk} />)}
          </div>
        </section>
      ))}
    </div>
  );
};

const SmallStockCard = ({ stock }: { stock: RadarResult }) => (
  <motion.div whileHover={{ scale: 1.02, y: -2 }} className="p-5 bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-lg flex items-center justify-between gap-4">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black">{stock.ticker}</div>
      <div>
        <h4 className="text-sm font-black text-slate-800 dark:text-white truncate max-w-[120px]">{stock.companyName}</h4>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-emerald-500">{stock.currentPrice.toLocaleString()}円</span>
          <span className={cn("text-[10px] font-black px-1.5 py-0.5 rounded", stock.totalScore > 0 ? "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" : "text-slate-400")}>+{stock.totalScore}</span>
        </div>
      </div>
    </div>
    <button className="w-10 h-10 rounded-full border flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all"><Plus size={18} /></button>
  </motion.div>
);
