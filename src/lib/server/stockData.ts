import { StockPairMaster } from "@/types/stock";
import path from "path";
import fs from "fs";

/**
 * サーバーサイドでのみ実行可能な銘柄データ取得ユーティリティ
 */
export function getLocalStockMasterData(): StockPairMaster[] {
  const filePath = path.join(process.cwd(), "src", "data", "tse_prime_all.json");
  
  if (!fs.existsSync(filePath)) {
    throw new Error("銘柄データファイルが見つかりません。");
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(fileContent);
}
