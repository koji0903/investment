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
    { id: "growth", label: "高成長株", desc: "売上・利益が急上昇", icon: <TrendingUp size={22} />, color: "from-indigo-600 to-blue-500", stocks: data.growth },
    { id: "value", label: "割安銘柄", desc: "PBR1倍割れ・低PER", icon: <BarChart size={22} />, color: "from-emerald-600 to-teal-500", stocks: data.value },
    { id: "dividend", label: "安定利回り", desc: "高配当・低パウアウト", icon: <Coins size={22} />, color: "from-amber-600 to-orange-500", stocks: data.dividend },
    { id: "trend", label: "強気波形", desc: "移動平均線が上向き", icon: <Zap size={22} />, color: "from-rose-600 to-pink-500", stocks: data.trend },
    { id: "rebound", label: "底打ち期待", desc: "RSI低位・反発狙い", icon: <ArrowDownCircle size={22} />, color: "from-purple-600 to-violet-500", stocks: data.rebound },
  ];

  return (
    <div className="space-y-16">
      {categories.map((cat) => (
        <section key={cat.id} className="space-y-8">
          <div className="flex items-center justify-between border-l-4 border-indigo-500 pl-6">
            <div>
              <div className="flex items-center gap-3">
                <span className={cn("text-xs font-black px-2 py-0.5 rounded bg-gradient-to-r text-white shadow-sm uppercase tracking-widest", cat.color)}>
                  {cat.id}
                </span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">{cat.label}</h3>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{cat.desc}</p>
            </div>
          </div>
          {cat.stocks && cat.stocks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {cat.stocks.map((stk) => <SmallStockCard key={stk.ticker} stock={stk} />)}
            </div>
          ) : (
            <div className="py-12 text-center rounded-[32px] border-2 border-dashed border-slate-100 dark:border-slate-800/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">現在のフィルター条件に合致する銘柄はありません</p>
            </div>
          )}
        </section>
      ))}
    </div>
  );
};

const SmallStockCard = ({ stock }: { stock: RadarResult }) => (
  <motion.div 
    whileHover={{ y: -5 }} 
    className="group p-6 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500"
  >
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-500">{stock.ticker}</div>
        <div>
          <h4 className="text-base font-black text-slate-800 dark:text-white truncate max-w-[140px] leading-tight">{stock.companyName}</h4>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{stock.sector}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-lg font-black text-slate-900 dark:text-white leading-tight">{stock.currentPrice.toLocaleString()}円</div>
        <div className={cn("text-[10px] font-black", stock.totalScore > 0 ? "text-emerald-500" : "text-rose-500")}>
          SCORE: {stock.totalScore.toFixed(0)}
        </div>
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-3 mb-6">
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3">
        <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Market Cap</div>
        <div className="text-xs font-black text-slate-700 dark:text-slate-200">{stock.marketCap.toFixed(1)}兆円</div>
      </div>
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3">
        <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Yield</div>
        <div className="text-xs font-black text-emerald-500">{stock.dividendYield.toFixed(2)}%</div>
      </div>
    </div>

    <button className="w-full py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all uppercase tracking-widest flex items-center justify-center gap-2">
      <Plus size={14} /> Add to Watchlist
    </button>
  </motion.div>
);
