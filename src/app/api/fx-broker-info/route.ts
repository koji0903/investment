import { NextResponse } from 'next/server';

// 日本の主要FX会社の標準的な証拠金要件（25倍前提：4%）
// 実際には各社毎週更新されるが、ここでは代表的な値を推定用に使用
const BROKER_MARGIN_REQUIREMENTS: Record<string, number> = {
  "DMM FX": 0.04,
  "GMOクリック証券": 0.04,
  "SBI FXトレード": 0.04,
  "外貨ex": 0.04,
  "外為どっとコム": 0.04,
  "楽天FX": 0.04,
  "default": 0.04
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const broker = searchParams.get('broker') || 'default';
  
  // ネットワーク遅延のシミュレーション
  await new Promise(r => setTimeout(r, 800));

  const marginRate = BROKER_MARGIN_REQUIREMENTS[broker] || BROKER_MARGIN_REQUIREMENTS["default"];

  return NextResponse.json({
    success: true,
    broker,
    marginRate,
    lastUpdated: new Date().toISOString(),
    note: "FX各社の公開されている標準的な証拠金率に基づいています。"
  });
}
