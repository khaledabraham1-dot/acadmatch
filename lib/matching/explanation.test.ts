import { describe, expect, it } from "vitest";
import { FORMATIONS } from "@/data/formations";
import { computeCompatibility } from "@/lib/matching/engine";
import { buildActionPlan, buildDecisionAid } from "@/lib/matching/explanation";
import type { StudentProfile } from "@/types";

function formation(id: string) {
  const found = FORMATIONS.find((f) => f.id === id);
  if (!found) throw new Error(`Formation introuvable: ${id}`);
  return found;
}

const thinProfile: StudentProfile = {
  currentLevel: "Licence 3",
  fieldOfStudy: "Informatique",
  currentDegree: "Licence Informatique",
  courses: [{ id: "1", name: "Algorithmique" }],
  skills: ["Git"],
  goal: "Master",
  languages: ["Français"],
};

describe("buildActionPlan", () => {
  it("priorise les lacunes essentielles avant les utiles", () => {
    const f = formation("f-m2ds-ip-paris");
    const result = computeCompatibility(thinProfile, f);
    const actions = buildActionPlan(f, result, 5);

    expect(actions.length).toBeGreaterThan(0);
    const firstEssential = actions.findIndex((a) => a.importance === "essentielle");
    const firstUtile = actions.findIndex((a) => a.importance === "utile");
    if (firstEssential !== -1 && firstUtile !== -1) {
      expect(firstEssential).toBeLessThan(firstUtile);
    }
  });

  it("limite le plan à 3 actions par défaut", () => {
    const f = formation("f-m2ds-ip-paris");
    const result = computeCompatibility(thinProfile, f);
    expect(buildActionPlan(f, result).length).toBeLessThanOrEqual(3);
  });
});

describe("buildDecisionAid", () => {
  it("signale un écart d'objectif", () => {
    const f = formation("f-licence-info-paris-saclay");
    // Licence alors que l'étudiant vise un Master
    const result = computeCompatibility(thinProfile, f);
    const aid = buildDecisionAid(thinProfile, f, result);
    expect(aid.headline).toMatch(/\d+\/100/);
    expect(aid.paragraphs.some((p) => /objectif/i.test(p))).toBe(true);
    expect(aid.actions).toBeDefined();
  });

  it("signale la langue d'enseignement si absente du profil", () => {
    const f = formation("f-msc-ai-centralesupelec");
    expect(f.language).toBe("Anglais");
    const result = computeCompatibility(thinProfile, f);
    const aid = buildDecisionAid(thinProfile, f, result);
    expect(aid.paragraphs.some((p) => /anglais/i.test(p))).toBe(true);
  });

  it("reste déterministe pour les mêmes entrées", () => {
    const f = formation("f-m2ds-ip-paris");
    const result = computeCompatibility(thinProfile, f);
    const a = buildDecisionAid(thinProfile, f, result);
    const b = buildDecisionAid(thinProfile, f, result);
    expect(a).toEqual(b);
  });
});
