"use client";

import React, { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";
import { auth, isConfigValid } from "@/lib/firebase";
import { initializeUserData, generateDemoData } from "@/lib/db";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus, Mail, Lock, Loader2, ArrowRight, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!authLoading && user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  if (!isConfigValid) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 border border-amber-500/30 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-amber-500/20 rounded-2xl">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-center mb-4 text-amber-500">Firebase設定が必要です</h2>
          <p className="text-slate-400 text-sm mb-6 text-center leading-relaxed">
            Firebase AuthenticationとFirestoreを利用するために、環境変数の設定が必要です。
          </p>
          <div className="bg-slate-950 rounded-2xl p-5 mb-8 font-mono text-xs text-indigo-400 border border-slate-700">
            1. <code className="text-white">.env.local</code> を作成<br/>
            2. プロジェクト設定からAPIキー等をコピー<br/>
            3. アプリを再起動（npm run dev）
          </div>
          <p className="text-xs text-slate-500 text-center italic">
            ※ 詳細は .env.local.example を参照してください。
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        // Firestore初期データの作成
        await initializeUserData(userCredential.user.uid, email, name);
      }
      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError(
        err.code === "auth/user-not-found" || err.code === "auth/wrong-password" 
          ? "メールアドレスまたはパスワードが正しくありません。"
          : err.code === "auth/email-already-in-use"
          ? "このメールアドレスは既に登録されています。"
          : "認証に失敗しました。もう一度お試しください。"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError("");
    const demoEmail = "demo@example.com";
    const demoPassword = "demo-password-123";

    try {
      try {
        // 1. 既存のデモユーザーでログイン試行
        await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
      } catch (err: any) {
        // 2. 存在しなければ新規作成
        if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
          const userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
          await updateProfile(userCredential.user, { displayName: "Demo Investor" });
          
          // 初期化とデモデータ生成
          await initializeUserData(userCredential.user.uid, demoEmail, "Demo Investor");
          await generateDemoData(userCredential.user.uid);
          
          await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
        } else {
          throw err;
        }
      }
      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError("デモログインに失敗しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-6 md:p-8">
          <div className="flex justify-center mb-6 md:mb-8">
            <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
              <LogIn className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-center text-slate-800 dark:text-slate-100 mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-center text-slate-500 dark:text-slate-400 mb-6 md:mb-8 text-xs md:text-sm">
            {isLogin ? "資産状況をチェックしましょう" : "新しい投資体験をここから始めましょう"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">お名前</label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 pl-10 pr-4 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    placeholder="投資 太郎"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 ml-1">メールアドレス</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 pl-10 pr-4 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  placeholder="investor@example.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 ml-1">パスワード</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 pl-10 pr-4 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl text-rose-500 text-xs font-bold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-400 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25 mt-6"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {isLogin ? "ログイン" : "アカウント作成"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-4 text-slate-400 font-bold tracking-widest">OR</span>
            </div>
          </div>

          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all border border-slate-700 shadow-xl group"
          >
            <Sparkles className="w-5 h-5 text-amber-400 group-hover:scale-125 transition-transform" />
            デモデータでログイン
          </button>

          <div className="mt-4 text-center">
            <button
              onClick={() => router.push("/?demo=true")}
              className="text-xs font-bold text-slate-500 hover:text-indigo-500 transition-colors"
            >
              閲覧専用デモ（ログイン不要）で試す
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-bold text-indigo-500 hover:text-indigo-600"
            >
              {isLogin ? "新しいアカウントを作成する" : "既にアカウントをお持ちの方"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
