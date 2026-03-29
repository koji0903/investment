"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getUSDJPYQuoteAction, getUSDJPYOHLCAction } from "@/lib/actions/fx";

/**
 * USD/JPY リアルタイムデータ取得フック
 */
export function useUSDJPYData(pollingInterval = 5000) {
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
      const q = await getUSDJPYQuoteAction();
      setQuote(q);

      // OHLC データの並行取得
      const [m1, m5, m15, h1] = await Promise.all([
        getUSDJPYOHLCAction("1m"),
        getUSDJPYOHLCAction("5m"),
        getUSDJPYOHLCAction("15m"),
        getUSDJPYOHLCAction("1h")
      ]);

      setOhlcData({
        "1m": m1,
        "5m": m5,
        "15m": m15,
        "1h": h1
      });
      
      setError(null);
    } catch (err) {
      console.error("Failed to fetch USD/JPY data:", err);
      setError("データ取得に失敗しました。再試行中...");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    const timer = setInterval(fetchAllData, pollingInterval);
    return () => clearInterval(timer);
  }, [fetchAllData, pollingInterval]);

  return { quote, ohlcData, isLoading, error, refetch: fetchAllData };
}
