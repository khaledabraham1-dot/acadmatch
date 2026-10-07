import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { adminBasePath, isInternalAdminPath, toInternalAdminPath } from "@/lib/admin/access";

/**
 * Nommé `proxy.ts` (pas `middleware.ts`) : convention renommée en Next.js 16
 * — voir node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md.
 *
 * Deux rôles :
 * 1. Espace admin (2026-10-07) : il n'est servi qu'à son adresse secrète
 *    (ADMIN_PATH, lib/admin/access.ts), réécrite en interne vers /admin.
 *    Taper /admin directement donne une page introuvable, comme n'importe
 *    quelle adresse qui n'existe pas.
 * 2. Rafraîchir le cookie de session Supabase à chaque requête
 * (les Server Components ne peuvent pas écrire de cookies). AUCUNE page n'est
 * protégée/redirigée ici — un compte reste entièrement optionnel, tout le
 * parcours (profil, recherche, résultat) doit continuer à fonctionner sans
 * connexion, comme depuis le début (voir lib/storage.ts, README).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Un dossier préfixé par « _ » n'est jamais une route : la réécriture affiche la page 404.
  if (isInternalAdminPath(pathname)) return NextResponse.rewrite(new URL("/_introuvable", request.url));
  const adminTarget = toInternalAdminPath(pathname, adminBasePath(process.env.ADMIN_PATH));
  const pass = () => {
    if (!adminTarget) return NextResponse.next({ request });
    const url = request.nextUrl.clone();
    url.pathname = adminTarget;
    const rewritten = NextResponse.rewrite(url, { request });
    // L'adresse secrète ne doit fuiter ni vers un autre site, ni dans un cache, ni dans un moteur de recherche.
    rewritten.headers.set("Referrer-Policy", "no-referrer");
    rewritten.headers.set("X-Robots-Tag", "noindex, nofollow");
    rewritten.headers.set("Cache-Control", "no-store");
    return rewritten;
  };
  let response = pass();

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
          response = pass();
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
