"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Languages, Loader2, MessageSquareText, Sparkles } from "lucide-react";
import type { Application, InterviewPrep, InterviewQuestion, StudentProfile } from "@/types";
import { getFormationById } from "@/data/formations";
import { loadApplications, loadProfile, loadSavedFormationIds, upsertApplication } from "@/lib/storage";
import { createApplication } from "@/lib/applications";
import { interviewLanguage, MAX_ANSWER_LENGTH } from "@/lib/ai/interviewPrompt";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
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

const CATEGORY_TONES: Record<InterviewQuestion["category"], "info" | "neutral" | "warning" | "success"> = {
  motivation: "info",
  parcours: "neutral",
  académique: "neutral",
  projet: "success",
  "point de vigilance": "warning",
};

/**
 * Préparation aux entretiens (Phase 18). Pour une candidature suivie :
 * questions probables générées par l'IA à partir du profil, de la formation,
 * du projet d'études et des écarts calculés par le moteur de matching ;
 * réponses rédigées par l'étudiant lui-même ; retour de l'IA sur chaque
 * réponse à la demande. Tout est enregistré dans la candidature
 * (`Application.interviewPrep`, localStorage) — rien côté serveur.
 */
export function InterviewPrepView() {
  const searchParams = useSearchParams();
  const formationId = searchParams.get("formationId");

  const { configured, user, authLoading } = useAiAccess();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false);
  const [feedbackLoadingId, setFeedbackLoadingId] = useState<string | null>(null);
  const [errorReason, setErrorReason] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(loadProfile());
    setApplications(loadApplications());
    setSavedIds(loadSavedFormationIds());
  }, []);

  const formation = formationId ? getFormationById(formationId) : undefined;
  const application = applications.find((a) => a.formationId === formationId);
  const prep = application?.interviewPrep;

  // Toujours repartir de la version enregistrée plutôt que de `application`
  // capturé au rendu : un retour IA arrive plusieurs secondes après le clic,
  // et ne doit pas écraser une réponse modifiée entre-temps.
  function savePrep(update: (current: InterviewPrep | undefined) => InterviewPrep) {
    if (!formationId) return;
    const base = loadApplications().find((a) => a.formationId === formationId) ?? createApplication(formationId);
    setApplications(upsertApplication({ ...base, interviewPrep: update(base.interviewPrep) }));
  }

  function updateQuestion(id: string, patch: Partial<InterviewQuestion>) {
    savePrep((current) => ({
      ...current!,
      questions: (current?.questions ?? []).map((q) => (q.id === id ? { ...q, ...patch } : q)),
    }));
  }

  async function handleGenerate() {
    if (!formationId || !profile || !formation) return;
    const hasAnswers = prep?.questions.some((q) => q.answer.trim());
    if (hasAnswers && !confirmingRegenerate) {
      setConfirmingRegenerate(true);
      return;
    }
    setConfirmingRegenerate(false);
    setGenerating(true);
    setErrorReason(null);
    const targetedFormationIds = [...new Set([...savedIds, ...applications.map((a) => a.formationId)])];
    const result = await postAi<{ questions: InterviewQuestion[] }>("/api/entretien", {
      action: "questions",
      formationId,
      profile,
      targetedFormationIds,
    });
    setGenerating(false);
    if (!result.ok) {
      setErrorReason(result.reason);
      return;
    }
    savePrep(() => ({
      questions: result.questions,
      language: interviewLanguage(formation),
      generatedAt: new Date().toISOString(),
    }));
  }

  async function handleFeedback(question: InterviewQuestion) {
    if (!formationId || !profile) return;
    setFeedbackLoadingId(question.id);
    setErrorReason(null);
    const result = await postAi<{ text: string }>("/api/entretien", {
      action: "feedback",
      formationId,
      profile,
      question: question.question,
      answer: question.answer,
    });
    setFeedbackLoadingId(null);
    if (!result.ok) {
      setErrorReason(result.reason);
      return;
    }
    updateQuestion(question.id, { feedback: result.text });
  }

  if (!configured) return <AiNotConfiguredNotice featureName="La préparation aux entretiens" />;
  if (authLoading) return null;
  if (!user) return <AiLoginRequired />;

  if (!formationId || !formation) {
    return (
      <ApplicationPicker
        applications={applications}
        basePath="/entretiens"
        description="La préparation porte sur l'entretien d'une formation précise"
      />
    );
  }

  const next = `/entretiens?formationId=${formationId}`;
  if (!profile) {
    return (
      <ProfileRequired
        message="Renseignez votre profil académique pour préparer un entretien basé sur votre parcours réel."
        next={next}
      />
    );
  }

  const english = interviewLanguage(formation) === "anglais";
  const answeredCount = prep?.questions.filter((q) => q.answer.trim()).length ?? 0;

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Formation visée</p>
        <h2 className="mt-1 font-semibold text-slate-900">{formation.name}</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          {formation.institution.name} · {formation.institution.city}
        </p>
        <p className="mt-3 text-sm text-slate-600">
          <span className="font-medium text-slate-700">Procédure officielle : </span>
          {formation.applicationProcedure}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          AcadMatch ne sait pas si un entretien vous sera proposé : seule la procédure officielle fait foi. Cette
          préparation reste utile pour tout échange avec l&apos;établissement.
        </p>
        {english && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-blue-50/70 px-3 py-2 text-sm text-blue-800">
            <Languages className="mt-0.5 size-4 shrink-0" aria-hidden />
            Formation enseignée en anglais : l&apos;entretien se déroule généralement en anglais — les questions
            sont générées en anglais pour vous y entraîner.
          </p>
        )}
      </Card>

      {!profile.experiences?.trim() && (
        <Card className="border-blue-100 bg-blue-50/60">
          <p className="text-sm text-blue-800">
            Ajoutez vos stages, projets et engagements à votre profil : le jury vous interrogera dessus, et
            l&apos;IA ne peut s&apos;appuyer que sur ce que vous avez déclaré.{" "}
            <Link
              href={`/profil?next=${encodeURIComponent(next)}`}
              className="font-medium underline underline-offset-2"
            >
              Compléter mon profil
            </Link>
          </p>
        </Card>
      )}

      <Card className="border-slate-200 bg-slate-50/60">
        <p className="text-xs leading-relaxed text-slate-500">
          La génération envoie votre profil (parcours, matières, compétences et expériences déclarées), vos
          réponses et les informations publiques des formations ciblées à notre fournisseur IA (Anthropic).
          Rien n&apos;est partagé au-delà de ces appels. Chaque génération de questions et chaque retour compte
          pour une utilisation de l&apos;IA.
        </p>
      </Card>

      {errorReason && <AiErrorNotice reason={errorReason} />}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Questions probables</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {prep
                ? `${answeredCount}/${prep.questions.length} réponses rédigées`
                : "Motivation, parcours, prérequis, projet et points faibles de votre dossier."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {confirmingRegenerate && (
              <Button type="button" size="sm" variant="outline" onClick={() => setConfirmingRegenerate(false)}>
                Annuler
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant={confirmingRegenerate ? "primary" : "outline"}
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              {confirmingRegenerate
                ? "Confirmer : effacer mes réponses"
                : prep
                  ? "Nouvelles questions"
                  : "Générer les questions"}
            </Button>
          </div>
        </div>
        {!prep && (
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Méthode conseillée : rédigez vous-même chaque réponse, demandez un retour, corrigez, puis
            entraînez-vous à voix haute — 1 à 2 minutes par réponse, sans lire.
          </p>
        )}
      </Card>

      {prep?.questions.map((q, index) => (
        <Card key={q.id}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Question {index + 1}</span>
            <Badge tone={CATEGORY_TONES[q.category]}>{q.category}</Badge>
          </div>
          <p className="mt-2 font-medium text-slate-900" lang={english ? "en" : "fr"}>
            {q.question}
          </p>
          {q.intent && (
            <p className="mt-1 text-xs text-slate-500">
              <span className="font-medium">Ce que le jury évalue :</span> {q.intent}
            </p>
          )}

          <Textarea
            aria-label={`Votre réponse à la question ${index + 1}`}
            value={q.answer}
            onChange={(e) => updateQuestion(q.id, { answer: e.target.value })}
            maxLength={MAX_ANSWER_LENGTH}
            lang={english ? "en" : "fr"}
            placeholder="Rédigez votre réponse avec vos propres mots…"
            className="mt-3 min-h-28"
          />

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-slate-400">
              {q.answer.length}/{MAX_ANSWER_LENGTH}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleFeedback(q)}
              disabled={!q.answer.trim() || feedbackLoadingId !== null}
            >
              {feedbackLoadingId === q.id ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <MessageSquareText className="size-3.5" />
              )}
              {q.feedback ? "Nouveau retour" : "Obtenir un retour"}
            </Button>
          </div>

          {q.feedback && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Retour du jury (IA)</p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{q.feedback}</p>
            </div>
          )}
        </Card>
      ))}

      {prep && (
        <p className="text-xs leading-relaxed text-slate-500">
          Questions et retours générés par IA : un entraînement, pas une prédiction de l&apos;entretien réel.
          Vos réponses sont enregistrées automatiquement sur cet appareil, dans la candidature.
        </p>
      )}
    </div>
  );
}
