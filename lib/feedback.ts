/**
 * Boucle de feedback MVP (Étape 9) — respectueuse de la vie privée.
 *
 * - Stockage local uniquement par défaut (aucun envoi serveur).
 * - Envoi e-mail optionnel si `NEXT_PUBLIC_FEEDBACK_EMAIL` est défini.
 */

export type FeedbackHelpfulness = "oui" | "partiellement" | "non";

export interface FeedbackEntry {
  id: string;
  createdAt: string;
  helpfulness: FeedbackHelpfulness;
  comment: string;
  formationId: string | null;
  score: number | null;
}

const FEEDBACK_KEY = "acadmatch:feedback";

function getStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getFeedbackEmail(): string {
  return (process.env.NEXT_PUBLIC_FEEDBACK_EMAIL ?? "").trim();
}

export function loadFeedbackEntries(): FeedbackEntry[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(FEEDBACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as FeedbackEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveFeedbackEntry(entry: Omit<FeedbackEntry, "id" | "createdAt">): FeedbackEntry {
  const full: FeedbackEntry = {
    ...entry,
    id: `fb-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    comment: entry.comment.trim().slice(0, 1000),
  };

  const storage = getStorage();
  if (storage) {
    try {
      const existing = loadFeedbackEntries();
      storage.setItem(FEEDBACK_KEY, JSON.stringify([full, ...existing].slice(0, 50)));
    } catch {
      // Stockage bloqué : on continue (mailto éventuel reste possible).
    }
  }

  return full;
}

/** Construit un mailto prérempli — n'ouvre rien si aucun e-mail configuré. */
export function buildFeedbackMailto(entry: FeedbackEntry): string | null {
  const email = getFeedbackEmail();
  if (!email) return null;

  const subject = encodeURIComponent(`[AcadMatch] Feedback — ${entry.helpfulness}`);
  const body = encodeURIComponent(
    [
      `Aide perçue : ${entry.helpfulness}`,
      `Formation : ${entry.formationId ?? "n/a"}`,
      `Score : ${entry.score ?? "n/a"}`,
      `Date : ${entry.createdAt}`,
      "",
      "Commentaire :",
      entry.comment || "(aucun)",
    ].join("\n"),
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

export const FEEDBACK_LABELS: Record<FeedbackHelpfulness, string> = {
  oui: "Oui, ça m'aide",
  partiellement: "Un peu",
  non: "Pas vraiment",
};
