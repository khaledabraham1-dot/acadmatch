import { describe, expect, it } from "vitest";
import { buildDashboard, changePercent, dayKeys, isPeriod, trend, type DashboardInput } from "@/lib/admin/dashboard";

const now = new Date("2026-10-07T15:00:00Z");
const ago = (days: number, hour = 10) => {
  const d = new Date(now.getTime() - days * 86400000);
  d.setUTCHours(hour);
  return d.toISOString();
};

const base: DashboardInput = {
  now,
  period: 7,
  accountsTotal: 0,
  accounts: [],
  journey: [],
  requests: [],
  feedback: [],
  ai: [],
  audit: [],
  budgetUsd: 2,
  formationName: (id) => `Nom de ${id}`,
  health: { formations: [], campaigns: [], fees: [] },
  failures: [],
  actionsReady: true,
};

describe("tableau de bord admin", () => {
  it("liste les jours de la période, du plus ancien à aujourd'hui", () => {
    expect(dayKeys(now, 3)).toEqual(["2026-10-05", "2026-10-06", "2026-10-07"]);
  });

  it("compte par jour, et sépare la période de la précédente", () => {
    const t = trend([{ at: ago(0) }, { at: ago(0) }, { at: ago(6) }, { at: ago(7) }, { at: ago(13) }, { at: ago(14) }], now, 7);
    expect(t.series).toEqual([1, 0, 0, 0, 0, 0, 2]);
    expect(t.current).toBe(3);
    expect(t.previous).toBe(2); // ago(14) est hors des deux périodes
  });

  it("additionne des montants (coût de l'IA) sans erreur d'arrondi visible", () => {
    const t = trend([{ at: ago(0), value: 0.1 }, { at: ago(0), value: 0.2 }], now, 7);
    expect(t.current).toBe(0.3);
  });

  it("ne calcule pas de variation sans période précédente", () => {
    expect(changePercent({ current: 5, previous: 0 })).toBeNull();
    expect(changePercent({ current: 15, previous: 10 })).toBe(50);
  });

  it("n'accepte que 7, 30 ou 90 jours", () => {
    expect(isPeriod("30")).toBe(true);
    expect(isPeriod("365")).toBe(false);
    expect(isPeriod(null)).toBe(false);
  });

  it("calcule l'entonnoir : part des visiteurs qui passent à l'étape suivante", () => {
    const step = (s: string, n: number, device = "ordinateur") => Array.from({ length: n }, () => ({ step: s, device, created_at: ago(1) }));
    const data = buildDashboard({
      ...base,
      journey: [...step("profil-parcours", 10, "mobile"), ...step("profil-enregistre", 6), ...step("resultat-vu", 3), ...step("partage", 2)],
    });
    expect(data.funnel.map((s) => [s.step, s.count, s.fromPrevious])).toEqual([
      ["profil-parcours", 10, null],
      ["profil-enregistre", 6, 60],
      ["resultat-vu", 3, 50],
      ["candidature-ajoutee", 0, 0],
    ]);
    expect(data.funnel[0].mobileShare).toBe(100);
    expect(data.side.find((s) => s.step === "partage")!.count).toBe(2);
    expect(data.devices).toEqual({ mobile: 10, computer: 11 });
    expect(data.kpis.results.current).toBe(3);
  });

  it("ne garde des comptes que des dates, et compte les nouveaux et les actifs", () => {
    const data = buildDashboard({
      ...base,
      accountsTotal: 3,
      accounts: [
        { created_at: ago(1), last_sign_in_at: ago(0) },
        { created_at: ago(40), last_sign_in_at: ago(2) },
        { created_at: ago(40), last_sign_in_at: null },
      ],
    });
    expect(data.kpis.accounts).toMatchObject({ total: 3, active: 2 });
    expect(data.kpis.accounts.created.current).toBe(1);
    expect(JSON.stringify(data)).not.toContain("@");
  });

  it("détaille les demandes regroupées et compte les récentes", () => {
    const row = { institution: null, country: "France", source: "recherche-vide", profile_field: "Droit", profile_level: "Licence 3", profile_goal: "Master", created_at: ago(1) };
    const data = buildDashboard({
      ...base,
      requests: [
        { ...row, wanted: "Master Droit des affaires", search_query: "droit affaires" },
        { ...row, wanted: "master droit des affaires", created_at: ago(30), search_query: null },
      ],
    });
    expect(data.requests).toHaveLength(1);
    expect(data.requests[0]).toMatchObject({ count: 2, recent: 1, queries: ["droit affaires"], levels: ["Licence 3"], goals: ["Master"] });
    expect(data.kpis.requests.current).toBe(1);
  });

  it("résume les avis et nomme les formations", () => {
    const fb = (helpfulness: string, score_fairness: string | null, comment = "") => ({ formation_id: "f1", helpfulness, score_fairness, comment, created_at: ago(1) });
    const data = buildDashboard({ ...base, feedback: [fb("oui", "juste", "Très clair"), fb("non", "trop-haut"), fb("partiellement", null)] });
    expect(data.feedback.helpfulness).toEqual({ oui: 1, partiellement: 1, non: 1 });
    expect(data.feedback.fairness).toEqual({ tooHigh: 1, fair: 1, tooLow: 0 });
    expect(data.feedback.byFormation[0]).toMatchObject({ name: "Nom de f1", count: 3 });
    expect(data.feedback.comments).toEqual([expect.objectContaining({ name: "Nom de f1", text: "Très clair", fairness: "juste" })]);
  });

  it("donne le coût de l'IA du jour, par jour et par fonctionnalité", () => {
    const data = buildDashboard({
      ...base,
      ai: [
        { feature: "lettre", cost_usd: "0.02", created_at: ago(0) },
        { feature: "lettre", cost_usd: 0.01, created_at: ago(2) },
        { feature: "releve", cost_usd: 0.05, created_at: ago(0) },
      ],
    });
    expect(data.ai.today).toEqual({ costUsd: 0.07, calls: 2 });
    expect(data.ai.daily).toHaveLength(7);
    expect(data.ai.byFeature.map((f) => f.feature)).toEqual(["releve", "lettre"]);
    expect(data.kpis.aiCost.current).toBe(0.08);
  });
});
