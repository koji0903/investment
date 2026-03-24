"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  User, 
  signOut as firebaseSignOut 
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDemo: boolean;
  logout: () => Promise<void>;
}

export const DEMO_USER_ID = "demo-user-stable-id";

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isDemo: false,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // デモモードの判定 (URL パラメータ ?demo=true)
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "true") {
      setIsDemo(true);
      setUser({
        uid: DEMO_USER_ID,
        email: "demo@example.com",
        displayName: "Demo Investor",
        isAnonymous: true,
      } as User);
      setLoading(false);
      return;
    }

    // 認証状態の監視
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      setIsDemo(false);
    });

    // 5秒以内に認証が終わらない場合は一旦ロード解除（オフライン/エラー対応）
    const timer = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          console.warn("[Auth] Auth check timed out. Proceeding...");
          return false;
        }
        return prev;
      });
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const logout = async () => {
    try {
      if (isDemo) {
        setIsDemo(false);
        setUser(null);
        return;
      }
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
