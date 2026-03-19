"use client";

import { PortfolioProvider } from "@/context/PortfolioContext";
import { AlertProvider } from "@/context/AlertContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PortfolioProvider>
      <AlertProvider>
        {children}
      </AlertProvider>
    </PortfolioProvider>
  );
}
