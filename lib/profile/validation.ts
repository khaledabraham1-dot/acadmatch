import {
  ACADEMIC_LEVEL_ORDER,
  type AcademicLevel,
  type StudentProfile,
  type StudyGoal,
} from "@/types";

/**
 * Validation et fiabilité du profil étudiant (Étape 6).
 *
 * Objectif produit : un utilisateur peut créer un profil *exploitable* par le
 * moteur sans comprendre son fonctionnement interne. On distingue :
 * - erreurs bloquantes (profil inutilisable pour un matching crédible) ;
 * - alertes (parcours atypique ou incomplet — on laisse passer avec un signal) ;
 * - niveau de fiabilité du score qui en découlera.
 *
 * Seuils volontaires et documentés : un étudiant ne liste jamais tout son
 * cursus ; on exige assez de signal pour que le matching lexical ait du sens,
 * sans transformer le formulaire en interrogatoire.
 */

/** Nombre minimum de matières pour un matching de contenu crédible. */
export const MIN_COURSES_FOR_MATCHING = 1;

/** Nombre recommandé de matières pour un profil "solide". */
export const RECOMMENDED_COURSES = 3;

/** Nombre recommandé de compétences pour un profil "solide". */
export const RECOMMENDED_SKILLS = 2;

export type ProfileReliability = "insuffisant" | "limité" | "solide";

export interface ProfileDraft {
  currentLevel: AcademicLevel;
  fieldOfStudy: string;
  currentDegree: string;
  courses: string[];
  skills: string[];
  goal: StudyGoal;
  languages: string[];
}

export interface ProfileValidation {
  /** Empêche la sauvegarde / la poursuite du parcours. */
  errors: string[];
  /** Signaux non bloquants (incohérence douce, profil mince). */
  warnings: string[];
  reliability: ProfileReliability;
  /** Phrase courte affichable à côté du score / sur la recherche. */
  reliabilityLabel: string;
  /** Message d'aide pour renforcer le profil. */
  reliabilityHint: string;
  isSubmittable: boolean;
}

function levelRank(level: AcademicLevel): number {
  return ACADEMIC_LEVEL_ORDER.indexOf(level);
}

/**
 * Objectif visé vs niveau actuel : on n'interdit pas les parcours atypiques
 * (passerelles, admissions parallèles), on alerte seulement les cas clairement
 * irréalistes pour un étudiant qui ne connaît pas le système français.
 */
export function assessGoalLevelCoherence(
  currentLevel: AcademicLevel,
  goal: StudyGoal,
): string | null {
  const rank = levelRank(currentLevel);

  // Viser une Licence alors qu'on est déjà en Master (ou au-delà) : le score
  // restera élevé sur le contenu, mais ce n'est presque jamais l'intention.
  if (goal === "Licence" && rank >= levelRank("Master 1")) {
    return "Vous visez une Licence alors que votre niveau actuel est déjà un Master (ou plus). Vérifiez votre objectif.";
  }

  // Doctorat sans au moins un Master 1 : possible en théorie, rare en pratique
  // pour une première orientation via AcadMatch.
  if (goal === "Doctorat" && rank < levelRank("Master 1")) {
    return "Un Doctorat suppose en général un Master (ou équivalent). Votre niveau actuel rend cet objectif ambitieux.";
  }

  // Bac seul → Master : fréquent chez les candidats internationaux mal calibrés.
  if (goal === "Master" && rank <= levelRank("Baccalauréat")) {
    return "Un Master français demande en général une Licence (ou équivalent). Complétez d'abord un niveau Licence, ou visez une Licence / école adaptée.";
  }

  return null;
}

function countNonEmpty(items: string[]): number {
  return items.filter((item) => item.trim().length > 0).length;
}

export function assessProfileReliability(input: {
  courses: string[];
  skills: string[];
}): Pick<ProfileValidation, "reliability" | "reliabilityLabel" | "reliabilityHint"> {
  const courseCount = countNonEmpty(input.courses);
  const skillCount = countNonEmpty(input.skills);

  if (courseCount < MIN_COURSES_FOR_MATCHING && skillCount < 1) {
    return {
      reliability: "insuffisant",
      reliabilityLabel: "Profil insuffisant",
      reliabilityHint:
        "Ajoutez au moins une matière ou une compétence pour que l'analyse de compatibilité ait un sens.",
    };
  }

  if (courseCount >= RECOMMENDED_COURSES && skillCount >= RECOMMENDED_SKILLS) {
    return {
      reliability: "solide",
      reliabilityLabel: "Profil solide",
      reliabilityHint:
        "Votre parcours est suffisamment renseigné pour une analyse de compatibilité crédible.",
    };
  }

  return {
    reliability: "limité",
    reliabilityLabel: "Profil limité",
    reliabilityHint: `Pour un score plus fiable, visez au moins ${RECOMMENDED_COURSES} matières et ${RECOMMENDED_SKILLS} compétences marquantes.`,
  };
}

/** Valide un brouillon de formulaire (avant construction du `StudentProfile`). */
export function validateProfileDraft(draft: ProfileDraft): ProfileValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!draft.fieldOfStudy.trim()) {
    errors.push("Indiquez votre domaine d'études.");
  }

  if (draft.languages.length === 0) {
    errors.push("Sélectionnez au moins une langue d'enseignement.");
  }

  const courseCount = countNonEmpty(draft.courses);
  const skillCount = countNonEmpty(draft.skills);
  if (courseCount < MIN_COURSES_FOR_MATCHING && skillCount < 1) {
    errors.push("Ajoutez au moins une matière étudiée ou une compétence.");
  }

  const goalWarning = assessGoalLevelCoherence(draft.currentLevel, draft.goal);
  if (goalWarning) warnings.push(goalWarning);

  const reliability = assessProfileReliability({
    courses: draft.courses,
    skills: draft.skills,
  });

  if (reliability.reliability === "limité") {
    warnings.push(reliability.reliabilityHint);
  }

  return {
    errors,
    warnings,
    ...reliability,
    isSubmittable: errors.length === 0,
  };
}

/** Évalue un profil déjà sauvegardé (pages recherche / résultat). */
export function validateStoredProfile(profile: StudentProfile): ProfileValidation {
  return validateProfileDraft({
    currentLevel: profile.currentLevel,
    fieldOfStudy: profile.fieldOfStudy,
    currentDegree: profile.currentDegree,
    courses: profile.courses.map((course) => course.name),
    skills: profile.skills,
    goal: profile.goal,
    languages: profile.languages,
  });
}

/**
 * Sécurise le paramètre `?next=` du profil : chemin relatif interne uniquement
 * (pas d'open redirect vers un domaine externe via `//evil.com`).
 */
export function safeInternalPath(next: string | null, fallback = "/recherche"): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  if (next.includes("://")) return fallback;
  return next;
}
