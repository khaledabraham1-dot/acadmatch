import { describe, expect, it } from "vitest";
import { formatProfile, isPromptableProfile, MAX_EXPERIENCES_LENGTH, MAX_PROFILE_JSON_LENGTH } from "@/lib/ai/promptContext";
import type { StudentProfile } from "@/types";

const profile: StudentProfile = {
  currentLevel: "Licence 3",
  fieldOfStudy: "Informatique",
  currentDegree: "Licence Informatique",
  courses: [{ id: "1", name: "Algorithmique" }],
  skills: ["Python"],
  goal: "Master",
  languages: ["Français"],
};

describe("formatProfile", () => {
  it("n'ajoute la ligne d'expériences que si l'étudiant en a déclaré", () => {
    expect(formatProfile(profile)).not.toMatch(/Expériences/);
    expect(formatProfile({ ...profile, experiences: "   " })).not.toMatch(/Expériences/);
    expect(formatProfile({ ...profile, experiences: "Stage chez X" })).toContain("Stage chez X");
  });

  it("tronque des expériences trop longues", () => {
    const text = formatProfile({ ...profile, experiences: "a".repeat(MAX_EXPERIENCES_LENGTH + 500) });
    expect(text).toContain("a".repeat(MAX_EXPERIENCES_LENGTH));
    expect(text).not.toContain("a".repeat(MAX_EXPERIENCES_LENGTH + 1));
  });
});

describe("isPromptableProfile", () => {
  it("accepte un profil bien formé, avec ou sans champs optionnels", () => {
    expect(isPromptableProfile(profile)).toBe(true);
    expect(isPromptableProfile({ ...profile, experiences: "x", academicStanding: "bon" })).toBe(true);
  });

  it("refuse ce que formatProfile ne pourrait pas lire", () => {
    expect(isPromptableProfile(null)).toBe(false);
    expect(isPromptableProfile("profil")).toBe(false);
    expect(isPromptableProfile({ ...profile, courses: undefined })).toBe(false);
    expect(isPromptableProfile({ ...profile, courses: [{ id: "1" }] })).toBe(false);
    expect(isPromptableProfile({ ...profile, skills: [42] })).toBe(false);
    expect(isPromptableProfile({ ...profile, experiences: 12 })).toBe(false);
  });

  it("refuse un profil démesuré (coût du prompt)", () => {
    expect(isPromptableProfile({ ...profile, skills: ["x".repeat(MAX_PROFILE_JSON_LENGTH)] })).toBe(false);
  });
});
