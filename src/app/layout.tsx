import type { Metadata, Viewport } from "next";
import "./globals.css";
import SplashScreen from "@/components/SplashScreen";
import BottomNav from "@/components/BottomNav";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Legendário | Reserva de Feijoada",
  description: "A melhor feijoada solidária da região. Reserve sua feijoada completa com o sabor e tradição do Legendário.",
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

import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="beforeInteractive"
        />
      </head>
      <body className="js-loading">
        <Providers>
          <SplashScreen />
          <div id="main-app-content">
            {children}
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
