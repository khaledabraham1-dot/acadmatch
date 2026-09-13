import { describe, expect, it } from "vitest";
import { FORMATIONS, getFormationById } from "@/data/formations";
import { computeCompatibility } from "@/lib/matching/engine";
import type { StudentProfile } from "@/types";

/** Vérifications de cohérence sur les données de démonstration (pas de logique métier ici). */
describe("FORMATIONS (données de démonstration)", () => {
  it("contient au moins 15 formations couvrant plusieurs domaines", () => {
    expect(FORMATIONS.length).toBeGreaterThanOrEqual(15);
    const fields = new Set(FORMATIONS.map((f) => f.field));
    expect(fields.size).toBeGreaterThanOrEqual(5);
  });

  it("marque explicitement chaque formation comme donnée de démonstration", () => {
    for (const formation of FORMATIONS) {
      expect(formation.demo).toBe(true);
      expect(formation.id).toBeTruthy();
      expect(formation.coreCourses.length).toBeGreaterThan(0);
      expect(formation.skills.length).toBeGreaterThan(0);
    }
  });

  it("a des ids uniques", () => {
    const ids = FORMATIONS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getFormationById retrouve une formation existante et renvoie undefined sinon", () => {
    const first = FORMATIONS[0];
    expect(getFormationById(first.id)).toBe(first);
    expect(getFormationById("id-inexistant")).toBeUndefined();
  });

  it("le moteur de matching produit un score valide pour chaque formation", () => {
    const profile: StudentProfile = {
      currentLevel: "Licence 3",
      fieldOfStudy: "Informatique",
      currentDegree: "Licence Informatique",
      courses: [{ id: "1", name: "Bases de données" }],
      skills: ["Python"],
      goal: "Master",
    };

    for (const formation of FORMATIONS) {
      const result = computeCompatibility(profile, formation);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.formationId).toBe(formation.id);
    }
  });
});
