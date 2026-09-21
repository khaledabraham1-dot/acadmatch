/**
 * Fondations IA transverses (Phase 6) — réutilisées par toutes les
 * fonctionnalités IA prévues plus loin dans la roadmap (import
 * multi-documents, lettre de motivation, préparation aux entretiens,
 * assistant). Rien de tout ça n'existe encore : cette phase pose juste la
 * plomberie commune pour ne pas la refaire 5 fois.
 */
export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Haiku 4.5, pas le modèle le plus capable disponible : les usages prévus
 * (extraction de documents, génération de texte assistée pour étudiants) ne
 * demandent pas un raisonnement de pointe, et le roadmap est explicite sur
 * le contrôle des coûts pour toute feature IA. Un point d'ajustement unique
 * si une feature future a réellement besoin de plus de capacité.
 */
export const AI_MODEL = "claude-haiku-4-5";

/**
 * Quota journalier unique, partagé entre toutes les features IA (pas encore
 * de quota par fonctionnalité — simplification volontaire tant qu'aucune
 * feature réelle n'existe pour calibrer un vrai coût par appel). À affiner
 * une fois la première feature IA livrée et son coût réel mesuré.
 */
export const MAX_AI_REQUESTS_PER_DAY = 20;

/** Logique pure, testable sans base de données — voir lib/ai/rateLimit.ts. */
export function hasQuotaRemaining(usedToday: number, limit: number = MAX_AI_REQUESTS_PER_DAY): boolean {
  return usedToday < limit;
}
