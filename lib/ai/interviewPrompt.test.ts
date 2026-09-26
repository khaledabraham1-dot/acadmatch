import { describe, expect, it } from "vitest";
import {
  buildInterviewFeedbackPrompt,
  buildInterviewQuestionsPrompt,
  interviewLanguage,
  MAX_QUESTIONS,
  parseInterviewQuestions,
} from "@/lib/ai/interviewPrompt";
import type { StudentProfile, StudyProgram } from "@/types";

const profile: StudentProfile = {
  currentLevel: "Licence 3",
  fieldOfStudy: "Informatique",
  currentDegree: "Licence Informatique",
  courses: [{ id: "1", name: "Algorithmique" }],
  skills: ["Python"],
  goal: "Master",
  languages: ["Français", "Anglais"],
  experiences: "Stage de 2 mois en développement web",
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
  applicationProcedure: "Sur dossier puis entretien.",
  source: "https://example.fr",
  verifiedAt: "2026-01-01",
  verificationStatus: "vérifiée",
  demo: false,
};

const other: StudyProgram = { ...formation, id: "f-b", name: "Autre Master", institution: { ...formation.institution, name: "Autre Université" } };

let n = 0;
const makeId = () => `q${++n}`;

describe("buildInterviewQuestionsPrompt", () => {
  it("interdit toute invention et fournit profil, expériences, procédure, écarts et projet d'études", () => {
    const { system, user } = buildInterviewQuestionsPrompt(profile, formation, {
      gaps: ["Machine Learning non étudié"],
      otherFormations: [formation, other],
    });
    expect(system).toMatch(/n'inventes JAMAIS/);
    expect(user).toContain("Stage de 2 mois en développement web");
    expect(user).toContain("Sur dossier puis entretien.");
    expect(user).toContain("- Machine Learning non étudié");
    expect(user).toContain("Autre Master");
    // La formation visée n'est pas listée parmi les "autres" formations ciblées.
    expect(user).not.toMatch(/- Master Test/);
  });

  it("ne réclame pas de point de vigilance quand aucun écart n'existe", () => {
    const { system, user } = buildInterviewQuestionsPrompt(profile, formation, { gaps: [], otherFormations: [] });
    expect(user).toContain("Aucun écart identifié");
    expect(system).toMatch(/S'il n'y a aucun écart, n'utilise pas cette catégorie/);
  });

  it("pose les questions dans la langue d'enseignement", () => {
    const english = { ...formation, language: "Anglais" };
    expect(interviewLanguage(english)).toBe("anglais");
    expect(interviewLanguage(formation)).toBe("français");
    expect(buildInterviewQuestionsPrompt(profile, english, { gaps: [], otherFormations: [] }).user).toContain(
      "Langue des questions : anglais",
    );
  });
});

describe("buildInterviewFeedbackPrompt", () => {
  it("interdit de rédiger la réponse à la place de l'étudiant et impose du texte brut", () => {
    const { system, user } = buildInterviewFeedbackPrompt(profile, formation, "Pourquoi nous ?", "Parce que…");
    expect(system).toMatch(/Ne rédige JAMAIS une réponse complète/);
    expect(system).toMatch(/aucun Markdown/);
    expect(user).toContain("Pourquoi nous ?");
    expect(user).toContain("Parce que…");
  });
});

describe("parseInterviewQuestions", () => {
  it("lit un tableau JSON, même entouré d'un bloc de code ou de texte", () => {
    const raw = 'Voici :\n```json\n[{"category":"motivation","question":"Pourquoi ce master ?","intent":"Motivation"}]\n```';
    const questions = parseInterviewQuestions(raw, makeId);
    expect(questions).toHaveLength(1);
    expect(questions[0]).toMatchObject({ category: "motivation", question: "Pourquoi ce master ?", answer: "" });
    expect(questions[0].id).toBeTruthy();
  });

  it("écarte les entrées sans question et normalise une catégorie inconnue", () => {
    const raw = JSON.stringify([
      { category: "motivation", question: "  " },
      { category: "Inconnue", question: "Parlez-moi de vous." },
      { category: " Point de vigilance ", question: "Et le Machine Learning ?" },
      "texte",
    ]);
    const questions = parseInterviewQuestions(raw, makeId);
    expect(questions.map((q) => q.category)).toEqual(["parcours", "point de vigilance"]);
    expect(questions[0].intent).toBe("");
  });

  it("renvoie une liste vide sur une réponse inexploitable", () => {
    expect(parseInterviewQuestions("Désolé, je ne peux pas.", makeId)).toEqual([]);
    expect(parseInterviewQuestions("[not json]", makeId)).toEqual([]);
    expect(parseInterviewQuestions('{"question":"x"}', makeId)).toEqual([]);
  });

  it(`plafonne à ${MAX_QUESTIONS} questions`, () => {
    const raw = JSON.stringify(Array.from({ length: 15 }, (_, i) => ({ category: "projet", question: `Q${i}` })));
    expect(parseInterviewQuestions(raw, makeId)).toHaveLength(MAX_QUESTIONS);
  });
});
