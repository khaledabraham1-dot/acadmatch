import { describe, expect, it } from "vitest";
import { currentAcademicYear, feedbackByFormation, groupFormationRequests } from "@/lib/admin/stats";
import { outdatedCampaigns, outdatedFees, staleFormations } from "@/lib/admin/catalogueHealth";
import { FORMATIONS } from "@/data/formations";
import { OFFICIAL_CAMPAIGNS } from "@/data/campaigns";
import { TUITION_FEES } from "@/data/budget";

const now = new Date("2026-10-06T12:00:00Z");
const ago = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();

describe("indicateurs admin", () => {
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
