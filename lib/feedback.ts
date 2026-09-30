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

const PENDING_KEY = "acadmatch:feedback";
const MAX_PENDING = 20;
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

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readPending(): FeedbackRow[] {
  try {
    const parsed = JSON.parse(storage()?.getItem(PENDING_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? (parsed as FeedbackRow[]) : [];
  } catch {
    return [];
  }
}

function writePending(rows: FeedbackRow[]) {
  try {
    if (rows.length === 0) storage()?.removeItem(PENDING_KEY);
    else storage()?.setItem(PENDING_KEY, JSON.stringify(rows.slice(-MAX_PENDING)));
  } catch {
    // Stockage bloqué : l'avis est perdu, sans gêner l'étudiant.
  }
}

async function postRow(row: FeedbackRow): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return false;
  try {
    const response = await fetch(`${url.replace(/\/+$/, "")}/rest/v1/feedback`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(row),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** Envoie l'avis ; en cas d'échec, le garde pour un nouvel essai. */
export async function sendFeedback(payload: FeedbackPayload): Promise<"sent" | "queued"> {
  const row = toFeedbackRow(payload);
  if (await postRow(row)) return "sent";
  writePending([...readPending(), row]);
  return "queued";
}

/** Renvoie les avis restés en attente (appelé à l'affichage d'un résultat). */
export async function flushPendingFeedback(): Promise<void> {
  const pending = readPending();
  if (pending.length === 0) return;
  const failed: FeedbackRow[] = [];
  for (const row of pending) {
    if (!(await postRow(row))) failed.push(row);
  }
  writePending(failed);
}
