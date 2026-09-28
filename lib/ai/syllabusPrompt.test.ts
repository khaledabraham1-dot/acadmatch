import { describe, expect, it } from "vitest";
import {
  buildSyllabusSystemPrompt,
  buildSyllabusUserInstruction,
  MAX_PROFILE_COURSES,
  MAX_SKILLS_PER_MODULE,
  parseSyllabusExtraction,
  sanitizeProfileCourses,
  skillsFromModules,
} from "@/lib/ai/syllabusPrompt";

const PROFILE = ["Analyse numérique", "Programmation"];

const valid = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    is_syllabus: true,
    modules: [
      {
        name: "Analyse numérique",
        original_name: "Analyse num. (S4)",
        matched_course: "analyse numérique",
        skills: ["Méthodes numériques", "Python", "python"],
        evidence: "Résolution numérique d'EDO, TP en Python.",
      },
      {
        name: "Cryptographie",
        original_name: "Cryptographie (option)",
        matched_course: null,
        skills: ["Cryptographie"],
        evidence: "Chiffrement symétrique et asymétrique.",
      },
    ],
    warnings: [],
    ...overrides,
  });

describe("parseSyllabusExtraction", () => {
  it("normalise une extraction valide et recopie la matière du profil à l'identique", () => {
    const result = parseSyllabusExtraction(valid(), PROFILE);
    expect(result?.modules[0]).toEqual({
      name: "Analyse numérique",
      originalName: "Analyse num. (S4)",
      matchedCourse: "Analyse numérique",
      skills: ["Méthodes numériques", "Python"],
      evidence: "Résolution numérique d'EDO, TP en Python.",
    });
    expect(result?.modules[1].matchedCourse).toBeNull();
  });

  it("refuse un rapprochement vers une matière absente du profil (sinon une option non suivie serait pré-cochée)", () => {
    const raw = valid({
      modules: [{ name: "Cryptographie", original_name: "Crypto", matched_course: "Cryptographie", skills: [], evidence: "" }],
    });
    expect(parseSyllabusExtraction(raw, PROFILE)?.modules[0].matchedCourse).toBeNull();
  });

  it("borne le nombre de compétences par cours et vide la justification d'un cours sans compétence", () => {
    const raw = valid({
      modules: [
        { name: "A", original_name: "A", matched_course: null, skills: ["1", "2", "3", "4", "5", "6", "7", "8"], evidence: "x" },
        { name: "B", original_name: "B", matched_course: null, skills: [], evidence: "texte inventé" },
      ],
    });
    const result = parseSyllabusExtraction(raw, PROFILE)!;
    expect(result.modules[0].skills).toHaveLength(MAX_SKILLS_PER_MODULE);
    expect(result.modules[1].evidence).toBe("");
  });

  it("ne garde aucun cours si le document n'est pas un programme", () => {
    const result = parseSyllabusExtraction(valid({ is_syllabus: false }), PROFILE);
    expect(result?.isSyllabus).toBe(false);
    expect(result?.modules).toEqual([]);
  });

  it("renvoie null sur une réponse inutilisable", () => {
    expect(parseSyllabusExtraction("pas du json", PROFILE)).toBeNull();
    expect(parseSyllabusExtraction(JSON.stringify({ modules: [] }), PROFILE)).toBeNull();
  });
});

describe("sanitizeProfileCourses", () => {
  it("garde les chaînes non vides, sans doublon, dans la limite", () => {
    expect(sanitizeProfileCourses(["Algèbre", " algèbre ", "", 42, "Analyse"])).toEqual(["Algèbre", "Analyse"]);
    expect(sanitizeProfileCourses("Algèbre")).toEqual([]);
    const many = Array.from({ length: 200 }, (_, i) => `Cours ${i}`);
    expect(sanitizeProfileCourses(many)).toHaveLength(MAX_PROFILE_COURSES);
  });
});

describe("skillsFromModules", () => {
  it("fusionne les compétences (casse ignorée) en gardant les cours qui les justifient", () => {
    const modules = parseSyllabusExtraction(
      valid({
        modules: [
          { name: "Analyse numérique", original_name: "x", matched_course: null, skills: ["Python"], evidence: "e" },
          { name: "Programmation", original_name: "y", matched_course: null, skills: ["python", "C"], evidence: "e" },
        ],
      }),
      PROFILE,
    )!.modules;
    expect(skillsFromModules(modules)).toEqual([
      { skill: "Python", from: ["Analyse numérique", "Programmation"] },
      { skill: "C", from: ["Programmation"] },
    ]);
  });
});

describe("prompt", () => {
  it("interdit l'invention et la déduction depuis l'intitulé seul, et transmet les deux vocabulaires", () => {
    const prompt = buildSyllabusSystemPrompt(["Algorithmique"], ["Python"]);
    expect(prompt).toContain("N'invente jamais");
    expect(prompt).toContain("Ne déduis jamais une compétence du seul intitulé");
    expect(prompt).toContain("AUCUNE donnée personnelle");
    expect(prompt).toContain("Algorithmique");
    expect(prompt).toContain("Python");
  });

  it("liste les matières du profil pour le rapprochement, ou le signale si elles manquent", () => {
    expect(buildSyllabusUserInstruction(["Algèbre"])).toContain("- Algèbre");
    expect(buildSyllabusUserInstruction([])).toContain("aucune matière renseignée");
  });
});
