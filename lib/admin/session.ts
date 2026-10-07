import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminBasePath, isAdminEmail, isRecentSignIn } from "@/lib/admin/access";

export type AdminCheck =
  | { status: "admin"; email: string }
  | { status: "reauth"; email: string }
  /** Administrateur sans double vérification : il doit l'activer avant d'entrer. */
  | { status: "mfa-enroll"; email: string }
  /** Double vérification activée, mais pas encore saisie pour cette session. */
  | { status: "mfa-verify"; email: string }
  | { status: "anonymous" }
  | { status: "forbidden" }
  | { status: "unconfigured" };

/**
 * Vérifie côté serveur, dans cet ordre, que la personne connectée :
 * 1. est administratrice (ADMIN_EMAILS) ;
 * 2. s'est connectée récemment (lib/admin/access.ts) ;
 * 3. a validé la double vérification (code de l'application d'authentification,
 *    niveau « aal2 » de Supabase) pendant cette session (2026-10-07).
 * Un mot de passe volé ne suffit donc pas : il faut aussi le téléphone.
 * Toute page, route ou action admin commence par cet appel : la clé secrète
 * de Supabase n'est utilisée qu'après un « admin » ici.
 */
export async function checkAdmin(): Promise<AdminCheck> {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SECRET_KEY || !adminBasePath(process.env.ADMIN_PATH)) return { status: "unconfigured" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "anonymous" };
  if (!isAdminEmail(user.email, process.env.ADMIN_EMAILS)) return { status: "forbidden" };
  const email = user.email!;
  if (!isRecentSignIn(user.last_sign_in_at, new Date())) return { status: "reauth", email };
  if (!(user.factors ?? []).some((f) => f.factor_type === "totp" && f.status === "verified")) return { status: "mfa-enroll", email };
  // getClaims vérifie la signature du jeton de session avant d'en lire le niveau.
  const { data: claims } = await supabase.auth.getClaims();
  return claims?.claims.aal === "aal2" ? { status: "admin", email } : { status: "mfa-verify", email };
}

/** Pour les actions et routes : refuse tout ce qui n'est pas un admin pleinement vérifié. */
export async function requireAdmin(): Promise<string> {
  const access = await checkAdmin();
  if (access.status !== "admin") throw new Error("Accès refusé");
  return access.email;
}

/** Adresse publique (secrète) de l'espace admin, côté serveur uniquement. */
export function adminHref(subpath = ""): string {
  return `${adminBasePath(process.env.ADMIN_PATH) ?? "/admin"}${subpath}`;
}

/** Trace une action admin (best effort : un échec du journal ne bloque pas l'action déjà faite). */
export async function logAdminAction(email: string, action: string, detail: string): Promise<void> {
  await createAdminClient()
    .from("admin_audit")
    .insert({ admin_email: email.slice(0, 320), action: action.slice(0, 60), detail: detail.slice(0, 500) });
}
