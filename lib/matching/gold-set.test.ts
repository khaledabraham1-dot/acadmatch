import { describe, expect, it } from "vitest";
import { FORMATIONS } from "@/data/formations";
import { computeCompatibility } from "@/lib/matching/engine";
import { compareFormationsByGoalThenScore } from "@/lib/matching/ranking";
import type { StudentProfile } from "@/types";

/**
 * Gold set Étape 8 — profils annotés "comme un conseiller d'orientation".
 *
 * Chaque cas encode une attente humaine minimale (pas un score exact) :
 * - ce qui doit ressortir en tête ;
 * - ce qui ne doit PAS être recommandé comme premier choix ;
 * - un écart de score mesurable entre un bon et un mauvais match.
 *
 * Objectif : détecter les régressions de ranking / faux positifs avant ouverture publique.
 */

function byId(id: string) {
  const formation = FORMATIONS.find((f) => f.id === id);
  if (!formation) throw new Error(`Formation gold-set introuvable: ${id}`);
  return formation;
}

function ranked(profile: StudentProfile) {
  const scores = new Map(
    FORMATIONS.map((f) => [f.id, computeCompatibility(profile, f).overallScore]),
  );
  const sorted = [...FORMATIONS].sort((a, b) =>
    compareFormationsByGoalThenScore(a, b, profile, (f) => scores.get(f.id) ?? -1),
  );
  return { sorted, scores };
}

describe("gold set orientation — cas positifs / négatifs / limites", () => {
  it("POS : L3 Info solide visant Master → Masters devant Licences/BUT", () => {
    const profile: StudentProfile = {
      currentLevel: "Licence 3",
      fieldOfStudy: "Informatique",
      currentDegree: "Licence Informatique",
      courses: [
        { id: "1", name: "Algorithmique" },
        { id: "2", name: "Bases de données" },
        { id: "3", name: "Programmation orientée objet" },
        { id: "4", name: "Statistiques" },
        { id: "5", name: "Machine Learning" },
      ],
      skills: ["Python", "SQL", "Git"],
      goal: "Master",
      languages: ["Français", "Anglais"],
    };

    const { sorted } = ranked(profile);
    const firstNonMaster = sorted.findIndex((f) => f.goal !== "Master");
    const lastMaster = sorted.map((f) => f.goal).lastIndexOf("Master");
    expect(firstNonMaster).toBeGreaterThan(lastMaster);
  });

  it("NEG : profil Droit / littéraires ne doit pas surclasser un vrai profil Data sur M2DS", () => {
    const m2ds = byId("f-m2ds-ip-paris");

    const dataProfile: StudentProfile = {
      currentLevel: "Master 1",
      fieldOfStudy: "Data Science & IA",
      currentDegree: "Master 1 Data Science",
      courses: [
        { id: "1", name: "Machine Learning" },
        { id: "2", name: "Statistiques" },
        { id: "3", name: "Optimisation" },
        { id: "4", name: "Deep Learning" },
      ],
      skills: ["Python", "Machine Learning", "Statistiques"],
      goal: "Master",
      languages: ["Français", "Anglais"],
    };

    const lawProfile: StudentProfile = {
      currentLevel: "Licence 3",
      fieldOfStudy: "Droit",
      currentDegree: "Licence Droit",
      courses: [
        { id: "1", name: "Droit civil" },
        { id: "2", name: "Droit des sociétés" },
        { id: "3", name: "Droit constitutionnel" },
      ],
      skills: ["Rédaction juridique", "Argumentation"],
      goal: "Master",
      languages: ["Français"],
    };

    const dataScore = computeCompatibility(dataProfile, m2ds).overallScore;
    const lawScore = computeCompatibility(lawProfile, m2ds).overallScore;
    expect(dataScore).toBeGreaterThan(lawScore + 15);
  });

  it("NEG : Bac seul visant Master reste clairement en retrait sur un M2 sélectif", () => {
    const m2ds = byId("f-m2ds-ip-paris");
    const profile: StudentProfile = {
      currentLevel: "Baccalauréat",
      fieldOfStudy: "Informatique",
      currentDegree: "Baccalauréat",
      courses: [{ id: "1", name: "NSI" }],
      skills: ["Python"],
      goal: "Master",
      languages: ["Français"],
    };
    const score = computeCompatibility(profile, m2ds).overallScore;
    expect(score).toBeLessThan(55);
  });

  it("POS : BUT2 / L2 Info visant école → INSA devant une Licence générique", () => {
    const profile: StudentProfile = {
      currentLevel: "Licence 2",
      fieldOfStudy: "Informatique",
      currentDegree: "BUT Informatique",
      courses: [
        { id: "1", name: "Algorithmique" },
        { id: "2", name: "Bases de données" },
        { id: "3", name: "Programmation orientée objet" },
      ],
      skills: ["Java", "SQL"],
      goal: "École spécialisée",
      languages: ["Français"],
    };

    const { sorted, scores } = ranked(profile);
    expect(sorted[0].id).toBe("f-insa-lyon-info-parallele");
    expect(scores.get("f-insa-lyon-info-parallele")!).toBeGreaterThan(
      scores.get("f-licence-info-sorbonne")!,
    );
  });

  it("LIMITE : profil vide de matières reste scorable sans crash (bornes 0–100)", () => {
    const profile: StudentProfile = {
      currentLevel: "Licence 3",
      fieldOfStudy: "Informatique",
      currentDegree: "Licence Informatique",
      courses: [{ id: "1", name: "Algorithmique" }],
      skills: [],
      goal: "Master",
      languages: ["Français"],
    };

    for (const formation of FORMATIONS) {
      const result = computeCompatibility(profile, formation);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(Number.isFinite(result.overallScore)).toBe(true);
    }
  });

  it("LIMITE : formation 100% anglais pénalise un profil sans anglais (écart mesurable)", () => {
    const formation = byId("f-msc-ai-centralesupelec");
    const base = {
      currentLevel: "Licence 3" as const,
      fieldOfStudy: "Mathématiques",
      currentDegree: "Licence Mathématiques",
      courses: [
        { id: "1", name: "Probabilités" },
        { id: "2", name: "Statistiques" },
        { id: "3", name: "Algèbre linéaire" },
      ],
      skills: ["Python"],
      goal: "Master" as const,
    };

    const withEn = computeCompatibility({ ...base, languages: ["Français", "Anglais"] }, formation);
    const withoutEn = computeCompatibility({ ...base, languages: ["Français"] }, formation);
    expect(withoutEn.overallScore).toBeLessThan(withEn.overallScore);
    expect(withEn.overallScore - withoutEn.overallScore).toBeGreaterThanOrEqual(5);
  });
});
