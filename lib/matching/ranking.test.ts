import { describe, expect, it } from "vitest";
import { compareFormationsByGoalThenScore } from "@/lib/matching/ranking";
import type { Formation, StudentProfile } from "@/types";

function formation(overrides: Partial<Formation> = {}): Formation {
  return {
    id: "f",
    name: "Formation",
    institution: "Établissement",
    city: "Paris",
    level: "Master 1",
    goal: "Master",
    field: "Informatique",
    description: "",
    prerequisites: [],
    coreCourses: [],
    skills: [],
    requiredLevel: "Licence 3",
    language: "Français",
    source: "https://demo.acadmatch.fr/f",
    demo: true,
    ...overrides,
  } as Formation;
}

function profile(overrides: Partial<StudentProfile> = {}): StudentProfile {
  return {
    currentLevel: "Licence 3",
    fieldOfStudy: "Informatique",
    currentDegree: "Licence Informatique",
    courses: [],
    skills: [],
    goal: "Master",
    languages: ["Français"],
    ...overrides,
  };
}

describe("compareFormationsByGoalThenScore", () => {
  it("classe une formation hors objectif après une formation dans l'objectif, même avec un score plus bas", () => {
    // Reproduit le cas observé en Étape 4 : une Licence, largement dépassée
    // par l'étudiant, obtient un meilleur score qu'un Master pertinent — le
    // tri doit quand même remonter le Master en premier.
    const wrongGoalButHighScore = formation({ id: "licence", goal: "Licence" });
    const rightGoalButLowerScore = formation({ id: "master", goal: "Master" });
    const scores = new Map([
      ["licence", 90],
      ["master", 60],
    ]);
    const scoreOf = (f: Formation) => scores.get(f.id) ?? -1;

    const sorted = [wrongGoalButHighScore, rightGoalButLowerScore].sort((a, b) =>
      compareFormationsByGoalThenScore(a, b, profile({ goal: "Master" }), scoreOf),
    );

    expect(sorted.map((f) => f.id)).toEqual(["master", "licence"]);
  });

  it("trie par score décroissant à l'intérieur d'un même groupe d'objectif", () => {
    const low = formation({ id: "low", goal: "Master" });
    const high = formation({ id: "high", goal: "Master" });
    const scores = new Map([
      ["low", 40],
      ["high", 85],
    ]);
    const scoreOf = (f: Formation) => scores.get(f.id) ?? -1;

    const sorted = [low, high].sort((a, b) =>
      compareFormationsByGoalThenScore(a, b, profile({ goal: "Master" }), scoreOf),
    );

    expect(sorted.map((f) => f.id)).toEqual(["high", "low"]);
  });

  it("retombe sur un simple tri par score quand aucun profil n'est renseigné", () => {
    const a = formation({ id: "a", goal: "Licence" });
    const b = formation({ id: "b", goal: "Master" });
    const scores = new Map([
      ["a", 90],
      ["b", 60],
    ]);
    const scoreOf = (f: Formation) => scores.get(f.id) ?? -1;

    const sorted = [a, b].sort((x, y) => compareFormationsByGoalThenScore(x, y, null, scoreOf));

    expect(sorted.map((f) => f.id)).toEqual(["a", "b"]);
  });
});
