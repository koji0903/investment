import { DashboardHeader } from "@/components/DashboardHeader";
import { RadarDashboard } from "@/components/stock/radar/RadarDashboard";

export default function StockRadarPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0a0c10] pb-20">
      <DashboardHeader 
        totalAssets={12500000} 
        totalProfitAndLoss={850000} 
        variant="minimal"
        hideAuth={true}
      />
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <RadarDashboard />
      </div>
    </main>
  );
}
