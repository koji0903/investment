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
import { Asset, Transaction } from "@/types";
import { AlertRule } from "@/types/alert";

/**
 * ユーザーごとの詳細なコレクションパスを取得
 */
const getAssetsCol = (uid: string, portfolioId: string) => 
  collection(db, "users", uid, "portfolios", portfolioId, "assets");

const getTransactionsCol = (uid: string, portfolioId: string) => 
  collection(db, "users", uid, "portfolios", portfolioId, "transactions");

const getAlertsCol = (uid: string) => collection(db, "users", uid, "alerts");

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

export const updateRiskTolerance = async (uid: string, riskTolerance: "low" | "moderate" | "high") => {
  return setDoc(doc(db, "users", uid, "settings", "general"), { riskTolerance }, { merge: true });
};

export const subscribeRiskTolerance = (uid: string, callback: (risk: string) => void) => {
  return onSnapshot(doc(db, "users", uid, "settings", "general"), (doc) => {
    if (doc.exists()) {
      callback(doc.data().riskTolerance || "moderate");
    } else {
      callback("moderate");
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
