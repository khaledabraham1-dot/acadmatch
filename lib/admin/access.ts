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
