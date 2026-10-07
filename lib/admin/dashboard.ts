/**
 * Tableau de bord admin V3 (2026-10-07) : toutes les données affichées par
 * components/admin/AdminDashboard.tsx, calculées ici à partir des lignes
 * brutes. Fonctions pures, testées (lib/admin/dashboard.test.ts).
 *
 * Chaque indicateur est donné pour la période choisie (7, 30 ou 90 jours)
 * ET la période précédente de même durée : la tendance (+12 %) dit si ça
 * progresse, ce qu'un chiffre seul ne dit jamais. Jours en UTC, comme le
 * budget quotidien de l'IA. Aucune donnée personnelle ne sort d'ici : les
 * comptes ne sont plus que des dates.
 */
import { STEP_LABELS, feedbackByFormation, groupFormationRequests, type FeedbackRow, type RequestGroup, type RequestRow } from "@/lib/admin/stats";
import type { JourneyStep } from "@/lib/journey";
import type { HealthItem } from "@/lib/admin/catalogueHealth";

const DAY = 24 * 60 * 60 * 1000;

export const PERIODS = [7, 30, 90] as const;
export type Period = (typeof PERIODS)[number];
export const isPeriod = (value: unknown): value is Period => PERIODS.includes(Number(value) as Period);

export interface Trend {
  current: number;
  previous: number;
  /** Une valeur par jour de la période, du plus ancien au plus récent. */
  series: number[];
}

/** Jours (AAAA-MM-JJ, UTC) de la période, du plus ancien à aujourd'hui inclus. */
export function dayKeys(now: Date, days: number): string[] {
  return Array.from({ length: days }, (_, i) => new Date(now.getTime() - (days - 1 - i) * DAY).toISOString().slice(0, 10));
}

/**
 * Somme par jour sur la période, et totaux de la période et de la précédente.
 * Les bornes suivent les jours civils : « 7 jours » = aujourd'hui et les 6 jours d'avant.
 */
export function trend(items: { at: string; value?: number }[], now: Date, days: number): Trend {
  const keys = dayKeys(now, days);
  const index = new Map(keys.map((k, i) => [k, i]));
  const series = keys.map(() => 0);
  const previousStart = new Date(now.getTime() - (2 * days - 1) * DAY).toISOString().slice(0, 10);
  let previous = 0;
  for (const item of items) {
    const day = item.at.slice(0, 10);
    const value = item.value ?? 1;
    const i = index.get(day);
    if (i !== undefined) series[i] += value;
    else if (day >= previousStart && day < keys[0]) previous += value;
  }
  const round = (v: number) => Math.round(v * 10000) / 10000;
  return { current: round(series.reduce((a, b) => a + b, 0)), previous: round(previous), series: series.map(round) };
}

/** Variation en %, ou null quand la période précédente est vide (pas de base de comparaison). */
export function changePercent(t: Pick<Trend, "current" | "previous">): number | null {
  if (t.previous === 0) return null;
  return Math.round(((t.current - t.previous) / t.previous) * 100);
}

export interface JourneyEvent { step: string; device: string | null; created_at: string }
export interface AccountDates { created_at: string; last_sign_in_at: string | null }
export interface AiRow { feature: string; cost_usd: number | string; created_at: string }
export interface AuditRow { created_at: string; admin_email: string; action: string; detail: string }
export interface FullRequestRow extends RequestRow { search_query?: string | null; profile_goal?: string | null }
export interface FullFeedbackRow extends FeedbackRow { profile_field?: string | null; profile_level?: string | null }

/** Le chemin principal d'un étudiant, dans l'ordre : c'est l'entonnoir. */
export const MAIN_FUNNEL: JourneyStep[] = ["profil-parcours", "profil-enregistre", "resultat-vu", "candidature-ajoutee"];
/** Actions secondaires : comptées, mais hors de l'entonnoir (on peut les faire à tout moment). */
export const SIDE_STEPS: JourneyStep[] = ["exemple-essaye", "releve-importe", "ia-utilisee", "partage"];
/** Courbes du graphique d'activité, dans l'ordre des couleurs. */
export const ACTIVITY_STEPS: JourneyStep[] = ["resultat-vu", "profil-enregistre", "exemple-essaye"];

export interface FunnelStep {
  step: JourneyStep;
  label: string;
  count: number;
  previous: number;
  /** Part des visiteurs de l'étape précédente arrivés ici (null pour la première). */
  fromPrevious: number | null;
  mobileShare: number | null;
}

export interface RequestDetail extends RequestGroup {
  /** Demandes reçues pendant la période choisie. */
  recent: number;
  levels: string[];
  goals: string[];
  queries: string[];
  sources: string[];
}

export interface DashboardData {
  generatedAt: string;
  period: Period;
  days: string[];
  kpis: {
    accounts: { total: number | null; created: Trend; active: number };
    results: Trend;
    profiles: Trend;
    requests: Trend;
    feedback: Trend;
    aiCost: Trend;
  };
  activity: { step: JourneyStep; label: string; values: number[] }[];
  funnel: FunnelStep[];
  side: { step: JourneyStep; label: string; count: number; previous: number }[];
  devices: { mobile: number; computer: number };
  requests: RequestDetail[];
  feedback: {
    total: number;
    helpfulness: { oui: number; partiellement: number; non: number };
    fairness: { tooHigh: number; fair: number; tooLow: number };
    byFormation: { formationId: string; name: string; count: number; helpfulShare: number; tooHigh: number; fair: number; tooLow: number }[];
    comments: { name: string; text: string; at: string; fairness: string | null; helpfulness: string }[];
  };
  ai: { today: { costUsd: number; calls: number }; budgetUsd: number; daily: number[]; calls: Trend; byFeature: { feature: string; calls: number; costUsd: number }[] };
  health: { formations: HealthItem[]; campaigns: HealthItem[]; fees: HealthItem[] };
  audit: AuditRow[];
  /** Tables illisibles (migration manquante, panne) : affichées en alerte, jamais en silence. */
  failures: string[];
  actionsReady: boolean;
}

export interface DashboardInput {
  now: Date;
  period: Period;
  accountsTotal: number | null;
  accounts: AccountDates[];
  journey: JourneyEvent[];
  requests: FullRequestRow[];
  feedback: FullFeedbackRow[];
  ai: AiRow[];
  audit: AuditRow[];
  budgetUsd: number;
  formationName: (id: string) => string;
  health: DashboardData["health"];
  failures: string[];
  actionsReady: boolean;
}

const share = (part: number, total: number) => (total ? Math.round((part / total) * 100) : null);
const distinct = (values: (string | null | undefined)[], max = 8) =>
  [...new Set(values.filter((v): v is string => !!v && !!v.trim()).map((v) => v.trim()))].slice(0, max);

export function buildDashboard(input: DashboardInput): DashboardData {
  const { now, period: days } = input;
  const since = now.getTime() - (days - 1) * DAY;
  const periodStart = new Date(since).toISOString().slice(0, 10);
  const inPeriod = (iso: string) => iso.slice(0, 10) >= periodStart;

  const stepTrend = (step: JourneyStep) => trend(input.journey.filter((e) => e.step === step).map((e) => ({ at: e.created_at })), now, days);
  const steps = new Map<JourneyStep, Trend>([...MAIN_FUNNEL, ...SIDE_STEPS].map((s) => [s, stepTrend(s)]));

  const funnel = MAIN_FUNNEL.map((step, i) => {
    const t = steps.get(step)!;
    const recent = input.journey.filter((e) => e.step === step && inPeriod(e.created_at));
    const before = i > 0 ? steps.get(MAIN_FUNNEL[i - 1])!.current : 0;
    return {
      step,
      label: STEP_LABELS[step],
      count: t.current,
      previous: t.previous,
      fromPrevious: i === 0 ? null : before ? Math.min(100, Math.round((t.current / before) * 100)) : null,
      mobileShare: share(recent.filter((e) => e.device === "mobile").length, recent.length),
    };
  });

  const periodEvents = input.journey.filter((e) => inPeriod(e.created_at));

  const groups = groupFormationRequests(input.requests);
  const requests: RequestDetail[] = groups.map((g) => {
    const wanted = new Set(g.wantedValues);
    const rows = input.requests.filter((r) => wanted.has(r.wanted));
    return {
      ...g,
      recent: rows.filter((r) => inPeriod(r.created_at)).length,
      levels: distinct(rows.map((r) => r.profile_level)),
      goals: distinct(rows.map((r) => r.profile_goal)),
      queries: distinct(rows.map((r) => r.search_query), 5),
      sources: distinct(rows.map((r) => r.source)),
    };
  });

  const fb = input.feedback;
  const aiPeriod = input.ai.filter((r) => inPeriod(r.created_at));
  const features = new Map<string, { calls: number; costUsd: number }>();
  for (const row of aiPeriod) {
    const entry = features.get(row.feature) ?? { calls: 0, costUsd: 0 };
    features.set(row.feature, { calls: entry.calls + 1, costUsd: entry.costUsd + (Number(row.cost_usd) || 0) });
  }
  const aiCost = trend(input.ai.map((r) => ({ at: r.created_at, value: Number(r.cost_usd) || 0 })), now, days);
  const aiCalls = trend(input.ai.map((r) => ({ at: r.created_at })), now, days);

  return {
    generatedAt: now.toISOString(),
    period: days,
    days: dayKeys(now, days),
    kpis: {
      accounts: {
        total: input.accountsTotal,
        created: trend(input.accounts.map((a) => ({ at: a.created_at })), now, days),
        active: input.accounts.filter((a) => a.last_sign_in_at && inPeriod(a.last_sign_in_at)).length,
      },
      results: steps.get("resultat-vu")!,
      profiles: steps.get("profil-enregistre")!,
      requests: trend(input.requests.map((r) => ({ at: r.created_at })), now, days),
      feedback: trend(fb.map((r) => ({ at: r.created_at })), now, days),
      aiCost,
    },
    activity: ACTIVITY_STEPS.map((step) => ({ step, label: STEP_LABELS[step], values: (steps.get(step) ?? stepTrend(step)).series })),
    funnel,
    side: SIDE_STEPS.map((step) => ({ step, label: STEP_LABELS[step], count: steps.get(step)!.current, previous: steps.get(step)!.previous })),
    devices: {
      mobile: periodEvents.filter((e) => e.device === "mobile").length,
      computer: periodEvents.filter((e) => e.device !== "mobile").length,
    },
    requests,
    feedback: {
      total: fb.length,
      helpfulness: {
        oui: fb.filter((r) => r.helpfulness === "oui").length,
        partiellement: fb.filter((r) => r.helpfulness === "partiellement").length,
        non: fb.filter((r) => r.helpfulness === "non").length,
      },
      fairness: {
        tooHigh: fb.filter((r) => r.score_fairness === "trop-haut").length,
        fair: fb.filter((r) => r.score_fairness === "juste").length,
        tooLow: fb.filter((r) => r.score_fairness === "trop-bas").length,
      },
      byFormation: feedbackByFormation(fb)
        .slice(0, 12)
        .map((s) => ({ formationId: s.formationId, name: input.formationName(s.formationId), count: s.count, helpfulShare: s.helpfulShare, tooHigh: s.tooHigh, fair: s.fair, tooLow: s.tooLow })),
      comments: fb
        .filter((r) => r.comment.trim())
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 30)
        .map((r) => ({ name: input.formationName(r.formation_id), text: r.comment.trim(), at: r.created_at, fairness: r.score_fairness, helpfulness: r.helpfulness })),
    },
    ai: {
      today: {
        costUsd: aiCost.series.at(-1) ?? 0,
        calls: aiCalls.series.at(-1) ?? 0,
      },
      budgetUsd: input.budgetUsd,
      daily: aiCost.series,
      calls: aiCalls,
      byFeature: [...features.entries()]
        .map(([feature, v]) => ({ feature, calls: v.calls, costUsd: Math.round(v.costUsd * 10000) / 10000 }))
        .sort((a, b) => b.costUsd - a.costUsd),
    },
    health: input.health,
    audit: input.audit,
    failures: input.failures,
    actionsReady: input.actionsReady,
  };
}
