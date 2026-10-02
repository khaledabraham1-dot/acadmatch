import { describe, expect, it } from "vitest";
import { canOpenStep, firstBlockingStep, isPathStepComplete, type StepDraft } from "@/lib/profile/steps";

const EMPTY: StepDraft = { fieldOfStudy: "", languages: ["Français"], courses: [], skills: [] };

describe("profil en trois étapes", () => {
  it("l'étape 1 exige un domaine et une langue", () => {
    expect(isPathStepComplete(EMPTY)).toBe(false);
    expect(isPathStepComplete({ ...EMPTY, fieldOfStudy: "Informatique" })).toBe(true);
    expect(isPathStepComplete({ ...EMPTY, fieldOfStudy: "Informatique", languages: [] })).toBe(false);
  });

  it("renvoie l'étape où corriger ce qui bloque", () => {
    expect(firstBlockingStep(EMPTY)).toBe(1);
    expect(firstBlockingStep({ ...EMPTY, fieldOfStudy: "Informatique" })).toBe(2);
    expect(firstBlockingStep({ ...EMPTY, fieldOfStudy: "Informatique", courses: ["  "] })).toBe(2);
    expect(firstBlockingStep({ ...EMPTY, fieldOfStudy: "Informatique", skills: ["Python"] })).toBeNull();
  });

  it("l'étape 3 (optionnelle) ne bloque jamais", () => {
    expect(firstBlockingStep({ ...EMPTY, fieldOfStudy: "Droit", courses: ["Droit civil"] })).toBeNull();
  });

  it("n'ouvre les étapes 2 et 3 qu'une fois le parcours renseigné", () => {
    expect(canOpenStep(1, EMPTY)).toBe(true);
    expect(canOpenStep(2, EMPTY)).toBe(false);
    expect(canOpenStep(3, EMPTY)).toBe(false);
    expect(canOpenStep(3, { ...EMPTY, fieldOfStudy: "Droit" })).toBe(true);
  });
});
