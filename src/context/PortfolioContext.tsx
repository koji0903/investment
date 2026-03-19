"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { Asset, AssetCalculated, Transaction } from "@/types";
import { calculateAssetValues } from "@/lib/dummyData";
import { useAuth } from "@/context/AuthContext";
import { subscribeAssets, subscribeTransactions, subscribeAnalysis, subscribeBehavior, subscribeStrategy, saveTransaction, saveAsset, generateDemoData } from "@/lib/db";
import { updateDoc, doc } from "firebase/firestore";
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
  totalAssetsValue: number;
  totalProfitAndLoss: number;
  addTransaction: (transaction: Omit<Transaction, "id" | "date">) => Promise<void>;
  lastUpdated: string | null;
  isFetching: boolean;
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
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

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

    return () => {
      unsubAssets();
      unsubTx();
      unsubAnalysis();
      unsubBehavior();
      unsubStrategy();
    };
  }, [user, portfolioId]);

  // 外部APIからの価格フェッチ
  useEffect(() => {
    if (!user || assets.length === 0) return;

    const fetchMarketData = async () => {
      try {
        setIsFetching(true);
        const res = await fetch("/api/market-data");
        if (!res.ok) throw new Error("API Fetch Error");
        const data = await res.json();

        if (data.prices) {
          setPrices(data.prices);
          if (data.timestamp) setLastUpdated(data.timestamp);
        }
      } catch (error) {
        console.error("Failed to fetch market data", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000);

    return () => clearInterval(interval);
  }, [user, assets.length]);

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

      await updateDoc(doc(db, "users", user.uid, "portfolios", portfolioId, "assets", targetAsset.id), {
        quantity: newQuantity,
        averageCost: newAverageCost,
        currentPrice: prices[targetAsset.symbol] || targetAsset.currentPrice
      });
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
    return assets.map(asset => {
      const latestPrice = prices[asset.symbol] || asset.currentPrice;
      return calculateAssetValues({ ...asset, currentPrice: latestPrice });
    });
  }, [assets, prices]);

  const totalAssetsValue = useMemo(() => {
    return calculatedAssets.reduce((total, asset) => total + asset.evaluatedValue, 0);
  }, [calculatedAssets]);

  const totalProfitAndLoss = useMemo(() => {
    return calculatedAssets.reduce((total, asset) => total + asset.profitAndLoss, 0);
  }, [calculatedAssets]);

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
        totalAssetsValue,
        totalProfitAndLoss,
        addTransaction,
        lastUpdated,
        isFetching,
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
