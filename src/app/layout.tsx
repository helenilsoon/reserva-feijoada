import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reserva de Feijoada | Sabor & Tradição",
  description: "Reserve sua feijoada completa com o melhor sabor da região.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
