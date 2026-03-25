"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { Asset, AssetCalculated, Transaction, BrokerConnection } from "@/types";
import { calculateAssetValues } from "@/lib/dummyData";
import { calculatePortfolioScores, PortfolioScores } from "@/lib/scoringEngine";
import { useAuth } from "@/context/AuthContext";
import { useNotify } from "@/context/NotificationContext";
import { 
  subscribeAssets, 
  subscribeTransactions, 
  subscribeAnalysis, 
  subscribeBehavior, 
  subscribeStrategy, 
  subscribeBrokerConnections,
  subscribeGrowthMetrics,
  subscribePortfolioMetrics,
  saveGrowthMetrics,
  savePortfolioMetrics,
  updateBrokerConnection,
  saveTransaction, 
  saveAsset, 
  generateDemoData 
} from "@/lib/db";
import { setDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface AnalysisSummary {
  realizedProfit: number;
  winRate: number;
  winCount: number;
  lossCount: number;
  totalTrades: number;
  lastUpdated: any;
  assetMeta: any[];
}

interface PortfolioContextType {
  portfolioId: string;
  assets: Asset[];
  transactions: Transaction[];
  calculatedAssets: AssetCalculated[];
  analysis: AnalysisSummary | null;
  behavior: any;
  strategy: any;
  brokerConnections: BrokerConnection[];
  totalAssetsValue: number;
  totalProfitAndLoss: number;
  totalDailyChange: number;
  growthMetrics: any | null;
  portfolioMetrics: any | null;
  addAsset: (asset: Omit<Asset, "id">) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, "id" | "date">) => Promise<void>;
  updateAsset: (assetId: string, update: Partial<Asset>) => Promise<void>;
  deleteAsset: (assetId: string) => Promise<void>;
  syncExternalData?: (providerType: 'stock' | 'crypto' | 'fx') => Promise<void>;
  prices: Record<string, number>;
  lastUpdated: string | null;
  isFetching: boolean;
  fetchError: string | null;
  currentScore: PortfolioScores | null;
  retryFetch: () => void;
  refreshPrices: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isDemo } = useAuth();
  const [portfolioId, setPortfolioId] = useState("default");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisSummary | null>(null);
  const [behavior, setBehavior] = useState<any>(null);
  const [strategy, setStrategy] = useState<any>(null);
  const [growthMetrics, setGrowthMetrics] = useState<any>(null);
  const [portfolioMetrics, setPortfolioMetrics] = useState<any>(null);
  const [brokerConnections, setBrokerConnections] = useState<BrokerConnection[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { notify } = useNotify();

  // デモデータの自動生成
  useEffect(() => {
    if (isDemo && user && assets.length === 0 && !isFetching) {
      generateDemoData(user.uid, portfolioId);
    }
  }, [isDemo, user, assets.length, isFetching, portfolioId]);

  // Firestoreとの同期
  useEffect(() => {
    if (!user) {
      setAssets([]);
      setTransactions([]);
      setAnalysis(null);
      setBehavior(null);
      setStrategy(null);
      return;
    }

    const unsubAssets = subscribeAssets(user.uid, portfolioId, (data) => {
      setAssets(data);
    });

    const unsubTx = subscribeTransactions(user.uid, portfolioId, (data) => {
      setTransactions(data);
    });

    const unsubAnalysis = subscribeAnalysis(user.uid, portfolioId, (data) => {
      setAnalysis(data);
    });

    const unsubBehavior = subscribeBehavior(user.uid, portfolioId, (data) => {
      setBehavior(data);
    });

    const unsubStrategy = subscribeStrategy(user.uid, portfolioId, (data) => {
      setStrategy(data);
    });
    
    const unsubGrowth = subscribeGrowthMetrics(user.uid, portfolioId, (data) => {
      setGrowthMetrics(data);
    });

    const unsubMetrics = subscribePortfolioMetrics(user.uid, portfolioId, (data) => {
      setPortfolioMetrics(data);
    });

    const unsubBroker = subscribeBrokerConnections(user.uid, (data) => {
      setBrokerConnections(data);
    });

    return () => {
      unsubAssets();
      unsubTx();
      unsubAnalysis();
      unsubBehavior();
      unsubStrategy();
      unsubGrowth();
      unsubMetrics();
      unsubBroker();
    };
  }, [user, portfolioId]);

  // 外部APIからの価格フェッチ
  const fetchMarketData = React.useCallback(async (retryCount = 0, force = false) => {
    if (!user || (assets.length === 0 && !force)) return;
    
    try {
      setIsFetching(true);
      setFetchError(null);
      
      // ポートフォリオに含まれる全銘柄のシンボルを抽出
      const symbols = [...new Set(assets.map(a => a.symbol).filter(Boolean))];
      
      const res = await fetch("/api/market-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols })
      });
      
      if (!res.ok) throw new Error("API Fetch Error");
      const data = await res.json();

      if (data.prices) {
        setPrices(prev => ({ ...prev, ...data.prices }));
        if (data.timestamp) setLastUpdated(data.timestamp);
        
        // オプティミスティックにFirestoreの最新価格も更新 (バックグラウンド)
        if (user && !isDemo) {
          updateAssetPricesInDb(user.uid, data.prices, assets);
        }
      }
    } catch (error) {
      console.error("Failed to fetch market data", error);
      if (retryCount < 2) {
        setTimeout(() => fetchMarketData(retryCount + 1), 3000);
      } else {
        setFetchError("価格データの取得に失敗しました");
        notify({
          type: "error",
          title: "接続エラー",
          message: "最新の時価情報を取得できませんでした。自動的に再試行します。",
        });
      }
    } finally {
      setIsFetching(false);
    }
  }, [user, assets, notify, isDemo, portfolioId]);

  // Firestoreの現在価格を更新するユーティリティ (頻度を制限)
  const updateAssetPricesInDb = async (uid: string, newPrices: Record<string, number>, currentAssets: Asset[]) => {
    try {
      for (const asset of currentAssets) {
        const freshPrice = newPrices[asset.symbol];
        // 価格に一定以上の変化があった場合のみ保存 (0.1%以上の変化)
        if (freshPrice && Math.abs(freshPrice - asset.currentPrice) / (asset.currentPrice || 1) > 0.001) {
          const assetRef = doc(db, "users", uid, "portfolios", portfolioId, "assets", asset.id);
          await setDoc(assetRef, {
            currentPrice: freshPrice,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      }
    } catch (e) {
      console.warn("Failed to background sync prices to DB", e);
    }
  };

  useEffect(() => {
    fetchMarketData(0);
    const interval = setInterval(() => fetchMarketData(0), 60000);

    return () => clearInterval(interval);
  }, [fetchMarketData]);

  const syncExternalData = async (providerType: 'stock' | 'crypto' | 'fx') => {
    if (isDemo || !user) {
      alert("デモモードまたは未ログイン時は連携データを保存できません。");
      return;
    }
    
    try {
      notify({
        type: "success",
        title: "連携開始",
        message: "外部データを取得しています。しばらくお待ちください...",
      });

      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerType })
      });
      
      if (!res.ok) throw new Error("Sync failed");
      const data = await res.json();
      
      if (data.success && data.data) {
        // 保存処理: Assets
        for (const asset of data.data.assets) {
          await saveAsset(user.uid, asset, portfolioId);
        }
        
        // 保存処理: Transactions
        for (const tx of data.data.transactions) {
          await saveTransaction(user.uid, tx, portfolioId);
        }

        notify({
          type: "success",
          title: "連携完了",
          message: data.message || "最新のデータを同期しました。",
        });
      }
    } catch (error) {
      console.error("External sync error:", error);
      notify({
        type: "error",
        title: "連携エラー",
        message: "データの取得に失敗しました。時間をおいて再度お試しください。",
      });
    }
  };

  const addTransaction = async (newTx: Omit<Transaction, "id" | "date">) => {
    if (isDemo) {
      alert("デモモードでは取引の追加・編集は制限されています。");
      return;
    }
    if (!user) return;

    // 1. 取引をFirestoreに保存
    await saveTransaction(user.uid, {
      ...newTx,
      date: new Date().toISOString()
    }, portfolioId);

    // 2. 資産の数量・平均取得単価を更新
    const targetAsset = assets.find(a => a.id === newTx.assetId || a.symbol === newTx.assetId);
    
    if (targetAsset) {
      let newQuantity = targetAsset.quantity;
      let newAverageCost = targetAsset.averageCost;

      if (newTx.type === "buy") {
        const totalCost = (targetAsset.quantity * targetAsset.averageCost) + (newTx.quantity * newTx.price);
        newQuantity = targetAsset.quantity + newTx.quantity;
        newAverageCost = newQuantity > 0 ? totalCost / newQuantity : 0;
      } else {
        newQuantity = Math.max(0, targetAsset.quantity - newTx.quantity);
      }

      await setDoc(doc(db, "users", user.uid, "portfolios", portfolioId, "assets", targetAsset.id), {
        quantity: newQuantity,
        averageCost: newAverageCost,
        currentPrice: prices[targetAsset.symbol] || targetAsset.currentPrice
      }, { merge: true });
    } else if (newTx.type === "buy") {
      let category: any = "株";
      const sym = newTx.assetId.toUpperCase();
      if (sym.includes("-USD") || sym.includes("BTC") || sym.includes("ETH")) category = "仮想通貨";
      else if (sym.includes(".T") || /^\d{4}$/.test(sym)) category = "株";
      else if (sym === "USDJPY=X") category = "FX";

      await saveAsset(user.uid, {
        symbol: newTx.assetId,
        name: newTx.assetId,
        category: category,
        quantity: newTx.quantity,
        averageCost: newTx.price,
        currentPrice: newTx.price
      }, portfolioId);
    }
  };

  const calculatedAssets = useMemo(() => {
    const usdJpyRate = prices["JPY=X"] || prices["USDJPY=X"] || 151.2; // 最新レート、なければデフォルト
    return assets.map(asset => {
      // 手動入力かつ市場価格シンボルがない場合は、保存されている currentPrice を優先
      const latestPrice = asset.isManual && !asset.symbol 
        ? asset.currentPrice 
        : (prices[asset.symbol] || asset.currentPrice);
      return calculateAssetValues({ ...asset, currentPrice: latestPrice }, prices);
    });
  }, [assets, prices]);

  const totalAssetsValue = useMemo(() => {
    return calculatedAssets.reduce((total, asset) => total + asset.evaluatedValue, 0);
  }, [calculatedAssets]);

  const totalProfitAndLoss = useMemo(() => {
    return calculatedAssets.reduce((total, asset) => total + asset.profitAndLoss, 0);
  }, [calculatedAssets]);

  const totalDailyChange = useMemo(() => {
    return calculatedAssets.reduce((total, asset) => total + asset.dailyChange, 0);
  }, [calculatedAssets]);

  // --- Scoring Logic ---
  const currentScore = useMemo(() => {
    if (calculatedAssets.length === 0) return null;

    const cashAssets = calculatedAssets.filter(a => a.category === "現金" || a.category === "銀行");
    const cashValue = cashAssets.reduce((sum, a) => sum + a.evaluatedValue, 0);
    const cashRatio = totalAssetsValue > 0 ? cashValue / totalAssetsValue : 0.2;
    const violationsCount = behavior?.ruleViolations?.length || 0;

    return calculatePortfolioScores(
      { 
        cagr: growthMetrics?.cagr || 12, 
        maxDrawdown: growthMetrics?.maxDrawdown || 8 
      },
      calculatedAssets,
      cashRatio,
      violationsCount
    );
  }, [calculatedAssets, totalAssetsValue, growthMetrics, behavior]);

  // 定期的なスコアのFirestore保存 (大幅な変更時または手動更新時)
  useEffect(() => {
    if (isDemo || !user || !currentScore) return;

    // 前回の保存データと比較して差分がある場合のみ保存（デバウンスを考慮しても良いが、一旦単純な比較）
    if (!portfolioMetrics || Math.abs(currentScore.total - portfolioMetrics.total) >= 1) {
      const timer = setTimeout(() => {
        savePortfolioMetrics(user.uid, portfolioId, currentScore);
      }, 5000); // 5秒のディレイ（頻繁な書き込み防止）
      return () => clearTimeout(timer);
    }
  }, [currentScore, user, isDemo, portfolioId, portfolioMetrics]);

  const addAsset = async (newAsset: Omit<Asset, "id">) => {
    if (isDemo) {
      alert("デモモードでは資産の追加は制限されています。");
      return;
    }
    if (!user) return;
    const { saveAsset } = await import("@/lib/db");
    await saveAsset(user.uid, newAsset, portfolioId);
  };

  const updateAsset = async (assetId: string, update: Partial<Asset>) => {
    if (isDemo) {
      alert("デモモードでは編集が制限されています。");
      return;
    }
    if (!user) return;
    await setDoc(doc(db, "users", user.uid, "portfolios", portfolioId, "assets", assetId), {
      ...update,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  };

  const deleteAsset = async (assetId: string) => {
    if (isDemo) {
      alert("デモモードでは削除が制限されています。");
      return;
    }
    if (!user) return;
    const { removeAsset } = await import("@/lib/db");
    await removeAsset(user.uid, assetId, portfolioId);
  };

  return (
    <PortfolioContext.Provider
      value={{
        portfolioId,
        assets,
        transactions,
        calculatedAssets,
        analysis,
        behavior,
        strategy,
        brokerConnections,
        totalAssetsValue,
        totalProfitAndLoss,
        totalDailyChange,
        growthMetrics,
        portfolioMetrics,
        addAsset,
        addTransaction,
        updateAsset,
        deleteAsset,
        syncExternalData,
        prices,
        lastUpdated,
        isFetching,
        fetchError,
        currentScore,
        retryFetch: () => fetchMarketData(0),
        refreshPrices: async () => {
          await fetchMarketData(0, true);
        },
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
};
