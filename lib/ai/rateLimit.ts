import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hasQuotaRemaining, MAX_AI_REQUESTS_PER_DAY } from "@/lib/ai/config";

/**
 * Les fonctionnalités IA nécessitent un compte (contrairement au reste
 * d'AcadMatch) : impossible de limiter un coût réel par appel sans pouvoir
 * attribuer l'usage à quelqu'un — un utilisateur anonyme ne peut pas être
 * mis en quota de façon fiable (IP partagée, pas de session stable). C'est
 * une différence de comportement assumée entre le cœur du produit (matching,
 * toujours gratuit et sans compte) et les futures features IA.
 */
export interface UsageCheck {
  allowed: boolean;
  remaining: number;
}

/**
 * Vérifie le quota journalier de l'utilisateur ET enregistre l'appel dans le
 * même geste si autorisé (évite un TOCTOU où deux appels concurrents
 * passeraient tous les deux la vérification). Utilise le client serveur
 * scopé à la session (RLS, voir supabase/migrations/0002_ai_usage.sql) —
 * jamais le client admin, une fonctionnalité IA n'a pas besoin de
 * contourner les policies.
 */
export async function checkAndRecordAiUsage(userId: string, feature: string): Promise<UsageCheck> {
  const supabase = await createClient();
  const sinceMidnightUtc = new Date();
  sinceMidnightUtc.setUTCHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("ai_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", sinceMidnightUtc.toISOString());

  const usedToday = count ?? 0;
  if (!hasQuotaRemaining(usedToday)) {
    return { allowed: false, remaining: 0 };
  }

  await supabase.from("ai_usage").insert({ user_id: userId, feature });
  return { allowed: true, remaining: MAX_AI_REQUESTS_PER_DAY - usedToday - 1 };
}
