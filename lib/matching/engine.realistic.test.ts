import { describe, expect, it } from "vitest";
import { FORMATIONS } from "@/data/formations";
import { computeCompatibility } from "@/lib/matching/engine";
import { compareFormationsByGoalThenScore } from "@/lib/matching/ranking";
import type { StudentProfile } from "@/types";

/**
 * Validation du moteur sur des profils étudiants réalistes et le vrai
 * catalogue (Étape 4 du roadmap). Contrairement à lib/matching/engine.test.ts
 * (règles unitaires sur des données synthétiques), ces tests documentent le
 * comportement attendu sur des cas concrets rencontrés en testant
 * manuellement le moteur — voir la mémoire projet "acadmatch-roadmap".
 */

function findFormation(id: string) {
  const formation = FORMATIONS.find((f) => f.id === id);
  if (!formation) throw new Error(`Formation de test introuvable : ${id}`);
  return formation;
}

describe("moteur de matching sur le catalogue réel — profils réalistes", () => {
  it("un étudiant en L3 Informatique visant un Master ne voit plus une Licence ressortir devant les Masters pertinents", () => {
    // Cas observé en testant l'Étape 4 : une Licence L1, largement dépassée
    // par le profil, obtenait un meilleur score brut qu'un vrai Master
    // pertinent (voir compareFormationsByGoalThenScore). On vérifie ici le
    // comportement de bout en bout, sur les vraies formations.
    const profile: StudentProfile = {
      currentLevel: "Licence 3",
      fieldOfStudy: "Informatique",
      currentDegree: "Licence Informatique",
      courses: [
        { id: "1", name: "Algorithmique" },
        { id: "2", name: "Bases de données" },
        { id: "3", name: "Programmation orientée objet" },
        { id: "4", name: "Probabilités" },
        { id: "5", name: "Statistiques" },
      ],
      skills: ["Python", "SQL", "Machine Learning"],
      goal: "Master",
      languages: ["Français", "Anglais"],
    };

    const scores = new Map(FORMATIONS.map((f) => [f.id, computeCompatibility(profile, f).overallScore]));
    const sorted = [...FORMATIONS].sort((a, b) =>
      compareFormationsByGoalThenScore(a, b, profile, (f) => scores.get(f.id) ?? -1),
    );

    const firstNonMasterIndex = sorted.findIndex((f) => f.goal !== "Master");
    const lastMasterIndex = sorted.map((f) => f.goal).lastIndexOf("Master");
    expect(firstNonMasterIndex).toBeGreaterThan(lastMasterIndex);
  });

  it("pénalise mesurablement une formation enseignée en anglais quand l'étudiant n'est pas à l'aise en anglais (MSc AI CentraleSupélec)", () => {
    const formation = findFormation("f-msc-ai-centralesupelec");
    expect(formation.language).toBe("Anglais");

    const base: Omit<StudentProfile, "languages"> = {
      currentLevel: "Licence 3",
      fieldOfStudy: "Mathématiques",
      currentDegree: "Licence Mathématiques",
      courses: [
        { id: "1", name: "Analyse" },
        { id: "2", name: "Algèbre linéaire" },
        { id: "3", name: "Probabilités" },
        { id: "4", name: "Statistiques" },
      ],
      skills: ["Rigueur mathématique", "Python"],
      goal: "Master",
    };

    const comfortable = computeCompatibility({ ...base, languages: ["Français", "Anglais"] }, formation);
    const uncomfortable = computeCompatibility({ ...base, languages: ["Français"] }, formation);

    expect(uncomfortable.overallScore).toBeLessThan(comfortable.overallScore);
  });

  it("un étudiant BUT2 visant une admission parallèle (objectif École spécialisée) voit les formations « École spécialisée » devant les Licences", () => {
    // Depuis la phase 4 (extension du catalogue), l'INSA Lyon n'est plus la
    // seule formation à objectif "École spécialisée" (ENSEIRB-MATMECA,
    // Bordeaux INP, a le même objectif) : on ne verrouille donc plus un
    // gagnant précis entre les deux — leur ordre reflète des différences
    // réelles de fiches (ex: "Programmation orientée objet" pondérée
    // différemment) — seulement l'invariant qui compte : aucune Licence ne
    // doit passer devant une formation visant réellement son objectif.
    const profile: StudentProfile = {
      currentLevel: "Licence 2",
      fieldOfStudy: "Informatique",
      currentDegree: "BUT Informatique (2e année)",
      courses: [
        { id: "1", name: "Programmation orientée objet" },
        { id: "2", name: "Bases de données" },
        { id: "3", name: "Réseaux informatiques" },
      ],
      skills: ["Java", "SQL"],
      goal: "École spécialisée",
      languages: ["Français"],
    };

    const scores = new Map(FORMATIONS.map((f) => [f.id, computeCompatibility(profile, f).overallScore]));
    const sorted = [...FORMATIONS].sort((a, b) =>
      compareFormationsByGoalThenScore(a, b, profile, (f) => scores.get(f.id) ?? -1),
    );

    const firstNonSpecialiseIndex = sorted.findIndex((f) => f.goal !== "École spécialisée");
    const lastSpecialiseIndex = sorted.map((f) => f.goal).lastIndexOf("École spécialisée");
    expect(firstNonSpecialiseIndex).toBeGreaterThan(lastSpecialiseIndex);
  });
});
