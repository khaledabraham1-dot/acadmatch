import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ESTIMATED_COST_USD,
  featureKind,
  featuresOfKind,
  globalDailyBudgetUsd,
  USER_DAILY_LIMITS,
} from "@/lib/ai/config";

/**
 * Budget IA (audit pré-lancement, 2026-09-29) : chaque appel est RÉSERVÉ
 * avant d'être fait, puis RÉGLÉ à son coût réel. La réservation est une
 * fonction Postgres verrouillée (supabase/migrations/0003_ai_budget.sql) qui
 * vérifie en une seule opération le quota de l'étudiant et le budget
 * quotidien de tout le site — l'ancien « compter puis insérer » laissait
 * passer des requêtes simultanées, et un quota par compte seul ne protégeait
 * pas contre des comptes créés en série.
 *
 * Les fonctionnalités IA exigent un compte : impossible d'attribuer un coût
 * réel à un visiteur anonyme (IP partagée, pas de session stable).
 *
 * En cas de doute, on refuse : sans clé secrète ou si la base ne répond
 * pas, aucun appel payant n'est fait.
 */
export type Reservation =
  | { allowed: true; usageId: string }
  | { allowed: false; reason: "quota_exceeded" | "budget_exhausted" | "error" };

export async function reserveAiCall(userId: string, feature: string): Promise<Reservation> {
  if (!process.env.SUPABASE_SECRET_KEY) return { allowed: false, reason: "error" };
  const kind = featureKind(feature);
  try {
    const { data, error } = await createAdminClient().rpc("reserve_ai_call", {
      p_user_id: userId,
      p_feature: feature,
      p_limited_features: featuresOfKind(kind),
      p_user_daily_limit: USER_DAILY_LIMITS[kind],
      p_estimated_cost_usd: ESTIMATED_COST_USD[kind],
      p_global_daily_budget_usd: globalDailyBudgetUsd(),
    });
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) return { allowed: false, reason: "error" };
    if (row.allowed && row.usage_id) return { allowed: true, usageId: row.usage_id };
    return { allowed: false, reason: row.reason === "budget_exhausted" ? "budget_exhausted" : "quota_exceeded" };
  } catch {
    return { allowed: false, reason: "error" };
  }
}

/**
 * Remplace l'estimation réservée par le coût réel (0 si l'appel a échoué
 * sans être facturé). Un échec ici laisse l'estimation haute en place :
 * le budget est alors surestimé, jamais dépassé.
 */
export async function settleAiCall(usageId: string, costUsd: number): Promise<void> {
  try {
    await createAdminClient().rpc("settle_ai_call", { p_usage_id: usageId, p_cost_usd: costUsd });
  } catch {
    // Volontairement silencieux : voir ci-dessus.
  }
}
