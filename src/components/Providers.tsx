import { AuthProvider } from "@/context/AuthContext";
import { PortfolioProvider } from "@/context/PortfolioContext";
import { AlertProvider } from "@/context/AlertContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PortfolioProvider>
        <AlertProvider>
          {children}
        </AlertProvider>
      </PortfolioProvider>
    </AuthProvider>
  );
}
