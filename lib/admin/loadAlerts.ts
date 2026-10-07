import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildDigest, yesterdayUtc, type Digest } from "@/lib/admin/alerts";
import type { FeedbackRow, RequestRow } from "@/lib/admin/stats";
import { outdatedCampaigns, outdatedFees, staleFormations } from "@/lib/admin/catalogueHealth";
import { globalDailyBudgetUsd } from "@/lib/ai/config";
import { FORMATIONS } from "@/data/formations";
import { OFFICIAL_CAMPAIGNS } from "@/data/campaigns";
import { TUITION_FEES } from "@/data/budget";
import { listAccountDates } from "@/lib/admin/loadDashboard";

const DAY = 24 * 60 * 60 * 1000;

/** Lit Supabase (clé secrète) et prépare le résumé. Appelé par la tâche quotidienne et par l'essai depuis l'admin. */
export async function loadDigest({ force = false, now = new Date() }: { force?: boolean; now?: Date } = {}): Promise<{ digest: Digest | null; error: string | null }> {
  const db = createAdminClient();
  const since = new Date(now.getTime() - DAY).toISOString();
  const yesterday = yesterdayUtc(now);
  const [requests, feedback, ai, accounts] = await Promise.all([
    db.from("formation_requests").select("wanted, institution, country, source, profile_field, profile_level, created_at, status").order("created_at", { ascending: false }).limit(20000),
    db.from("feedback").select("formation_id, helpfulness, score_fairness, comment, created_at").gte("created_at", since),
    db.from("ai_usage").select("cost_usd").gte("created_at", yesterday.start).lt("created_at", yesterday.end),
    listAccountDates(db),
  ]);
  const failed = [requests.error && "demandes", feedback.error && "avis", ai.error && "IA", accounts.error && "comptes"].filter(Boolean);
  if (failed.length) return { digest: null, error: `Lecture impossible : ${failed.join(", ")}.` };

  const health = [
    ...staleFormations(FORMATIONS, now),
    ...outdatedCampaigns(Object.values(OFFICIAL_CAMPAIGNS), now),
    ...outdatedFees(TUITION_FEES, FORMATIONS, now),
  ];
  const digest = buildDigest(
    {
      now,
      requests: (requests.data ?? []) as RequestRow[],
      feedback: (feedback.data ?? []) as FeedbackRow[],
      aiYesterday: {
        costUsd: (ai.data ?? []).reduce((sum, row) => sum + (Number((row as { cost_usd: unknown }).cost_usd) || 0), 0),
        calls: ai.data?.length ?? 0,
      },
      budgetUsd: globalDailyBudgetUsd(),
      newAccounts: accounts.rows.filter((a) => new Date(a.created_at).getTime() >= now.getTime() - DAY).length,
      overdueCatalogue: health.filter((h) => h.overdue).length,
      formationName: (id) => {
        const f = FORMATIONS.find((x) => x.id === id);
        return f ? `${f.name}, ${f.institution.name}` : id;
      },
    },
    { force },
  );
  return { digest, error: null };
}
