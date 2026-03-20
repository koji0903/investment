"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User, ChevronDown, Settings, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export const UserMenu = () => {
  const { user, logout, isDemo } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 p-1.5 pr-3 rounded-full transition-all border outline-none group",
          isOpen 
            ? "bg-white dark:bg-slate-800 border-indigo-500/50 shadow-lg shadow-indigo-500/10" 
            : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-white shadow-inner transition-transform group-hover:scale-105",
          isDemo ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-gradient-to-br from-indigo-500 to-purple-600"
        )}>
          {isDemo ? <Shield size={16} /> : <User size={16} />}
        </div>
        <span className="text-xs font-black text-slate-700 dark:text-slate-200 hidden sm:block">
          {user.displayName || user.email?.split('@')[0] || "User"}
        </span>
        <ChevronDown 
          size={14} 
          className={cn(
            "text-slate-400 transition-transform duration-300",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-[100]"
          >
            <div className="p-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ログイン中</p>
              <p className="text-sm font-black text-slate-800 dark:text-white truncate">{user.displayName || "ゲストユーザー"}</p>
              <p className="text-[10px] font-bold text-slate-500 truncate">{user.email}</p>
            </div>

            <div className="p-2">
              {isDemo && (
                <div className="px-3 py-2 mb-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20">
                  <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Shield size={12} /> デモモード閲覧中
                  </p>
                </div>
              )}
              
              <button 
                onClick={() => {
                  setIsOpen(false);
                  // ツールタブへ遷移するなどの処理があればここに追加
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-xl transition-colors group"
              >
                <Settings size={16} className="group-hover:rotate-90 transition-transform duration-500" />
                アカウント設定
              </button>

              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors mt-1"
              >
                <LogOut size={16} />
                ログアウト
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
