import { describe, expect, it } from "vitest";
import {
  ALL_CITIES,
  ALL_DOMAINS,
  ALL_LANGUAGES,
  ALL_LEVELS,
  EMPTY_FILTERS,
  filterFormations,
  isGoalCoveredByCatalogue,
  matchesFilters,
  uniqueSorted,
} from "@/lib/search/filters";
import type { Formation } from "@/types";

function formation(overrides: Partial<Formation> = {}): Formation {
  return {
    id: "f",
    name: "Master Data Science",
    institution: "Université Exemple",
    city: "Paris",
    level: "Master 1",
    goal: "Master",
    field: "Data Science & IA",
    description: "",
    prerequisites: [],
    coreCourses: [],
    skills: [],
    requiredLevel: "Licence 3",
    language: "Français",
    applicationProcedure: "Dossier en ligne — formation de test.",
    source: "https://demo.acadmatch.fr/f",
    demo: true,
    ...overrides,
  } as Formation;
}

describe("matchesFilters", () => {
  it("ne filtre rien quand tous les critères sont à leur valeur par défaut", () => {
    expect(matchesFilters(formation(), EMPTY_FILTERS)).toBe(true);
  });

  it("filtre par texte sur le nom, l'établissement ou le domaine, insensible à la casse/accents", () => {
    const f = formation({ name: "Master Intelligence Artificielle", institution: "École Élite" });
    expect(matchesFilters(f, { ...EMPTY_FILTERS, query: "ecole elite" })).toBe(true);
    expect(matchesFilters(f, { ...EMPTY_FILTERS, query: "INTELLIGENCE" })).toBe(true);
    expect(matchesFilters(f, { ...EMPTY_FILTERS, query: "droit" })).toBe(false);
  });

  it("filtre par niveau, domaine, ville et langue indépendamment", () => {
    const f = formation({ level: "Master 2", field: "Informatique", city: "Lyon", language: "Anglais" });
    expect(matchesFilters(f, { ...EMPTY_FILTERS, level: "Master 2" })).toBe(true);
    expect(matchesFilters(f, { ...EMPTY_FILTERS, level: "Licence 3" })).toBe(false);
    expect(matchesFilters(f, { ...EMPTY_FILTERS, domain: "Informatique" })).toBe(true);
    expect(matchesFilters(f, { ...EMPTY_FILTERS, domain: "Droit" })).toBe(false);
    expect(matchesFilters(f, { ...EMPTY_FILTERS, city: "Lyon" })).toBe(true);
    expect(matchesFilters(f, { ...EMPTY_FILTERS, city: "Paris" })).toBe(false);
    expect(matchesFilters(f, { ...EMPTY_FILTERS, language: "Anglais" })).toBe(true);
    expect(matchesFilters(f, { ...EMPTY_FILTERS, language: "Français" })).toBe(false);
  });

  it("combine tous les filtres avec un ET logique", () => {
    const f = formation({ level: "Master 2", field: "Informatique", city: "Lyon", language: "Anglais" });
    const allMatch = { level: "Master 2", domain: "Informatique", city: "Lyon", language: "Anglais", query: "" };
    expect(matchesFilters(f, allMatch)).toBe(true);
    // Un seul critère qui ne correspond plus suffit à exclure la formation.
    expect(matchesFilters(f, { ...allMatch, city: "Paris" })).toBe(false);
  });

  it("un objet ALL_* sert de sentinelle 'aucun filtre', jamais une vraie valeur de formation", () => {
    // Garde-fou : si une formation avait un jour un champ littéralement égal à
    // ces libellés, elle ne doit pas se retrouver filtrée par erreur.
    expect(ALL_LEVELS).not.toBe("");
    expect(ALL_DOMAINS).not.toBe("");
    expect(ALL_CITIES).not.toBe("");
    expect(ALL_LANGUAGES).not.toBe("");
  });
});

describe("filterFormations", () => {
  it("ne retourne que les formations correspondant à tous les filtres", () => {
    const paris = formation({ id: "paris", city: "Paris" });
    const lyon = formation({ id: "lyon", city: "Lyon" });
    const result = filterFormations([paris, lyon], { ...EMPTY_FILTERS, city: "Lyon" });
    expect(result.map((f) => f.id)).toEqual(["lyon"]);
  });

  it("retourne un tableau vide sans erreur quand aucune formation ne correspond", () => {
    const result = filterFormations([formation()], { ...EMPTY_FILTERS, city: "Marseille" });
    expect(result).toEqual([]);
  });
});

describe("uniqueSorted", () => {
  it("dédoublonne et trie les valeurs d'un champ, pour peupler les options d'un filtre", () => {
    const formations = [
      formation({ id: "1", city: "Nantes" }),
      formation({ id: "2", city: "Lyon" }),
      formation({ id: "3", city: "Nantes" }),
    ];
    expect(uniqueSorted(formations, (f) => f.city)).toEqual(["Lyon", "Nantes"]);
  });
});

describe("isGoalCoveredByCatalogue", () => {
  const formations = [formation({ goal: "Master" })];

  it("est vrai quand une formation vise cet objectif", () => {
    expect(isGoalCoveredByCatalogue(formations, "Master")).toBe(true);
  });

  it("est faux quand aucune formation ne vise cet objectif (ex: Doctorat, absent du catalogue actuel)", () => {
    expect(isGoalCoveredByCatalogue(formations, "Doctorat")).toBe(false);
  });

  it("reste vrai sans objectif renseigné (rien à signaler avant que l'utilisateur choisisse)", () => {
    expect(isGoalCoveredByCatalogue(formations, null)).toBe(true);
    expect(isGoalCoveredByCatalogue(formations, undefined)).toBe(true);
  });
});
