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
          symbol: "7203.T", // トヨタ
          name: "トヨタ自動車",
          category: "株",
          quantity: 100,
          averageCost: 3100,
          currentPrice: 3500,
        },
        {
          symbol: "9984.T", // SBG
          name: "ソフトバンクグループ",
          category: "株",
          quantity: 200,
          averageCost: 7800,
          currentPrice: 8500,
        }
      ];
      newTransactions = [
        {
          date: now.toISOString(),
          type: "dividend",
          assetId: "7203.T",
          quantity: 100,
          price: 45, // 配当
        }
      ];
    } else if (providerType === 'crypto') {
      newAssets = [
        {
          symbol: "BTC",
          name: "Bitcoin",
          category: "仮想通貨",
          quantity: 0.12,
          averageCost: 8200000,
          currentPrice: 9500000,
        },
        {
          symbol: "ETH",
          name: "Ethereum",
          category: "仮想通貨",
          quantity: 1.5,
          averageCost: 380000,
          currentPrice: 450000,
        }
      ];
      newTransactions = [
        {
          date: now.toISOString(),
          type: "buy",
          assetId: "BTC",
          quantity: 0.02,
          price: 9000000,
        }
      ];
    } else if (providerType === 'fx') {
      newAssets = [
        {
          symbol: "USDJPY",
          name: "ドル/円 (L)",
          category: "FX",
          quantity: 10000,
          averageCost: 148.5,
          currentPrice: 150.2,
        }
      ];
      newTransactions = [
        {
          date: now.toISOString(),
          type: "buy",
          assetId: "USDJPY",
          quantity: 0, // スワップ付与
          price: 150.2,
        }
      ];
    }

    return NextResponse.json({
      success: true,
      message: `${providerType.toUpperCase()} 連携データを取得しました。`,
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
