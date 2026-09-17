import { describe, expect, it } from "vitest";
import { FORMATIONS } from "@/data/formations";
import { EXAMPLE_STUDENT_PROFILE } from "@/data/example-profile";
import { blockingCatalogueIssues } from "@/lib/data/integrity";
import { computeCompatibility } from "@/lib/matching/engine";
import { validateStoredProfile } from "@/lib/profile/validation";

/**
 * Smoke checks MVP public (Étape 9) — vérités produit qui doivent rester vraies
 * pour qu'une personne externe puisse utiliser AcadMatch sans surprise.
 */
describe("MVP public — checklist de confiance", () => {
  it("le catalogue public ne contient aucune fiche démo", () => {
    expect(FORMATIONS.every((f) => f.demo === false)).toBe(true);
    expect(blockingCatalogueIssues(FORMATIONS, new Date("2026-09-17T12:00:00.000Z"))).toEqual([]);
  });

  it("le profil exemple est exploitable et solide", () => {
    const validation = validateStoredProfile(EXAMPLE_STUDENT_PROFILE);
    expect(validation.isSubmittable).toBe(true);
    expect(validation.reliability).toBe("solide");
  });

  it("le profil exemple produit un score valide sur tout le catalogue", () => {
    for (const formation of FORMATIONS) {
      const result = computeCompatibility(EXAMPLE_STUDENT_PROFILE, formation);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    }
  });

  it("le parcours minimal catalogue → résultat est possible (ids stables)", () => {
    expect(FORMATIONS.length).toBeGreaterThanOrEqual(6);
    for (const formation of FORMATIONS) {
      expect(formation.id).toMatch(/^f-/);
      expect(formation.source.startsWith("https://")).toBe(true);
    }
  });
});
