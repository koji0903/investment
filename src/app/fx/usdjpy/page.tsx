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
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function USDJPYDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <IntegratedCommandCenter />
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
