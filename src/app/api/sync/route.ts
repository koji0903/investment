import { NextResponse } from 'next/server';

interface SyncRequest {
  providerType: 'stock' | 'crypto' | 'fx';
}

export async function POST(request: Request) {
  try {
    const body: SyncRequest = await request.json();
    const { providerType } = body;

    // Simulate network delay for API connection
    await new Promise((resolve) => setTimeout(resolve, 2000));

    let newAssets: any[] = [];
    let newTransactions: any[] = [];

    const now = new Date();

    if (providerType === 'stock') {
      newAssets = [
        {
          id: `sync-stock-${Date.now()}-1`,
          symbol: "7974.T",
          name: "任天堂",
          category: "株",
          quantity: 100,
          averagePrice: 7500,
          currentPrice: 8200,
          evaluatedValue: 820000,
          currency: "JPY",
        },
        {
          id: `sync-stock-${Date.now()}-2`,
          symbol: "9984.T",
          name: "ソフトバンクグループ",
          category: "株",
          quantity: 200,
          averagePrice: 8000,
          currentPrice: 8500,
          evaluatedValue: 1700000,
          currency: "JPY",
        }
      ];
      newTransactions = [
        {
          id: `tx-sync-stock-${Date.now()}`,
          date: now.toISOString(),
          type: "dividend",
          assetId: "7974.T",
          assetName: "任天堂",
          amount: 15000,
          price: 150,
          quantity: 100,
          currency: "JPY"
        }
      ];
    } else if (providerType === 'crypto') {
      newAssets = [
        {
          id: `sync-crypto-${Date.now()}-1`,
          symbol: "BTC",
          name: "Bitcoin",
          category: "仮想通貨",
          quantity: 0.15,
          averagePrice: 5000000,
          currentPrice: 9500000,
          evaluatedValue: 1425000,
          currency: "JPY",
        }
      ];
      newTransactions = [
        {
          id: `tx-sync-crypto-${Date.now()}`,
          date: now.toISOString(),
          type: "buy",
          assetId: "BTC",
          assetName: "Bitcoin",
          amount: 50000,
          price: 9000000,
          quantity: 0.0055,
          currency: "JPY"
        }
      ];
    } else if (providerType === 'fx') {
      newAssets = [
        {
          id: `sync-fx-${Date.now()}-1`,
          symbol: "USD/JPY",
          name: "米ドル/円",
          category: "FX",
          quantity: 10000,
          averagePrice: 140.5,
          currentPrice: 150.2,
          evaluatedValue: 1502000,
          currency: "JPY",
        }
      ];
      newTransactions = [
        {
          id: `tx-sync-fx-${Date.now()}`,
          date: now.toISOString(),
          type: "buy", // swap point equivalent roughly
          assetId: "USD/JPY",
          assetName: "米ドル/円 (スワップ付与)",
          amount: 2500,
          price: 150.2,
          quantity: 0,
          currency: "JPY"
        }
      ];
    }

    return NextResponse.json({
      success: true,
      message: `${providerType.toUpperCase()} APIからのデータ同期が完了しました。`,
      syncedAt: now.toISOString(),
      data: {
        assets: newAssets,
        transactions: newTransactions
      }
    });

  } catch (error) {
    console.error('Sync Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to sync data' }, { status: 500 });
  }
}
