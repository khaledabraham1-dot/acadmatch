import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Supprime le compte de l'utilisateur authentifié (auth.users + sa ligne
 * `profiles`, via `on delete cascade` — voir supabase/migrations/0001_profiles.sql).
 * Nécessite la clé secrète (lib/supabase/admin.ts), donc une route serveur :
 * le navigateur ne peut pas supprimer un compte auth.users lui-même.
 *
 * Sécurité : l'id à supprimer vient de la session serveur (cookies), jamais
 * du corps de la requête — un utilisateur ne peut donc jamais demander la
 * suppression d'un autre compte que le sien.
 */
export async function POST() {
  // Sans Supabase configuré, createClient() lève une exception (constaté en
  // durcissant app/api/lettre-motivation/route.ts, Phase 17) — même garde ici
  // plutôt qu'un 500 non géré si cette route est appelée directement.
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Comptes pas encore configurés." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json({ error: "Échec de la suppression du compte." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
