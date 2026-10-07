import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildDashboard, type AccountDates, type AiRow, type AuditRow, type DashboardData, type FullFeedbackRow, type FullRequestRow, type JourneyEvent, type Period } from "@/lib/admin/dashboard";
import { outdatedCampaigns, outdatedFees, staleFormations } from "@/lib/admin/catalogueHealth";
import { globalDailyBudgetUsd } from "@/lib/ai/config";
import { FORMATIONS } from "@/data/formations";
import { OFFICIAL_CAMPAIGNS } from "@/data/campaigns";
import { TUITION_FEES } from "@/data/budget";

const DAY = 24 * 60 * 60 * 1000;
const MAX_ROWS = 20000;
const MAX_ACCOUNT_PAGES = 20;

/**
 * Lit Supabase avec la clé secrète et construit le tableau de bord. À
 * n'appeler qu'après checkAdmin() === "admin" (page et route /donnees).
 * On lit deux périodes (l'actuelle et la précédente) pour les tendances.
 */
export async function loadDashboard(period: Period, now = new Date()): Promise<DashboardData> {
  const db = createAdminClient();
  const since = new Date(now.getTime() - 2 * period * DAY).toISOString();
  const requestColumns = "wanted, institution, country, source, search_query, profile_field, profile_level, profile_goal, created_at";

  const [accounts, journey, requestsWithStatus, feedback, ai, audit] = await Promise.all([
    listAccountDates(db),
    db.from("journey_events").select("step, device, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(MAX_ROWS),
    db.from("formation_requests").select(`${requestColumns}, status`).order("created_at", { ascending: false }).limit(MAX_ROWS),
    db.from("feedback").select("formation_id, helpfulness, score_fairness, comment, profile_field, profile_level, created_at").order("created_at", { ascending: false }).limit(MAX_ROWS),
    db.from("ai_usage").select("feature, cost_usd, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(MAX_ROWS),
    db.from("admin_audit").select("created_at, admin_email, action, detail").order("created_at", { ascending: false }).limit(30),
  ]);
  // Migration 0010 pas encore exécutée : la colonne « status » manque, on relit sans elle.
  const actionsReady = !requestsWithStatus.error;
  const requests = actionsReady
    ? requestsWithStatus
    : await db.from("formation_requests").select(requestColumns).order("created_at", { ascending: false }).limit(MAX_ROWS);

  const failures = [
    accounts.error && "comptes",
    journey.error && "parcours",
    requests.error && "demandes de formation",
    feedback.error && "avis",
    ai.error && "usage de l'IA",
  ].filter((f): f is string => Boolean(f));

  return buildDashboard({
    now,
    period,
    accountsTotal: accounts.total,
    accounts: accounts.rows,
    journey: (journey.data ?? []) as JourneyEvent[],
    requests: (requests.data ?? []) as FullRequestRow[],
    feedback: (feedback.data ?? []) as FullFeedbackRow[],
    ai: (ai.data ?? []) as AiRow[],
    audit: (audit.data ?? []) as AuditRow[],
    budgetUsd: globalDailyBudgetUsd(),
    formationName: (id) => {
      const f = FORMATIONS.find((x) => x.id === id);
      return f ? `${f.name}, ${f.institution.name}` : id;
    },
    health: {
      formations: staleFormations(FORMATIONS, now),
      campaigns: outdatedCampaigns(Object.values(OFFICIAL_CAMPAIGNS), now),
      fees: outdatedFees(TUITION_FEES, FORMATIONS, now),
    },
    failures,
    actionsReady,
  });
}

/** Dates de création et de dernière connexion des comptes, sans aucune adresse. */
async function listAccountDates(db: ReturnType<typeof createAdminClient>): Promise<{ total: number | null; rows: AccountDates[]; error: boolean }> {
  const rows: AccountDates[] = [];
  let total: number | null = null;
  for (let page = 1; page <= MAX_ACCOUNT_PAGES; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return { total, rows, error: true };
    if ("total" in data && typeof data.total === "number") total = data.total;
    rows.push(...data.users.map((u) => ({ created_at: u.created_at, last_sign_in_at: u.last_sign_in_at ?? null })));
    if (data.users.length < 1000) break;
  }
  return { total: total ?? rows.length, rows, error: false };
}
