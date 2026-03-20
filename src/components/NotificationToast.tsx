"use client";

import { useNotify, Notification } from "@/context/NotificationContext";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const ICON_MAP = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
  error: <AlertCircle className="w-5 h-5 text-rose-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
};

const STYLE_MAP = {
  success: "border-emerald-100 bg-emerald-50/90 dark:bg-emerald-500/10 dark:border-emerald-500/20",
  error: "border-rose-100 bg-rose-50/90 dark:bg-rose-500/10 dark:border-rose-500/20",
  warning: "border-amber-100 bg-amber-50/90 dark:bg-amber-500/10 dark:border-amber-500/20",
  info: "border-blue-100 bg-blue-50/90 dark:bg-blue-500/10 dark:border-blue-500/20",
};

export const NotificationToast = () => {
  const { notifications, dismiss } = useNotify();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-full max-w-md px-4 pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md",
              STYLE_MAP[n.type]
            )}
          >
            <div className="shrink-0 mt-0.5">{ICON_MAP[n.type]}</div>
            <div className="flex-1 min-w-0">
              {n.title && <p className="text-sm font-black text-slate-900 dark:text-white mb-0.5">{n.title}</p>}
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{n.message}</p>
            </div>
            <button 
              onClick={() => dismiss(n.id)}
              className="shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <X size={14} className="text-slate-400" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
