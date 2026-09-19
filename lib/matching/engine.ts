import {
  ACADEMIC_LEVEL_ORDER,
  NEUTRAL_ACADEMIC_STANDING,
  type AcademicItem,
  type AcademicStanding,
  type CompatibilityBreakdown,
  type CompatibilityResult,
  type Formation,
  type Importance,
  type MatchStrength,
  type Requirement,
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
 * Rappel : ce score est une SIMULATION de compatibilité académique entre un
 * profil et le contenu affiché d'une formation. Il ne représente en aucun
 * cas une probabilité d'admission.
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
 * incomplète (voir aussi `requirementWeight` et `STRENGTH_POINTS.partielle`
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

  // Comparaison MOT à mot (jamais caractère à caractère) à partir d'ici :
  // un test `na.includes(nb)` sur les chaînes brutes ferait matcher "R" dans
  // "droit" ou "Git" dans "digitale", par pur hasard de lettres. `tokenize`
  // filtre déjà les mots d'une seule lettre, donc un intitulé comme "R" tombe
  // ici à un ensemble de mots vide et ne matche plus jamais accidentellement.
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.length === 0 || tb.length === 0) return 0;
  const setA = new Set(ta);
  const setB = new Set(tb);
  const intersection = [...setA].filter((token) => setB.has(token)).length;
  const union = new Set([...setA, ...setB]).size;
  const jaccard = union === 0 ? 0 : intersection / union;

  // Un intitulé entièrement contenu, mot pour mot, dans un intitulé plus
  // long est un signal positif : soit une reformulation plus détaillée
  // ("Bases de données" ⊆ "Bases de données médicales"), soit une
  // spécialisation du même thème ("Droit" ⊆ "Droit des sociétés"). On ne
  // le traite comme une correspondance FORTE que si au moins deux mots sont
  // partagés : un seul mot générique en commun ("Analyse" ⊆ "Analyse
  // financière") est un signal réel mais plus faible — la matière commune
  // peut recouvrir des domaines différents — d'où une correspondance
  // partielle plutôt que forte.
  const [smaller, larger] = setA.size <= setB.size ? [setA, setB] : [setB, setA];
  const isFullyContained = smaller.size > 0 && [...smaller].every((token) => larger.has(token));
  if (isFullyContained) {
    return smaller.size >= 2 ? 0.8 : Math.max(jaccard, 0.5);
  }

  return jaccard;
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

/**
 * Toutes les formulations reconnues pour un intitulé (le nom + ses alias
 * explicites, ex: name="Machine Learning", aliases=["Apprentissage
 * automatique"]). Le moteur essaie chaque formulation et garde la meilleure
 * correspondance — cela s'ajoute (sans le remplacer) à la table globale de
 * synonymes utilisée par `similarity` ci-dessus.
 */
function namesOf(item: { name?: string; value?: string; aliases?: string[] }): string[] {
  const base = item.name ?? item.value ?? "";
  return [base, ...(item.aliases ?? [])].filter((name) => name.length > 0);
}

/** Trouve le meilleur élément du profil étudiant pour un ensemble de formulations équivalentes. */
function bestMatch(names: string[], pool: string[]): { item: string | null; strength: MatchStrength } {
  let best = { item: null as string | null, score: 0 };
  for (const candidate of pool) {
    for (const name of names) {
      const score = similarity(name, candidate);
      if (score > best.score) best = { item: candidate, score };
    }
  }
  return { item: best.item, strength: strengthFromScore(best.score) };
}

function levelRank(level: string): number {
  const index = ACADEMIC_LEVEL_ORDER.indexOf(level as (typeof ACADEMIC_LEVEL_ORDER)[number]);
  return index === -1 ? 0 : index;
}

/**
 * Ajustement du score "Niveau / dossier" selon l'auto-évaluation des
 * résultats académiques (`StudentProfile.academicStanding`, Étape 10 —
 * "point 1"). Un jury regarde la qualité du dossier, pas seulement le
 * niveau/domaine — un profil qui liste les mêmes matières qu'un autre mais
 * avec des résultats nettement meilleurs (ou plus faibles) ne devrait pas
 * obtenir exactement le même score.
 *
 * Volontairement modeste et SYMÉTRIQUE, pas un seuil de sélectivité par
 * formation : on ne connaît pas la barre réelle de chaque jury sans
 * l'inventer (interdit par la charte du catalogue), donc l'ajustement reste
 * le même quelle que soit la formation plutôt que de prétendre à une
 * précision qu'on n'a pas. Un profil qui ne renseigne pas ce champ (ancien
 * profil stocké avant son ajout, ou choix de ne pas répondre) reçoit
 * `NEUTRAL_ACADEMIC_STANDING` : aucun ajustement, ni pénalité ni bonus.
 */
const ACADEMIC_STANDING_ADJUSTMENT: Record<AcademicStanding, number> = {
  "Résultats modestes": -12,
  "Résultats dans la moyenne": 0,
  "Bons résultats": 8,
  "Excellents résultats": 15,
};

/**
 * Score "Niveau / dossier" : le niveau actuel de l'étudiant permet-il de
 * candidater, cette formation correspond-elle au diplôme qu'il vise
 * réellement (son "objectif de formation"), et que vaut son dossier ? Une
 * formation de Licence affichée à un étudiant visant un Master n'est pas ce
 * qu'il recherche, même si son niveau actuel le lui permettrait
 * techniquement. On compare directement `formation.goal` à `profile.goal`
 * (et non le `level` de la formation) : `level` décrit le niveau d'ENTRÉE,
 * pas le type de diplôme visé — une école d'ingénieurs en admission
 * parallèle a un niveau d'entrée "Licence 3" mais un objectif "École
 * spécialisée", pas "Licence".
 */
function computeLevelDegreeScore(profile: StudentProfile, formation: Formation): number {
  const diff = levelRank(profile.currentLevel) - levelRank(formation.requiredLevel);
  let base: number;
  if (diff === 0) base = 100;
  else if (diff === 1) base = 90;
  else if (diff >= 2) base = 75;
  else if (diff === -1) base = 55;
  else base = 20;

  const matchesGoal = formation.goal === profile.goal;
  const afterGoal = matchesGoal ? base : Math.max(0, base - 25);

  const standing = profile.academicStanding ?? NEUTRAL_ACADEMIC_STANDING;
  const afterStanding = afterGoal + ACADEMIC_STANDING_ADJUSTMENT[standing];
  return Math.min(100, Math.max(0, afterStanding));
}

// À l'intérieur des prérequis, le niveau et le domaine sont structurants et
// souvent éliminatoires (une mauvaise filière ou un niveau insuffisant
// bloque réellement l'admission), alors qu'un prérequis isolé de matière ou
// de compétence est davantage indicatif. Ils comptent donc double par défaut
// — une formation peut cependant surcharger ce poids via `importance`.
const PREREQUISITE_TYPE_WEIGHT: Record<Requirement["type"], number> = {
  niveau: 2,
  domaine: 2,
  matiere: 1,
  competence: 1,
};

const IMPORTANCE_WEIGHT: Record<Importance, number> = {
  essentielle: 3,
  importante: 2,
  utile: 1,
};

function requirementWeight(requirement: Requirement): number {
  if (requirement.importance) return IMPORTANCE_WEIGHT[requirement.importance];
  return PREREQUISITE_TYPE_WEIGHT[requirement.type] ?? 1;
}

/** L'étudiant est-il à l'aise pour suivre des cours dans la langue d'enseignement de la formation ? */
function computeLanguageStrength(profile: StudentProfile, formation: Formation): MatchStrength {
  const comfortable = profile.languages.some((lang) => normalize(lang) === normalize(formation.language));
  return comfortable ? "forte" : "manquant";
}

/**
 * Score "Prérequis" : chaque exigence d'admission explicite est-elle
 * satisfaite, plus un prérequis implicite — la langue d'enseignement. Une
 * formation à 100% en anglais qu'un étudiant ne maîtrise pas n'est pas
 * réellement suivable, même si tout le reste du profil correspond ; on la
 * traite donc avec le même poids qu'un prérequis de "domaine" (structurant,
 * souvent éliminatoire), pas comme un simple bonus.
 */
function computePrerequisitesScore(profile: StudentProfile, formation: Formation): number {
  let weightedTotal = 0;
  let weightSum = 0;

  const languageWeight = PREREQUISITE_TYPE_WEIGHT.domaine;
  weightedTotal += STRENGTH_POINTS[computeLanguageStrength(profile, formation)] * languageWeight;
  weightSum += languageWeight;

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
        strength = bestMatch(namesOf(requirement), [profile.fieldOfStudy]).strength;
        break;
      case "matiere":
        strength = bestMatch(namesOf(requirement), profile.courses.map((course) => course.name)).strength;
        break;
      case "competence":
        strength = bestMatch(namesOf(requirement), profile.skills).strength;
        break;
      default:
        strength = "manquant";
    }

    const weight = requirementWeight(requirement);
    weightedTotal += STRENGTH_POINTS[strength] * weight;
    weightSum += weight;
  }

  return Math.round(weightedTotal / weightSum);
}

/**
 * Compare une liste de matières/compétences attendues au profil étudiant.
 * Chaque élément pèse selon son `importance` : une matière "essentielle"
 * absente du profil coûte plus cher au score qu'une matière "utile".
 */
function computeContentScore(
  items: AcademicItem[],
  studentPool: string[],
): { score: number; rows: SubjectMatch[] } {
  if (items.length === 0) return { score: 100, rows: [] };

  const rows: SubjectMatch[] = [];
  let weightedTotal = 0;
  let weightSum = 0;

  for (const item of items) {
    const match = bestMatch(namesOf(item), studentPool);
    rows.push({
      studentItem: match.item ?? "—",
      formationRequirement: item.name,
      strength: match.strength,
    });
    const weight = IMPORTANCE_WEIGHT[item.importance] ?? 1;
    weightedTotal += STRENGTH_POINTS[match.strength] * weight;
    weightSum += weight;
  }

  return { score: Math.round(weightedTotal / weightSum), rows };
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

  const content = computeContentScore(formation.coreCourses, studentPool);
  const skills = computeContentScore(formation.skills, studentPool);
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
