import { describe, expect, it } from "vitest";
import { FORMATIONS } from "@/data/formations";
import { EXAMPLE_STUDENT_PROFILE } from "@/data/example-profile";
import { computeCompatibility } from "@/lib/matching/engine";
import { buildDecisionAid } from "@/lib/matching/explanation";
import { buildNextSteps, buildVerdict } from "@/lib/matching/nextSteps";
import type { StudentProfile } from "@/types";

function formation(id: string) {
  const found = FORMATIONS.find((f) => f.id === id);
  if (!found) throw new Error(`Formation introuvable: ${id}`);
  return found;
}

function analyse(profile: StudentProfile, id: string) {
  const f = formation(id);
  const result = computeCompatibility(profile, f);
  return { f, result, aid: buildDecisionAid(profile, f, result) };
}

const thinProfile: StudentProfile = {
  currentLevel: "Licence 3",
  fieldOfStudy: "Informatique",
  currentDegree: "Licence Informatique",
  courses: [{ id: "1", name: "Algorithmique" }],
  skills: [],
  goal: "Master",
  languages: ["Français"],
};

describe("verdict et prochaines actions", () => {
  it("profil trop mince : le verdict le dit et la 1re action ramène à l'étape 2 du profil", () => {
    const { f, result, aid } = analyse(thinProfile, "f-mosig-grenoble-inp");
    expect(result.evidenceCapped).toBe(true);
    expect(buildVerdict(thinProfile, f, result)).toMatch(/provisoire/);
    const steps = buildNextSteps(thinProfile, f, result, aid);
    expect(steps[0].title).toBe("Complétez votre profil");
    expect(steps[0].href).toContain("/profil?etape=2&next=");
  });

  it("profil non évaluable : on corrige les intitulés d'abord", () => {
    const absurd: StudentProfile = { ...thinProfile, courses: [{ id: "1", name: "Girafe" }] };
    const { f, result, aid } = analyse(absurd, "f-mosig-grenoble-inp");
    expect(result.noContentMatch).toBe(true);
    expect(buildVerdict(absurd, f, result)).toMatch(/ne permet pas encore/);
    expect(buildNextSteps(absurd, f, result, aid)[0].title).toMatch(/intitulé/);
  });

  it("langue d'enseignement non indiquée : signalée dans le verdict et les actions", () => {
    const frenchOnly: StudentProfile = { ...EXAMPLE_STUDENT_PROFILE, languages: ["Français"] };
    const { f, result, aid } = analyse(frenchOnly, "f-msc-ai-centralesupelec");
    const steps = buildNextSteps(frenchOnly, f, result, aid);
    expect(steps.some((s) => s.title === "Justifiez votre niveau en Anglais")).toBe(true);
    // Pas de seconde action « Anglais courant » qui redit la même chose.
    expect(buildNextSteps(frenchOnly, f, result, aid, 10).filter((s) => /anglais/i.test(s.title))).toHaveLength(1);
  });

  it("formation sélective sans relevé importé : propose l'import", () => {
    const { f, result, aid } = analyse(EXAMPLE_STUDENT_PROFILE, "f-mosig-grenoble-inp");
    const steps = buildNextSteps(EXAMPLE_STUDENT_PROFILE, f, result, aid, 10);
    expect(steps.some((s) => s.title === "Importez votre relevé de notes")).toBe(true);
  });

  it("jamais plus de 3 actions, et toujours au moins une", () => {
    for (const f of FORMATIONS) {
      for (const profile of [EXAMPLE_STUDENT_PROFILE, thinProfile]) {
        const result = computeCompatibility(profile, f);
        const steps = buildNextSteps(profile, f, result, buildDecisionAid(profile, f, result));
        expect(steps.length).toBeGreaterThan(0);
        expect(steps.length).toBeLessThanOrEqual(3);
        expect(buildVerdict(profile, f, result).length).toBeGreaterThan(0);
      }
    }
  });

  it("une fiche de démonstration ne renvoie jamais vers sa fausse URL", () => {
    for (const f of FORMATIONS.filter((x) => x.demo)) {
      const result = computeCompatibility(EXAMPLE_STUDENT_PROFILE, f);
      const steps = buildNextSteps(EXAMPLE_STUDENT_PROFILE, f, result, buildDecisionAid(EXAMPLE_STUDENT_PROFILE, f, result), 10);
      expect(steps.some((s) => s.external)).toBe(false);
    }
  });
});
