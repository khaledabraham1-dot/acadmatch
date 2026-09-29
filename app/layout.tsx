import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SITE_NAME, siteUrl } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DEFAULT_DESCRIPTION =
  "Comparez votre relevé de notes aux prérequis réels des licences et masters en France et en Belgique : score explicable, lacunes à combler, sources officielles. Gratuit, avant de candidater.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "AcadMatch — Quelles formations en France et en Belgique correspondent à votre parcours ?",
    template: "%s — AcadMatch",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

/**
 * Vercel Web Analytics, sans cookie ni identifiant persistant : servi depuis
 * notre propre domaine (/_vercel/insights), donc aucune origine tierce à
 * ouvrir dans la CSP. Chargé seulement sur Vercel, où ce chemin existe.
 * Script direct plutôt que le paquet @vercel/analytics, dont les peer
 * dependencies optionnelles (SvelteKit, Vite 8) cassent l'installation npm.
 */
const WEB_ANALYTICS_ENABLED = process.env.VERCEL === "1";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900">
        {children}
        {WEB_ANALYTICS_ENABLED && <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />}
      </body>
    </html>
  );
}
