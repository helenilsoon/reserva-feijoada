import type { Metadata, Viewport } from "next";
import "./globals.css";
import SplashScreen from "@/components/SplashScreen";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Reserva de Feijoada | Sabor & Tradição",
  description: "Reserve sua feijoada completa com o melhor sabor da região.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Legendário",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a0f0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <SplashScreen />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
