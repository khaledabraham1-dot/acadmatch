import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { getAiClient } from "@/lib/ai/client";
import { isAiConfigured, AI_MODEL } from "@/lib/ai/config";
import { checkAndRecordAiUsage } from "@/lib/ai/rateLimit";

export type AiCallResult =
  | { ok: true; text: string }
  | { ok: false; reason: "not_configured" | "quota_exceeded" | "error" };

interface CallAiParams {
  /** Utilisateur Supabase authentifié — voir lib/ai/rateLimit.ts. */
  userId: string;
  /** Nom court de la fonctionnalité appelante, tracé dans ai_usage (ex: "lettre-motivation"). */
  feature: string;
  system: string;
  messages: Anthropic.MessageParam[];
  /**
   * true quand `system` est un prompt long et stable réutilisé tel quel par
   * de nombreux appels (ex: instructions générales d'un assistant) — active
   * le cache prompt Anthropic (~90% moins cher sur la partie mise en cache
   * lors des appels suivants). false par défaut : ne rien cacher tant
   * qu'aucun prompt réellement long/stable n'existe (voir shared/prompt-caching.md
   * de la doc Claude API — cacher un prompt court/instable n'apporte rien).
   */
  cacheSystemPrompt?: boolean;
  maxTokens?: number;
}

/**
 * Point d'entrée unique pour toute fonctionnalité IA d'AcadMatch : vérifie
 * la configuration, applique le quota par utilisateur, appelle Claude, et
 * ramène un résultat typé plutôt qu'une exception — chaque fonctionnalité
 * appelante doit gérer explicitement les 3 cas d'échec (voir
 * docs/ai-integration.md) au lieu de laisser une erreur non gérée remonter
 * jusqu'à l'utilisateur.
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

  const usage = await checkAndRecordAiUsage(userId, feature);
  if (!usage.allowed) return { ok: false, reason: "quota_exceeded" };

  try {
    const client = getAiClient();
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: maxTokens,
      system: cacheSystemPrompt
        ? [{ type: "text", text: system, cache_control: { type: "ephemeral" } }]
        : system,
      messages,
    });

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text",
    );
    return textBlock ? { ok: true, text: textBlock.text } : { ok: false, reason: "error" };
  } catch {
    return { ok: false, reason: "error" };
  }
}
