"use client";

import React, { useState, useMemo } from "react";
import { X, Plus, Trash2, Save, Loader2, Coins, Landmark, Globe, Building2, LineChart, Banknote, ShieldCheck } from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";
import { Asset, AssetCategory } from "@/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ManualAssetFormProps {
  onClose: () => void;
  initialCategory?: AssetCategory;
  asset?: Asset;
}

interface AssetRow {
  id: string;
  name: string;
  symbol: string;
  quantity: number;
  currentPrice: number;
  averageCost: number;
  brokerName: string;
}

const CATEGORIES: { id: AssetCategory; label: string; icon: React.ElementType }[] = [
  { id: "銀行", label: "銀行・預金", icon: Landmark },
  { id: "日本株", label: "日本株", icon: Building2 },
  { id: "外国株", label: "外国株", icon: Globe },
  { id: "投資信託", label: "投資信託", icon: Banknote },
  { id: "仮想通貨", label: "仮想通貨", icon: Coins },
  { id: "FX", label: "FX", icon: LineChart },
];

const BROKER_SUGGESTIONS: Record<string, string[]> = {
  "銀行": ["三菱UFJ銀行", "三井住友銀行", "みずほ銀行", "ゆうちょ銀行", "楽天銀行", "住信SBIネット銀行", "PayPay銀行"],
  "日本株": ["楽天証券", "SBI証券", "マネックス証券", "松井証券", "auカブコム証券", "野村證券", "大和証券"],
  "外国株": ["楽天証券", "SBI証券", "マネックス証券", "サクソバンク証券", "IG証券"],
  "投資信託": ["楽天証券", "SBI証券", "マネックス証券", "三菱UFJ国際投信", "アセットマネジメントOne"],
  "仮想通貨": ["bitFlyer", "Coincheck", "GMOコイン", "DMM Bitcoin", "Binance", "Bybit", "MetaMask"],
  "FX": ["DMM FX", "GMOクリック証券", "SBI FXトレード", "外貨ex", "外為どっとコム", "楽天FX"],
};

const ASSET_NAME_SUGGESTIONS: Record<string, { name: string; symbol: string }[]> = {
  "FX": [
    { name: "USD/JPY (ドル円)", symbol: "USDJPY=X" },
    { name: "EUR/JPY (ユーロ円)", symbol: "EURJPY=X" },
    { name: "GBP/JPY (ポンド円)", symbol: "GBPJPY=X" },
    { name: "AUD/JPY (豪ドル円)", symbol: "AUDJPY=X" },
    { name: "NZD/JPY (NZドル円)", symbol: "NZDJPY=X" },
    { name: "EUR/USD (ユーロドル)", symbol: "EURUSD=X" },
    { name: "GBP/USD (ポンドドル)", symbol: "GBPUSD=X" },
    { name: "ZAR/JPY (南アランド円)", symbol: "ZARJPY=X" },
    { name: "TRY/JPY (トルコリラ円)", symbol: "TRYJPY=X" },
    { name: "MXN/JPY (メキシコペソ円)", symbol: "MXNJPY=X" },
  ],
  "仮想通貨": [
    { name: "Bitcoin (BTC)", symbol: "BTC" },
    { name: "Ethereum (ETH)", symbol: "ETH" },
    { name: "Ripple (XRP)", symbol: "XRP" },
    { name: "Solana (SOL)", symbol: "SOL" },
    { name: "Cardano (ADA)", symbol: "ADA" },
    { name: "Polygon (MATIC)", symbol: "MATIC" },
    { name: "BNB", symbol: "BNB" },
    { name: "Dogecoin (DOGE)", symbol: "DOGE" },
  ],
};

export const ManualAssetForm = ({ onClose, initialCategory = "銀行", asset }: ManualAssetFormProps) => {
  const { addAsset, updateAsset, deleteAsset } = usePortfolio();
  
  const [category, setCategory] = useState<AssetCategory>(asset?.category || initialCategory);
  const [rows, setRows] = useState<AssetRow[]>(
    asset 
      ? [{ 
          id: asset.id, 
          name: asset.name, 
          symbol: asset.symbol || "", 
          quantity: asset.quantity, 
          currentPrice: asset.currentPrice, 
          averageCost: asset.averageCost,
          brokerName: asset.brokerName || ""
        }]
      : [{ id: "1", name: "", symbol: "", quantity: 0, currentPrice: 0, averageCost: 0, brokerName: "" }]
  );
  
  const [loading, setLoading] = useState(false);
  const isEdit = !!asset;

  const brokerSuggestions = useMemo(() => BROKER_SUGGESTIONS[category] || [], [category]);
  const assetNameSuggestions = useMemo(() => ASSET_NAME_SUGGESTIONS[category] || [], [category]);

  const addRow = () => {
    setRows([...rows, { id: Math.random().toString(36).substr(2, 9), name: "", symbol: "", quantity: 0, currentPrice: 0, averageCost: 0, brokerName: rows[rows.length-1]?.brokerName || "" }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof AssetRow, value: string | number) => {
    let newRows = rows.map(r => r.id === id ? { ...r, [field]: value } : r);
    
    // Auto-sync symbol if name matches a suggestion
    if (field === "name") {
      const match = assetNameSuggestions.find(s => s.name === value);
      if (match) {
        newRows = newRows.map(r => r.id === id ? { ...r, symbol: match.symbol } : r);
      }
    }
    
    setRows(newRows);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        const row = rows[0];
        await updateAsset(asset!.id, {
          name: row.name,
          category,
          symbol: row.symbol,
          quantity: Number(row.quantity),
          currentPrice: Number(row.currentPrice),
          averageCost: Number(row.averageCost),
          brokerName: row.brokerName,
        });
      } else {
        for (const row of rows) {
          if (!row.name) continue;
          await addAsset({
            name: row.name,
            category,
            symbol: row.symbol || "",
            quantity: Number(row.quantity),
            currentPrice: Number(row.currentPrice),
            averageCost: Number(row.averageCost),
            brokerName: row.brokerName,
            isManual: true,
          });
        }
      }
      onClose();
    } catch (error) {
      console.error("Failed to save assets", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!asset || !window.confirm("この資産を削除してもよろしいですか？")) return;
    setLoading(true);
    try {
      await deleteAsset(asset.id);
      onClose();
    } catch (error) {
      console.error("Delete failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
              <Plus size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                {isEdit ? "資産を編集" : "証券会社・金融機関別の一括追加"}
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Broker-Linked Asset Entry</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
          <div className="p-8 space-y-8 overflow-y-auto">
            {!isEdit && (
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">カテゴリを選択</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300",
                        category === cat.id
                          ? "bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-105"
                          : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-900"
                      )}
                    >
                      <cat.icon size={20} />
                      <span className="text-[10px] font-black">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  資産の内訳（{CATEGORIES.find(c => c.id === category)?.label}）
                </label>
                <div className="flex items-center gap-2 text-indigo-500">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-black uppercase tracking-tighter">価格自動連動対応済み</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {rows.map((row) => (
                    <motion.div 
                      key={row.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 group relative"
                    >
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 ml-1">利用機関</label>
                        <input
                          list={`brokers-${row.id}`}
                          type="text"
                          placeholder="例: 楽天証券"
                          value={row.brokerName}
                          onChange={(e) => updateRow(row.id, "brokerName", e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                        />
                        <datalist id={`brokers-${row.id}`}>
                          {brokerSuggestions.map(s => <option key={s} value={s} />)}
                        </datalist>
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 ml-1">資産・銘柄名</label>
                        <input
                          list={`names-${row.id}`}
                          type="text"
                          required
                          placeholder="例: トヨタ"
                          value={row.name}
                          onChange={(e) => updateRow(row.id, "name", e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                        />
                        <datalist id={`names-${row.id}`}>
                          {assetNameSuggestions.map(s => <option key={s.name} value={s.name} />)}
                        </datalist>
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 ml-1">コード (連動用)</label>
                        <input
                          type="text"
                          value={row.symbol}
                          onChange={(e) => updateRow(row.id, "symbol", e.target.value.toUpperCase())}
                          placeholder="例: 7203.T"
                          className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div className="md:col-span-1 space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 ml-1">保有数</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={row.quantity}
                          onChange={(e) => updateRow(row.id, "quantity", e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 ml-1">評価単価</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={row.currentPrice}
                          onChange={(e) => updateRow(row.id, "currentPrice", e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 ml-1">取得単価</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={row.averageCost}
                          onChange={(e) => updateRow(row.id, "averageCost", e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div className="md:col-span-1 flex justify-end pb-1">
                        {!isEdit && rows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {!isEdit && (
                  <button
                    type="button"
                    onClick={addRow}
                    className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 hover:text-indigo-500 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2 font-black text-sm"
                  >
                    <Plus size={20} />
                    さらに資産を追加する
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-6 bg-indigo-50 dark:bg-indigo-500/5 rounded-[32px] border border-indigo-100 dark:border-indigo-500/10 flex gap-4">
              <div className="p-3 bg-indigo-500 rounded-2xl text-white h-fit shadow-lg shadow-indigo-500/20">
                <Globe size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-800 dark:text-white">評価単価の自動連動について</h4>
                <p className="text-xs font-bold text-slate-500 leading-relaxed">
                  FXや仮想通貨では、提示された名前（例: USD/JPY）を選択すると、自動で正確なデータコードが設定されます。
                  その他の資産も、正しいコード（例: 7203.T）を入力することで最新の評価額と連動します。
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                className="w-full md:w-auto px-8 py-4 text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all"
              >
                削除する
              </button>
            )}
            <div className="flex-1 md:flex" />
            <button
              type="button"
              onClick={onClose}
              className="w-full md:w-auto px-8 py-4 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />}
              {isEdit ? "更新する" : "資産を一括登録する"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
