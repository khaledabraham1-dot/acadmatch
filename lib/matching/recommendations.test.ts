import { describe, expect, it } from "vitest";
import { FORMATIONS } from "@/data/formations";
import { DEFAULT_RECOMMENDATIONS_LIMIT, getRecommendations } from "@/lib/matching/recommendations";
import { computeCompatibility } from "@/lib/matching/engine";
import type { StudentProfile } from "@/types";

/**
 * Phase 9 — recommandations. Ces tests vérifient la composition (tri +
 * raison), pas le scoring lui-même (déjà couvert par gold-set.test.ts et
 * engine.test.ts) : aucun nouveau moteur n'est introduit ici.
 */

const l3InfoVersMaster: StudentProfile = {
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

const but2VersEcole: StudentProfile = {
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

const droitVersMaster: StudentProfile = {
  currentLevel: "Licence 3",
  fieldOfStudy: "Droit",
  currentDegree: "Licence Droit",
  courses: [
    { id: "1", name: "Droit civil" },
    { id: "2", name: "Droit des sociétés" },
  ],
  skills: ["Rédaction juridique"],
  goal: "Doctorat",
  languages: ["Français"],
};

describe("getRecommendations", () => {
  it("retourne DEFAULT_RECOMMENDATIONS_LIMIT résultats, triés par score décroissant à objectif égal", () => {
    const recos = getRecommendations(l3InfoVersMaster, FORMATIONS);
    expect(recos).toHaveLength(DEFAULT_RECOMMENDATIONS_LIMIT);
    for (let i = 1; i < recos.length; i++) {
      const sameGoal = recos[i - 1].formation.goal === recos[i].formation.goal;
      if (sameGoal) {
        expect(recos[i - 1].result.overallScore).toBeGreaterThanOrEqual(recos[i].result.overallScore);
      }
    }
  });

  it("respecte la limite demandée", () => {
    expect(getRecommendations(l3InfoVersMaster, FORMATIONS, 1)).toHaveLength(1);
    expect(getRecommendations(l3InfoVersMaster, FORMATIONS, 0)).toHaveLength(0);
  });

  it("ne recalcule pas un score différent de computeCompatibility (pas de second moteur)", () => {
    const recos = getRecommendations(l3InfoVersMaster, FORMATIONS, 1);
    const [top] = recos;
    const direct = computeCompatibility(l3InfoVersMaster, top.formation);
    expect(top.result.overallScore).toBe(direct.overallScore);
  });

  it("place une formation visant le bon objectif (École spécialisée) devant une Licence générique", () => {
    const recos = getRecommendations(but2VersEcole, FORMATIONS);
    expect(recos[0].formation.id).toBe("f-insa-lyon-info-parallele");
  });

  it("fournit une raison non vide pour chaque recommandation", () => {
    const recos = getRecommendations(l3InfoVersMaster, FORMATIONS);
    for (const reco of recos) {
      expect(reco.reason.length).toBeGreaterThan(0);
    }
  });

  it("LIMITE : objectif non couvert par le catalogue (Doctorat) reste scorable sans crash", () => {
    // Cf. Étape 10 : aucune formation ne vise "Doctorat" — le tri retombe sur le score brut,
    // déjà signalé à l'utilisateur ailleurs par isGoalCoveredByCatalogue/CatalogueScopeNotice.
    const recos = getRecommendations(droitVersMaster, FORMATIONS);
    expect(recos).toHaveLength(DEFAULT_RECOMMENDATIONS_LIMIT);
    for (const reco of recos) {
      expect(reco.result.overallScore).toBeGreaterThanOrEqual(0);
      expect(reco.result.overallScore).toBeLessThanOrEqual(100);
    }
  });

  it("LIMITE : catalogue plus petit que la limite ne renvoie que ce qui existe", () => {
    const [first, second] = FORMATIONS;
    const recos = getRecommendations(l3InfoVersMaster, [first, second], 5);
    expect(recos).toHaveLength(2);
  });
});
