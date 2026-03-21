"use client";

import React, { useMemo } from "react";
import { IndustryAnalysis, IndustryRelation } from "@/types/market";
import { motion } from "framer-motion";

interface IndustryRelationshipMapProps {
  analysis: IndustryAnalysis;
}

export const IndustryRelationshipMap: React.FC<IndustryRelationshipMapProps> = ({ analysis }) => {
  // 動的なノード配置ロジック (企業数に応じて半径とサイズを調整)
  const nodes = useMemo(() => {
    const count = analysis.companies.length;
    return analysis.companies.map((c, i) => {
      const angle = (i / count) * 2 * Math.PI;
      // 企業数が多い場合は半径を広げる
      const radius = count > 6 ? 140 : 120;
      return {
        ...c,
        x: 200 + radius * Math.cos(angle),
        y: 200 + radius * Math.sin(angle)
      };
    });
  }, [analysis]);

  const nodeMap = useMemo(() => {
    const map: Record<string, typeof nodes[0]> = {};
    nodes.forEach(n => map[n.id] = n);
    return map;
  }, [nodes]);

  return (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto bg-white/50 dark:bg-slate-900/30 rounded-full border border-slate-100 dark:border-slate-800 p-8 shadow-inner">
      <svg viewBox="0 0 400 400" className="w-full h-full overflow-visible drop-shadow-sm">
        {/* 関係性の線を描画 */}
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="10" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="#cbd5e1" />
          </marker>
        </defs>

        {analysis.relations.map((rel, i) => {
          const from = nodeMap[rel.from];
          const to = nodeMap[rel.to];
          if (!from || !to) return null;

          return (
            <g key={`rel-${i}`}>
              <motion.line
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: i * 0.2 }}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={rel.type === "competitor" ? "#cbd5e1" : "#6366f1"}
                strokeWidth="2"
                strokeDasharray={rel.type === "competitor" ? "4 4" : "0"}
                markerEnd="url(#arrowhead)"
              />
              <text
                x={(from.x + to.x) / 2}
                y={(from.y + to.y) / 2 - 10}
                className="text-[8px] font-black fill-slate-400 dark:fill-slate-500 text-center"
                textAnchor="middle"
              >
                {rel.label}
              </text>
            </g>
          );
        })}

        {/* 企業のノードを描画 */}
        {nodes.map((node, i) => (
          <motion.g
            key={node.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: i * 0.1 }}
          >
            <circle
              cx={node.x}
              cy={node.y}
              r="35"
              className="fill-white dark:fill-slate-800 stroke-2 stroke-indigo-500/20 dark:stroke-indigo-500/30 shadow-lg"
            />
            <foreignObject x={node.x - 30} y={node.y - 30} width="60" height="60">
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-1 overflow-hidden">
                <span className="text-[9px] font-black leading-tight text-slate-800 dark:text-slate-100">
                  {node.name}
                </span>
                <span className="text-[7px] font-bold text-slate-400 dark:text-slate-500 mt-1">
                  {node.symbol}
                </span>
              </div>
            </foreignObject>
          </motion.g>
        ))}
      </svg>
    </div>
  );
};
