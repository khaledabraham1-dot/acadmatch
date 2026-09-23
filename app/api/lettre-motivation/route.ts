import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { callAi } from "@/lib/ai/callAi";
import { buildMotivationLetterPrompt } from "@/lib/ai/motivationLetterPrompt";
import { getFormationById } from "@/data/formations";
import type { StudentProfile } from "@/types";

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
  // Sans Supabase configuré (voir docs/accounts-setup.md), createClient() lève
  // une exception — cette route doit se dégrader proprement (comme l'UI,
  // voir MotivationLetterView) plutôt que de renvoyer un 500 non géré.
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, reason: "not_authenticated" }, { status: 401 });
  }

  let body: { formationId?: string; profile?: StudentProfile };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_request" }, { status: 400 });
  }

  const { formationId, profile } = body;
  if (!formationId || !profile) {
    return NextResponse.json({ ok: false, reason: "invalid_request" }, { status: 400 });
  }

  const formation = getFormationById(formationId);
  if (!formation) {
    return NextResponse.json({ ok: false, reason: "invalid_request" }, { status: 400 });
  }

  const { system, user: userMessage } = buildMotivationLetterPrompt(profile, formation);

  const result = await callAi({
    userId: user.id,
    feature: "lettre-motivation",
    system,
    messages: [{ role: "user", content: userMessage }],
  });

  if (!result.ok) {
    const status = result.reason === "quota_exceeded" ? 429 : 503;
    return NextResponse.json({ ok: false, reason: result.reason }, { status });
  }

  return NextResponse.json({ ok: true, text: result.text });
}
