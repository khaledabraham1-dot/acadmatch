/**
 * En-têtes de sécurité HTTP appliqués à toutes les réponses (next.config.ts).
 *
 * CSP sans nonce, volontairement : le catalogue et la plupart des pages sont
 * pré-rendus statiquement, et un nonce forcerait le rendu dynamique de
 * chaque page (voir node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md).
 * `script-src` garde donc 'unsafe-inline' (scripts d'hydratation de Next),
 * mais la politique verrouille ce qui compte pour AcadMatch :
 * - `connect-src` : le navigateur ne parle qu'à notre origine et à Supabase
 *   — un script injecté ne pourrait pas exfiltrer un profil ailleurs ;
 * - `frame-ancestors 'none'` : pas d'intégration dans une iframe (clickjacking) ;
 * - `object-src`, `base-uri`, `form-action` : ferment les vecteurs classiques.
 */

type Header = { key: string; value: string };

/** Origine (schéma + hôte) de l'URL Supabase, ou null si absente/invalide. */
export function supabaseOrigin(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function contentSecurityPolicy({ isDev, supabaseUrl }: { isDev: boolean; supabaseUrl?: string }): string {
  const supabase = supabaseOrigin(supabaseUrl);
  const directives = [
    "default-src 'self'",
    // 'unsafe-eval' : uniquement en dev (React reconstruit les piles d'erreur serveur).
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    // En dev, le rechargement à chaud passe par un WebSocket sur la même origine.
    `connect-src 'self'${supabase ? ` ${supabase}` : ""}${isDev ? " ws:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ];
  return directives.join("; ");
}

export function securityHeaders(options: { isDev: boolean; supabaseUrl?: string }): Header[] {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(options) },
    // Doublon de frame-ancestors pour les navigateurs anciens (Android WebView).
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    // Les liens vers les sites officiels ne reçoivent que notre domaine, jamais le chemin.
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // L'import de relevé passe par <input type="file"> : aucune API capteur n'est utilisée.
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
}
