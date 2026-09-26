import { NextResponse } from "next/server";
import { callAi } from "@/lib/ai/callAi";
import { buildMotivationLetterPrompt } from "@/lib/ai/motivationLetterPrompt";
import { isPromptableProfile } from "@/lib/ai/promptContext";
import { aiErrorResponse, aiFailureResponse, authenticateAiRequest, readJsonBody } from "@/lib/ai/routeAuth";
import { getFormationById } from "@/data/formations";

/**
 * Génère un brouillon de lettre de motivation (Phase 17) — première
 * fonctionnalité IA à consommer les fondations de la Phase 6
 * (docs/ai-integration.md : toujours depuis une route serveur, jamais
 * depuis un composant client, la clé Anthropic ne doit jamais atteindre
 * le navigateur).
 *
 * Le profil étudiant vit dans localStorage (jamais côté serveur, voir
 * lib/storage.ts) : il doit donc voyager dans le corps de la requête —
 * seule donnée envoyée en plus de l'id de formation, jamais persistée
 * telle quelle côté serveur (ai_usage ne journalise que l'id utilisateur
 * et le nom de la fonctionnalité, voir lib/ai/rateLimit.ts).
 */
export async function POST(request: Request) {
  const auth = await authenticateAiRequest();
  if (!auth.ok) return auth.response;

  const body = await readJsonBody<{ formationId: string; profile: unknown }>(request);
  const formation = body?.formationId ? getFormationById(body.formationId) : undefined;
  if (!formation || !isPromptableProfile(body?.profile)) {
    return aiErrorResponse("invalid_request", 400);
  }

  const { system, user: userMessage } = buildMotivationLetterPrompt(body.profile, formation);

  const result = await callAi({
    userId: auth.userId,
    feature: "lettre-motivation",
    system,
    messages: [{ role: "user", content: userMessage }],
  });

  if (!result.ok) return aiFailureResponse(result);
  return NextResponse.json({ ok: true, text: result.text });
}
