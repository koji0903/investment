"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import { Asset, AssetCalculated, Transaction } from "@/types";
import { dummyAssets, calculateAssetValues } from "@/lib/dummyData";

interface PortfolioContextType {
  assets: Asset[];
  transactions: Transaction[];
  calculatedAssets: AssetCalculated[];
  totalAssetsValue: number;
  totalProfitAndLoss: number;
  addTransaction: (transaction: Omit<Transaction, "id" | "date">) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

// 初期取引データ（今回は空ですが拡張可能）
const initialTransactions: Transaction[] = [];

export const PortfolioProvider = ({ children }: { children: React.ReactNode }) => {
  const [assets, setAssets] = useState<Asset[]>(dummyAssets);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

  // 取引追加時に、対象資産の保有数量と平均取得単価を自動で再計算するロジック
  const addTransaction = (newTx: Omit<Transaction, "id" | "date">) => {
    const transaction: Transaction = {
      ...newTx,
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString(),
    };

    // 取引履歴リストの先頭に追加
    setTransactions((prev) => [transaction, ...prev]);

    // 取引をもとに資産データを更新
    setAssets((prevAssets) => {
      return prevAssets.map((asset) => {
        if (asset.id !== transaction.assetId) return asset;

        let newQuantity = asset.quantity;
        let newAverageCost = asset.averageCost;

        if (transaction.type === "buy") {
          // [買い] 総取得コストを計算し、新しい平均取得単価を算出
          const totalCost = (asset.quantity * asset.averageCost) + (transaction.quantity * transaction.price);
          newQuantity = asset.quantity + transaction.quantity;
          newAverageCost = newQuantity > 0 ? totalCost / newQuantity : 0;
        } else if (transaction.type === "sell") {
          // [売り] 保有数量を減らす。平均取得単価は変動させない。
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

  // メモリ上で保持する計算済み資産配列
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
