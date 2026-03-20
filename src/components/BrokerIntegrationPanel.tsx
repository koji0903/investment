"use client";

import { useAuth } from "@/context/AuthContext";
import { useNotify } from "@/context/NotificationContext";
import { usePortfolio } from "@/context/PortfolioContext";
import { updateBrokerConnection } from "@/lib/db";
import { ProviderType, BrokerConnection } from "@/types";

type ProviderType = 'stock' | 'crypto' | 'fx';

interface ProviderConfig {
  id: ProviderType;
  name: string;
  description: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'stock',
    name: '証券口座 API連携',
    description: '国内株式・投資信託の保有残高と取引履歴を自動取得します。',
    icon: Landmark,
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20'
  },
  {
    id: 'crypto',
    name: '暗号資産 取引所連携',
    description: 'ビットコインなどの仮想通貨の保有量と最新価格を自動取得します。',
    icon: Bitcoin,
    colorClass: 'text-amber-500',
    bgClass: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
  },
  {
    id: 'fx',
    name: 'FX（外国為替） API連携',
    description: '為替建玉の残高と毎日のスワップポイント履歴を自動取得します。',
    icon: LineChart,
    colorClass: 'text-emerald-500',
    bgClass: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
  }
];

export const BrokerIntegrationPanel = () => {
  const { user, isDemo } = useAuth();
  const { brokerConnections, syncExternalData } = usePortfolio();
  const { notify } = useNotify();
  
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});

  const handleToggleConnection = async (providerId: string, currentStatus: boolean) => {
    if (isDemo || !user) {
      notify({ type: "info", title: "制限事項", message: "デモモードでは連携設定の変更は保存されません。" });
      return;
    }

    try {
      await updateBrokerConnection(user.uid, providerId, {
        isConnected: !currentStatus,
        status: !currentStatus ? "active" : "disconnected"
      });
      notify({
        type: "success",
        title: !currentStatus ? "連携を開始しました" : "連携を終了しました",
        message: `${providerId.toUpperCase()} との接続設定を更新しました。`,
      });
    } catch (error) {
      notify({ type: "error", title: "更新失敗", message: "連携状態の更新に失敗しました。" });
    }
  };

  const handleSync = async (providerId: ProviderType) => {
    const connection = brokerConnections.find(c => c.id === providerId);
    if (!connection?.isConnected) return;
    
    setSyncing(prev => ({ ...prev, [providerId]: true }));
    
    try {
      if (syncExternalData) {
        await syncExternalData(providerId);
      }
      
      if (user && !isDemo) {
        await updateBrokerConnection(user.uid, providerId, {
          lastSyncedAt: new Date().toISOString(),
          status: "active"
        });
      }
    } catch (error) {
      console.error("Sync failed", error);
      if (user && !isDemo) {
        await updateBrokerConnection(user.uid, providerId, { status: "error" });
      }
    } finally {
      setSyncing(prev => ({ ...prev, [providerId]: false }));
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm">
      <div className="p-6 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
              <LinkIcon size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">金融機関データ自動連携</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Automatic Asset Synchronization</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-700">
            <AlertCircle size={14} className="text-indigo-500" />
            <span>※データは暗号化されて安全に通信されます</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROVIDERS.map((provider) => {
            const Icon = provider.icon;
            const connection = brokerConnections.find(c => c.id === provider.id);
            const isConnected = connection?.isConnected || false;
            const isSyncing = syncing[provider.id];

            return (
              <div 
                key={provider.id} 
                className={cn(
                  "flex flex-col p-5 rounded-[24px] border transition-all duration-300",
                  isConnected 
                    ? provider.bgClass
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={cn(
                    "p-3 rounded-2xl border",
                    isConnected 
                      ? "bg-white dark:bg-slate-800 shadow-sm border-white/50 dark:border-slate-700" 
                      : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                  )}>
                    <Icon size={24} className={isConnected ? provider.colorClass : ""} />
                  </div>
                  
                  {/* Status Badge */}
                  <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 rounded-full border text-[10px] font-black tracking-widest uppercase",
                    isConnected 
                      ? "text-emerald-600 border-emerald-100 dark:border-emerald-900" 
                      : "text-slate-400 border-slate-200 dark:border-slate-700"
                  )}>
                    {isConnected ? (
                      <>
                        <CheckCircle2 size={12} />
                        連携中
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        未連携
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-2 mb-6">
                  <h3 className="text-base font-black text-slate-800 dark:text-white">
                    {provider.name}
                  </h3>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                    {provider.description}
                  </p>
                </div>

                <div className="space-y-3 mt-auto">
                  {connection?.lastSyncedAt && connection.isConnected && (
                    <div className="text-[10px] font-bold text-slate-400 text-center">
                      最終取得: {new Date(connection.lastSyncedAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleToggleConnection(provider.id, isConnected)}
                      className={cn(
                        "py-2.5 rounded-xl text-xs font-black transition-all",
                        isConnected 
                          ? "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700" 
                          : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                      )}
                    >
                      {isConnected ? "連携解除" : "連携設定"}
                    </button>
                    
                    <button 
                      onClick={() => handleSync(provider.id)}
                      disabled={!isConnected || isSyncing}
                      className={cn(
                        "py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5",
                        !isConnected
                          ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400"
                          : isSyncing
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-wait"
                            : "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                      )}
                    >
                      <RefreshCw size={14} className={cn(isSyncing && "animate-spin")} />
                      {isSyncing ? "取得中..." : "データ更新"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
