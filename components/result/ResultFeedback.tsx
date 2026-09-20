"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  buildFeedbackMailto,
  FEEDBACK_LABELS,
  saveFeedbackEntry,
  type FeedbackHelpfulness,
} from "@/lib/feedback";
import { MessageSquareHeart } from "lucide-react";

interface ResultFeedbackProps {
  formationId: string;
  score: number;
}

/**
 * Une question unique après l'analyse — boucle de feedback MVP.
 * Aucune donnée n'est envoyée à un serveur tiers par défaut.
 */
export function ResultFeedback({ formationId, score }: ResultFeedbackProps) {
  const [choice, setChoice] = useState<FeedbackHelpfulness | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (!choice) return;
    const entry = saveFeedbackEntry({
      helpfulness: choice,
      comment,
      formationId,
      score,
    });
    setSubmitted(true);

    const mailto = buildFeedbackMailto(entry);
    if (mailto) {
      // Ouverture optionnelle : l'utilisateur peut annuler dans son client mail.
      window.location.href = mailto;
    }
  }

  if (submitted) {
    return (
      <Card className="border-emerald-100 bg-emerald-50/50">
        <p className="text-sm font-medium text-emerald-900">Merci — votre avis est enregistré.</p>
        <p className="mt-1 text-sm text-emerald-800">
          Il nous aide à améliorer AcadMatch pour les prochains étudiants.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-900">
        <MessageSquareHeart className="size-4 text-slate-500" aria-hidden />
        Votre avis (30 secondes)
      </h2>
      <p className="mb-4 text-sm text-slate-500">
        Cette analyse vous a-t-elle aidé à y voir plus clair pour candidater ?
      </p>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Aide perçue">
        {(Object.keys(FEEDBACK_LABELS) as FeedbackHelpfulness[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setChoice(key)}
            aria-pressed={choice === key}
            className={
              choice === key
                ? "rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-medium text-white"
                : "rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            }
          >
            {FEEDBACK_LABELS[key]}
          </button>
        ))}
      </div>

      {choice && (
        <div className="mt-4 space-y-3">
          <label htmlFor="feedback-comment" className="block text-sm font-medium text-slate-700">
            Pourquoi ? (optionnel)
          </label>
          <textarea
            id="feedback-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Ex. : les lacunes prioritaires sont claires / il manque telle info…"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <Button type="button" onClick={handleSubmit}>
            Envoyer mon avis
          </Button>
          <p className="text-xs text-slate-400">
            Aucun compte requis. L&apos;avis reste sur cet appareil
            {process.env.NEXT_PUBLIC_FEEDBACK_EMAIL ? " et peut être envoyé par e-mail" : ""}.
          </p>
        </div>
      )}
    </Card>
  );
}
