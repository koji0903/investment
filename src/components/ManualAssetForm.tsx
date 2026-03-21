"use client";

import React, { useState, useEffect } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { useAuth } from "@/context/AuthContext";
import { useNotify } from "@/context/NotificationContext";
import { Asset, AssetCategory } from "@/types";
import { Save, X, Trash2, Loader2, Landmark, Globe, Coins, LineChart, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ManualAssetFormProps {
  asset?: Asset; // 編集モードの場合
  onClose: () => void;
}

const CATEGORIES: { label: string; value: AssetCategory; icon: React.ElementType }[] = [
  { label: "銀行・預金", value: "銀行", icon: Landmark },
  { label: "日本株", value: "日本株", icon: Banknote },
  { label: "外国株", value: "外国株", icon: Globe },
  { label: "投資信託", value: "投資信託", icon: LineChart },
  { label: "仮想通貨", value: "仮想通貨", icon: Coins },
  { label: "FX", value: "FX", icon: LineChart },
];

export const ManualAssetForm = ({ asset, onClose }: ManualAssetFormProps) => {
  const { addAsset, updateAsset, deleteAsset } = usePortfolio();
  const { isDemo } = useAuth();
  const { notify } = useNotify();

  const [name, setName] = useState(asset?.name || "");
  const [category, setCategory] = useState<AssetCategory>(asset?.category || "銀行");
  const [symbol, setSymbol] = useState(asset?.symbol || "");
  const [quantity, setQuantity] = useState<number>(asset?.quantity || 1);
  const [currentPrice, setCurrentPrice] = useState<number>(asset?.currentPrice || 0);
  const [averageCost, setAverageCost] = useState<number>(asset?.averageCost || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 編集モードの場合の初期化
  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setCategory(asset.category);
      setSymbol(asset.symbol);
      setQuantity(asset.quantity);
      setCurrentPrice(asset.currentPrice);
      setAverageCost(asset.averageCost);
    }
  }, [asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || quantity <= 0 || currentPrice < 0) {
      notify({ type: "error", title: "入力エラー", message: "必須項目を正しく入力してください。" });
      return;
    }

    setIsSubmitting(true);
    try {
      const assetData: Omit<Asset, "id"> = {
        name,
        category,
        symbol: symbol || `${category}_${Date.now()}`, // シンボルがない場合は内部IDとして生成
        quantity,
        currentPrice,
        averageCost: averageCost || currentPrice,
        isManual: true,
      };

      if (asset) {
        await updateAsset(asset.id, assetData);
        notify({ type: "success", title: "更新完了", message: "資産を更新しました。" });
      } else {
        await addAsset(assetData);
        notify({ type: "success", title: "登録完了", message: "新しい資産を登録しました。" });
      }
      onClose();
    } catch (error) {
      console.error(error);
      notify({ type: "error", title: "エラー", message: "データの保存に失敗しました。" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!asset) return;
    if (!confirm("この資産を削除してもよろしいですか？")) return;

    setIsSubmitting(true);
    try {
      await deleteAsset(asset.id);
      notify({ type: "success", title: "削除完了", message: "資産を削除しました。" });
      onClose();
    } catch (error) {
      notify({ type: "error", title: "エラー", message: "削除に失敗しました。" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center text-white">
                {asset ? <Save size={20} /> : <Landmark size={20} />}
              </div>
              {asset ? "資産を編集" : "手動で資産を追加"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 名前 */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">資産名</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="楽天銀行, トヨタ自動車等"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              {/* カテゴリ */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">カテゴリ</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AssetCategory)}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900 dark:text-white appearance-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <LineChart size={16} />
                  </div>
                </div>
              </div>

              {/* Symbol */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">シンボル (任意)</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="7203.T, BTC等"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900 dark:text-white"
                />
              </div>

              {/* 数量 */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">数量</label>
                <input
                  type="number"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              {/* 現在の評価単価 */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">現在の評価単価 / 残高</label>
                <input
                  type="number"
                  step="any"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(Number(e.target.value))}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              {/* 平均取得単価 */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">平均取得単価 (任意)</label>
                <input
                  type="number"
                  step="any"
                  value={averageCost}
                  onChange={(e) => setAverageCost(Number(e.target.value))}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              {asset && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting || isDemo}
                  className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all"
                >
                  <Trash2 size={24} />
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || isDemo}
                className={cn(
                  "flex-1 p-4 rounded-2xl text-white font-black shadow-xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2",
                  isDemo ? "bg-slate-300 dark:bg-slate-800 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500"
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Save size={20} />
                    {asset ? "変更を保存" : "資産を登録"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};
