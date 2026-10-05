/**
 * Indicateurs de l'espace admin (2026-10-06), calculés à partir des lignes
 * brutes des tables Supabase. Fonctions pures : aucune lecture ici, tout est
 * testable (lib/admin/stats.test.ts). Aucune donnée personnelle n'entre ni ne
 * sort : les tables lues sont anonymes ou réduites à des comptes.
 */
import { JOURNEY_STEPS, type JourneyStep } from "@/lib/journey";
import { normalize } from "@/lib/utils";

const DAY = 24 * 60 * 60 * 1000;

export interface JourneyRow { step: string; detail: string | null; device: string | null; created_at: string }
export interface RequestRow { wanted: string; institution: string | null; country: string | null; source: string; profile_field: string | null; profile_level: string | null; created_at: string }
export interface FeedbackRow { formation_id: string; helpfulness: string; score_fairness: string | null; comment: string; created_at: string }
export interface AiUsageRow { feature: string; cost_usd: number | string; created_at: string }

const since = (now: Date, days: number) => now.getTime() - days * DAY;
const inWindow = (iso: string, now: Date, days: number) => new Date(iso).getTime() >= since(now, days);

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

export interface FunnelLine { step: JourneyStep; label: string; last7: number; last30: number; mobileShare: number | null }

/** Étapes du parcours sur 7 et 30 jours, dans l'ordre du parcours. */
export function journeyFunnel(rows: JourneyRow[], now: Date): FunnelLine[] {
  return JOURNEY_STEPS.map((step) => {
    const ofStep = rows.filter((r) => r.step === step);
    const recent = ofStep.filter((r) => inWindow(r.created_at, now, 30));
    const mobile = recent.filter((r) => r.device === "mobile").length;
    return {
      step,
      label: STEP_LABELS[step],
      last7: ofStep.filter((r) => inWindow(r.created_at, now, 7)).length,
      last30: recent.length,
      mobileShare: recent.length ? Math.round((mobile / recent.length) * 100) : null,
    };
  });
}

export interface RequestGroup { label: string; count: number; lastAt: string; countries: string[]; fields: string[]; institutions: string[] }

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
    }))
    .sort((a, b) => b.count - a.count || b.lastAt.localeCompare(a.lastAt));
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

export interface AiDay { day: string; calls: number; costUsd: number }
export interface AiSummary { today: AiDay; days: AiDay[]; byFeature: { feature: string; calls: number; costUsd: number }[]; costLast30: number }

const cost = (row: AiUsageRow) => Number(row.cost_usd) || 0;
const round4 = (value: number) => Math.round(value * 10000) / 10000;

/** Appels et coût de l'IA par jour (UTC, comme le budget quotidien) et par fonctionnalité. */
export function aiUsageSummary(rows: AiUsageRow[], now: Date, days = 14): AiSummary {
  const dayOf = (iso: string) => iso.slice(0, 10);
  const list: AiDay[] = Array.from({ length: days }, (_, i) => {
    const day = new Date(now.getTime() - i * DAY).toISOString().slice(0, 10);
    const ofDay = rows.filter((r) => dayOf(r.created_at) === day);
    return { day, calls: ofDay.length, costUsd: round4(ofDay.reduce((sum, r) => sum + cost(r), 0)) };
  });
  const recent = rows.filter((r) => inWindow(r.created_at, now, 30));
  const features = new Map<string, { calls: number; costUsd: number }>();
  for (const row of recent) {
    const entry = features.get(row.feature) ?? { calls: 0, costUsd: 0 };
    features.set(row.feature, { calls: entry.calls + 1, costUsd: entry.costUsd + cost(row) });
  }
  return {
    today: list[0],
    days: list,
    byFeature: [...features.entries()].map(([feature, v]) => ({ feature, calls: v.calls, costUsd: round4(v.costUsd) })).sort((a, b) => b.costUsd - a.costUsd),
    costLast30: round4(recent.reduce((sum, r) => sum + cost(r), 0)),
  };
}

/** Rentrée universitaire en cours au format « 2026-2027 » (elle bascule en septembre). */
export function currentAcademicYear(now: Date): string {
  const year = now.getUTCFullYear();
  const start = now.getUTCMonth() >= 8 ? year : year - 1;
  return `${start}-${start + 1}`;
}
