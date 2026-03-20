import { AuthProvider } from "@/context/AuthContext";
import { PortfolioProvider } from "@/context/PortfolioContext";
import { AlertProvider } from "@/context/AlertContext";
import { NotificationProvider } from "@/context/NotificationContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <PortfolioProvider>
          <AlertProvider>
            {children}
          </AlertProvider>
        </PortfolioProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
