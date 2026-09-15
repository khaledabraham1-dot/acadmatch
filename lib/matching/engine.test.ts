import { describe, expect, it } from "vitest";
import { computeCompatibility } from "@/lib/matching/engine";
import type { AcademicItem, Formation, Importance, Requirement, StudentProfile } from "@/types";

/**
 * Tests du moteur de matching (lib/matching/engine.ts).
 *
 * Le moteur est déterministe et basé sur des règles + alias/synonymes — pas
 * d'IA. Ces tests vérifient les 5 scénarios demandés :
 * 1. profil très compatible
 * 2. profil partiellement compatible
 * 3. profil clairement incompatible
 * 4. correspondances avec synonymes/alias (y compris inter-langues)
 * 5. absence de matières/compétences dans le profil
 */

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function course(name: string, importance: Importance = "essentielle", aliases?: string[]): AcademicItem {
  return { id: nextId("c"), name, importance, category: "matiere", ...(aliases ? { aliases } : {}) };
}

function skill(name: string, importance: Importance = "essentielle", aliases?: string[]): AcademicItem {
  return { id: nextId("s"), name, importance, category: "competence", ...(aliases ? { aliases } : {}) };
}

function requirement(partial: Omit<Requirement, "id" | "label"> & { label?: string }): Requirement {
  return { id: nextId("r"), label: partial.label ?? partial.value, ...partial };
}

/** Formation de test avec des valeurs par défaut raisonnables, surchargeables par cas de test. */
function makeFormation(overrides: Partial<Formation> = {}): Formation {
  return {
    id: "f-test",
    name: "Formation de test",
    institution: "Université fictive",
    city: "Paris",
    level: "Master 1",
    goal: "Master",
    field: "Informatique",
    description: "Formation de démonstration utilisée uniquement pour les tests.",
    requiredLevel: "Licence 3",
    language: "Français",
    prerequisites: [
      requirement({ type: "niveau", value: "Licence 3" }),
      requirement({ type: "domaine", value: "Informatique" }),
    ],
    coreCourses: [course("Machine Learning"), course("Statistiques"), course("Bases de données", "importante")],
    skills: [skill("Python"), skill("SQL", "importante")],
    source: "https://demo.acadmatch.fr/formations/test",
    demo: true,
    ...overrides,
    // `Partial<Formation>` sur une union discriminée élargit `demo` en
    // `boolean` : ce cast ne concerne que ce helper de test, pas les
    // données réelles (voir types/index.ts — DemoFormation/VerifiedFormation).
  } as Formation;
}

function makeProfile(overrides: Partial<StudentProfile> = {}): StudentProfile {
  return {
    currentLevel: "Master 1",
    fieldOfStudy: "Informatique",
    currentDegree: "Licence Informatique",
    courses: [],
    skills: [],
    goal: "Master",
    languages: ["Français"],
    ...overrides,
  };
}

describe("computeCompatibility", () => {
  it("1. donne un score élevé pour un profil très compatible", () => {
    const formation = makeFormation();
    const profile = makeProfile({
      currentLevel: "Master 1",
      fieldOfStudy: "Informatique",
      goal: "Master",
      courses: [
        { id: "1", name: "Machine Learning" },
        { id: "2", name: "Statistiques" },
        { id: "3", name: "Bases de données" },
      ],
      skills: ["Python", "SQL"],
    });

    const result = computeCompatibility(profile, formation);

    expect(result.overallScore).toBeGreaterThanOrEqual(85);
    expect(result.breakdown.prerequisites).toBeGreaterThanOrEqual(90);
    expect(result.breakdown.academicContent).toBe(100);
    expect(result.breakdown.skills).toBe(100);
    expect(result.gaps).toHaveLength(0);
    expect(result.strengths).toEqual(
      expect.arrayContaining(["Machine Learning", "Statistiques", "Bases de données"]),
    );
  });

  it("2. donne un score intermédiaire pour un profil partiellement compatible", () => {
    const formation = makeFormation();
    // Niveau/domaine/objectif corrects, mais seule une partie des matières/compétences correspond.
    const profile = makeProfile({
      currentLevel: "Licence 3",
      fieldOfStudy: "Informatique",
      goal: "Master",
      courses: [{ id: "1", name: "Statistiques" }],
      skills: ["Python"],
    });

    const result = computeCompatibility(profile, formation);

    expect(result.overallScore).toBeGreaterThan(35);
    expect(result.overallScore).toBeLessThan(85);
    expect(result.strengths).toContain("Statistiques");
    expect(result.gaps).toEqual(expect.arrayContaining(["Machine Learning", "Bases de données"]));
  });

  it("3. donne un score bas pour un profil clairement incompatible", () => {
    const formation = makeFormation({
      field: "Informatique",
      requiredLevel: "Licence 3",
      level: "Master 1",
    });
    const profile = makeProfile({
      currentLevel: "Baccalauréat",
      fieldOfStudy: "Droit",
      goal: "Licence",
      courses: [{ id: "1", name: "Droit des contrats" }],
      skills: ["Rédaction juridique"],
    });

    const result = computeCompatibility(profile, formation);

    expect(result.overallScore).toBeLessThan(30);
    expect(result.strengths).toHaveLength(0);
  });

  it("4. reconnaît les correspondances par synonymes/alias, y compris inter-langues", () => {
    const formation = makeFormation({
      language: "Anglais",
      coreCourses: [
        course("Database Systems", "essentielle", ["Base de données"]),
        course("Probability", "essentielle", ["Probabilités"]),
        course("Statistical Methods", "essentielle", ["Statistiques"]),
        course("Machine Learning", "importante"), // reconnu via la table de synonymes globale
      ],
      skills: [skill("Python")],
    });
    const profile = makeProfile({
      courses: [
        { id: "1", name: "Base de données" },
        { id: "2", name: "Probabilités" },
        { id: "3", name: "Statistiques" },
        { id: "4", name: "Apprentissage automatique" },
      ],
      skills: ["Python"],
    });

    const result = computeCompatibility(profile, formation);

    const strengthOf = (name: string) => result.matches.find((m) => m.formationRequirement === name)?.strength;
    expect(strengthOf("Database Systems")).toBe("forte");
    expect(strengthOf("Probability")).toBe("forte");
    expect(strengthOf("Statistical Methods")).toBe("forte");
    expect(strengthOf("Machine Learning")).toBe("forte");
    expect(result.gaps).toHaveLength(0);
  });

  it("reproduit l'exemple du brief : Statistiques/Probabilités/Python en forte correspondance, ML/Optimisation manquants", () => {
    const formation = makeFormation({
      coreCourses: [
        course("Statistiques"),
        course("Probabilités"),
        course("Python"),
        course("Machine Learning"),
        course("Optimisation"),
      ],
      skills: [],
    });
    const profile = makeProfile({
      courses: [
        { id: "1", name: "Statistiques" },
        { id: "2", name: "Probabilités" },
        { id: "3", name: "Python" },
        { id: "4", name: "Bases de données" },
      ],
      skills: [],
    });

    const result = computeCompatibility(profile, formation);

    expect(result.strengths).toEqual(expect.arrayContaining(["Statistiques", "Probabilités", "Python"]));
    expect(result.gaps).toEqual(expect.arrayContaining(["Machine Learning", "Optimisation"]));
  });

  it("ne fait pas correspondre un mot d'une lettre par simple hasard de caractères (ex: \"R\" dans \"droit\")", () => {
    const formation = makeFormation({
      coreCourses: [course("Droit des contrats"), course("Architecture logicielle")],
      skills: [skill("R")],
    });
    const profile = makeProfile({
      courses: [{ id: "1", name: "Droit des contrats" }],
      skills: ["Rédaction juridique"],
    });

    const result = computeCompatibility(profile, formation);

    const rMatch = result.matches.find((m) => m.formationRequirement === "R");
    expect(rMatch?.strength).toBe("manquant");
  });

  it("ne fait pas correspondre un mot par simple sous-chaîne de caractères (ex: \"Git\" dans \"digitale\")", () => {
    const formation = makeFormation({
      coreCourses: [course("Transformation digitale")],
      skills: [skill("Git")],
    });
    const profile = makeProfile({ courses: [], skills: ["Marketing digital"] });

    const result = computeCompatibility(profile, formation);

    const gitMatch = result.matches.find((m) => m.formationRequirement === "Git");
    expect(gitMatch?.strength).toBe("manquant");
  });

  it("dégrade en correspondance PARTIELLE (pas forte) un seul mot générique partagé entre deux matières différentes", () => {
    // "Analyse" est un mot trop générique pour prouver, à lui seul, une
    // maîtrise de l'analyse financière ou de l'analyse de données.
    const formation = makeFormation({ coreCourses: [course("Analyse financière")], skills: [] });
    const profile = makeProfile({ courses: [{ id: "1", name: "Analyse de données" }], skills: [] });

    const result = computeCompatibility(profile, formation);

    expect(result.matches[0].strength).toBe("partielle");
  });

  it("5. reste stable et explicable quand le profil ne renseigne aucune matière/compétence", () => {
    const formation = makeFormation();
    const profile = makeProfile({ courses: [], skills: [] });

    const result = computeCompatibility(profile, formation);

    expect(Number.isFinite(result.overallScore)).toBe(true);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.breakdown.academicContent).toBe(0);
    expect(result.breakdown.skills).toBe(0);
    expect(result.strengths).toHaveLength(0);
    expect(result.matches.every((m) => m.strength === "manquant" && m.studentItem === "—")).toBe(true);
    expect(result.gaps.length).toBeGreaterThan(0);
    // Le niveau/domaine restent, eux, corrects : ce critère ne doit pas s'effondrer.
    expect(result.breakdown.levelDegree).toBeGreaterThan(0);
  });

  it("compare l'objectif au `goal` de la formation, pas à son niveau d'entrée (ex: école d'ingénieurs en admission parallèle)", () => {
    // Une formation "grande école" en admission parallèle a un niveau
    // d'entrée Licence 3 mais un objectif "École spécialisée" : un étudiant
    // qui vise justement ça ne doit pas être pénalisé comme si la formation
    // était une simple Licence (voir computeLevelDegreeScore).
    const formation = makeFormation({ requiredLevel: "Licence 2", level: "Licence 3", goal: "École spécialisée" });
    const matchingGoal = makeProfile({ currentLevel: "Licence 2", goal: "École spécialisée" });
    const mismatchedGoal = makeProfile({ currentLevel: "Licence 2", goal: "Licence" });

    expect(computeCompatibility(matchingGoal, formation).breakdown.levelDegree).toBe(100);
    expect(computeCompatibility(mismatchedGoal, formation).breakdown.levelDegree).toBe(75);
  });

  it("pénalise le score de prérequis quand l'étudiant n'est pas à l'aise dans la langue d'enseignement", () => {
    const formation = makeFormation({ language: "Anglais" });
    const comfortable = makeProfile({ languages: ["Français", "Anglais"] });
    const uncomfortable = makeProfile({ languages: ["Français"] });

    expect(computeCompatibility(comfortable, formation).breakdown.prerequisites).toBe(100);
    expect(computeCompatibility(uncomfortable, formation).breakdown.prerequisites).toBe(67);
  });
});
