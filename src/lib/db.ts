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
  updateDoc
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
