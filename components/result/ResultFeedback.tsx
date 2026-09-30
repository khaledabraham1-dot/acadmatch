"use client";

import { useEffect, useState } from "react";
import { MessageSquareHeart } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  FAIRNESS_LABELS,
  FEEDBACK_LABELS,
  flushPendingFeedback,
  MAX_COMMENT_LENGTH,
  sendFeedback,
  type FeedbackHelpfulness,
  type ScoreFairness,
} from "@/lib/feedback";

interface ResultFeedbackProps {
  formationId: string;
  score: number;
  /** Contexte anonyme envoyé avec l'avis (jamais d'identifiant). */
  profileField: string;
  profileLevel: string;
  scoreEstimate: boolean;
  fromTranscript: boolean;
}

function Choice<T extends string>({ value, current, label, onSelect }: { value: T; current: T | null; label: string; onSelect: (v: T) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={current === value}
      className={
        current === value
          ? "rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-bold text-white"
          : "rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
      }
    >
      {label}
    </button>
  );
}

/**
 * Deux questions courtes après l'analyse : l'aide perçue, et surtout « le
 * score vous paraît-il juste ? » — l'indicateur direct de la confiance dans
 * le moteur, formation par formation. Envoi anonyme (lib/feedback.ts).
 */
export function ResultFeedback({ formationId, score, profileField, profileLevel, scoreEstimate, fromTranscript }: ResultFeedbackProps) {
  const [choice, setChoice] = useState<FeedbackHelpfulness | null>(null);
  const [fairness, setFairness] = useState<ScoreFairness | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [outcome, setOutcome] = useState<"sent" | "queued" | null>(null);

  // Renvoie les avis restés en attente (réseau coupé lors d'une visite précédente).
  useEffect(() => {
    void flushPendingFeedback();
  }, []);

  async function handleSubmit() {
    if (!choice) return;
    setSending(true);
    const result = await sendFeedback({
      formationId,
      score,
      helpfulness: choice,
      scoreFairness: fairness,
      comment,
      profileField,
      profileLevel,
      scoreEstimate,
      fromTranscript,
    });
    setSending(false);
    setOutcome(result);
  }

  if (outcome) {
    return (
      <Card className="border-blue-100 bg-blue-50/60">
        <p className="text-sm font-bold text-slate-900">
          {outcome === "sent" ? "Merci, votre avis est envoyé." : "Merci : votre avis sera envoyé dès que la connexion le permettra."}
        </p>
        <p className="mt-1 text-sm text-slate-600">Il sert directement à rendre les scores plus justes pour les prochains étudiants.</p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">
        <MessageSquareHeart className="size-4 text-slate-500" aria-hidden />
        Votre avis (30 secondes)
      </h2>
      <p className="mb-3 text-sm text-slate-600">Cette analyse vous a-t-elle aidé à y voir plus clair pour candidater ?</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Aide perçue">
        {(Object.keys(FEEDBACK_LABELS) as FeedbackHelpfulness[]).map((key) => (
          <Choice key={key} value={key} current={choice} label={FEEDBACK_LABELS[key]} onSelect={setChoice} />
        ))}
      </div>

      {choice && (
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-sm text-slate-600">Le score ({score}/100) vous paraît-il juste pour votre parcours ?</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Justesse du score">
              {(Object.keys(FAIRNESS_LABELS) as ScoreFairness[]).map((key) => (
                <Choice key={key} value={key} current={fairness} label={FAIRNESS_LABELS[key]} onSelect={setFairness} />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="feedback-comment" className="block text-sm font-bold text-slate-800">
              Pourquoi ? (optionnel)
            </label>
            <textarea
              id="feedback-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={MAX_COMMENT_LENGTH}
              placeholder="Ex. : il manque telle matière / les lacunes sont claires…"
              className="w-full rounded-[14px] border border-slate-200 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>
          <Button type="button" onClick={handleSubmit} disabled={sending}>
            {sending ? "Envoi…" : "Envoyer mon avis"}
          </Button>
          <p className="text-xs text-slate-600">
            Avis anonyme : ni nom, ni e-mail, ni compte. Seuls la formation, le score et le domaine et le niveau de
            votre profil l&apos;accompagnent. N&apos;écrivez pas d&apos;information personnelle dans le commentaire.
          </p>
        </div>
      )}
    </Card>
  );
}
