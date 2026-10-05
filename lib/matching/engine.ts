import {
  ACADEMIC_LEVEL_ORDER,
  NEUTRAL_ACADEMIC_STANDING,
  type AcademicItem,
  type AcademicStanding,
  type CompatibilityBreakdown,
  type CompatibilityResult,
  type Importance,
  type MatchStrength,
  type Requirement,
  type StudentProfile,
  type StudyProgram,
  type SubjectMatch,
} from "@/types";
import { RECOMMENDED_COURSES, RECOMMENDED_SKILLS } from "@/lib/profile/validation";
import { selectivityOf, selectivityTier, type SelectivityTier } from "@/lib/selectivity";
import { effectiveStanding } from "@/lib/profile/grades";
import { normalize } from "@/lib/utils";
import { similarity, strengthFromScore } from "@/lib/matching/similarity";
import { isLanguageTerm, isRecognizedTerm } from "@/lib/matching/vocabulary";
import { domainEquivalents } from "@/data/subjects";

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

// Une correspondance partielle reste un signal positif réel (matière proche,
// formulation différente) — elle vaut donc plus qu'une simple moyenne 50/50
// avec l'absence totale de correspondance.
export const STRENGTH_POINTS: Record<MatchStrength, number> = {
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
export const ACADEMIC_STANDING_ADJUSTMENT: Record<AcademicStanding, number> = {
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
/**
 * Résultats académiques × sélectivité officielle (2026-09-30). Quand la
 * sélectivité d'une formation est publiée (Mon Master, Parcoursup, accès
 * ouvert belge — lib/selectivity.ts), le niveau de résultats pèse sur le
 * score GLOBAL, d'autant plus que la formation est sélective : des résultats
 * modestes ne ferment pas une formation accessible, mais pèsent lourd face à
 * une formation qui ne retient qu'une candidature sur huit. Sans sélectivité
 * publiée, on garde l'ancien ajustement modeste et identique partout
 * (ACADEMIC_STANDING_ADJUSTMENT), faute de connaître la barre réelle.
 * Un profil qui n'a pas renseigné ses résultats n'est ni pénalisé ni avantagé.
 */
export const SELECTIVITY_STANDING_ADJUSTMENT: Record<SelectivityTier, Record<AcademicStanding, number>> = {
  "très sélective": { "Résultats modestes": -20, "Résultats dans la moyenne": -8, "Bons résultats": 0, "Excellents résultats": 3 },
  sélective: { "Résultats modestes": -10, "Résultats dans la moyenne": -3, "Bons résultats": 2, "Excellents résultats": 4 },
  accessible: { "Résultats modestes": -3, "Résultats dans la moyenne": 0, "Bons résultats": 1, "Excellents résultats": 2 },
};

/** Ajustement global (points) selon résultats et sélectivité ; 0 si l'un des deux est inconnu. */
export function selectivityStandingAdjustment(profile: StudentProfile, formation: StudyProgram): number {
  const tier = selectivityTier(selectivityOf(formation.id));
  const { standing } = effectiveStanding(profile);
  if (!tier || !standing) return 0;
  return SELECTIVITY_STANDING_ADJUSTMENT[tier][standing];
}

function computeLevelDegreeScore(profile: StudentProfile, formation: StudyProgram): number {
  const diff = levelRank(profile.currentLevel) - levelRank(formation.requiredLevel);
  let base: number;
  if (diff === 0) base = 100;
  else if (diff === 1) base = 90;
  else if (diff >= 2) base = 75;
  else if (diff === -1) base = 55;
  else base = 20;

  const matchesGoal = formation.goal === profile.goal;
  const afterGoal = matchesGoal ? base : Math.max(0, base - 25);

  // Sélectivité publiée : les résultats pèsent sur le score global (plus bas), pas ici.
  const selectivityKnown = selectivityTier(selectivityOf(formation.id)) !== null;
  const standing = selectivityKnown ? NEUTRAL_ACADEMIC_STANDING : (effectiveStanding(profile).standing ?? NEUTRAL_ACADEMIC_STANDING);
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

/**
 * Le domaine d'études est choisi dans une liste fermée (`DOMAINS`) : on le
 * compare donc exactement au domaine exigé et à ses alias déclarés, jamais
 * mot à mot — sinon "Sciences de l'ingénieur" et "Sciences politiques"
 * se ressemblaient par le seul mot "Sciences". Les domaines réellement
 * voisins sont déclarés explicitement dans chaque fiche via `aliases`.
 */
function domainRequirementStrength(requirement: Requirement, fieldOfStudy: string): MatchStrength {
  // Un ancien domaine (ex: "Sciences fondamentales") vaut chacun de ses remplaçants.
  const fields = domainEquivalents(fieldOfStudy).map(normalize);
  return namesOf(requirement).some((name) => fields.includes(normalize(name))) ? "forte" : "manquant";
}

/**
 * La formation relève-t-elle du domaine de l'étudiant ? Oui si c'est son
 * domaine, ou si ses prérequis officiels acceptent explicitement ce domaine
 * (alias de l'exigence « domaine », ex. un master de mathématiques ouvert
 * aux profils Data & IA). Sert à ne pas noyer l'étudiant sous des formations
 * sans rapport avec son parcours (recherche), sans rien inventer : la
 * parenté entre domaines vient des fiches elles-mêmes.
 */
export function acceptsStudentDomain(profile: Pick<StudentProfile, "fieldOfStudy">, formation: StudyProgram): boolean {
  const fields = domainEquivalents(profile.fieldOfStudy).map(normalize);
  if (isExcludedDomain(profile.fieldOfStudy, formation)) return false;
  if (fields.includes(normalize(formation.field))) return true;
  return formation.prerequisites.some(
    (requirement) => requirement.type === "domaine" && domainRequirementStrength(requirement, profile.fieldOfStudy) === "forte",
  );
}

/** L'étudiant est-il à l'aise pour suivre des cours dans la langue d'enseignement de la formation ? */
function computeLanguageStrength(profile: StudentProfile, formation: StudyProgram): MatchStrength {
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
function computePrerequisitesScore(profile: StudentProfile, formation: StudyProgram): number {
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
        strength = domainRequirementStrength(requirement, profile.fieldOfStudy);
        break;
      case "matiere":
        strength = bestMatch(namesOf(requirement), profile.courses.map((course) => course.name)).strength;
        break;
      case "competence":
        strength = bestMatch(namesOf(requirement), [...profile.skills, ...profile.languages]).strength;
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
 * Plafond "hors domaine". Sans lui, le niveau (25 %) et les prérequis
 * génériques (niveau, langue) suffisaient à donner ~45/100 — donc
 * "Partiellement compatible" — à une formation d'un domaine sans aucun
 * rapport (ex: licence de mécanique → master de droit européen), faux
 * signal devenu fréquent avec un catalogue multi-domaines.
 *
 * Le plafond ne s'applique que si le domaine exigé est ABSENT du profil, et
 * il se relâche à mesure que le profil prouve le contenu de la formation :
 * une vraie réorientation (ex: informatique → data science, avec les
 * matières qui vont avec) n'est pas pénalisée, seule l'absence de toute
 * preuve l'est. Le contenu seul compte ici, pas les compétences : des
 * compétences transverses ("Anglais courant", "Python") ne prouvent pas
 * qu'on a les bases d'un autre domaine.
 *
 * Plafond SOUPLE : au-delà du plafond, le score n'est pas écrasé mais
 * compressé (x0,25). Un plafond sec rendrait égaux des profils réellement
 * différents (ex: à l'aise ou non en anglais) — l'ordre entre eux doit
 * rester juste même hors domaine.
 *
 * La "preuve de contenu" qui relâche le plafond ne compte QUE les
 * correspondances fortes (un partiel vaut 60 dans le score de contenu
 * affiché, mais 0 ici) : hors domaine, un partiel vient souvent d'un seul
 * mot générique partagé ("Droit international" ~ "Droit des sociétés"), ce
 * qui ne prouve pas les bases d'une autre discipline — cas observé : un
 * profil de science politique à 86/100 sur un master de droit des affaires.
 */
export const DOMAIN_MISMATCH_BASE_CAP = 25;
export const DOMAIN_MISMATCH_COMPRESSION = 0.25;
const OUTSIDE_DOMAIN_EVIDENCE_POINTS: Record<MatchStrength, number> = { forte: 100, partielle: 0, manquant: 0 };

/** Preuve de contenu hors domaine : moyenne pondérée des matières, partiels peu comptés. */
function outsideDomainEvidence(formation: StudyProgram, rows: SubjectMatch[]): number {
  let total = 0;
  let weights = 0;
  formation.coreCourses.forEach((item, index) => {
    const weight = IMPORTANCE_WEIGHT[item.importance] ?? 1;
    total += OUTSIDE_DOMAIN_EVIDENCE_POINTS[rows[index]?.strength ?? "manquant"] * weight;
    weights += weight;
  });
  return weights === 0 ? 100 : Math.round(total / weights);
}

/**
 * Niveau de preuve (audit du 2026-09-30) : le niveau, le domaine et la
 * langue sont DÉCLARÉS et remplissent à eux seuls les critères « prérequis »
 * et « niveau » (55 % du poids). Sans matières ni compétences pour les
 * étayer, un profil presque vide obtenait un score élevé — cas constaté :
 * « Master 1, Data & IA » avec une matière et une compétence, 84/100 sur
 * une MSc en IA. Un jury dirait « je ne peux pas juger » : le score est donc
 * plafonné tant que le profil compte moins de EVIDENCE_FULL_ITEMS (5) preuves
 * (matières + compétences ; les langues n'en sont pas).
 *
 * Plafond SOUPLE comme pour le domaine : au-delà, le score est compressé
 * (x0,25), pas écrasé, pour garder un ordre juste entre les formations.
 */
// Aligné sur le profil « solide » annoncé à l'étudiant (lib/profile/validation.ts) :
// on ne plafonne jamais un profil qui suit nos propres recommandations.
export const EVIDENCE_FULL_ITEMS = RECOMMENDED_COURSES + RECOMMENDED_SKILLS;
// 0 preuve reconnue → 15 ; puis +12 par preuve (27, 39, 51, 63) ; aucun plafond à 5.
export const EVIDENCE_CAP_BASE = 15;
export const EVIDENCE_CAP_PER_ITEM = 12;
export const EVIDENCE_COMPRESSION = 0.25;

/**
 * Nombre de preuves distinctes du profil : matières + compétences RECONNUES
 * (lib/matching/vocabulary.ts), sans doublons. Un mot quelconque (« Girafe »)
 * n'est pas une preuve.
 */
export function profileEvidenceCount(profile: StudentProfile): number {
  return new Set(
    [...profile.courses.map((course) => course.name), ...profile.skills]
      .filter((label) => isRecognizedTerm(label) && !isLanguageTerm(label))
      .map(normalize)
      .filter(Boolean),
  ).size;
}

/**
 * Aucune matière ni compétence du profil ne correspond au programme : le
 * profil n'apporte aucune preuve pour CETTE formation, quel que soit ce
 * qu'il déclare (niveau, domaine, langue). Le score ne peut pas dépasser ce
 * plafond, comme un jury qui ne trouve rien de pertinent dans un dossier.
 */
export const NO_CONTENT_MATCH_CEILING = 20;

/** Plafond du score selon le nombre de preuves ; null quand le profil est assez documenté. */
export function evidenceCap(evidenceCount: number): number | null {
  return evidenceCount >= EVIDENCE_FULL_ITEMS ? null : EVIDENCE_CAP_BASE + EVIDENCE_CAP_PER_ITEM * evidenceCount;
}

/** Le domaine d'études du profil est-il explicitement exclu par la formation (`Requirement.excludes`) ? */
function isExcludedDomain(fieldOfStudy: string, formation: StudyProgram): boolean {
  const fields = domainEquivalents(fieldOfStudy).map(normalize);
  return formation.prerequisites.some(
    (requirement) => requirement.type === "domaine" && (requirement.excludes ?? []).some((domain) => fields.includes(normalize(domain))),
  );
}

/** Le domaine d'études du profil est-il absent de TOUS les domaines exigés ? false si la formation n'en exige aucun. */
function isOutsideRequiredDomain(profile: StudentProfile, formation: StudyProgram): boolean {
  const domainRequirements = formation.prerequisites.filter((requirement) => requirement.type === "domaine");
  return (
    domainRequirements.length > 0 &&
    domainRequirements.every((requirement) => domainRequirementStrength(requirement, profile.fieldOfStudy) === "manquant")
  );
}

/**
 * Calcule le résultat de compatibilité entre un profil étudiant et une formation.
 * Fonction pure : mêmes entrées → même résultat, sans effet de bord.
 */
export function computeCompatibility(profile: StudentProfile, formation: StudyProgram): CompatibilityResult {
  // Les matières et compétences renseignées forment un même bassin de
  // comparaison : un cours "Machine Learning" peut légitimement démontrer
  // à la fois un contenu académique et une compétence. Les langues
  // déclarées en font aussi partie : un étudiant qui a coché "Anglais" ne
  // doit pas en plus penser à ajouter "Anglais courant" à ses compétences
  // pour satisfaire une formation qui l'exige.
  const studentPool = [...profile.courses.map((course) => course.name), ...profile.skills, ...profile.languages];

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

  const selectivityAdjustment = selectivityStandingAdjustment(profile, formation);
  const weightedScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        breakdown.prerequisites * ENGINE_WEIGHTS.prerequisites +
          breakdown.academicContent * ENGINE_WEIGHTS.academicContent +
          breakdown.skills * ENGINE_WEIGHTS.skills +
          breakdown.levelDegree * ENGINE_WEIGHTS.levelDegree,
      ) + selectivityAdjustment,
    ),
  );

  // Domaine exclu : plafond strict, sans crédit pour les matières communes (c'est ce qui exclut l'étudiant).
  const excludedDomain = isExcludedDomain(profile.fieldOfStudy, formation);
  const outsideDomain = excludedDomain || isOutsideRequiredDomain(profile, formation);
  const domainCap = DOMAIN_MISMATCH_BASE_CAP + (excludedDomain ? 0 : outsideDomainEvidence(formation, content.rows));
  const domainCapped = outsideDomain && weightedScore > domainCap;
  const afterDomain = domainCapped
    ? Math.round(domainCap + (weightedScore - domainCap) * DOMAIN_MISMATCH_COMPRESSION)
    : weightedScore;

  const evidenceCeiling = evidenceCap(profileEvidenceCount(profile));
  const evidenceCapped = evidenceCeiling !== null && afterDomain > evidenceCeiling;
  const afterEvidence = evidenceCapped
    ? Math.round(evidenceCeiling + (afterDomain - evidenceCeiling) * EVIDENCE_COMPRESSION)
    : afterDomain;

  // Sans aucune preuve reconnue, les langues seules (« Anglais » ↔ « Anglais courant ») ne suffisent pas.
  const noContentMatch = (content.score === 0 && skills.score === 0) || profileEvidenceCount(profile) === 0;
  const overallScore = noContentMatch ? Math.min(afterEvidence, NO_CONTENT_MATCH_CEILING) : afterEvidence;

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
    ...(domainCapped ? { domainCapped: true } : {}),
    ...(excludedDomain ? { domainExcluded: true } : {}),
    ...(evidenceCapped ? { evidenceCapped: true } : {}),
    ...(noContentMatch ? { noContentMatch: true } : {}),
    ...(selectivityAdjustment !== 0 ? { selectivityAdjustment } : {}),
  };
}
