import type { Application, ChecklistItem, StudyProgram } from "@/types";

/**
 * Calendrier personnalisé (Phase 14) — logique pure, testable indépendamment
 * de l'UI.
 *
 * Choix de portée assumé : la phase demande un calendrier "basé sur
 * formations, candidatures et deadlines" qui "utilise uniquement des dates
 * vérifiées et signale les dates non vérifiées". Or `StudyProgram` ne
 * stocke volontairement AUCUNE date de candidature exacte
 * (`applicationProcedure` documente la plateforme/période, jamais un
 * jour précis — une date de campagne se périme en quelques mois, voir
 * types/index.ts) : il n'existe donc aucune date "vérifiée" à afficher.
 * Toutes les entrées de ce calendrier sont donc des rappels personnels que
 * l'étudiant se fixe lui-même (`Application.deadline`,
 * `ChecklistItem.dueDate`) — jamais une date officielle affirmée par
 * AcadMatch. C'est signalé une fois, clairement, plutôt que de simuler une
 * distinction vérifié/non-vérifié qui n'existe pas dans les données.
 *
 * Discipline dates/fuseaux horaires (consigne explicite de la phase) :
 * toutes les dates sont des chaînes ISO "YYYY-MM-DD" comparées et groupées
 * comme des chaînes (jamais via un `Date` local, dont le fuseau du
 * navigateur pourrait décaler le jour affiché) ; un `Date` n'est construit
 * qu'au moment du formatage d'affichage, toujours ancré en UTC
 * (`T00:00:00.000Z` + `timeZone: "UTC"`) pour ne jamais dépendre du fuseau
 * de l'utilisateur.
 */

export type CalendarEntrySource = "deadline" | "document" | "nextAction";

export interface CalendarEntry {
  formationId: string;
  formationName: string;
  /** Date ISO "YYYY-MM-DD". */
  date: string;
  source: CalendarEntrySource;
  /** Id de l'élément de checklist d'origine — absent pour une échéance (non cochable). */
  itemId?: string;
  label: string;
  done: boolean;
}

/** Construit les entrées du calendrier à partir des candidatures suivies. */
export function buildCalendarEntries(applications: Application[], formations: StudyProgram[]): CalendarEntry[] {
  const entries: CalendarEntry[] = [];

  for (const application of applications) {
    const formation = formations.find((f) => f.id === application.formationId);
    if (!formation) continue;

    if (application.deadline) {
      entries.push({
        formationId: application.formationId,
        formationName: formation.name,
        date: application.deadline,
        source: "deadline",
        label: `Échéance personnelle — ${formation.name}`,
        done: false,
      });
    }

    entries.push(...itemEntries(application.documents, "document", application.formationId, formation.name));
    entries.push(...itemEntries(application.nextActions, "nextAction", application.formationId, formation.name));
  }

  return entries;
}

function itemEntries(
  items: ChecklistItem[],
  source: "document" | "nextAction",
  formationId: string,
  formationName: string,
): CalendarEntry[] {
  return items
    .filter((item) => item.dueDate)
    .map((item) => ({
      formationId,
      formationName,
      date: item.dueDate!,
      source,
      itemId: item.id,
      label: item.label,
      done: item.done,
    }));
}

/** Tri chronologique — comparaison de chaînes ISO, jamais de `Date` (voir discipline fuseaux en tête de fichier). */
export function sortCalendarEntries(entries: CalendarEntry[]): CalendarEntry[] {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

/** Regroupe les entrées par date ISO, dans l'ordre chronologique. */
export function groupEntriesByDate(entries: CalendarEntry[]): Map<string, CalendarEntry[]> {
  const map = new Map<string, CalendarEntry[]>();
  for (const entry of sortCalendarEntries(entries)) {
    const forDate = map.get(entry.date) ?? [];
    forDate.push(entry);
    map.set(entry.date, forDate);
  }
  return map;
}

/** "YYYY-MM-DD" du jour, en UTC — même ancrage que le formatage d'affichage. */
export function todayIso(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString().slice(0, 10);
}

/** Une entrée non cochée dont la date est strictement passée. */
export function isOverdue(entry: Pick<CalendarEntry, "date" | "done">, now = new Date()): boolean {
  return !entry.done && entry.date < todayIso(now);
}

/** Formate une date ISO en toutes lettres, ancré en UTC pour ne jamais dépendre du fuseau du visiteur. */
export function formatCalendarDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
