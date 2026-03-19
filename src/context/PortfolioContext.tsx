"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { Asset, AssetCalculated, Transaction } from "@/types";
import { calculateAssetValues } from "@/lib/dummyData";
import { useAuth } from "@/context/AuthContext";
import { subscribeAssets, subscribeTransactions, saveTransaction, saveAsset } from "@/lib/db";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface PortfolioContextType {
  assets: Asset[];
  transactions: Transaction[];
  calculatedAssets: AssetCalculated[];
  totalAssetsValue: number;
  totalProfitAndLoss: number;
  addTransaction: (transaction: Omit<Transaction, "id" | "date">) => Promise<void>;
  lastUpdated: string | null;
  isFetching: boolean;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  // Firestoreとの同期
  useEffect(() => {
    if (!user) {
      setAssets([]);
      setTransactions([]);
      return;
    }

    const unsubAssets = subscribeAssets(user.uid, (data) => {
      setAssets(data);
    });

    const unsubTx = subscribeTransactions(user.uid, (data) => {
      setTransactions(data);
    });

    return () => {
      unsubAssets();
      unsubTx();
    };
  }, [user]);

  // 外部APIからの価格フェッチ (Firestoreの資産に対して価格をマッピング)
  useEffect(() => {
    if (!user || assets.length === 0) return;

    const fetchMarketData = async () => {
      try {
        setIsFetching(true);
        const res = await fetch("/api/market-data");
        if (!res.ok) throw new Error("API Fetch Error");
        const data = await res.json();

        if (data.prices) {
          setAssets((prevAssets) =>
            prevAssets.map((asset) => {
              // symbolがあれば使用、なければID（レガシー互換）を使用
              const priceKey = asset.symbol || asset.id;
              const newPrice = data.prices[priceKey]; 
              if (newPrice != null) {
                return { ...asset, currentPrice: newPrice };
              }
              return asset;
            })
          );
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
  }, [user, assets.length > 0]);

  const addTransaction = async (newTx: Omit<Transaction, "id" | "date">) => {
    if (!user) return;

    // 1. 取引をFirestoreに保存
    await saveTransaction(user.uid, {
      ...newTx,
      date: new Date().toISOString()
    });

    // 2. 資産の数量・平均取得単価を更新
    const targetAsset = assets.find(a => a.id === newTx.assetId || a.symbol === newTx.assetId);
    
    if (targetAsset) {
      // 既存資産の更新
      let newQuantity = targetAsset.quantity;
      let newAverageCost = targetAsset.averageCost;

      if (newTx.type === "buy") {
        const totalCost = (targetAsset.quantity * targetAsset.averageCost) + (newTx.quantity * newTx.price);
        newQuantity = targetAsset.quantity + newTx.quantity;
        newAverageCost = newQuantity > 0 ? totalCost / newQuantity : 0;
      } else {
        newQuantity = Math.max(0, targetAsset.quantity - newTx.quantity);
      }

      await updateDoc(doc(db, "users", user.uid, "assets", targetAsset.id), {
        quantity: newQuantity,
        averageCost: newAverageCost
      });
    } else if (newTx.type === "buy") {
      // 新規資産の作成
      // 簡易的なカテゴリ推論
      let category: any = "株";
      const sym = newTx.assetId.toUpperCase();
      if (sym.includes("-USD") || sym.includes("BTC") || sym.includes("ETH")) category = "仮想通貨";
      else if (sym.includes(".T") || /^\d{4}$/.test(sym)) category = "株";
      else if (sym === "USDJPY=X") category = "FX";

      await saveAsset(user.uid, {
        symbol: newTx.assetId,
        name: newTx.assetId, // 初期値はシンボルと同じ
        category: category,
        quantity: newTx.quantity,
        averageCost: newTx.price,
        currentPrice: newTx.price
      });
    }
  };

  const calculatedAssets = useMemo(() => {
    return assets.map(asset => calculateAssetValues(asset));
  }, [assets]);

  const totalAssetsValue = useMemo(() => {
    return calculatedAssets.reduce((total, asset) => total + asset.evaluatedValue, 0);
  }, [calculatedAssets]);

  const totalProfitAndLoss = useMemo(() => {
    return calculatedAssets.reduce((total, asset) => total + asset.profitAndLoss, 0);
  }, [calculatedAssets]);

  return (
    <PortfolioContext.Provider
      value={{
        assets,
        transactions,
        calculatedAssets,
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
