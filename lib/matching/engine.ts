import {
  ACADEMIC_LEVEL_ORDER,
  type CompatibilityBreakdown,
  type CompatibilityResult,
  type Formation,
  type MatchStrength,
  type StudentProfile,
  type SubjectMatch,
} from "@/types";
import { normalize } from "@/lib/utils";
import { areSynonyms } from "@/lib/matching/synonyms";

/**
 * Moteur de scoring déterministe d'AcadMatch.
 *
 * Aucune IA externe n'est utilisée ici : le score est entièrement calculé
 * par des règles explicites, ci-dessous, afin de rester transparent et
 * remplaçable. Ce fichier ne dépend d'aucun composant React — il peut être
 * testé et amélioré indépendamment de l'interface.
 *
 * Pondération du score global (documentée pour rester explicable à l'utilisateur) :
 * - Prérequis d'admission ......... 25%
 * - Contenu académique ............ 35%
 * - Compétences .................... 20%
 * - Niveau / diplôme ............... 20%
 */
export const ENGINE_WEIGHTS: CompatibilityBreakdown = {
  prerequisites: 0.25,
  academicContent: 0.35,
  skills: 0.2,
  levelDegree: 0.2,
};

const STOPWORDS = new Set([
  "de", "des", "du", "la", "le", "les", "et", "en", "pour", "l", "d", "aux",
  "au", "a", "une", "un", "ou", "sur", "avec",
]);

function tokenize(value: string): string[] {
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

/** Similarité entre deux libellés, de 0 (aucun rapport) à 1 (équivalents). */
function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (areSynonyms(na, nb)) return 0.9;
  if (na.includes(nb) || nb.includes(na)) return 0.8;

  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.length === 0 || tb.length === 0) return 0;
  const setA = new Set(ta);
  const setB = new Set(tb);
  const intersection = [...setA].filter((token) => setB.has(token)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function strengthFromScore(score: number): MatchStrength {
  if (score >= 0.6) return "forte";
  if (score >= 0.25) return "partielle";
  return "manquant";
}

const STRENGTH_POINTS: Record<MatchStrength, number> = {
  forte: 100,
  partielle: 50,
  manquant: 0,
};

/** Trouve le meilleur élément du profil étudiant pour une exigence donnée. */
function bestMatch(requirement: string, pool: string[]): { item: string | null; strength: MatchStrength } {
  let best = { item: null as string | null, score: 0 };
  for (const candidate of pool) {
    const score = similarity(requirement, candidate);
    if (score > best.score) best = { item: candidate, score };
  }
  return { item: best.item, strength: strengthFromScore(best.score) };
}

function levelRank(level: string): number {
  const index = ACADEMIC_LEVEL_ORDER.indexOf(level as (typeof ACADEMIC_LEVEL_ORDER)[number]);
  return index === -1 ? 0 : index;
}

/** Score "Niveau / diplôme" : le niveau actuel de l'étudiant permet-il de candidater ? */
function computeLevelDegreeScore(profile: StudentProfile, formation: Formation): number {
  const diff = levelRank(profile.currentLevel) - levelRank(formation.requiredLevel);
  if (diff === 0) return 100;
  if (diff === 1) return 90;
  if (diff >= 2) return 75;
  if (diff === -1) return 55;
  return 20;
}

/** Score "Prérequis" : chaque exigence d'admission est-elle satisfaite ? */
function computePrerequisitesScore(profile: StudentProfile, formation: Formation): number {
  if (formation.prerequisites.length === 0) return 100;

  const strengths = formation.prerequisites.map((requirement): MatchStrength => {
    switch (requirement.type) {
      case "niveau": {
        const diff = levelRank(profile.currentLevel) - levelRank(requirement.value);
        if (diff >= 0) return "forte";
        if (diff === -1) return "partielle";
        return "manquant";
      }
      case "domaine":
        return strengthFromScore(similarity(requirement.value, profile.fieldOfStudy));
      case "matiere":
        return bestMatch(requirement.value, profile.courses.map((course) => course.name)).strength;
      case "competence":
        return bestMatch(requirement.value, profile.skills).strength;
      default:
        return "manquant";
    }
  });

  const total = strengths.reduce((sum, strength) => sum + STRENGTH_POINTS[strength], 0);
  return Math.round(total / strengths.length);
}

/** Compare une liste d'exigences (matières ou compétences) au profil étudiant. */
function computeContentScore(
  requirements: string[],
  studentPool: string[],
): { score: number; rows: SubjectMatch[] } {
  if (requirements.length === 0) return { score: 100, rows: [] };

  const rows: SubjectMatch[] = requirements.map((requirement) => {
    const match = bestMatch(requirement, studentPool);
    return {
      studentItem: match.item ?? "—",
      formationRequirement: requirement,
      strength: match.strength,
    };
  });

  const total = rows.reduce((sum, row) => sum + STRENGTH_POINTS[row.strength], 0);
  return { score: Math.round(total / rows.length), rows };
}

/**
 * Calcule le résultat de compatibilité entre un profil étudiant et une formation.
 * Fonction pure : mêmes entrées → même résultat, sans effet de bord.
 */
export function computeCompatibility(profile: StudentProfile, formation: Formation): CompatibilityResult {
  // Les matières et compétences renseignées forment un même bassin de
  // comparaison : un cours "Machine Learning" peut légitimement démontrer
  // à la fois un contenu académique et une compétence.
  const studentPool = [...profile.courses.map((course) => course.name), ...profile.skills];

  const content = computeContentScore(formation.keySubjects, studentPool);
  const skills = computeContentScore(formation.requiredSkills, studentPool);
  const prerequisites = computePrerequisitesScore(profile, formation);
  const levelDegree = computeLevelDegreeScore(profile, formation);

  const breakdown: CompatibilityBreakdown = {
    prerequisites,
    academicContent: content.score,
    skills: skills.score,
    levelDegree,
  };

  const overallScore = Math.round(
    breakdown.prerequisites * ENGINE_WEIGHTS.prerequisites +
      breakdown.academicContent * ENGINE_WEIGHTS.academicContent +
      breakdown.skills * ENGINE_WEIGHTS.skills +
      breakdown.levelDegree * ENGINE_WEIGHTS.levelDegree,
  );

  // Fusionne les tableaux de correspondance matières + compétences, sans doublons.
  const seen = new Set<string>();
  const matches: SubjectMatch[] = [];
  for (const row of [...content.rows, ...skills.rows]) {
    const key = normalize(row.formationRequirement);
    if (seen.has(key)) continue;
    seen.add(key);
    matches.push(row);
  }

  const strengths = [...new Set(
    matches.filter((row) => row.strength === "forte").map((row) => row.formationRequirement),
  )].slice(0, 6);

  const gaps = [...new Set(
    matches.filter((row) => row.strength === "manquant").map((row) => row.formationRequirement),
  )].slice(0, 6);

  return {
    formationId: formation.id,
    overallScore: Math.min(100, Math.max(0, overallScore)),
    breakdown,
    strengths,
    gaps,
    matches,
  };
}
