import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Firebaseの設定 (環境変数から取得)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 設定が有効かどうかをチェック
const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "undefined";

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (isConfigValid) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  // 設定が不足している場合は、ダミーまたはエラースロー用のプロキシを返す
  // (アプリケーション全体がクラッシュするのを防ぐ)
  console.warn("Firebase configuration is missing. Please set NEXT_PUBLIC_FIREBASE_API_KEY in .env.local");
  
  // 最小限の初期化 (エラー回避用)
  const dummyApp = { name: "dummy" } as FirebaseApp;
  app = dummyApp;
  // @ts-ignore
  auth = { currentUser: null, onAuthStateChanged: (cb) => { cb(null); return () => {}; } } as Auth;
  // @ts-ignore
  db = {} as Firestore;
}

export { app, auth, db, isConfigValid };
