import type { Application, ApplicationStatus, ChecklistItem } from "@/types";
import type { CompatibilityTone } from "@/lib/matching/labels";
import type { DocumentSuggestion } from "@/data/documentSuggestions";
import { normalize } from "@/lib/utils";

/**
 * Logique pure du suivi des candidatures (Phase 13) — testable indépendamment
 * de l'UI et de `lib/storage.ts` (qui reste, lui, non testé en unitaire par
 * convention du projet : dépend de `window.localStorage`, absent de
 * l'environnement de test `node` — voir lib/storage.compare.test.ts).
 */

const STATUS_TONE: Record<ApplicationStatus, CompatibilityTone | "neutral"> = {
  "à préparer": "neutral",
  "prête": "info",
  "envoyée": "warning",
  "en attente": "warning",
  "réponse reçue": "success",
};

export function applicationStatusTone(status: ApplicationStatus): CompatibilityTone | "neutral" {
  return STATUS_TONE[status];
}

const STATUS_URGENCY_RANK: Record<ApplicationStatus, number> = {
  "à préparer": 0,
  "prête": 1,
  "envoyée": 2,
  "en attente": 3,
  "réponse reçue": 4,
};

/**
 * Trie les candidatures pour l'affichage : les moins avancées (donc les plus
 * actionnables) en premier, puis par échéance personnelle croissante à
 * statut égal (sans échéance renseignée = affiché en dernier de son groupe).
 */
export function sortApplicationsByUrgency(applications: Application[]): Application[] {
  return [...applications].sort((a, b) => {
    const rankDiff = STATUS_URGENCY_RANK[a.status] - STATUS_URGENCY_RANK[b.status];
    if (rankDiff !== 0) return rankDiff;
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return 0;
  });
}

export function createApplication(formationId: string): Application {
  return { formationId, status: "à préparer", documents: [], nextActions: [], notes: "" };
}

function randomChecklistItemId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Ajoute un élément (document ou action) à une checklist ; ignore un libellé vide. */
export function addChecklistItem(items: ChecklistItem[], label: string): ChecklistItem[] {
  const trimmed = label.trim();
  if (!trimmed) return items;
  return [...items, { id: randomChecklistItemId(), label: trimmed, done: false }];
}

export function toggleChecklistItem(items: ChecklistItem[], id: string): ChecklistItem[] {
  return items.map((item) => (item.id === id ? { ...item, done: !item.done } : item));
}

export function removeChecklistItem(items: ChecklistItem[], id: string): ChecklistItem[] {
  return items.filter((item) => item.id !== id);
}

/** Fixe (ou retire, avec `date` undefined/vide) le rappel personnel d'un élément de checklist (Phase 14). */
export function setChecklistItemDueDate(items: ChecklistItem[], id: string, date: string | undefined): ChecklistItem[] {
  return items.map((item) => (item.id === id ? { ...item, dueDate: date || undefined } : item));
}

/** Bascule obligatoire/optionnel pour un élément — appréciation libre de l'étudiant sur son propre élément. */
export function toggleChecklistItemRequired(items: ChecklistItem[], id: string): ChecklistItem[] {
  return items.map((item) => (item.id === id ? { ...item, required: !item.required } : item));
}

/**
 * Ajoute les documents d'un jeu de suggestions officielles (Phase 15) à une
 * checklist, avec leur `required`/`source` déjà sourcés — ignore les
 * libellés déjà présents (comparaison insensible à la casse/accents) pour
 * ne pas dupliquer si l'étudiant clique deux fois.
 */
export function addSuggestedDocuments(items: ChecklistItem[], suggestions: DocumentSuggestion[], source: string): ChecklistItem[] {
  const existingLabels = new Set(items.map((item) => normalize(item.label)));
  const toAdd = suggestions
    .filter((s) => !existingLabels.has(normalize(s.label)))
    .map((s) => ({ id: randomChecklistItemId(), label: s.label, done: false, required: s.required, source }));
  return [...items, ...toAdd];
}
