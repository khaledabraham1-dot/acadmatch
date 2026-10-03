import type { Metadata } from "next";
import { Figtree, Unbounded } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SITE_NAME, siteUrl } from "@/lib/site";
import { SyncManager } from "@/components/account/SyncStatus";

// Identité « Radar » : Figtree pour le texte (très lisible sur petit écran),
// Unbounded pour les grands titres et les scores. Voir app/globals.css.
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const DEFAULT_DESCRIPTION =
  "Comparez votre relevé de notes aux prérequis réels des licences et masters en France et en Belgique : score explicable, lacunes à combler, sources officielles. Gratuit, avant de candidater.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    // ~60 caractères : au-delà, Google coupe le titre dans ses résultats.
    default: "AcadMatch — Votre licence ou master en France et en Belgique",
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
      className={`${figtree.variable} ${unbounded.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background font-sans text-slate-900">
        {children}
        <SyncManager />
        {WEB_ANALYTICS_ENABLED && <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />}
      </body>
    </html>
  );
}
