import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client serveur (Route Handlers, Server Components) — même clé publique que
 * le client navigateur, mais les cookies de session voyagent via next/headers.
 * `setAll` peut échouer sans risque dans un Server Component pur lecture : la
 * session est de toute façon rafraîchie par `proxy.ts` à chaque requête.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Ignoré si appelé depuis un Server Component pur lecture — proxy.ts rafraîchit la session.
          }
        },
      },
    },
  );
}
