"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { AlertCircle, ShieldAlert } from "lucide-react";
import type { Application } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { USER_DAILY_LIMITS } from "@/lib/ai/config";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { FormationPicker } from "@/components/shared/FormationPicker";

/**
 * Briques communes aux fonctionnalités IA (lettre de motivation — Phase 17,
 * entretiens — Phase 18) : accès au compte, dégradation propre quand l'IA
 * n'est pas configurée, messages d'échec typés (voir docs/ai-integration.md)
 * et choix de la candidature concernée.
 */

const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: "Vous devez être connecté pour utiliser cette fonctionnalité.",
  not_configured: "Cette fonctionnalité IA n'est pas encore configurée. Réessayez plus tard.",
  quota_exceeded: `Vous avez atteint votre limite d'IA pour aujourd'hui (${USER_DAILY_LIMITS.import} imports de documents et ${USER_DAILY_LIMITS.texte} générations de texte par jour). Réessayez demain.`,
  budget_exhausted:
    "L'analyse par IA est très demandée aujourd'hui et sa capacité quotidienne est atteinte. Réessayez demain — le reste d'AcadMatch reste disponible.",
  document_too_long:
    "Document trop long : ne gardez que les pages utiles (votre dernière année, par exemple) ou collez seulement le texte concerné.",
  invalid_request: "Requête invalide — rechargez la page et réessayez.",
  error: "Une erreur est survenue pendant la génération. Réessayez dans un instant.",
};

export function aiErrorMessage(reason: string): string {
  return ERROR_MESSAGES[reason] ?? ERROR_MESSAGES.error;
}

/**
 * Appelle une route IA et ramène `{ ok: true, ...data }` ou
 * `{ ok: false, reason }` — jamais une exception (réseau coupé, JSON
 * illisible) à gérer dans chaque composant.
 */
export async function postAi<T>(url: string, payload: unknown): Promise<({ ok: true } & T) | { ok: false; reason: string }> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data?.ok ? data : { ok: false, reason: data?.reason ?? "error" };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export function useAiAccess() {
  const [configured] = useState(isSupabaseConfigured());
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.subscription.unsubscribe();
  }, [configured]);

  return { configured, user, authLoading };
}

export function AiNotConfiguredNotice({ featureName }: { featureName: string }) {
  return (
    <Card className="border-amber-100 bg-amber-50/60">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Fonctionnalité bientôt disponible</h2>
          <p className="mt-1 text-sm text-slate-600">{featureName} est en cours de mise en place.</p>
        </div>
      </div>
    </Card>
  );
}

export function AiLoginRequired() {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 border-blue-100 bg-blue-50/60">
      <p className="text-sm text-blue-800">
        Les fonctionnalités IA demandent un compte (gratuit) — le reste d&apos;AcadMatch reste utilisable sans
        connexion.
      </p>
      <LinkButton href="/compte" size="sm">
        Se connecter
      </LinkButton>
    </Card>
  );
}

export function AiErrorNotice({ reason }: { reason: string }) {
  return (
    <Card className="flex items-start gap-3 border-red-100 bg-red-50/60">
      <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden />
      <p className="text-sm text-red-800">{aiErrorMessage(reason)}</p>
    </Card>
  );
}

export function ProfileRequired({ message, next }: { message: string; next: string }) {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 border-blue-100 bg-blue-50/60">
      <p className="text-sm text-blue-800">{message}</p>
      <LinkButton href={`/profil?next=${encodeURIComponent(next)}`} size="sm">
        Analyser mon profil
      </LinkButton>
    </Card>
  );
}

/** Choix de la candidature suivie à laquelle s'applique la fonctionnalité. */
export function ApplicationPicker({
  applications,
  basePath,
  description,
}: {
  applications: Application[];
  basePath: string;
  description: string;
}) {
  return (
    <FormationPicker
      formationIds={applications.map((a) => a.formationId)}
      basePath={basePath}
      title="Choisissez une candidature"
      description={
        <>
          {description}, suivie dans{" "}
          <Link href="/candidatures" className="font-medium text-blue-600 hover:text-blue-700">
            le suivi des candidatures
          </Link>
          .
        </>
      }
      emptyState={
        <LinkButton href="/candidatures" size="sm" variant="outline">
          Suivre une candidature
        </LinkButton>
      }
    />
  );
}
