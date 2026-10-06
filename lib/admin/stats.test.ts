import { describe, expect, it } from "vitest";
import { aiUsageSummary, currentAcademicYear, feedbackByFormation, groupFormationRequests, journeyFunnel } from "@/lib/admin/stats";
import { outdatedCampaigns, outdatedFees, staleFormations } from "@/lib/admin/catalogueHealth";
import { FORMATIONS } from "@/data/formations";
import { OFFICIAL_CAMPAIGNS } from "@/data/campaigns";
import { TUITION_FEES } from "@/data/budget";

const now = new Date("2026-10-06T12:00:00Z");
const ago = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();

describe("indicateurs admin", () => {
  it("compte les étapes du parcours sur 7 et 30 jours, avec la part mobile", () => {
    const funnel = journeyFunnel(
      [
        { step: "resultat-vu", detail: null, device: "mobile", created_at: ago(1) },
        { step: "resultat-vu", detail: null, device: "ordinateur", created_at: ago(10) },
        { step: "resultat-vu", detail: null, device: "mobile", created_at: ago(40) },
      ],
      now,
    );
    const line = funnel.find((l) => l.step === "resultat-vu")!;
    expect([line.last7, line.last30, line.mobileShare]).toEqual([1, 2, 50]);
    expect(funnel[0].step).toBe("exemple-essaye");
    expect(funnel.find((l) => l.step === "partage")!.mobileShare).toBeNull();
  });

  it("regroupe les demandes identiques à la casse et aux accents près", () => {
    const base = { institution: null, source: "recherche-vide", profile_level: null };
    const groups = groupFormationRequests([
      { ...base, wanted: "Master Économie du développement", country: "France", profile_field: "Économie & Gestion", created_at: ago(2) },
      { ...base, wanted: "master economie du developpement", country: null, profile_field: null, created_at: ago(1) },
      { ...base, wanted: "Master Économie du développement ", country: "Belgique", profile_field: "Droit", created_at: ago(3) },
      { ...base, wanted: "Architecture", country: null, profile_field: null, created_at: ago(0) },
    ]);
    expect(groups[0]).toMatchObject({ label: "Master Économie du développement", count: 3, countries: ["Belgique", "France"] });
    expect(groups[1].label).toBe("Architecture");
    expect(groups[0].wantedValues).toHaveLength(3);
    expect(groups[0].status).toBe("a-traiter");
  });

  it("donne au groupe le statut commun, ou « à traiter » si une demande est nouvelle", () => {
    const base = { institution: null, source: "catalogue", profile_level: null, country: null, profile_field: null, created_at: ago(1) };
    expect(groupFormationRequests([{ ...base, wanted: "MBA", status: "ajoutee" }, { ...base, wanted: "mba", status: "ajoutee" }])[0].status).toBe("ajoutee");
    expect(groupFormationRequests([{ ...base, wanted: "MBA", status: "ajoutee" }, { ...base, wanted: "mba" }])[0].status).toBe("a-traiter");
  });

  it("fait remonter les formations dont le score paraît faux", () => {
    const row = (formation_id: string, score_fairness: string | null, helpfulness = "oui") => ({ formation_id, helpfulness, score_fairness, comment: "", created_at: ago(1) });
    const summary = feedbackByFormation([row("a", "juste"), row("a", "juste"), row("b", "trop-haut", "non"), row("b", "trop-bas")]);
    expect(summary[0]).toMatchObject({ formationId: "b", tooHigh: 1, tooLow: 1, helpfulShare: 50 });
  });

  it("additionne le coût de l'IA par jour et par fonctionnalité", () => {
    const ai = aiUsageSummary(
      [
        { feature: "lettre-motivation", cost_usd: "0.01200", created_at: "2026-10-06T08:00:00Z" },
        { feature: "import-releve", cost_usd: 0.05, created_at: "2026-10-06T09:00:00Z" },
        { feature: "lettre-motivation", cost_usd: 0.012, created_at: "2026-10-05T09:00:00Z" },
      ],
      now,
    );
    expect(ai.today).toEqual({ day: "2026-10-06", calls: 2, costUsd: 0.062 });
    expect(ai.days).toHaveLength(14);
    expect(ai.byFeature[0]).toEqual({ feature: "import-releve", calls: 1, costUsd: 0.05 });
    expect(ai.costLast30).toBe(0.074);
  });

  it("calcule l'année universitaire en cours", () => {
    expect(currentAcademicYear(new Date("2026-10-06T00:00:00Z"))).toBe("2026-2027");
    expect(currentAcademicYear(new Date("2027-03-01T00:00:00Z"))).toBe("2026-2027");
  });

  it("signale la santé du catalogue sans erreur sur les vraies données", () => {
    expect(Array.isArray(staleFormations(FORMATIONS, now))).toBe(true);
    expect(outdatedCampaigns(Object.values(OFFICIAL_CAMPAIGNS), now).map((c) => c.id)).toEqual(expect.arrayContaining(["parcoursup", "monmaster"]));
    const later = new Date("2027-10-01T00:00:00Z");
    expect(staleFormations(FORMATIONS, later).every((item) => item.overdue)).toBe(true);
    expect(outdatedFees(TUITION_FEES, FORMATIONS, later).length).toBeGreaterThan(0);
  });
});
