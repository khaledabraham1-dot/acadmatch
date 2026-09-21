import { createBrowserClient } from "@supabase/ssr";

/**
 * Client navigateur — respecte les policies Row Level Security de Postgres
 * (voir supabase/migrations/0001_profiles.sql) : un utilisateur connecté ne
 * peut lire/écrire que sa propre ligne dans `profiles`, imposé côté base,
 * pas seulement par ce code. Ne jamais utiliser la clé secrète ici (voir
 * lib/supabase/admin.ts, strictement serveur).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
