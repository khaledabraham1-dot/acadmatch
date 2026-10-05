"use client";

import { trackStep } from "@/lib/journey";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Save, Sparkles } from "lucide-react";
import type { Application, StudentProfile } from "@/types";
import { getFormationById } from "@/data/formations";
import { loadApplications, loadProfile, upsertApplication } from "@/lib/storage";
import { createApplication } from "@/lib/applications";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import {
  AiErrorNotice,
  AiLoginRequired,
  AiNotConfiguredNotice,
  ApplicationPicker,
  ProfileRequired,
  postAi,
  useAiAccess,
} from "@/components/ai/AiFeature";

type GenerationState = "idle" | "loading" | "error";

/**
 * Assistant de lettre de motivation (Phase 17) — première fonctionnalité IA
 * livrée, consomme les fondations de la Phase 6 (docs/ai-integration.md).
 * Basé uniquement sur le profil (localStorage) et la formation ciblée : le
 * profil voyage jusqu'à la route serveur dans le corps de la requête (voir
 * app/api/lettre-motivation/route.ts), jamais stocké côté serveur au-delà
 * de l'appel. Le texte généré reste toujours un brouillon éditable, jamais
 * envoyé automatiquement nulle part.
 */
export function MotivationLetterView() {
  const searchParams = useSearchParams();
  const formationId = searchParams.get("formationId");

  const { configured, user, authLoading } = useAiAccess();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [draft, setDraft] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [generation, setGeneration] = useState<GenerationState>("idle");
  const [errorReason, setErrorReason] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(loadProfile());
    setApplications(loadApplications());
  }, []);

  const formation = formationId ? getFormationById(formationId) : undefined;
  const application = useMemo(
    () => applications.find((a) => a.formationId === formationId),
    [applications, formationId],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(application?.motivationLetter ?? "");
  }, [application?.formationId, application?.motivationLetter]);

  function handleSave() {
    if (!formationId) return;
    const base = application ?? createApplication(formationId);
    const next = upsertApplication({ ...base, motivationLetter: draft });
    setApplications(next);
    setSavedAt(Date.now());
  }

  async function handleGenerate() {
    if (!formationId || !profile) return;
    setGeneration("loading");
    setErrorReason(null);
    const result = await postAi<{ text: string }>("/api/lettre-motivation", { formationId, profile });
    if (!result.ok) {
      setErrorReason(result.reason);
      setGeneration("error");
      return;
    }
    setDraft(result.text);
    setGeneration("idle");
    trackStep("ia-utilisee", "lettre");
  }

  if (!configured) return <AiNotConfiguredNotice featureName="L'assistant de lettre de motivation" />;
  if (authLoading) return null;
  if (!user) return <AiLoginRequired />;

  if (!formationId || !formation) {
    return (
      <ApplicationPicker
        applications={applications}
        basePath="/lettre-motivation"
        description="La lettre de motivation est rédigée pour une formation précise"
      />
    );
  }

  if (!profile) {
    return (
      <ProfileRequired
        message="Renseignez votre profil académique pour générer un brouillon basé sur votre parcours réel."
        next={`/lettre-motivation?formationId=${formationId}`}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Formation visée</p>
        <h2 className="mt-1 font-semibold text-slate-900">{formation.name}</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          {formation.institution.name} · {formation.institution.city}
        </p>
      </Card>

      <Card className="border-slate-200 bg-slate-50/60">
        <p className="text-xs leading-relaxed text-slate-500">
          La génération envoie votre profil (parcours, matières, compétences déclarées) et les informations
          publiques de cette formation à notre fournisseur IA (Anthropic) pour produire un brouillon. Rien
          n&apos;est partagé au-delà de cet appel.
        </p>
      </Card>

      {generation === "error" && errorReason && <AiErrorNotice reason={errorReason} />}

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Brouillon</h2>
          <Button type="button" size="sm" variant="outline" onClick={handleGenerate} disabled={generation === "loading"}>
            {generation === "loading" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            {draft ? "Régénérer un brouillon" : "Générer un brouillon"}
          </Button>
        </div>

        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Cliquez sur « Générer un brouillon », ou commencez à écrire vous-même…"
          className="min-h-64"
        />

        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Ce texte est un point de départ, jamais une lettre finale : relisez-le, corrigez-le et
          personnalisez-le avant tout envoi. N&apos;ajoutez jamais une information inexacte.
        </p>

        <div className="mt-3 flex items-center gap-3">
          <Button type="button" size="sm" onClick={handleSave} disabled={!draft.trim()}>
            <Save className="size-3.5" />
            Sauvegarder
          </Button>
          {savedAt && <span className="text-xs text-slate-500">Sauvegardé.</span>}
        </div>
      </Card>
    </div>
  );
}
