import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client "secret" (remplace l'ancienne `service_role` key — voir
 * docs/accounts-setup.md) : contourne toute Row Level Security, réservé aux
 * opérations d'administration que l'utilisateur ne peut pas faire lui-même
 * (ex: supprimer son compte auth.users, voir app/api/account/delete/route.ts).
 * `import "server-only"` fait échouer le build si ce fichier est jamais
 * importé depuis un composant client — la clé ne doit jamais atteindre le
 * navigateur.
 */
export function createAdminClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
