import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  updateDoc,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebase";
import { Asset, Transaction, TradeProposal } from "@/types";
import { AlertRule } from "@/types/alert";

/**
 * ユーザーごとの詳細なコレクションパスを取得
 */
const getAssetsCol = (uid: string, portfolioId: string) => 
  collection(db, "users", uid, "portfolios", portfolioId, "assets");

const getTransactionsCol = (uid: string, portfolioId: string) => 
  collection(db, "users", uid, "portfolios", portfolioId, "transactions");

const getAlertsCol = (uid: string) => collection(db, "users", uid, "alerts");

const getProposalsCol = (uid: string) => collection(db, "users", uid, "proposals");

// --- Assets ---

export const subscribeAssets = (uid: string, portfolioId: string = "default", callback: (assets: Asset[]) => void) => {
  return onSnapshot(getAssetsCol(uid, portfolioId), (snapshot) => {
    const assets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Asset[];
    callback(assets);
  });
};

export const saveAsset = async (uid: string, asset: Omit<Asset, "id">, portfolioId: string = "default") => {
  return addDoc(getAssetsCol(uid, portfolioId), asset);
};

export const removeAsset = async (uid: string, assetId: string, portfolioId: string = "default") => {
  return deleteDoc(doc(db, "users", uid, "portfolios", portfolioId, "assets", assetId));
};

// --- Transactions ---

export const subscribeTransactions = (uid: string, portfolioId: string = "default", callback: (transactions: Transaction[]) => void) => {
  const q = query(getTransactionsCol(uid, portfolioId), orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date
      };
    }) as Transaction[];
    callback(transactions);
  });
};

export const saveTransaction = async (uid: string, transaction: Omit<Transaction, "id">, portfolioId: string = "default") => {
  return addDoc(getTransactionsCol(uid, portfolioId), {
    ...transaction,
    date: Timestamp.fromDate(new Date(transaction.date))
  });
};

// --- Alerts ---

export const subscribeAlerts = (uid: string, callback: (alerts: AlertRule[]) => void) => {
  return onSnapshot(getAlertsCol(uid), (snapshot) => {
    const alerts = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as AlertRule[];
    callback(alerts);
  });
};

export const saveAlert = async (uid: string, alert: AlertRule) => {
  const { id, ...data } = alert;
  return setDoc(doc(db, "users", uid, "alerts", id), data);
};

export const updateAlertEnabled = async (uid: string, alertId: string, enabled: boolean) => {
  return updateDoc(doc(db, "users", uid, "alerts", alertId), { enabled });
};

export const removeAlert = async (uid: string, alertId: string) => {
  return deleteDoc(doc(db, "users", uid, "alerts", alertId));
};

// --- Trade Proposals ---

export const subscribeTradeProposals = (uid: string, callback: (proposals: TradeProposal[]) => void) => {
  const q = query(getProposalsCol(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const proposals = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
      };
    }) as TradeProposal[];
    callback(proposals.filter(p => p.status === "pending"));
  });
};

export const executeTradeProposal = async (uid: string, proposal: TradeProposal, portfolioId: string = "default") => {
  const batch = writeBatch(db);
  const proposalRef = doc(db, "users", uid, "proposals", proposal.id);
  const transCol = getTransactionsCol(uid, portfolioId);
  const assetsCol = getAssetsCol(uid, portfolioId);

  // 1. プロポーザルを完了ステータスに更新
  batch.update(proposalRef, { status: "executed", executedAt: serverTimestamp() });

  // 2. トランザクションレコードの作成
  const transRef = doc(transCol);
  batch.set(transRef, {
    assetId: "", // シンボルベースで後で照合するか、新規作成
    assetSymbol: proposal.assetSymbol,
    assetName: proposal.assetName,
    type: proposal.type,
    quantity: proposal.quantity,
    price: proposal.price,
    date: serverTimestamp(),
    isFromProposal: true,
    proposalId: proposal.id
  });

  // 3. アセットの更新または新規作成
  // 既存アセットの検索
  const assetsQuery = query(assetsCol, where("symbol", "==", proposal.assetSymbol));
  const assetsSnap = await getDocs(assetsQuery);

  if (!assetsSnap.empty) {
    const assetDoc = assetsSnap.docs[0];
    const assetData = assetDoc.data();
    const currentQty = assetData.quantity || 0;
    const currentPrice = assetData.currentPrice || proposal.price;
    const currentAvgCost = assetData.averageCost || proposal.price;

    let newQty = currentQty;
    let newAvgCost = currentAvgCost;

    if (proposal.type === "buy") {
      newQty = currentQty + proposal.quantity;
      newAvgCost = (currentAvgCost * currentQty + proposal.price * proposal.quantity) / newQty;
    } else {
      newQty = Math.max(0, currentQty - proposal.quantity);
    }

    batch.update(assetDoc.ref, {
      quantity: newQty,
      averageCost: newAvgCost,
      updatedAt: serverTimestamp()
    });
  } else if (proposal.type === "buy") {
    // 新規アセット
    const newAssetRef = doc(assetsCol);
    batch.set(newAssetRef, {
      symbol: proposal.assetSymbol,
      name: proposal.assetName,
      category: "株", // デフォルト。AIが判定しても良い
      currentPrice: proposal.price,
      quantity: proposal.quantity,
      averageCost: proposal.price,
      updatedAt: serverTimestamp()
    });
    // トランザクションのassetIdを更新
    batch.update(transRef, { assetId: newAssetRef.id });
  }

  return batch.commit();
};

export const rejectTradeProposal = async (uid: string, proposalId: string) => {
  return updateDoc(doc(db, "users", uid, "proposals", proposalId), {
    status: "rejected",
    rejectedAt: serverTimestamp()
  });
};

export const addDemoProposal = async (uid: string) => {
  const proposal: Omit<TradeProposal, "id"> = {
    assetSymbol: "NVDA",
    assetName: "NVIDIA Corp",
    type: "buy",
    quantity: 5,
    price: 920.5,
    reason: "強力なGPU需要とAI市場の拡大により、短期的な上昇トレンドが継続すると予想されます。テクニカル指標も買いサインを示しています。",
    status: "pending",
    createdAt: new Date().toISOString()
  };

  return addDoc(getProposalsCol(uid), {
    ...proposal,
    createdAt: serverTimestamp()
  });
};

// --- Analysis ---

export const subscribeAnalysis = (uid: string, portfolioId: string = "default", callback: (analysis: any) => void) => {
  return onSnapshot(doc(db, "users", uid, "portfolios", portfolioId, "analysis", "summary"), (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback(null);
    }
  });
};

export const subscribeStrategy = (uid: string, portfolioId: string = "default", callback: (strategy: any) => void) => {
  return onSnapshot(doc(db, "users", uid, "portfolios", portfolioId, "analysis", "strategy"), (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback(null);
    }
  });
};

export const subscribeBehavior = (uid: string, portfolioId: string = "default", callback: (behavior: any) => void) => {
  return onSnapshot(doc(db, "users", uid, "portfolios", portfolioId, "analysis", "behavior"), (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback(null);
    }
  });
};

export const updateRiskSettings = async (uid: string, settings: { riskTolerance?: string, autoExecute?: boolean }) => {
  return setDoc(doc(db, "users", uid, "settings", "general"), { ...settings, updatedAt: serverTimestamp() }, { merge: true });
};

export const subscribeRiskSettings = (uid: string, callback: (settings: any) => void) => {
  return onSnapshot(doc(db, "users", uid, "settings", "general"), (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback({ riskTolerance: "moderate", autoExecute: false });
    }
  });
};

export const initializeUserData = async (uid: string, email: string, displayName: string = "") => {
  const batch = writeBatch(db);

  // 1. ユーザー基本ドキュメント
  const userRef = doc(db, "users", uid);
  batch.set(userRef, {
    email,
    displayName,
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
  });

  // 2. デフォルトポートフォリオ
  const portfolioRef = doc(db, "users", uid, "portfolios", "default");
  batch.set(portfolioRef, {
    name: "メインポートフォリオ",
    createdAt: serverTimestamp(),
  });

  // 3. 初期設定
  const settingsRef = doc(db, "users", uid, "settings", "general");
  batch.set(settingsRef, {
    riskTolerance: "moderate",
    currency: "JPY",
    updatedAt: serverTimestamp(),
  });

  return batch.commit();
};

export const generateDemoData = async (uid: string, portfolioId: string = "default") => {
  const batch = writeBatch(db);
  const assetsCol = getAssetsCol(uid, portfolioId);
  const transCol = getTransactionsCol(uid, portfolioId);

  const demoAssets = [
    { name: "Apple Inc.", symbol: "AAPL", category: "株", currentPrice: 190.5, quantity: 10, averageCost: 175.2 },
    { name: "Toyota Motor", symbol: "7203.T", category: "株", currentPrice: 3500, quantity: 100, averageCost: 2800 },
    { name: "Bitcoin", symbol: "BTC", category: "仮想通貨", currentPrice: 9500000, quantity: 0.1, averageCost: 6000000 },
    { name: "Ethereum", symbol: "ETH", category: "仮想通貨", currentPrice: 450000, quantity: 2, averageCost: 320000 },
    { name: "eMAXIS Slim S&P500", symbol: "SP500_TRUST", category: "投資信託", currentPrice: 25000, quantity: 100, averageCost: 18000 },
    { name: "ドル/円 (L)", symbol: "USDJPY", category: "FX", currentPrice: 150.2, quantity: 10000, averageCost: 145.5 },
  ];

  demoAssets.forEach(data => {
    const assetRef = doc(assetsCol);
    batch.set(assetRef, {
      ...data,
      updatedAt: serverTimestamp()
    });

    // 初期購入トランザクション
    const transRef = doc(transCol);
    batch.set(transRef, {
      assetId: assetRef.id,
      type: "buy",
      quantity: data.quantity,
      price: data.averageCost,
      date: serverTimestamp()
    });
  });

  return batch.commit();
};

export const clearPortfolioData = async (uid: string, portfolioId: string = "default") => {
  const batch = writeBatch(db);
  const assetsCol = getAssetsCol(uid, portfolioId);
  const transCol = getTransactionsCol(uid, portfolioId);

  // 全アセットの取得
  const assetsSnap = await getDocs(assetsCol);
  assetsSnap.docs.forEach(d => batch.delete(d.ref));

  // 全トランザクションの取得
  const transSnap = await getDocs(transCol);
  transSnap.docs.forEach(d => batch.delete(d.ref));

  return batch.commit();
};
