/**
 * Fondations IA transverses (Phase 6) et budget IA (audit pré-lancement,
 * 2026-09-29) — logique pure, testable sans base de données ni API. La
 * réservation atomique elle-même vit dans supabase/migrations/0003_ai_budget.sql
 * et lib/ai/rateLimit.ts.
 */
export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Haiku 4.5 pour la génération de texte (lettre de motivation, entretiens) :
 * pas besoin d'un raisonnement de pointe, et le budget est serré.
 */
export const AI_MODEL = "claude-haiku-4-5";

/** Modèle des extractions de documents : lecture fiable de scans et relevés étrangers (voir docs/ai-integration.md). */
export const AI_EXTRACTION_MODEL = "claude-opus-5";

/** Plafond de sortie des extractions : 80 matières ou 60 cours tiennent largement en dessous. */
export const EXTRACTION_MAX_OUTPUT_TOKENS = 8000;

/**
 * Taille maximale d'un document importé, en tokens (comptés gratuitement
 * avant l'envoi) : une année de relevé ou de programme tient en quelques
 * milliers ; au-delà, c'est un document entier de 50 pages et plus, qui
 * coûterait autant que des dizaines d'imports normaux.
 */
export const MAX_IMPORT_INPUT_TOKENS = 40_000;

/** Tarifs Anthropic en dollars par million de tokens (vérifiés le 2026-09-29). */
const PRICING_PER_MTOK: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5": { input: 1, output: 5 },
  "claude-sonnet-5": { input: 2, output: 10 },
  "claude-opus-5": { input: 5, output: 25 },
  "claude-opus-4-8": { input: 5, output: 25 },
};
/** Modèle inconnu (ex : repli côté serveur vers un autre modèle) : on compte au tarif Opus, jamais moins. */
const FALLBACK_PRICING = { input: 5, output: 25 };

export interface AiUsageTokens {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

/** Coût réel d'un appel, depuis l'usage renvoyé par l'API. */
export function costOfCall(model: string, usage: AiUsageTokens): number {
  const price = PRICING_PER_MTOK[model] ?? FALLBACK_PRICING;
  const input =
    usage.input_tokens + (usage.cache_creation_input_tokens ?? 0) * 1.25 + (usage.cache_read_input_tokens ?? 0) * 0.1;
  return (input * price.input + usage.output_tokens * price.output) / 1_000_000;
}

/** Deux familles de fonctionnalités, deux quotas : les imports coûtent bien plus cher que le texte. */
export type AiFeatureKind = "import" | "texte";

export const AI_FEATURES: Record<string, AiFeatureKind> = {
  "releve-notes": "import",
  "programme-formation": "import",
  "lettre-motivation": "texte",
  "entretien-questions": "texte",
  "entretien-feedback": "texte",
};

/** Appels par étudiant et par jour (UTC). Un étudiant importe son relevé une ou deux fois, pas dix. */
export const USER_DAILY_LIMITS: Record<AiFeatureKind, number> = { import: 4, texte: 15 };

/**
 * Coût réservé avant l'appel : le pire cas (entrée maximale, sortie
 * maximale), remplacé ensuite par le coût réel. Réserver le pire cas
 * garantit que plusieurs appels simultanés ne dépassent jamais le budget.
 */
export const ESTIMATED_COST_USD: Record<AiFeatureKind, number> = {
  import: costOfCall(AI_EXTRACTION_MODEL, { input_tokens: MAX_IMPORT_INPUT_TOKENS, output_tokens: EXTRACTION_MAX_OUTPUT_TOKENS }),
  texte: costOfCall(AI_MODEL, { input_tokens: 6_000, output_tokens: 2_048 }),
};

/**
 * Dépense IA maximale de tout le site par jour (UTC), tous étudiants
 * confondus — la vraie protection contre les comptes créés en série.
 * Réglable sans redéploiement du code via la variable d'environnement
 * AI_DAILY_BUDGET_USD (Vercel) ; 0,50 $ par défaut, soit une dizaine
 * d'imports et des dizaines de lettres par jour. « 0 » coupe toute l'IA
 * (interrupteur d'urgence) ; une variable vide ou invalide garde le défaut.
 */
export function globalDailyBudgetUsd(): number {
  const raw = process.env.AI_DAILY_BUDGET_USD?.trim();
  const value = raw ? Number(raw) : NaN;
  return Number.isFinite(value) && value >= 0 ? value : 0.5;
}

export function featureKind(feature: string): AiFeatureKind {
  // Fonctionnalité non déclarée : traitée comme un import (quota et coût les plus stricts).
  return AI_FEATURES[feature] ?? "import";
}

/** Fonctionnalités partageant le quota d'une famille. */
export function featuresOfKind(kind: AiFeatureKind): string[] {
  return Object.entries(AI_FEATURES)
    .filter(([, k]) => k === kind)
    .map(([feature]) => feature);
}
