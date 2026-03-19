"use client";

import { DashboardHeader } from "@/components/DashboardHeader";
import { AssetCard } from "@/components/AssetCard";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { usePortfolio } from "@/context/PortfolioContext";

export default function Home() {
  const { calculatedAssets, totalAssetsValue, totalProfitAndLoss } = usePortfolio();

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 lg:p-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
            My Portfolio
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            あなたのすべての資産を一つの場所で管理
          </p>
        </header>

        <section>
          <DashboardHeader 
            totalAssets={totalAssetsValue} 
            totalProfitAndLoss={totalProfitAndLoss} 
          />
        </section>

        <section className="pt-4 grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          <div className="xl:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                資産内訳
              </h2>
              <div className="text-sm font-medium text-slate-500 bg-slate-200/50 dark:bg-slate-800/50 px-3 py-1 rounded-full">
                {calculatedAssets.length} 件の資産
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {calculatedAssets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          </div>
          
          <div className="xl:col-span-1 flex flex-col gap-6 sticky top-8">
            <TransactionForm />
            <TransactionList />
          </div>
        </section>

      </div>
    </main>
  );
}
