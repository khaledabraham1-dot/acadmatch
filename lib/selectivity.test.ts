import { describe, expect, it } from "vitest";
import { FORMATIONS } from "@/data/formations";
import { SELECTIVITY } from "@/data/selectivity";
import { EXAMPLE_STUDENT_PROFILE } from "@/data/example-profile";
import { computeCompatibility } from "@/lib/matching/engine";
import { admissionRate, selectivityOf, selectivityTier, summarizeSelectivity } from "./selectivity";
import type { AcademicStanding } from "@/types";

const byId = (id: string) => FORMATIONS.find((f) => f.id === id)!;
const withStanding = (academicStanding: AcademicStanding | undefined) => ({ ...EXAMPLE_STUDENT_PROFILE, academicStanding });

describe("données de sélectivité", () => {
  it("chaque formation réelle a une entrée, et aucune entrée ne vise une formation inconnue", () => {
    const ids = FORMATIONS.filter((f) => !f.demo).map((f) => f.id).sort();
    expect(Object.keys(SELECTIVITY).sort()).toEqual(ids);
  });

  it("les chiffres officiels sont cohérents", () => {
    for (const data of Object.values(SELECTIVITY)) {
      if (data.kind === "mon-master") {
        expect(data.offers).toBeLessThanOrEqual(data.candidates);
        expect(data.fromAbroadOffers).toBeLessThanOrEqual(data.fromAbroadCandidates);
        expect(data.fromAbroadCandidates).toBeLessThanOrEqual(data.candidates);
        expect(data.recordIds.length).toBeGreaterThan(0);
      }
      if (data.kind === "parcoursup") {
        expect(data.accessRate).toBeGreaterThanOrEqual(0);
        expect(data.accessRate).toBeLessThanOrEqual(100);
        expect(data.platformUrl).toMatch(/^https:\/\/dossierappel\.parcoursup\.fr\//);
      }
    }
  });

  it("classe la sélectivité à partir des seuls chiffres publiés", () => {
    expect(selectivityTier(selectivityOf("f-mosig-grenoble-inp"))).toBe("très sélective");
    expect(selectivityTier(selectivityOf("f-master-physique-lyon1"))).toBe("accessible");
    expect(selectivityTier(selectivityOf("f-bachelier-droit-ulb"))).toBe("accessible");
    expect(selectivityTier(selectivityOf("f-msc-ai-centralesupelec"))).toBeNull();
    expect(admissionRate(selectivityOf("f-msc-ai-centralesupelec"))).toBeNull();
  });

  it("rappelle aux candidats hors UE que Parcoursup n'est souvent pas leur voie", () => {
    const summary = summarizeSelectivity(selectivityOf("f-licence-info-toulouse"))!;
    expect(summary.details.join(" ")).toContain("Études en France");
  });

  it("n'affiche pas de proportion sur une poignée de candidats venant de l'étranger", () => {
    const summary = summarizeSelectivity(selectivityOf("f-master-chimie-strasbourg"))!;
    expect(summary.details.join(" ")).not.toContain("venant de l'étranger");
  });
});

describe("résultats × sélectivité dans le score", () => {
  it("des résultats modestes pèsent lourd sur une formation très sélective", () => {
    const mosig = byId("f-mosig-grenoble-inp");
    const modest = computeCompatibility(withStanding("Résultats modestes"), mosig).overallScore;
    const good = computeCompatibility(withStanding("Bons résultats"), mosig).overallScore;
    expect(good - modest).toBeGreaterThanOrEqual(15);
  });

  it("et peu sur une formation accessible", () => {
    const lyon = byId("f-master-physique-lyon1");
    const modest = computeCompatibility(withStanding("Résultats modestes"), lyon).overallScore;
    const good = computeCompatibility(withStanding("Bons résultats"), lyon).overallScore;
    expect(good - modest).toBeLessThanOrEqual(5);
  });

  it("un profil sans résultats renseignés n'est ni pénalisé ni avantagé", () => {
    expect(computeCompatibility(withStanding(undefined), byId("f-mosig-grenoble-inp")).selectivityAdjustment).toBeUndefined();
  });

  it("sans sélectivité publiée, aucun ajustement de sélectivité n'est appliqué", () => {
    expect(computeCompatibility(withStanding("Résultats modestes"), byId("f-msc-ai-centralesupelec")).selectivityAdjustment).toBeUndefined();
  });
});
