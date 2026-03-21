"use client";

import React from "react";
import { Sun, Cloud, CloudRain, CloudLightning } from "lucide-react";
import { IndustryTrend } from "@/types/market";
import { cn } from "@/lib/utils";

interface IndustryTrendBadgeProps {
  trend: IndustryTrend;
  showText?: boolean;
}

const TREND_CONFIG = {
  sunny: {
    icon: Sun,
    label: "快晴",
    className: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    animation: "animate-pulse"
  },
  cloudy: {
    icon: Cloud,
    label: "曇り",
    className: "text-slate-500 bg-slate-500/10 border-slate-500/20",
    animation: ""
  },
  rainy: {
    icon: CloudRain,
    label: "雨",
    className: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    animation: ""
  },
  stormy: {
    icon: CloudLightning,
    label: "嵐",
    className: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    animation: "animate-bounce"
  }
};

export const IndustryTrendBadge: React.FC<IndustryTrendBadgeProps> = ({ trend, showText = true }) => {
  const config = TREND_CONFIG[trend] || TREND_CONFIG.cloudy;
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full border font-black text-xs transition-all",
      config.className
    )}>
      <Icon size={14} className={config.animation} />
      {showText && <span>{config.label}</span>}
    </div>
  );
};
