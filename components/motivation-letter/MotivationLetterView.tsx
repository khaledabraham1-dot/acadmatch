"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { AlertCircle, Loader2, Save, ShieldAlert, Sparkles } from "lucide-react";
import type { Application, StudentProfile } from "@/types";
import { getFormationById } from "@/data/formations";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { loadApplications, loadProfile, upsertApplication } from "@/lib/storage";
import { createApplication } from "@/lib/applications";
import { MAX_AI_REQUESTS_PER_DAY } from "@/lib/ai/config";
import { Card } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/Field";

type GenerationState = "idle" | "loading" | "error";

const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: "Vous devez être connecté pour utiliser cette fonctionnalité.",
  not_configured: "Cette fonctionnalité IA n'est pas encore configurée. Réessayez plus tard.",
  quota_exceeded: `Vous avez atteint la limite de ${MAX_AI_REQUESTS_PER_DAY} générations aujourd'hui. Réessayez demain.`,
  invalid_request: "Requête invalide — rechargez la page et réessayez.",
  error: "Une erreur est survenue pendant la génération. Réessayez dans un instant.",
};

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

  const [configured] = useState(isSupabaseConfigured());
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(configured);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [draft, setDraft] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [generation, setGeneration] = useState<GenerationState>("idle");
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [picked, setPicked] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(loadProfile());
    setApplications(loadApplications());
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
    try {
      const response = await fetch("/api/lettre-motivation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formationId, profile }),
      });
      const data = await response.json();
      if (!data.ok) {
        setErrorReason(data.reason ?? "error");
        setGeneration("error");
        return;
      }
      setDraft(data.text);
      setGeneration("idle");
    } catch {
      setErrorReason("error");
      setGeneration("error");
    }
  }

  if (!configured) {
    return (
      <Card className="border-amber-100 bg-amber-50/60">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Fonctionnalité bientôt disponible</h2>
            <p className="mt-1 text-sm text-slate-600">
              L&apos;assistant de lettre de motivation est en cours de mise en place.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (authLoading) return null;

  if (!user) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3 border-blue-100 bg-blue-50/60">
        <p className="text-sm text-blue-800">
          Les fonctionnalités IA demandent un compte (gratuit) — le reste d&apos;AcadMatch reste utilisable
          sans connexion.
        </p>
        <LinkButton href="/compte" size="sm">
          Se connecter
        </LinkButton>
      </Card>
    );
  }

  if (!formationId || !formation) {
    return (
      <Card>
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Choisissez une candidature</h2>
        <p className="mb-4 text-sm text-slate-500">
          La lettre de motivation est rédigée pour une formation précise, suivie dans{" "}
          <Link href="/candidatures" className="font-medium text-blue-600 hover:text-blue-700">
            le suivi des candidatures
          </Link>
          .
        </p>
        {applications.length > 0 ? (
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <Select value={picked} onChange={(e) => setPicked(e.target.value)}>
                <option value="">Choisissez une formation…</option>
                {applications.map((a) => {
                  const f = getFormationById(a.formationId);
                  return f ? (
                    <option key={a.formationId} value={a.formationId}>
                      {f.name} — {f.institution.name}
                    </option>
                  ) : null;
                })}
              </Select>
            </div>
            <LinkButton
              href={picked ? `/lettre-motivation?formationId=${picked}` : "#"}
              size="md"
              className={!picked ? "pointer-events-none opacity-50" : undefined}
            >
              Continuer
            </LinkButton>
          </div>
        ) : (
          <LinkButton href="/candidatures" size="sm" variant="outline">
            Suivre une candidature
          </LinkButton>
        )}
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3 border-blue-100 bg-blue-50/60">
        <p className="text-sm text-blue-800">
          Renseignez votre profil académique pour générer un brouillon basé sur votre parcours réel.
        </p>
        <LinkButton href={`/profil?next=${encodeURIComponent(`/lettre-motivation?formationId=${formationId}`)}`} size="sm">
          Analyser mon profil
        </LinkButton>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Formation visée</p>
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

      {generation === "error" && errorReason && (
        <Card className="flex items-start gap-3 border-red-100 bg-red-50/60">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden />
          <p className="text-sm text-red-800">{ERROR_MESSAGES[errorReason] ?? ERROR_MESSAGES.error}</p>
        </Card>
      )}

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
          Ce texte est un point de départ, jamais une lettre finale — relisez-le, corrigez-le et
          personnalisez-le avant tout envoi. N&apos;ajoutez jamais une information inexacte.
        </p>

        <div className="mt-3 flex items-center gap-3">
          <Button type="button" size="sm" onClick={handleSave} disabled={!draft.trim()}>
            <Save className="size-3.5" />
            Sauvegarder
          </Button>
          {savedAt && <span className="text-xs text-slate-400">Sauvegardé.</span>}
        </div>
      </Card>
    </div>
  );
}
