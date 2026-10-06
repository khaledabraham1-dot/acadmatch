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
