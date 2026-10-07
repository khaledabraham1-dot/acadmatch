/**
 * Indicateurs de l'espace admin (2026-10-06), calculés à partir des lignes
 * brutes des tables Supabase. Fonctions pures : aucune lecture ici, tout est
 * testable (lib/admin/stats.test.ts). Aucune donnée personnelle n'entre ni ne
 * sort : les tables lues sont anonymes ou réduites à des comptes.
 */
import type { JourneyStep } from "@/lib/journey";
import { normalize } from "@/lib/utils";

export interface RequestRow { wanted: string; institution: string | null; country: string | null; source: string; profile_field: string | null; profile_level: string | null; created_at: string; status?: string }
export interface FeedbackRow { formation_id: string; helpfulness: string; score_fairness: string | null; comment: string; created_at: string }

export const STEP_LABELS: Record<JourneyStep, string> = {
  "exemple-essaye": "Exemple essayé",
  "profil-parcours": "Parcours renseigné (étape 1)",
  "profil-enregistre": "Profil enregistré",
  "resultat-vu": "Résultat consulté",
  "releve-importe": "Relevé de notes importé",
  "candidature-ajoutee": "Candidature ajoutée au suivi",
  "ia-utilisee": "Outil d'IA utilisé",
  partage: "Lien partagé",
};

export type RequestStatus = "a-traiter" | "ajoutee" | "refusee";
export interface RequestGroup {
  label: string;
  count: number;
  lastAt: string;
  countries: string[];
  fields: string[];
  institutions: string[];
  /** Intitulés exacts du groupe : la clé d'une mise à jour de statut. */
  wantedValues: string[];
  /** Statut commun ; « a-traiter » dès qu'une demande du groupe n'est pas traitée. */
  status: RequestStatus;
}

/**
 * Demandes de formations manquantes regroupées : même intitulé à la casse et
 * aux accents près. Le libellé affiché est la formulation la plus fréquente.
 */
export function groupFormationRequests(rows: RequestRow[]): RequestGroup[] {
  const groups = new Map<string, { labels: Map<string, number>; rows: RequestRow[] }>();
  for (const row of rows) {
    const key = normalize(row.wanted).replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
    if (!key) continue;
    const group = groups.get(key) ?? { labels: new Map<string, number>(), rows: [] as RequestRow[] };
    group.labels.set(row.wanted.trim(), (group.labels.get(row.wanted.trim()) ?? 0) + 1);
    group.rows.push(row);
    groups.set(key, group);
  }
  const distinct = (values: (string | null)[]) => [...new Set(values.filter((v): v is string => !!v && !!v.trim()))].sort((a, b) => a.localeCompare(b, "fr"));
  return [...groups.values()]
    .map(({ labels, rows: list }) => ({
      label: [...labels.entries()].sort((a, b) => b[1] - a[1])[0][0],
      count: list.length,
      lastAt: list.map((r) => r.created_at).sort().at(-1)!,
      countries: distinct(list.map((r) => r.country)),
      fields: distinct(list.map((r) => r.profile_field)),
      institutions: distinct(list.map((r) => r.institution)),
      wantedValues: [...new Set(list.map((r) => r.wanted))],
      status: groupStatus(list),
    }))
    .sort((a, b) => b.count - a.count || b.lastAt.localeCompare(a.lastAt));
}

function groupStatus(list: RequestRow[]): RequestStatus {
  const statuses = new Set(list.map((r) => r.status ?? "a-traiter"));
  if (statuses.has("a-traiter") || statuses.size !== 1) return "a-traiter";
  return [...statuses][0] === "refusee" ? "refusee" : "ajoutee";
}

export interface FeedbackSummary {
  formationId: string;
  count: number;
  helpfulShare: number;
  tooHigh: number;
  fair: number;
  tooLow: number;
  comments: { text: string; at: string }[];
}

/**
 * Avis par formation. Les formations dont le score paraît le plus souvent
 * « trop haut » ou « trop bas » remontent : ce sont les fiches à recalibrer.
 */
export function feedbackByFormation(rows: FeedbackRow[]): FeedbackSummary[] {
  const byId = new Map<string, FeedbackRow[]>();
  for (const row of rows) byId.set(row.formation_id, [...(byId.get(row.formation_id) ?? []), row]);
  return [...byId.entries()]
    .map(([formationId, list]) => ({
      formationId,
      count: list.length,
      helpfulShare: Math.round((list.filter((r) => r.helpfulness === "oui").length / list.length) * 100),
      tooHigh: list.filter((r) => r.score_fairness === "trop-haut").length,
      fair: list.filter((r) => r.score_fairness === "juste").length,
      tooLow: list.filter((r) => r.score_fairness === "trop-bas").length,
      comments: list
        .filter((r) => r.comment.trim())
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 5)
        .map((r) => ({ text: r.comment.trim(), at: r.created_at })),
    }))
    .sort((a, b) => b.tooHigh + b.tooLow - (a.tooHigh + a.tooLow) || b.count - a.count);
}

/** Rentrée universitaire en cours au format « 2026-2027 » (elle bascule en septembre). */
export function currentAcademicYear(now: Date): string {
  const year = now.getUTCFullYear();
  const start = now.getUTCMonth() >= 8 ? year : year - 1;
  return `${start}-${start + 1}`;
}
