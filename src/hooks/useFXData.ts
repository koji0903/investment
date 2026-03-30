"use client";

import { useState, useEffect, useCallback } from "react";
import { getFXQuoteAction, getFXOHLCAction } from "@/lib/actions/fx";

/**
 * 任意の通貨ペア リアルタイムデータ取得フック
 */
export function useFXData(pairCode: string, pollingInterval = 5000) {
  const [quote, setQuote] = useState<{ price: number; bid: number; ask: number; changePercent: number; updatedAt: string } | null>(null);
  const [ohlcData, setOhlcData] = useState<Record<string, any[]>>({
    "1m": [],
    "5m": [],
    "15m": [],
    "1h": []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      const q = await getFXQuoteAction(pairCode);
      setQuote(q);

      // OHLC データの並行取得
      const [m1, m5, m15, h1] = await Promise.all([
        getFXOHLCAction(pairCode, "1m"),
        getFXOHLCAction(pairCode, "5m"),
        getFXOHLCAction(pairCode, "15m"),
        getFXOHLCAction(pairCode, "1h")
      ]);

      setOhlcData({
        "1m": m1,
        "5m": m5,
        "15m": m15,
        "1h": h1
      });
      
      setError(null);
    } catch (err) {
      console.error(`Failed to fetch ${pairCode} data:`, err);
      setError("データ取得に失敗しました。再試行中...");
    } finally {
      setIsLoading(false);
    }
  }, [pairCode]);

  useEffect(() => {
    fetchAllData();
    const timer = setInterval(fetchAllData, pollingInterval);
    return () => clearInterval(timer);
  }, [fetchAllData, pollingInterval]);

  return { quote, ohlcData, isLoading, error, refetch: fetchAllData };
}
