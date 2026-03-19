"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { Asset, AssetCalculated, Transaction } from "@/types";
import { dummyAssets, calculateAssetValues } from "@/lib/dummyData";

interface PortfolioContextType {
  assets: Asset[];
  transactions: Transaction[];
  calculatedAssets: AssetCalculated[];
  totalAssetsValue: number;
  totalProfitAndLoss: number;
  addTransaction: (transaction: Omit<Transaction, "id" | "date">) => void;
  lastUpdated: string | null;
  isFetching: boolean;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

const initialTransactions: Transaction[] = [];

export const PortfolioProvider = ({ children }: { children: React.ReactNode }) => {
  const [assets, setAssets] = useState<Asset[]>(dummyAssets);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  // 外部APIからの定期データフェッチ
  useEffect(() => {
    let isMounted = true;

    const fetchMarketData = async () => {
      try {
        setIsFetching(true);
        const res = await fetch("/api/market-data");
        if (!res.ok) throw new Error("API Fetch Error");
        const data = await res.json();

        if (isMounted && data.prices) {
          setAssets((prevAssets) =>
            prevAssets.map((asset) => {
              const newPrice = data.prices[asset.id];
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
        if (isMounted) setIsFetching(false);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000); // 60秒ごと

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const addTransaction = (newTx: Omit<Transaction, "id" | "date">) => {
    const transaction: Transaction = {
      ...newTx,
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString(),
    };

    setTransactions((prev) => [transaction, ...prev]);

    setAssets((prevAssets) => {
      return prevAssets.map((asset) => {
        if (asset.id !== transaction.assetId) return asset;

        let newQuantity = asset.quantity;
        let newAverageCost = asset.averageCost;

        if (transaction.type === "buy") {
          const totalCost = (asset.quantity * asset.averageCost) + (transaction.quantity * transaction.price);
          newQuantity = asset.quantity + transaction.quantity;
          newAverageCost = newQuantity > 0 ? totalCost / newQuantity : 0;
        } else if (transaction.type === "sell") {
          newQuantity = Math.max(0, asset.quantity - transaction.quantity);
        }

        return {
          ...asset,
          quantity: newQuantity,
          averageCost: newAverageCost,
        };
      });
    });
  };

  const calculatedAssets = useMemo(() => {
    return assets.map(calculateAssetValues);
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
