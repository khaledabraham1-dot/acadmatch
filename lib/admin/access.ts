/**
 * Accès à l'espace admin (2026-10-06) : réservé aux adresses listées dans la
 * variable d'environnement ADMIN_EMAILS (Vercel), séparées par des virgules.
 * Aucune adresse n'est écrite dans le code ; sans variable, personne n'entre.
 */
export function parseAdminEmails(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.includes("@"));
}

export function isAdminEmail(email: string | null | undefined, raw: string | undefined): boolean {
  if (!email) return false;
  return parseAdminEmails(raw).includes(email.trim().toLowerCase());
}

/** Durée maximale depuis la dernière connexion pour agir dans l'admin. */
export const ADMIN_MAX_SESSION_HOURS = 12;

/**
 * Connexion récente : une session restée ouverte des jours sur un ordinateur
 * partagé ne doit pas suffire à ouvrir l'admin ni à supprimer un compte.
 */
export function isRecentSignIn(lastSignInAt: string | null | undefined, now: Date, hours = ADMIN_MAX_SESSION_HOURS): boolean {
  if (!lastSignInAt) return false;
  const at = new Date(lastSignInAt).getTime();
  return Number.isFinite(at) && now.getTime() - at <= hours * 3600_000 && at <= now.getTime() + 60_000;
}

/**
 * Adresse secrète de l'espace admin (2026-10-07) : variable ADMIN_PATH
 * (Vercel), un segment long et aléatoire, par exemple
 * « pilotage-k7m2x9q4w8r3t6v1 ». Le dossier interne app/admin reste, mais
 * proxy.ts renvoie une page introuvable à quiconque tape /admin : seule
 * l'adresse secrète y mène. Sans variable valide, l'admin est fermé.
 * Ce n'est pas la protection principale (compte admin + mot de passe +
 * double vérification), mais l'espace devient invisible aux robots qui
 * essaient /admin, /dashboard, etc.
 */
export function adminBasePath(raw: string | undefined): string | null {
  const slug = (raw ?? "").trim().replace(/^\/+|\/+$/g, "");
  return /^[a-z0-9-]{16,64}$/.test(slug) && slug !== "admin" ? `/${slug}` : null;
}

/** Chemin public (adresse secrète) → chemin interne /admin, ou null si ce n'est pas l'admin. */
export function toInternalAdminPath(pathname: string, base: string | null): string | null {
  if (!base) return null;
  if (pathname === base) return "/admin";
  return pathname.startsWith(`${base}/`) ? `/admin${pathname.slice(base.length)}` : null;
}

/** Le dossier interne /admin, appelé directement : toujours introuvable. */
export function isInternalAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}
