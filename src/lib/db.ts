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
import { 
  Asset, 
  Transaction, 
  TradeProposal, 
  InvestmentReport, 
  NotificationSettings, 
  RiskRule, 
  TradingRule, 
  PositionSizingSettings, 
  BrokerConnection, 
  ProviderType 
} from "@/types";
import { AlertRule } from "@/types/alert";

import { DEMO_USER_ID } from "@/context/AuthContext";

/**
 * ユーザーごとの詳細なコレクションパスを取得
 */
const getAssetsCol = (uid: string, portfolioId: string) => 
  collection(db, "users", uid, "portfolios", portfolioId, "assets");

const getTransactionsCol = (uid: string, portfolioId: string) => 
  collection(db, "users", uid, "portfolios", portfolioId, "transactions");

const getAlertsCol = (uid: string) => collection(db, "users", uid, "alerts");

const getProposalsCol = (uid: string) => collection(db, "users", uid, "proposals");

const getReportsCol = (uid: string) => collection(db, "users", uid, "reports");

// --- Assets ---

export const subscribeAssets = (uid: string, portfolioId: string = "default", callback: (assets: Asset[]) => void) => {
  if (!uid || uid === DEMO_USER_ID) return () => {};
  return onSnapshot(getAssetsCol(uid, portfolioId), 
    (snapshot) => {
      const assets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Asset[];
      callback(assets);
    },
    (error) => {
      console.warn("[Firestore] subscribeAssets restricted or error:", error.message);
    }
  );
};

export const saveAsset = async (uid: string, asset: Omit<Asset, "id">, portfolioId: string = "default") => {
  if (uid === DEMO_USER_ID) return;
  return addDoc(getAssetsCol(uid, portfolioId), asset);
};

export const removeAsset = async (uid: string, assetId: string, portfolioId: string = "default") => {
  if (uid === DEMO_USER_ID) return;
  return deleteDoc(doc(db, "users", uid, "portfolios", portfolioId, "assets", assetId));
};

// --- Transactions ---

export const subscribeTransactions = (uid: string, portfolioId: string = "default", callback: (transactions: Transaction[]) => void) => {
  if (!uid || uid === DEMO_USER_ID) return () => {};
  const q = query(getTransactionsCol(uid, portfolioId), orderBy("date", "desc"));
  return onSnapshot(q, 
    (snapshot) => {
      const transactions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date
        };
      }) as Transaction[];
      callback(transactions);
    },
    (error) => {
      console.warn("[Firestore] subscribeTransactions restricted or error:", error.message);
    }
  );
};

export const saveTransaction = async (uid: string, transaction: Omit<Transaction, "id">, portfolioId: string = "default") => {
  if (uid === DEMO_USER_ID) return;
  return addDoc(getTransactionsCol(uid, portfolioId), {
    ...transaction,
    date: Timestamp.fromDate(new Date(transaction.date))
  });
};

// --- Alerts ---

export const subscribeAlerts = (uid: string, callback: (alerts: AlertRule[]) => void) => {
  if (!uid || uid === DEMO_USER_ID) return () => {};
  return onSnapshot(getAlertsCol(uid), 
    (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as AlertRule[];
      callback(alerts);
    },
    (error) => {
      console.warn("[Firestore] subscribeAlerts error:", error.message);
    }
  );
};

export const saveAlert = async (uid: string, alert: AlertRule) => {
  if (uid === DEMO_USER_ID) return;
  const { id, ...data } = alert;
  return setDoc(doc(db, "users", uid, "alerts", id), data);
};

export const updateAlertEnabled = async (uid: string, alertId: string, enabled: boolean) => {
  if (uid === DEMO_USER_ID) return;
  return updateDoc(doc(db, "users", uid, "alerts", alertId), { enabled });
};

export const removeAlert = async (uid: string, alertId: string) => {
  if (uid === DEMO_USER_ID) return;
  return deleteDoc(doc(db, "users", uid, "alerts", alertId));
};

// --- Trade Proposals ---

export const subscribeTradeProposals = (uid: string, callback: (proposals: TradeProposal[]) => void) => {
  if (!uid || uid === DEMO_USER_ID) return () => {};
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
  if (uid === DEMO_USER_ID) return;
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

  return batch.commit().catch(err => {
    console.warn("[Firestore] executeTradeProposal batch commit failed:", err.message);
  });
};

export const rejectTradeProposal = async (uid: string, proposalId: string) => {
  if (uid === DEMO_USER_ID) return;
  return updateDoc(doc(db, "users", uid, "proposals", proposalId), {
    status: "rejected",
    rejectedAt: serverTimestamp()
  });
};

export const addDemoProposal = async (uid: string) => {
  if (uid === DEMO_USER_ID) return;
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

// --- Investment Reports ---

export const subscribeReports = (uid: string, callback: (reports: InvestmentReport[]) => void) => {
  if (!uid || uid === DEMO_USER_ID) return () => {};
  const q = query(getReportsCol(uid), orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
      };
    }) as InvestmentReport[];
    callback(reports);
  });
};

export const saveReport = async (uid: string, report: Omit<InvestmentReport, "id" | "createdAt">) => {
  if (uid === DEMO_USER_ID) return;
  return addDoc(getReportsCol(uid), {
    ...report,
    createdAt: serverTimestamp()
  });
};

// --- Notification Settings ---

const getNotificationSettingsDoc = (uid: string) => doc(db, "users", uid, "settings", "notifications");

export const subscribeNotificationSettings = (uid: string, callback: (settings: NotificationSettings) => void) => {
  if (!uid || uid === DEMO_USER_ID) {
    // デモ用初期値
    callback({
      lineEnabled: false,
      lineToken: "",
      emailEnabled: false,
      emailAddress: "",
      triggers: { alerts: true, strategy: true, market: true }
    });
    return () => {};
  }
  return onSnapshot(getNotificationSettingsDoc(uid), (doc) => {
    if (doc.exists()) {
      callback(doc.data() as NotificationSettings);
    } else {
      callback({
        lineEnabled: false,
        lineToken: "",
        emailEnabled: false,
        emailAddress: "",
        triggers: { alerts: true, strategy: true, market: true }
      });
    }
  });
};

export const updateNotificationSettings = async (uid: string, settings: Partial<NotificationSettings>) => {
  if (uid === DEMO_USER_ID) return;
  const docRef = getNotificationSettingsDoc(uid);
  return setDoc(docRef, settings, { merge: true });
};

// --- Risk Rules ---

const getRiskRulesDoc = (uid: string) => doc(db, "users", uid, "settings", "riskRules");

export const subscribeRiskRules = (uid: string, callback: (rules: RiskRule) => void) => {
  if (!uid || uid === DEMO_USER_ID) {
    callback({ maxLossPct: 15, stopLossPct: 10, maxDrawdownPct: 20, enabled: true, actionType: "alert" });
    return () => {};
  }
  return onSnapshot(getRiskRulesDoc(uid), (doc) => {
    if (doc.exists()) {
      callback(doc.data() as RiskRule);
    } else {
      callback({ maxLossPct: 15, stopLossPct: 10, maxDrawdownPct: 20, enabled: true, actionType: "alert" });
    }
  });
};

export const updateRiskRules = async (uid: string, rules: Partial<RiskRule>) => {
  if (uid === DEMO_USER_ID) return;
  const docRef = getRiskRulesDoc(uid);
  return setDoc(docRef, rules, { merge: true });
};

// --- Trading Rules ---

const getTradingRulesDoc = (uid: string) => doc(db, "users", uid, "settings", "tradingRules");

export const subscribeTradingRules = (uid: string, callback: (rules: TradingRule[]) => void) => {
  if (!uid || uid === DEMO_USER_ID) {
    callback([{ id: "default-sma", strategy: "sma_crossover", shortPeriod: 5, longPeriod: 25, enabled: true, autoPropose: true }]);
    return () => {};
  }
  return onSnapshot(collection(db, "users", uid, "settings", "tradingRules", "items"), (snapshot) => {
    const rules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TradingRule[];
    if (rules.length === 0) {
      callback([{ id: "default-sma", strategy: "sma_crossover", shortPeriod: 5, longPeriod: 25, enabled: true, autoPropose: true }]);
    } else {
      callback(rules);
    }
  });
};

export const updateTradingRule = async (uid: string, ruleId: string, rule: Partial<TradingRule>) => {
  if (uid === DEMO_USER_ID) return;
  const docRef = doc(db, "users", uid, "settings", "tradingRules", "items", ruleId);
  return setDoc(docRef, rule, { merge: true });
};

// --- Position Sizing ---

const getPositionSizingDoc = (uid: string) => doc(db, "users", uid, "settings", "positionSizing");

export const subscribePositionSizing = (uid: string, callback: (settings: PositionSizingSettings) => void) => {
  if (!uid || uid === DEMO_USER_ID) {
    callback({ maxCapitalPerTradePct: 20, riskPerTradePct: 1, enabled: true });
    return () => {};
  }
  return onSnapshot(getPositionSizingDoc(uid), (doc) => {
    if (doc.exists()) {
      callback(doc.data() as PositionSizingSettings);
    } else {
      callback({ maxCapitalPerTradePct: 20, riskPerTradePct: 1, enabled: true });
    }
  });
};

export const updatePositionSizing = async (uid: string, settings: Partial<PositionSizingSettings>) => {
  if (uid === DEMO_USER_ID) return;
  const docRef = getPositionSizingDoc(uid);
  return setDoc(docRef, settings, { merge: true });
};

// --- Analysis ---

export const subscribeAnalysis = (uid: string, portfolioId: string = "default", callback: (analysis: any) => void) => {
  if (!uid || uid === DEMO_USER_ID) return () => {};
  return onSnapshot(doc(db, "users", uid, "portfolios", portfolioId, "analysis", "summary"), (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback(null);
    }
  });
};

export const subscribeStrategy = (uid: string, portfolioId: string = "default", callback: (strategy: any) => void) => {
  if (!uid || uid === DEMO_USER_ID) return () => {};
  return onSnapshot(doc(db, "users", uid, "portfolios", portfolioId, "analysis", "strategy"), 
    (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      } else {
        callback(null);
      }
    },
    (error) => {
      console.warn("[Firestore] subscribeStrategy suppressed or error:", error.message);
    }
  );
};

export const subscribeBehavior = (uid: string, portfolioId: string = "default", callback: (behavior: any) => void) => {
  if (!uid || uid === DEMO_USER_ID) return () => {};
  return onSnapshot(doc(db, "users", uid, "portfolios", portfolioId, "analysis", "behavior"), 
    (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      } else {
        callback(null);
      }
    },
    (error) => {
      console.warn("[Firestore] subscribeBehavior suppressed or error:", error.message);
    }
  );
};

export const subscribeGrowthMetrics = (uid: string, portfolioId: string = "default", callback: (growth: any) => void) => {
  if (!uid || uid === DEMO_USER_ID) return () => {};
  return onSnapshot(doc(db, "users", uid, "portfolios", portfolioId, "analysis", "growth"), 
    (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      } else {
        callback(null);
      }
    },
    (error) => {
      console.warn("[Firestore] subscribeGrowthMetrics suppressed or error:", error.message);
    }
  );
};

export const saveGrowthMetrics = async (uid: string, portfolioId: string = "default", metrics: any) => {
  if (uid === DEMO_USER_ID) return;
  return setDoc(doc(db, "users", uid, "portfolios", portfolioId, "analysis", "growth"), {
    ...metrics,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const subscribePortfolioMetrics = (uid: string, portfolioId: string = "default", callback: (metrics: any) => void) => {
  if (!uid || uid === DEMO_USER_ID) return () => {};
  const q = query(collection(db, "users", uid, "portfolios", portfolioId, "portfolio_metrics"), orderBy("updatedAt", "desc"));
  return onSnapshot(q, 
    (snapshot) => {
      if (!snapshot.empty) {
        callback(snapshot.docs[0].data());
      } else {
        callback(null);
      }
    },
    (error) => {
      console.warn("[Firestore] subscribePortfolioMetrics suppressed or error:", error.message);
    }
  );
};

export const savePortfolioMetrics = async (uid: string, portfolioId: string = "default", metrics: any) => {
  if (uid === DEMO_USER_ID) return;
  return addDoc(collection(db, "users", uid, "portfolios", portfolioId, "portfolio_metrics"), {
    ...metrics,
    updatedAt: serverTimestamp()
  });
};

export const updateRiskSettings = async (uid: string, settings: { riskTolerance?: string, autoExecute?: boolean }) => {
  if (uid === DEMO_USER_ID) return;
  return setDoc(doc(db, "users", uid, "settings", "general"), { ...settings, updatedAt: serverTimestamp() }, { merge: true });
};

export const subscribeRiskSettings = (uid: string, callback: (settings: any) => void) => {
  if (!uid || uid === DEMO_USER_ID) {
    callback({ riskTolerance: "moderate", autoExecute: false });
    return () => {};
  }
  return onSnapshot(doc(db, "users", uid, "settings", "general"), 
    (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      } else {
        callback({ riskTolerance: "moderate", autoExecute: false });
      }
    },
    (error) => {
      console.warn("[Firestore] subscribeRiskSettings error:", error.message);
    }
  );
};

export const initializeUserData = async (uid: string, email: string, displayName: string = "") => {
  if (uid === DEMO_USER_ID) return;
  const batch = writeBatch(db);
  const userRef = doc(db, "users", uid);
  batch.set(userRef, { email, displayName, createdAt: serverTimestamp(), lastLogin: serverTimestamp() });
  const portfolioRef = doc(db, "users", uid, "portfolios", "default");
  batch.set(portfolioRef, { name: "メインポートフォリオ", createdAt: serverTimestamp() });
  const settingsRef = doc(db, "users", uid, "settings", "general");
  batch.set(settingsRef, { riskTolerance: "moderate", currency: "JPY", updatedAt: serverTimestamp() });
  return batch.commit().catch(err => {
    console.warn("[Firestore] initializeUserData batch commit failed:", err.message);
  });
};

export const generateDemoData = async (uid: string, portfolioId: string = "default") => {
  if (uid === DEMO_USER_ID) {
    console.log("[Demo] Skipping Firestore write for demo user.");
    return;
  }
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
    batch.set(assetRef, { ...data, updatedAt: serverTimestamp() });
    const transRef = doc(transCol);
    batch.set(transRef, { assetId: assetRef.id, type: "buy", quantity: data.quantity, price: data.averageCost, date: serverTimestamp() });
  });

  const growthRef = doc(db, "users", uid, "portfolios", portfolioId, "analysis", "growth");
  batch.set(growthRef, { cagr: 12.5, returnRate: 15.8, sharpeRatio: 1.45, maxDrawdown: 6.2, lastCalculated: new Date().toISOString(), updatedAt: serverTimestamp() });
  
  const metricsCol = collection(db, "users", uid, "portfolios", portfolioId, "portfolio_metrics");
  const metricsRef = doc(metricsCol);
  batch.set(metricsRef, { total: 82, diversification: 85, risk: 78, efficiency: 91, growth: 80, consistency: 75, updatedAt: serverTimestamp() });

  return batch.commit().catch(err => {
    console.warn("[Firestore] generateDemoData batch commit failed:", err.message);
  });
};

export const clearPortfolioData = async (uid: string, portfolioId: string = "default") => {
  if (uid === DEMO_USER_ID) return;
  const assetsCol = getAssetsCol(uid, portfolioId);
  const transCol = getTransactionsCol(uid, portfolioId);
  const assetsSnap = await getDocs(assetsCol).catch(() => ({ docs: [] } as any));
  const transSnap = await getDocs(transCol).catch(() => ({ docs: [] } as any));
  const batch = writeBatch(db);
  assetsSnap.docs.forEach((d: any) => batch.delete(d.ref));
  transSnap.docs.forEach((d: any) => batch.delete(d.ref));
  return batch.commit().catch(err => {
    console.warn("[Firestore] clearPortfolioData batch commit failed:", err.message);
  });
};

/**
 * 金融機関連携の状態を購読する
 */
export const subscribeBrokerConnections = (uid: string, onUpdate: (data: BrokerConnection[]) => void) => {
  if (!uid || uid === DEMO_USER_ID) {
    onUpdate([
      { id: "stock", providerId: "stock", name: "証券口座", isConnected: false, lastSyncedAt: null, status: "disconnected" },
      { id: "crypto", providerId: "crypto", name: "暗号資産", isConnected: false, lastSyncedAt: null, status: "disconnected" },
      { id: "fx", providerId: "fx", name: "FX（外国為替）", isConnected: false, lastSyncedAt: null, status: "disconnected" }
    ]);
    return () => {};
  }
  const q = query(collection(db, "users", uid, "settings", "brokerConnections", "items"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BrokerConnection));
    if (data.length === 0) {
      onUpdate([
        { id: "stock", providerId: "stock", name: "証券口座", isConnected: false, lastSyncedAt: null, status: "disconnected" },
        { id: "crypto", providerId: "crypto", name: "暗号資産", isConnected: false, lastSyncedAt: null, status: "disconnected" },
        { id: "fx", providerId: "fx", name: "FX（外国為替）", isConnected: false, lastSyncedAt: null, status: "disconnected" }
      ]);
    } else {
      onUpdate(data);
    }
  });
};

export const updateBrokerConnection = async (uid: string, connectionId: string, update: Partial<BrokerConnection>) => {
  if (uid === DEMO_USER_ID) return;
  const docRef = doc(db, "users", uid, "settings", "brokerConnections", "items", connectionId);
  await setDoc(docRef, update, { merge: true });
};
