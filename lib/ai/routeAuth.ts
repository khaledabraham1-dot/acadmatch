import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AiCallResult } from "@/lib/ai/callAi";

/**
 * Préambule commun à toutes les routes IA (lettre de motivation — Phase 17,
 * entretiens — Phase 18) : les fonctionnalités IA demandent un compte (voir
 * docs/ai-integration.md), et sans Supabase configuré createClient() lève
 * une exception — chaque route doit se dégrader proprement (503) plutôt
 * que de renvoyer un 500 non géré.
 */
export async function authenticateAiRequest(): Promise<
  { ok: true; userId: string } | { ok: false; response: NextResponse }
> {
  if (!isSupabaseConfigured()) {
    return { ok: false, response: aiErrorResponse("not_configured", 503) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, response: aiErrorResponse("not_authenticated", 401) };
  }
  return { ok: true, userId: user.id };
}

export function aiErrorResponse(reason: string, status: number): NextResponse {
  return NextResponse.json({ ok: false, reason }, { status });
}

/** Traduit un échec typé de callAi en réponse HTTP. */
export function aiFailureResponse(result: Extract<AiCallResult, { ok: false }>): NextResponse {
  return aiErrorResponse(result.reason, result.reason === "quota_exceeded" ? 429 : 503);
}

/** Corps JSON de la requête, ou null s'il est illisible. */
export async function readJsonBody<T>(request: Request): Promise<Partial<T> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : null;
  } catch {
    return null;
  }
}
