"use client";

import React from "react";
import { RadarDashboardData } from "@/types/radar";
import { 
  ResponsiveContainer, 
  Treemap, 
  Tooltip, 
  Cell 
} from "recharts";
import { motion } from "framer-motion";
import { Zap, TrendingUp, BarChart3, Activity } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface RadarMarketOverviewProps {
  data: RadarDashboardData | null;
}

export const RadarMarketOverview: React.FC<RadarMarketOverviewProps> = ({ data }) => {
  if (!data) return null;

  const { marketOverview } = data;
  const { sentiment, sectors, topGainers, topVolume } = marketOverview;

  // Treemap用データの形成
  const treemapData = sectors.map(s => ({
    name: s.name,
    size: s.marketCap,
    avgReturn: s.avgReturn,
  }));

  const CustomizedContent = (props: any) => {
    const { x, y, width, height, index, name, avgReturn } = props;
    if (width < 30 || height < 30) return null;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: avgReturn > 10 ? "#10b981" : avgReturn > 0 ? "#34d399" : avgReturn > -10 ? "#6366f1" : "#f43f5e",
            stroke: "#fff",
            strokeWidth: 2,
            strokeOpacity: 0.1,
          }}
        />
        {width > 60 && height > 40 && (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fff"
            fontSize={Math.min(width / 6, 12)}
            fontWeight="900"
            className="pointer-events-none"
          >
            {name}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Upper Grid: Sentiment & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mt-1">セクター別ヒートマップ</h3>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <Treemap
                data={treemapData}
                dataKey="size"
                aspectRatio={4/3}
                stroke="#fff"
                content={<CustomizedContent />}
              >
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-700 shadow-2xl text-[10px] font-bold">
                          <p className="mb-1 text-slate-400 uppercase tracking-widest">{data.name}</p>
                          <p className="text-base font-black">時価総額: {data.size.toFixed(2)}兆円</p>
                          <p className={cn("mt-1", data.avgReturn > 0 ? "text-emerald-400" : "text-rose-400")}>
                            平均スコア: {data.avgReturn > 0 ? "+" : ""}{data.avgReturn.toFixed(1)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </Treemap>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-4 flex items-center gap-1">
            <Zap size={10} className="text-indigo-500" />
            矩形の大きさは主要銘柄の時価総額合計、色は平均相関スコアを示します。
          </p>
        </div>

        <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden flex flex-col justify-between border border-slate-800 shadow-2xl">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-indigo-400">
                <Activity size={20} />
              </div>
              <h3 className="text-xl font-black mt-1">市場期待値</h3>
            </div>
            
            <div className="space-y-6">
              <div className="relative h-4 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${sentiment.score}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-emerald-500 to-rose-500"
                />
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-5xl font-black tracking-tighter mb-1">{sentiment.score.toFixed(0)}</div>
                  <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Sentiment Score</div>
                </div>
                <div className="text-right">
                  <div className={cn("text-xl font-black mb-1", sentiment.score > 60 ? "text-emerald-400" : "text-indigo-400")}>
                    {sentiment.label}
                  </div>
                  <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Markel Outlook</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-2">
            <SentimentMiniCard label="強気" count={sentiment.bullishCount} color="text-emerald-400" />
            <SentimentMiniCard label="中立" count={sentiment.neutralCount} color="text-slate-400" />
            <SentimentMiniCard label="弱気" count={sentiment.bearishCount} color="text-rose-400" />
          </div>
        </div>
      </div>

      {/* Rankings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RankingSection title="AI 高評価銘柄" stocks={topGainers} icon={<TrendingUp size={18} />} color="emerald" />
        <RankingSection title="出来高上位" stocks={topVolume} icon={<Activity size={18} />} color="indigo" />
      </div>
    </div>
  );
};

const SentimentMiniCard = ({ label, count, color }: { label: string; count: number; color: string }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
    <div className={cn("text-xs font-black mb-1", color)}>{label}</div>
    <div className="text-lg font-black">{count}</div>
  </div>
);

const RankingSection = ({ title, stocks, icon, color }: { title: string; stocks: any[]; icon: any; color: string }) => (
  <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
    <div className="flex items-center gap-3 mb-6">
      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg", `bg-${color}-500`)}>
        {icon}
      </div>
      <h3 className="font-black text-slate-800 dark:text-white mt-1 uppercase tracking-tight">{title}</h3>
    </div>
    <div className="space-y-3">
      {stocks.map((s, idx) => (
        <div key={s.ticker} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-slate-300 w-4">{idx + 1}</span>
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">{s.ticker}</div>
            <div className="min-w-0">
              <div className="text-sm font-black text-slate-800 dark:text-white truncate max-w-[150px]">{s.companyName}</div>
              <div className="text-[10px] font-bold text-slate-400 truncate">{s.sector}</div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-black text-slate-900 dark:text-white">{s.currentPrice.toLocaleString()}円</div>
            <div className={cn("text-[10px] font-black", s.totalScore > 0 ? "text-emerald-500" : "text-rose-500")}>
              {s.totalScore > 0 ? "+" : ""}{s.totalScore.toFixed(0)} pts
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
