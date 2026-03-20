import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_JP } from "next/font/google";
import { Providers } from "@/components/Providers";
import { NotificationToast } from "@/components/NotificationToast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PWAManager } from "@/components/PWAManager";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Antigravity Investment",
  description: "AI-powered high-performance investment analysis and portfolio management.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Antigravity",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansJP.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
        <Providers>
          <PWAManager />
          <div className="fixed top-6 right-6 z-50">
            <ThemeToggle />
          </div>
          {children}
          <NotificationToast />
        </Providers>
      </body>
    </html>
  );
}
