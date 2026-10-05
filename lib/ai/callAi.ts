import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { getAiClient } from "@/lib/ai/client";
import {
  AI_EXTRACTION_MODEL,
  AI_MODEL,
  costOfCall,
  EXTRACTION_MAX_OUTPUT_TOKENS,
  isAiConfigured,
  MAX_IMPORT_INPUT_TOKENS,
} from "@/lib/ai/config";
import { reserveAiCall, settleAiCall } from "@/lib/ai/rateLimit";
import { naturalPunctuation } from "@/lib/ai/punctuation";

export type AiFailureReason =
  | "not_configured"
  | "quota_exceeded"
  | "budget_exhausted"
  | "document_too_long"
  | "error";

export type AiCallResult = { ok: true; text: string } | { ok: false; reason: AiFailureReason };

interface CallAiParams {
  /** Utilisateur Supabase authentifié — voir lib/ai/rateLimit.ts. */
  userId: string;
  /** Nom court de la fonctionnalité appelante, déclaré dans AI_FEATURES (lib/ai/config.ts). */
  feature: string;
  system: string;
  messages: Anthropic.MessageParam[];
  /**
   * true quand `system` est un prompt long et stable réutilisé tel quel par
   * de nombreux appels — active le cache prompt Anthropic (~90 % moins cher
   * sur la partie en cache). false par défaut : cacher un prompt court ou
   * instable n'apporte rien.
   */
  cacheSystemPrompt?: boolean;
  maxTokens?: number;
}

/**
 * Point d'entrée unique pour la génération de texte : vérifie la
 * configuration, RÉSERVE l'appel sur le budget (quota de l'étudiant et
 * budget quotidien du site), appelle Claude, puis RÈGLE le coût réel.
 * Ramène un résultat typé plutôt qu'une exception : chaque route gère
 * explicitement les cas d'échec (voir docs/ai-integration.md).
 */
export async function callAi({
  userId,
  feature,
  system,
  messages,
  cacheSystemPrompt = false,
  maxTokens = 2048,
}: CallAiParams): Promise<AiCallResult> {
  if (!isAiConfigured()) return { ok: false, reason: "not_configured" };

  const reservation = await reserveAiCall(userId, feature);
  if (!reservation.allowed) return { ok: false, reason: reservation.reason };

  let cost = 0;
  try {
    const response = await getAiClient().messages.create({
      model: AI_MODEL,
      max_tokens: maxTokens,
      system: cacheSystemPrompt ? [{ type: "text", text: system, cache_control: { type: "ephemeral" } }] : system,
      messages,
    });
    cost = costOfCall(response.model, response.usage);

    const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === "text");
    return textBlock ? { ok: true, text: naturalPunctuation(textBlock.text) } : { ok: false, reason: "error" };
  } catch {
    return { ok: false, reason: "error" };
  } finally {
    await settleAiCall(reservation.usageId, cost);
  }
}

interface CallAiStructuredParams {
  userId: string;
  feature: string;
  system: string;
  /** Blocs de contenu du message utilisateur (document/image + consigne). */
  content: Anthropic.Beta.BetaContentBlockParam[];
  /** Schéma JSON imposé à la réponse (sorties structurées). */
  schema: Record<string, unknown>;
}

/**
 * Variante pour les extractions de documents (relevé, programme) : modèle
 * plus capable, sortie JSON garantie conforme au schéma, repli automatique
 * côté serveur si le premier modèle décline (`fallbacks: "default"`).
 *
 * Le document est d'abord MESURÉ (comptage de tokens, gratuit) : un
 * document trop long est refusé avant de coûter quoi que ce soit, et ne
 * consomme pas le quota de l'étudiant. Renvoie le JSON brut, à valider par
 * l'appelant.
 */
export async function callAiStructured({
  userId,
  feature,
  system,
  content,
  schema,
}: CallAiStructuredParams): Promise<AiCallResult> {
  if (!isAiConfigured()) return { ok: false, reason: "not_configured" };

  const client = getAiClient();
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content }];
  try {
    const { input_tokens } = await client.beta.messages.countTokens({ model: AI_EXTRACTION_MODEL, system, messages });
    if (input_tokens > MAX_IMPORT_INPUT_TOKENS) return { ok: false, reason: "document_too_long" };
  } catch {
    return { ok: false, reason: "error" };
  }

  const reservation = await reserveAiCall(userId, feature);
  if (!reservation.allowed) return { ok: false, reason: reservation.reason };

  let cost = 0;
  try {
    const response = await client.beta.messages.create({
      model: AI_EXTRACTION_MODEL,
      max_tokens: EXTRACTION_MAX_OUTPUT_TOKENS,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema } },
      system,
      messages,
    });
    cost = costOfCall(response.model, response.usage);

    // Refus de toute la chaîne de modèles, ou réponse tronquée : JSON inutilisable.
    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
      return { ok: false, reason: "error" };
    }
    const textBlock = response.content.find(
      (block): block is Anthropic.Beta.BetaTextBlock => block.type === "text",
    );
    return textBlock ? { ok: true, text: textBlock.text } : { ok: false, reason: "error" };
  } catch {
    return { ok: false, reason: "error" };
  } finally {
    await settleAiCall(reservation.usageId, cost);
  }
}
