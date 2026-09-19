import { describe, expect, it } from "vitest";
import type { StudentProfile } from "@/types";
import {
  assessGoalLevelCoherence,
  assessProfileReliability,
  safeInternalPath,
  validateProfileDraft,
  validateStoredProfile,
} from "@/lib/profile/validation";

describe("assessGoalLevelCoherence", () => {
  it("alerte un Master déjà diplômé qui vise une Licence", () => {
    expect(assessGoalLevelCoherence("Master 2", "Licence")).toMatch(/Licence/i);
  });

  it("alerte un Bac qui vise un Master", () => {
    expect(assessGoalLevelCoherence("Baccalauréat", "Master")).toMatch(/Licence/i);
  });

  it("alerte un L3 qui vise un Doctorat", () => {
    expect(assessGoalLevelCoherence("Licence 3", "Doctorat")).toMatch(/Master/i);
  });

  it("n'alerte pas un L3 qui vise un Master", () => {
    expect(assessGoalLevelCoherence("Licence 3", "Master")).toBeNull();
  });

  it("n'alerte pas une école spécialisée depuis L2", () => {
    expect(assessGoalLevelCoherence("Licence 2", "École spécialisée")).toBeNull();
  });
});

describe("assessProfileReliability", () => {
  it("marque insuffisant sans matières ni compétences", () => {
    expect(assessProfileReliability({ courses: [], skills: [] }).reliability).toBe("insuffisant");
  });

  it("marque limité avec trop peu de signal", () => {
    expect(
      assessProfileReliability({ courses: ["Algorithmique"], skills: ["Python"] }).reliability,
    ).toBe("limité");
  });

  it("marque solide avec assez de matières et compétences", () => {
    expect(
      assessProfileReliability({
        courses: ["Algorithmique", "Bases de données", "Réseaux"],
        skills: ["Python", "Git"],
      }).reliability,
    ).toBe("solide");
  });
});

describe("validateProfileDraft", () => {
  const base = {
    currentLevel: "Licence 3" as const,
    fieldOfStudy: "Informatique",
    currentDegree: "Licence Informatique",
    courses: ["Algorithmique", "Bases de données", "POO"],
    skills: ["Python", "SQL"],
    goal: "Master" as const,
    languages: ["Français"],
    academicStanding: "Résultats dans la moyenne" as const,
  };

  it("accepte un profil exploitable", () => {
    const result = validateProfileDraft(base);
    expect(result.isSubmittable).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.reliability).toBe("solide");
  });

  it("bloque un profil sans matières ni compétences", () => {
    const result = validateProfileDraft({ ...base, courses: [], skills: [] });
    expect(result.isSubmittable).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("bloque l'absence de langue", () => {
    const result = validateProfileDraft({ ...base, languages: [] });
    expect(result.isSubmittable).toBe(false);
  });

  it("ajoute une alerte (non bloquante) pour un objectif incohérent", () => {
    const result = validateProfileDraft({
      ...base,
      currentLevel: "Baccalauréat",
      goal: "Master",
      courses: ["Mathématiques"],
      skills: [],
    });
    expect(result.isSubmittable).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe("validateStoredProfile", () => {
  it("évalue un profil persisté", () => {
    const profile: StudentProfile = {
      currentLevel: "Licence 3",
      fieldOfStudy: "Informatique",
      currentDegree: "Licence Informatique",
      courses: [{ id: "c1", name: "Algorithmique" }],
      skills: ["Python"],
      goal: "Master",
      languages: ["Français"],
    };
    const result = validateStoredProfile(profile);
    expect(result.reliability).toBe("limité");
    expect(result.isSubmittable).toBe(true);
  });

  it("ne bloque pas un profil enregistré avant l'ajout de academicStanding", () => {
    // Simule un ancien profil localStorage, capturé avant ce champ (Étape 10).
    const legacyProfile = {
      currentLevel: "Licence 3",
      fieldOfStudy: "Informatique",
      currentDegree: "Licence Informatique",
      courses: [{ id: "c1", name: "Algorithmique" }],
      skills: ["Python"],
      goal: "Master",
      languages: ["Français"],
    } as StudentProfile;

    expect(() => validateStoredProfile(legacyProfile)).not.toThrow();
    expect(validateStoredProfile(legacyProfile).isSubmittable).toBe(true);
  });
});

describe("safeInternalPath", () => {
  it("accepte un chemin relatif interne", () => {
    expect(safeInternalPath("/recherche")).toBe("/recherche");
    expect(safeInternalPath("/resultat?formationId=f1")).toBe("/resultat?formationId=f1");
  });

  it("rejette les open redirects", () => {
    expect(safeInternalPath("//evil.com")).toBe("/recherche");
    expect(safeInternalPath("https://evil.com")).toBe("/recherche");
    expect(safeInternalPath("evil.com")).toBe("/recherche");
  });

  it("utilise le fallback si absent", () => {
    expect(safeInternalPath(null)).toBe("/recherche");
    expect(safeInternalPath(null, "/profil")).toBe("/profil");
  });
});
