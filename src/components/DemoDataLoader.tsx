"use client";

import React, { useState } from "react";
import { Sparkles, AlertTriangle, Loader2 } from "lucide-react";
import { generateDemoData, clearPortfolioData } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import { usePortfolio } from "@/context/PortfolioContext";
import { cn } from "@/lib/utils";

export const DemoDataLoader = () => {
  const { user } = useAuth();
  const { calculatedAssets } = usePortfolio();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLoadDemo = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (calculatedAssets.length > 0) {
        await clearPortfolioData(user.uid);
      }
      await generateDemoData(user.uid);
      setShowConfirm(false);
    } catch (error) {
      console.error("Demo data load error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-4 py-2 rounded-xl border border-indigo-500/20 transition-all text-xs font-bold"
        >
          <Sparkles className="w-4 h-4" />
          デモデータを読み込む
        </button>
      ) : (
        <div className="flex items-center gap-4 bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 text-amber-500 text-xs font-bold">
            <AlertTriangle className="w-4 h-4" />
            既存のデータが削除されます。よろしいですか？
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadDemo}
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "はい、上書きします"}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={loading}
              className="text-slate-400 hover:text-slate-100 px-2 py-1.5 text-[10px] font-bold transition-all"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
