import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Nommé `proxy.ts` (pas `middleware.ts`) : convention renommée en Next.js 16
 * — voir node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md.
 *
 * Rôle unique ici : rafraîchir le cookie de session Supabase à chaque requête
 * (les Server Components ne peuvent pas écrire de cookies). AUCUNE page n'est
 * protégée/redirigée ici — un compte reste entièrement optionnel, tout le
 * parcours (profil, recherche, résultat) doit continuer à fonctionner sans
 * connexion, comme depuis le début (voir lib/storage.ts, README).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Rafraîchit le token si nécessaire — le résultat n'est pas utilisé ici
  // (aucune redirection), seul l'effet de bord sur les cookies compte.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
