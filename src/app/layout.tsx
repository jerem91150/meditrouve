import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/providers/session-provider";
import CookieConsent from "@/components/CookieConsent";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = "https://www.meditrouve.fr";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MediTrouve - Suivi des ruptures de médicaments en France",
    template: "%s | MediTrouve",
  },
  description: "Trouvez vos médicaments en rupture de stock, localisez les pharmacies qui les ont et recevez des alertes de disponibilité. Données officielles ANSM.",
  keywords: ["médicaments", "rupture de stock", "pharmacie", "santé", "ordonnance", "pénurie", "ANSM", "tension approvisionnement", "disponibilité médicaments"],
  authors: [{ name: "MediTrouve" }],
  creator: "MediTrouve",
  publisher: "MediTrouve",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "MediTrouve - Suivi des ruptures de médicaments en France",
    description: "Trouvez vos médicaments en rupture de stock et localisez les pharmacies qui les ont. Alertes gratuites.",
    url: siteUrl,
    siteName: "MediTrouve",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MediTrouve - Suivi des ruptures de médicaments",
    description: "Trouvez vos médicaments en rupture de stock et localisez les pharmacies qui les ont.",
  },
  verification: {
    google: "VOTRE_CODE_VERIFICATION_GOOGLE",
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
