import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail, isRecentSignIn } from "@/lib/admin/access";

export type AdminCheck =
  | { status: "admin"; email: string }
  | { status: "reauth"; email: string }
  | { status: "anonymous" }
  | { status: "forbidden" }
  | { status: "unconfigured" };

/**
 * Vérifie côté serveur que la personne connectée est administratrice ET
 * qu'elle s'est connectée récemment (lib/admin/access.ts). Toute page, route
 * ou action admin commence par cet appel : la clé secrète de Supabase n'est
 * utilisée qu'après un « admin » ici.
 */
export async function checkAdmin(): Promise<AdminCheck> {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SECRET_KEY) return { status: "unconfigured" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "anonymous" };
  if (!isAdminEmail(user.email, process.env.ADMIN_EMAILS)) return { status: "forbidden" };
  return isRecentSignIn(user.last_sign_in_at, new Date()) ? { status: "admin", email: user.email! } : { status: "reauth", email: user.email! };
}

/** Pour les actions et exports : refuse tout ce qui n'est pas un admin récemment connecté. */
export async function requireAdmin(): Promise<string> {
  const access = await checkAdmin();
  if (access.status !== "admin") throw new Error("Accès refusé");
  return access.email;
}

/** Trace une action admin (best effort : un échec du journal ne bloque pas l'action déjà faite). */
export async function logAdminAction(email: string, action: string, detail: string): Promise<void> {
  await createAdminClient()
    .from("admin_audit")
    .insert({ admin_email: email.slice(0, 320), action: action.slice(0, 60), detail: detail.slice(0, 500) });
}
