import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/providers/session-provider";
import CookieConsent from "@/components/CookieConsent";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AlerteMedicaments - Suivi des ruptures de stock",
  description: "Suivez la disponibilite de vos medicaments et recevez des alertes",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <CookieConsent />
        </SessionProvider>
      </body>
    </html>
  );
}
