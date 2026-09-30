import { describe, expect, it } from "vitest";
import { FORMATIONS } from "@/data/formations";
import { computeCompatibility, NO_CONTENT_MATCH_CEILING, profileEvidenceCount } from "@/lib/matching/engine";
import { isRecognizedTerm, unrecognizedTerms } from "@/lib/matching/vocabulary";
import { similarity, strengthFromScore } from "@/lib/matching/similarity";
import type { Domain } from "@/data/subjects";
import type { AcademicLevel, StudentProfile, StudyGoal } from "@/types";

/**
 * Tests de confiance (audit du 2026-09-30) : un étudiant qui teste la
 * plateforme avec des profils absurdes doit obtenir des scores bas, et un
 * étudiant réel ne doit pas être pénalisé à tort. Chaque cas vient d'un
 * contournement constaté ou plausible ; en ajouter un à chaque nouvelle faille.
 */
const catalogue = FORMATIONS.filter((f) => !f.demo);

function profile(
  fieldOfStudy: Domain,
  courses: string[],
  skills: string[],
  options: { level?: AcademicLevel; goal?: StudyGoal; languages?: string[] } = {},
): StudentProfile {
  return {
    currentLevel: options.level ?? "Licence 3",
    fieldOfStudy,
    currentDegree: `Licence ${fieldOfStudy}`,
    courses: courses.map((name, i) => ({ id: String(i), name })),
    skills,
    goal: options.goal ?? "Master",
    languages: options.languages ?? ["Français", "Anglais"],
    academicStanding: "Bons résultats",
  };
}

const bestScore = (p: StudentProfile) => Math.max(...catalogue.map((f) => computeCompatibility(p, f).overallScore));

describe("profils absurdes : jamais de score crédible", () => {
  const absurd: [string, StudentProfile][] = [
    ["des noms d'animaux (cas signalé)", profile("Sciences politiques", ["Chat", "Chien", "Lion"], ["Girafe", "Zèbre"], { level: "Licence 2", goal: "Licence" })],
    ["des touches de clavier", profile("Informatique", ["azerty", "qsdfgh", "wxcvbn", "poiuy"], ["mlkjh", "nbvcx"])],
    ["aucune matière, seulement des langues", profile("Informatique", [], [], { languages: ["Français", "Anglais", "Espagnol"] })],
    ["des langues déguisées en compétences", profile("Data Science & IA", [], ["Anglais", "Français", "Arabe", "Espagnol", "Allemand"])],
    ["des mots vides", profile("Informatique", ["le la les", "de des du", "et ou"], ["un une"])],
    ["des mots courants sans rapport", profile("Économie & Gestion", ["Football", "Cuisine", "Voyage", "Musique"], ["Jeux vidéo"])],
  ];

  for (const [label, p] of absurd) {
    it(`${label} : score plafonné à ${NO_CONTENT_MATCH_CEILING} partout`, () => {
      expect(profileEvidenceCount(p)).toBe(0);
      expect(bestScore(p)).toBeLessThanOrEqual(NO_CONTENT_MATCH_CEILING);
    });
  }

  it("une seule vraie compétence répétée sous toutes ses formes ne vaut qu'une preuve", () => {
    const p = profile("Data Science & IA", ["Python", "python", "PYTHON", "Programmation Python"], ["Python", " python "]);
    expect(profileEvidenceCount(p)).toBeLessThanOrEqual(2);
    expect(bestScore(p)).toBeLessThan(50);
  });

  it("noyer deux vraies matières dans des mots inventés ne lève pas le plafond", () => {
    const p = profile("Data Science & IA", ["Machine Learning", "Statistiques", "Blorp", "Zzz", "Truc", "Machin"], ["Bidule", "Chose"]);
    expect(profileEvidenceCount(p)).toBe(2);
    expect(bestScore(p)).toBeLessThan(55);
  });
});

describe("profils réels : jamais pénalisés à tort", () => {
  const real: [string, StudentProfile][] = [
    ["science politique (L2 → licence)", profile("Sciences politiques", ["Introduction à la science politique", "Histoire des idées politiques", "Sociologie politique", "Relations internationales", "Droit constitutionnel"], ["Analyse de documents", "Argumentation"], { level: "Licence 2", goal: "Licence" })],
    ["informatique (L3, intitulés marocains)", profile("Informatique", ["Algorithmique et structures de données", "Programmation Java", "Systèmes d'exploitation", "Réseaux", "Bases de données relationnelles", "Génie logiciel"], ["Java", "SQL", "Linux"])],
    ["économie (L3)", profile("Économie & Gestion", ["Microéconomie", "Macroéconomie", "Statistiques", "Comptabilité générale", "Économétrie"], ["Excel", "Stata"])],
    ["biologie (L3)", profile("Biologie & Santé", ["Biologie cellulaire", "Génétique", "Biochimie", "Microbiologie", "Physiologie animale"], ["PCR", "Culture cellulaire"])],
    ["droit (L3)", profile("Droit", ["Droit des obligations", "Droit des sociétés", "Droit administratif", "Droit européen", "Droit international public"], ["Rédaction juridique", "Recherche documentaire"])],
  ];

  for (const [label, p] of real) {
    it(`${label} : toutes ses matières comptent, et au moins une formation ressort compatible`, () => {
      const items = [...p.courses.map((c) => c.name), ...p.skills];
      expect(unrecognizedTerms(items)).toEqual([]);
      expect(bestScore(p)).toBeGreaterThanOrEqual(75);
    });
  }
});

describe("vocabulaire reconnu", () => {
  it("reconnaît les vraies matières et outils, pas les mots au hasard", () => {
    for (const term of ["Machine Learning", "Droit constitutionnel", "Linux", "Stata", "PCR", "Algèbre linéaire"]) {
      expect(isRecognizedTerm(term)).toBe(true);
    }
    for (const term of ["Girafe", "azerty", "Pizza", "go go go"]) {
      expect(isRecognizedTerm(term)).toBe(false);
    }
  });
});

describe("intitulés qui varient selon l'université et le pays (2026-09-30)", () => {
  const same: [string, string][] = [
    ["Analyse II", "Analyse"],
    ["Probabilités 3", "Probabilités"],
    ["Algo S3", "Algorithmique"],
    ["BDD", "Bases de données"],
    ["SGBD", "Bases de données"],
    ["INF301 - Génie logiciel", "Génie logiciel"],
    ["M1102 : Bases de données", "Bases de données"],
    ["Operating Systems", "Systèmes d'exploitation"],
    ["Databases", "Bases de données"],
    ["Microeconomics I", "Microéconomie"],
    ["Contract Law", "Droit des contrats"],
    ["Cell Biology", "Biologie cellulaire"],
    ["Réseau informatique", "Réseaux informatiques"],
    ["Droit des obligations (S3)", "Droit des obligations"],
    ["Maths 2", "Mathématiques"],
  ];
  for (const [variant, reference] of same) {
    it(`« ${variant} » = « ${reference} »`, () => {
      expect(strengthFromScore(similarity(variant, reference))).toBe("forte");
      expect(isRecognizedTerm(variant)).toBe(true);
    });
  }

  it("ne confond pas des sujets différents à cause de la numérotation", () => {
    expect(strengthFromScore(similarity("Analyse 2", "Analyse financière"))).not.toBe("forte");
    expect(strengthFromScore(similarity("Web 2.0", "Web 3.0"))).not.toBe("forte");
    expect(isRecognizedTerm("Chat 2")).toBe(false);
  });

  it("un relevé marocain codé et numéroté obtient le même score que sa version « propre »", () => {
    const clean = profile("Informatique", ["Algorithmique", "Bases de données", "Systèmes d'exploitation", "Génie logiciel", "Programmation orientée objet"], ["Java", "SQL"]);
    const coded = profile("Informatique", ["Algo S3", "M2104 - BDD", "Systèmes d'exploitation II", "INF301 - Génie logiciel", "POO 2"], ["Java", "SQL"]);
    const mosig = catalogue.find((f) => f.id === "f-mosig-grenoble-inp")!;
    expect(computeCompatibility(coded, mosig).overallScore).toBe(computeCompatibility(clean, mosig).overallScore);
  });
});
