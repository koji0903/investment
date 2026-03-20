import { AuthProvider } from "@/context/AuthContext";
import { PortfolioProvider } from "@/context/PortfolioContext";
import { AlertProvider } from "@/context/AlertContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { ThemeProvider } from "@/context/ThemeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <PortfolioProvider>
            <AlertProvider>
              {children}
            </AlertProvider>
          </PortfolioProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
