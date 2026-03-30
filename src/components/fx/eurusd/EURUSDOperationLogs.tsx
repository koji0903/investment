"use client";

import React from "react";
import { FXSimulation } from "@/types/fx";
import { History, ShieldAlert, List, ArrowUpRight, ArrowDownRight, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  simulations: FXSimulation[];
  violations: any[];
}

export const EURUSDOperationLogs = ({ simulations, violations }: Props) => {
  const [activeTab, setActiveTab] = React.useState<"trades" | "violations">("trades");

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-slate-800">
        <button
          onClick={() => setActiveTab("trades")}
          className={cn(
            "pb-3 text-[10px] font-black uppercase tracking-widest relative transition-all",
            activeTab === "trades" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
          )}
        >
          EUR/USD トレード履歴
          {activeTab === "trades" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("violations")}
          className={cn(
            "pb-3 text-[10px] font-black uppercase tracking-widest relative transition-all",
            activeTab === "violations" ? "text-rose-400" : "text-slate-500 hover:text-slate-300"
          )}
        >
          規律違反
          {activeTab === "violations" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500" />
          )}
        </button>
      </div>

      <div className="max-h-[500px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {activeTab === "trades" && (
          simulations.length === 0 ? (
            <div className="p-20 text-center text-slate-600 font-bold italic">EUR/USD 履歴なし</div>
          ) : (
            simulations.map((sim) => (
              <div key={sim.id} className="p-4 bg-slate-950/40 border border-slate-900 rounded-3xl flex items-center justify-between group hover:border-slate-700 transition-all shadow-lg">
                 <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      sim.pnl > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                    )}>
                      {sim.side === "buy" ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                    </div>
                    <div>
                       <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black text-slate-200">{sim.side === "buy" ? "買い" : "売り"} {sim.quantity} Lot</span>
                          <span className="text-[9px] font-bold text-slate-500">{new Date(sim.entryTimestamp).toLocaleString()}</span>
                       </div>
                       <p className="text-[10px] font-bold text-slate-400 mt-0.5 max-w-[300px] truncate uppercase tracking-tighter italic opacity-60">Reason: {sim.entryReason}</p>
                    </div>
                 </div>

                 <div className="text-right">
                    <p className={cn(
                      "text-sm font-black tabular-nums",
                      sim.pnl > 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {sim.pnl > 0 ? "+" : ""}{(sim.pnl * 10000).toFixed(1)} <span className="text-[10px]">pips</span>
                    </p>
                    <p className="text-[9px] font-black text-slate-600 uppercase mt-0.5">{sim.exitReason || "COMPLETED"}</p>
                 </div>
              </div>
            ))
          )
        )}

        {activeTab === "violations" && (
          violations.length === 0 ? (
            <div className="p-20 text-center text-slate-600 font-bold italic">規則違反なし</div>
          ) : (
            violations.map((v) => (
              <div key={v.id} className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-3xl flex items-center gap-4 group hover:bg-rose-500/10 transition-all">
                 <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-500">
                    <AlertCircle size={20} />
                 </div>
                 <div>
                    <div className="flex items-center gap-2">
                       <span className="text-[11px] font-black text-rose-400 uppercase tracking-tighter">規律違反を検出</span>
                       <span className="text-[9px] font-bold text-slate-500">{new Date(v.timestamp?.toDate() || 0).toLocaleString()}</span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-300 mt-0.5">{v.reason}</p>
                 </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};
