import { describe, expect, it } from "vitest";
import { FORMATIONS } from "@/data/formations";
import { computeCompatibility } from "@/lib/matching/engine";
import type { StudentProfile } from "@/types";

/**
 * Compétences d'entrée sourcées sur Parcoursup et Mon Master (2026-10-03) :
 * on compare un candidat à ce que le jury attend AVANT l'entrée, jamais au
 * contenu de la formation (voir data/formations.ts).
 */

const byId = (id: string) => FORMATIONS.find((f) => f.id === id)!;

const bachelier = (courses: string[]): StudentProfile => ({
  currentLevel: "Baccalauréat",
  fieldOfStudy: "Informatique",
  currentDegree: "Baccalauréat général",
  courses: courses.map((name, i) => ({ id: String(i), name })),
  skills: [],
  goal: "Licence",
  languages: ["Français", "Anglais"],
});

describe("compétences d'entrée des licences (grilles Parcoursup)", () => {
  const sciBac = bachelier(["Mathématiques", "Numérique et sciences informatiques (NSI)", "Physique-chimie"]);

  it("un bachelier maths + NSI n'est jamais « non évaluable » en 1re année d'informatique", () => {
    for (const id of ["f-licence-info-sorbonne", "f-licence-info-paris-saclay", "f-but-info-nantes", "f-licence-info-toulouse"]) {
      const result = computeCompatibility(sciBac, byId(id));
      expect(result.noContentMatch, id).toBeFalsy();
      expect(result.breakdown.skills, id).toBeGreaterThanOrEqual(80);
    }
  });

  it("aucune licence n'exige à l'entrée une matière enseignée en 1re année (algorithmique, SQL, rédaction juridique)", () => {
    const taughtInL1 = ["Algorithmique", "SQL", "Rédaction juridique", "Python"];
    for (const f of FORMATIONS.filter((x) => x.requiredLevel === "Baccalauréat" && !x.demo)) {
      const required = f.skills.filter((s) => s.importance !== "utile").map((s) => s.name);
      for (const name of taughtInL1) expect(required, f.id).not.toContain(name);
    }
  });
});

describe("compétences d'entrée des masters (attendus Mon Master)", () => {
  it("un physicien de L3 aux bases demandées par Lyon 1 est reconnu sur toutes les compétences", () => {
    const physicien: StudentProfile = {
      currentLevel: "Licence 3",
      fieldOfStudy: "Physique",
      currentDegree: "Licence de physique",
      courses: ["Mécanique quantique", "Électromagnétisme", "Physique statistique", "Physique expérimentale"].map((name, i) => ({ id: String(i), name })),
      skills: [],
      goal: "Master",
      languages: ["Français", "Anglais"],
    };
    expect(computeCompatibility(physicien, byId("f-master-physique-lyon1")).breakdown.skills).toBeGreaterThanOrEqual(90);
  });

  it("Bio-informatique Bordeaux reste ouvert aux biologistes sans informatique", () => {
    const skills = byId("f-master-bioinformatique-bordeaux").skills.map((s) => s.name);
    expect(skills).not.toContain("Python");
    expect(skills).toContain("Biologie");
  });
});
