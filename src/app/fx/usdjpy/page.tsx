"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUSDJPYData } from "@/hooks/useUSDJPYData";
import { calculateUSDJPYDecision } from "@/utils/fx/usdjpyDecision";
import { 
  USDJPYPriceBoard, 
  USDJPYTrendMonitor, 
  USDJPYDecisionMonitor,
  USDJPYFilterStatus
} from "@/components/fx/usdjpy/USDJPYComponents";
import { USDJPYSimulationPanel } from "@/components/fx/usdjpy/USDJPYSimulationPanel";
import { USDJPYRiskMonitor } from "@/components/fx/usdjpy/USDJPYRiskMonitor";
import { USDJPYAIInsights } from "@/components/fx/usdjpy/USDJPYAIInsights";
import { USDJPYRegimeMonitor } from "@/components/fx/usdjpy/USDJPYRegimeMonitor";
import { USDJPYStrategyLab } from "@/components/fx/usdjpy/USDJPYStrategyLab";
import { USDJPYIndicatorBanner } from "@/components/fx/usdjpy/USDJPYIndicatorBanner";
import { USDJPYExecutionMonitor } from "@/components/fx/usdjpy/USDJPYExecutionMonitor";
import { USDJPYStructureMonitor } from "@/components/fx/usdjpy/USDJPYStructureMonitor";
import { USDJPYPseudoOrderBook } from "@/components/fx/usdjpy/USDJPYPseudoOrderBook";
import { IntegratedCommandCenter } from "@/components/fx/usdjpy/IntegratedCommandCenter";
import { FXLearningService } from "@/services/fxLearningService";
import { FXSimulationService } from "@/services/fxSimulationService";
import { FXIndicatorService } from "@/services/fxIndicatorService";
import { FXExecutionService } from "@/services/fxExecutionService";
import { FXStructureService } from "@/services/fxStructureService";
import { FXLiquidityService } from "@/services/fxLiquidityService";
import { 
  LearningMetric, 
  FXRiskMetrics, 
  FXWeightProfile, 
  FXExecutionProfile,
  FXStructureAnalysis,
  FXPseudoOrderBook
} from "@/types/fx";
import { checkTradePermission } from "@/utils/fx/tradeGovernance";
import { FXPatternAnalyzer, AnalysisResult } from "@/utils/fx/FXPatternAnalyzer";
import { FXWeightOptimizer } from "@/utils/fx/FXWeightOptimizer";
import { 
  Activity, 
  Zap, 
  Target, 
  LineChart as ChartIcon, 
  BrainCircuit, 
  Settings2,
  AlertCircle,
  MessageSquare,
  ArrowLeft,
  ShieldCheck,
  Cpu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function USDJPYDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* 
          Premium Header Section 
          - Adds "breathing room" (padding)
          - Clear Title Hierarchy
      */}
      <div className="max-w-[1600px] mx-auto px-6 pt-12 md:pt-20 pb-10">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12"
        >
          <div className="space-y-4">
            <Link 
              href="/fx-judgment" 
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-indigo-400 transition-colors group mb-2"
            >
              <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back to Judgment</span>
            </Link>
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic">
                  USD/JPY <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">Day Trading Pro</span>
                </h1>
              </div>
              <p className="text-xs md:text-sm font-bold text-slate-500 tracking-[0.2em] uppercase flex items-center gap-3 mt-2">
                <Cpu size={14} className="text-indigo-500/50" />
                Integrated Neural Command Center v2.5
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-500/80">System Active</span>
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-6">
            <div className="px-6 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-md flex items-center gap-4">
               <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                  <ShieldCheck size={20} />
               </div>
               <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Risk Logic</p>
                  <p className="text-xs font-bold text-slate-200">Verified & Secure</p>
               </div>
            </div>
          </div>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <IntegratedCommandCenter />
        </motion.div>
      </div>
    </div>
  );
}

/**
 * 心理誘導メッセージ・ガイダンス
 */
function USDJPYNeuralMessage({ permission }: { permission: any }) {
  const messages = [
    "「待つこと」は、エントリーすることと同じくらい重要なトレード技術です。",
    "マーケットは逃げません。条件が整うまで虎視眈々と待ちましょう。",
    "規律を守ることは、手法よりもはるかに大きな資産を守ります。",
    "1回の負けに感情を支配されてはいけません。それは統計の一部に過ぎません。",
    "プロのトレーダーは、自分の感情ではなく、自分のルールに従います。"
  ];

  const [index, setIndex] = React.useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => setIndex(i => (i + 1) % messages.length), 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-6 rounded-[32px] border flex items-center gap-4",
        permission?.status === "stop" ? "bg-rose-500/10 border-rose-500/20" : "bg-slate-900 border-slate-900"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
        permission?.status === "stop" ? "bg-rose-500 text-white" : "bg-indigo-500 text-white"
      )}>
        <MessageSquare size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Neural Guidance</p>
        <p className="text-xs font-bold text-slate-300 leading-relaxed italic">
           {permission?.status === "stop" ? permission.reason : `"${messages[index]}"`}
        </p>
      </div>
    </motion.div>
  );
}
