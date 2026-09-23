import { describe, expect, it } from "vitest";
import { buildMotivationLetterPrompt } from "@/lib/ai/motivationLetterPrompt";
import type { StudentProfile, StudyProgram } from "@/types";

const profile: StudentProfile = {
  currentLevel: "Licence 3",
  fieldOfStudy: "Informatique",
  currentDegree: "Licence Informatique",
  courses: [{ id: "1", name: "Algorithmique" }],
  skills: ["Python"],
  goal: "Master",
  languages: ["Français", "Anglais"],
};

const formation: StudyProgram = {
  id: "f-a",
  name: "Master Test",
  institution: { name: "Université Test", city: "Paris", country: "France" },
  level: "Master 1",
  goal: "Master",
  field: "Informatique",
  description: "Un master de data science.",
  prerequisites: [{ id: "r1", type: "niveau", value: "Licence 3", label: "Licence 3 validée" }],
  coreCourses: [{ id: "c1", name: "Machine Learning", importance: "essentielle", category: "matiere" }],
  skills: [],
  requiredLevel: "Licence 3",
  language: "Français",
  applicationProcedure: "Test",
  source: "https://example.fr",
  verifiedAt: "2026-01-01",
  verificationStatus: "vérifiée",
  demo: false,
};

describe("buildMotivationLetterPrompt", () => {
  it("interdit explicitement d'inventer une expérience/compétence/diplôme/résultat", () => {
    const { system } = buildMotivationLetterPrompt(profile, formation);
    expect(system).toMatch(/n'inventes JAMAIS/i);
    expect(system).toMatch(/expérience/i);
    expect(system).toMatch(/compétence/i);
    expect(system).toMatch(/diplôme/i);
    expect(system).toMatch(/résultat/i);
  });

  it("rappelle explicitement que le texte produit reste un brouillon éditable", () => {
    const { system } = buildMotivationLetterPrompt(profile, formation);
    expect(system).toMatch(/BROUILLON/);
  });

  it("inclut les faits du profil fourni, rien d'autre inventé côté prompt", () => {
    const { user } = buildMotivationLetterPrompt(profile, formation);
    expect(user).toContain("Licence 3");
    expect(user).toContain("Informatique");
    expect(user).toContain("Algorithmique");
    expect(user).toContain("Python");
    expect(user).toContain("Français, Anglais");
  });

  it("inclut les faits de la formation fournie", () => {
    const { user } = buildMotivationLetterPrompt(profile, formation);
    expect(user).toContain("Master Test");
    expect(user).toContain("Université Test");
    expect(user).toContain("Un master de data science.");
    expect(user).toContain("Machine Learning");
    expect(user).toContain("Licence 3 validée");
  });

  it("rappelle la contrainte anti-invention aussi dans le message utilisateur", () => {
    const { user } = buildMotivationLetterPrompt(profile, formation);
    expect(user).toMatch(/N'invente aucune/);
  });

  it("omet proprement les sections vides (aucune matière/compétence renseignée)", () => {
    const emptyProfile: StudentProfile = { ...profile, courses: [], skills: [] };
    const { user } = buildMotivationLetterPrompt(emptyProfile, formation);
    expect(user).not.toContain("Matières suivies");
    expect(user).not.toContain("Compétences :");
  });
});
