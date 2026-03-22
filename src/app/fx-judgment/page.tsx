import React from "react";
import { FXJudgmentDashboard } from "@/components/fx/FXJudgmentDashboard";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "FX 投資判断エンジン | 資産運用アシスタント",
  description: "全通貨ペアに対するテクニカル・ファンダメンタル・スワップ統合分析エンジン",
};

export default function FXJudgmentPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <FXJudgmentDashboard />
      </main>

      <Footer />
    </div>
  );
}
