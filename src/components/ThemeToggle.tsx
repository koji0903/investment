"use client";

import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative w-14 h-8 rounded-full p-1 transition-colors duration-500 outline-none",
        theme === "dark" ? "bg-indigo-900/40 border border-indigo-500/30" : "bg-slate-200 border border-slate-300"
      )}
      aria-label="Toggle theme"
    >
      <motion.div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center shadow-md",
          theme === "dark" ? "bg-indigo-500 text-white" : "bg-white text-amber-500"
        )}
        animate={{
          x: theme === "dark" ? 24 : 0,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {theme === "dark" ? (
            <motion.div
              key="moon"
              initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.5, rotate: 45, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Moon size={14} fill="currentColor" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ scale: 0.5, rotate: 90, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.5, rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sun size={14} fill="currentColor" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  );
};
