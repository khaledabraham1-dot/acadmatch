/**
 * Avis sur les résultats (2026-10-01) — envoyés en base, anonymes.
 *
 * Avant : l'avis restait dans le navigateur de l'étudiant, personne ne le
 * lisait. Désormais il part dans la table `feedback`
 * (supabase/migrations/0005_feedback.sql) par un simple appel HTTP — sans
 * charger la librairie Supabase, pour rester léger sur mobile. Si l'envoi
 * échoue (réseau coupé, base indisponible), l'avis est gardé sur l'appareil
 * (clé `acadmatch:feedback`) et renvoyé automatiquement plus tard.
 *
 * Aucun identifiant n'est envoyé : ni compte, ni e-mail, ni nom. Seul le
 * contexte utile à l'amélioration du score (formation, score, domaine et
 * niveau du profil) accompagne les réponses.
 */

import { createAnonymousQueue } from "@/lib/anonymousInsert";

export type FeedbackHelpfulness = "oui" | "partiellement" | "non";
export type ScoreFairness = "trop-haut" | "juste" | "trop-bas";

export interface FeedbackPayload {
  formationId: string;
  score: number | null;
  helpfulness: FeedbackHelpfulness;
  scoreFairness: ScoreFairness | null;
  comment: string;
  profileField: string | null;
  profileLevel: string | null;
  scoreEstimate: boolean;
  fromTranscript: boolean;
}

export const FEEDBACK_LABELS: Record<FeedbackHelpfulness, string> = {
  oui: "Oui, ça m'aide",
  partiellement: "Un peu",
  non: "Pas vraiment",
};

export const FAIRNESS_LABELS: Record<ScoreFairness, string> = {
  "trop-haut": "Trop haut",
  juste: "Juste",
  "trop-bas": "Trop bas",
};

export const MAX_COMMENT_LENGTH = 1000;

const clip = (value: string | null, max: number) => (value === null ? null : value.trim().slice(0, max) || null);

/** Ligne de la table `feedback`, bornée comme les contraintes SQL. */
export function toFeedbackRow(payload: FeedbackPayload) {
  return {
    formation_id: payload.formationId.slice(0, 120),
    score: payload.score === null ? null : Math.max(0, Math.min(100, Math.round(payload.score))),
    helpfulness: payload.helpfulness,
    score_fairness: payload.scoreFairness,
    comment: payload.comment.trim().slice(0, MAX_COMMENT_LENGTH),
    profile_field: clip(payload.profileField, 80),
    profile_level: clip(payload.profileLevel, 40),
    score_estimate: payload.scoreEstimate,
    from_transcript: payload.fromTranscript,
  };
}

type FeedbackRow = ReturnType<typeof toFeedbackRow>;

const queue = createAnonymousQueue<FeedbackRow>("feedback", "acadmatch:feedback");

/** Envoie l'avis ; en cas d'échec, le garde pour un nouvel essai. */
export function sendFeedback(payload: FeedbackPayload): Promise<"sent" | "queued"> {
  return queue.send(toFeedbackRow(payload));
}

/** Renvoie les avis restés en attente (appelé à l'affichage d'un résultat). */
export function flushPendingFeedback(): Promise<void> {
  return queue.flush();
}
