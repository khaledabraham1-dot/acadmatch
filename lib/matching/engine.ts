import {
  ACADEMIC_LEVEL_ORDER,
  type AcademicLevel,
  type CompatibilityBreakdown,
  type CompatibilityResult,
  type Formation,
  type MatchStrength,
  type Requirement,
  type StudentProfile,
  type StudyGoal,
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
 * - Prérequis d'admission ......... 30%
 * - Contenu académique ............ 25%
 * - Compétences .................... 20%
 * - Niveau / diplôme ............... 25%
 *
 * Ces poids favorisent volontairement les éléments *structurants* du profil
 * (niveau, domaine, prérequis obligatoires) par rapport au contenu académique
 * et aux compétences : un étudiant ne liste jamais l'intégralité de son
 * cursus, donc une matière absente de son profil ne veut pas dire qu'il ne la
 * maîtrise pas. Un profil bien aligné sur le niveau et le domaine ne doit
 * donc pas s'effondrer simplement parce que la liste de matières est
 * incomplète (voir aussi `PREREQUISITE_TYPE_WEIGHT` et `STRENGTH_POINTS.partielle`
 * ci-dessous, qui appliquent le même principe à l'intérieur de chaque critère).
 */
export const ENGINE_WEIGHTS: CompatibilityBreakdown = {
  prerequisites: 0.3,
  academicContent: 0.25,
  skills: 0.2,
  levelDegree: 0.25,
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

// Une correspondance partielle reste un signal positif réel (matière proche,
// formulation différente) — elle vaut donc plus qu'une simple moyenne 50/50
// avec l'absence totale de correspondance.
const STRENGTH_POINTS: Record<MatchStrength, number> = {
  forte: 100,
  partielle: 60,
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

/** À quel objectif de formation (Licence/Master/Doctorat) correspond ce niveau ? */
function goalCategoryOf(level: AcademicLevel): StudyGoal | null {
  if (level.startsWith("Licence")) return "Licence";
  if (level.startsWith("Master")) return "Master";
  if (level === "Doctorat") return "Doctorat";
  return null; // ex. "Baccalauréat" : pas comparable à un objectif de formation.
}

/**
 * Score "Niveau / diplôme" : le niveau actuel de l'étudiant permet-il de
 * candidater, et cette formation correspond-elle au diplôme qu'il vise
 * réellement (son "objectif de formation") ? Une formation de Licence
 * affichée à un étudiant visant un Master n'est pas ce qu'il recherche,
 * même si son niveau actuel le lui permettrait techniquement.
 */
function computeLevelDegreeScore(profile: StudentProfile, formation: Formation): number {
  const diff = levelRank(profile.currentLevel) - levelRank(formation.requiredLevel);
  let base: number;
  if (diff === 0) base = 100;
  else if (diff === 1) base = 90;
  else if (diff >= 2) base = 75;
  else if (diff === -1) base = 55;
  else base = 20;

  const formationGoal = goalCategoryOf(formation.level);
  const matchesGoal = formationGoal === null || formationGoal === profile.goal;
  return matchesGoal ? base : Math.max(0, base - 25);
}

// À l'intérieur des prérequis, le niveau et le domaine sont structurants et
// souvent éliminatoires (une mauvaise filière ou un niveau insuffisant
// bloque réellement l'admission), alors qu'un prérequis isolé de matière ou
// de compétence est davantage indicatif. Ils comptent donc double.
const PREREQUISITE_TYPE_WEIGHT: Record<Requirement["type"], number> = {
  niveau: 2,
  domaine: 2,
  matiere: 1,
  competence: 1,
};

/** Score "Prérequis" : chaque exigence d'admission est-elle satisfaite ? */
function computePrerequisitesScore(profile: StudentProfile, formation: Formation): number {
  if (formation.prerequisites.length === 0) return 100;

  let weightedTotal = 0;
  let weightSum = 0;

  for (const requirement of formation.prerequisites) {
    let strength: MatchStrength;
    switch (requirement.type) {
      case "niveau": {
        const diff = levelRank(profile.currentLevel) - levelRank(requirement.value);
        if (diff >= 0) strength = "forte";
        else if (diff === -1) strength = "partielle";
        else strength = "manquant";
        break;
      }
      case "domaine":
        strength = strengthFromScore(similarity(requirement.value, profile.fieldOfStudy));
        break;
      case "matiere":
        strength = bestMatch(requirement.value, profile.courses.map((course) => course.name)).strength;
        break;
      case "competence":
        strength = bestMatch(requirement.value, profile.skills).strength;
        break;
      default:
        strength = "manquant";
    }

    const weight = PREREQUISITE_TYPE_WEIGHT[requirement.type] ?? 1;
    weightedTotal += STRENGTH_POINTS[strength] * weight;
    weightSum += weight;
  }

  return Math.round(weightedTotal / weightSum);
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
