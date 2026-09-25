import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Cible du lien magique reçu par e-mail (`signInWithOtp`, voir
 * components/account/LoginForm.tsx). Deux formats acceptés :
 *
 * - `?code=` — modèle d'e-mail Supabase par défaut (flux PKCE) : Supabase
 *   vérifie le lien puis redirige ici avec un code à échanger. Fonctionne
 *   sans rien personnaliser, mais seulement si le lien est ouvert dans le
 *   même navigateur que celui où la connexion a été demandée (le
 *   "code verifier" PKCE est dans ses cookies).
 * - `?token_hash=&type=` — modèle d'e-mail personnalisé (nécessite un SMTP
 *   personnalisé côté Supabase, voir docs/accounts-setup.md) : fonctionne
 *   aussi d'un appareil à l'autre.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

  if (isSupabaseConfigured() && (code || (tokenHash && type))) {
    const supabase = await createClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ type: type!, token_hash: tokenHash! });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/compte?erreur=lien_invalide`);
}

/**
 * N'accepte qu'un chemin interne ("/..."), jamais "//hote" ni "@hote" qui,
 * concaténés à `origin`, redirigeraient vers un site externe.
 */
function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/compte";
  }
  return next;
}
