import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAdminEmail } from "@/lib/admin/access";

export type AdminCheck = { status: "admin"; email: string } | { status: "anonymous" } | { status: "forbidden" } | { status: "unconfigured" };

/**
 * Vérifie côté serveur que la personne connectée est administratrice. Toute
 * page ou action admin doit commencer par cet appel : la clé secrète de
 * Supabase n'est utilisée qu'après un « admin » ici.
 */
export async function checkAdmin(): Promise<AdminCheck> {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SECRET_KEY) return { status: "unconfigured" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "anonymous" };
  return isAdminEmail(user.email, process.env.ADMIN_EMAILS) ? { status: "admin", email: user.email! } : { status: "forbidden" };
}
