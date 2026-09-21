import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Cible du lien magique reçu par e-mail (`signInWithOtp`, voir
 * components/account/LoginForm.tsx). Le modèle d'e-mail "Magic Link" doit
 * être personnalisé dans le tableau de bord Supabase pour pointer ici avec
 * `token_hash`/`type` (voir docs/accounts-setup.md — Supabase ne le fait pas
 * par défaut).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/compte";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/compte?erreur=lien_invalide`);
}
