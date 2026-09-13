/**
 * Types centraux d'AcadMatch.
 *
 * Ces types sont volontairement simples pour le MVP : on privilégie des
 * chaînes de caractères normalisées plutôt que des enums stricts, afin de
 * pouvoir enrichir/remplacer facilement les données de démonstration par
 * de vraies données plus tard sans casser les types.
 */

/** Niveau d'études, du lycée au doctorat. */
export type AcademicLevel =
  | "Baccalauréat"
  | "Licence 1"
  | "Licence 2"
  | "Licence 3"
  | "Master 1"
  | "Master 2"
  | "Doctorat";

/** Ordre des niveaux, utilisé par le moteur de scoring pour comparer deux niveaux. */
export const ACADEMIC_LEVEL_ORDER: AcademicLevel[] = [
  "Baccalauréat",
  "Licence 1",
  "Licence 2",
  "Licence 3",
  "Master 1",
  "Master 2",
  "Doctorat",
];

/** Objectif d'études visé par l'étudiant. */
export type StudyGoal = "Licence" | "Master" | "Doctorat" | "École spécialisée";

/** Une matière ou un module suivi par l'étudiant. */
export interface Course {
  id: string;
  name: string;
}

/** Le parcours académique renseigné par l'étudiant (aucun compte requis, stocké localement). */
export interface StudentProfile {
  /** Niveau actuellement validé ou en cours. */
  currentLevel: AcademicLevel;
  /** Domaine d'études principal, ex: "Informatique", "Économie & Gestion". */
  fieldOfStudy: string;
  /** Diplôme actuel / en cours, ex: "Licence en Informatique". */
  currentDegree: string;
  /** Matières / modules étudiés. */
  courses: Course[];
  /** Compétences maîtrisées. */
  skills: string[];
  /** Objectif de formation visé en France. */
  goal: StudyGoal;
}

/** Type de correspondance entre un élément du profil étudiant et une exigence de formation. */
export type MatchStrength = "forte" | "partielle" | "manquant";

/**
 * Poids d'une matière/compétence/prérequis dans le score.
 * "essentielle" = difficile de réussir la formation sans, "utile" = un plus.
 */
export type Importance = "essentielle" | "importante" | "utile";

/** Une exigence d'admission (prérequis) pour une formation. */
export interface Requirement {
  id: string;
  /** Libellé affiché, ex: "Licence en Informatique ou équivalent". */
  label: string;
  /** Catégorie de l'exigence, utilisée par le moteur de scoring. */
  type: "niveau" | "domaine" | "matiere" | "competence";
  /** Valeur normalisée comparée au profil étudiant (ex: domaine ou nom de matière). */
  value: string;
  /**
   * Formulations équivalentes reconnues par le moteur de matching, ex:
   * value="Probabilités", aliases=["Probability"] — utile pour un intitulé
   * en anglais ou une variante de nom d'un établissement à l'autre.
   */
  aliases?: string[];
  /** Poids de ce prérequis dans le score des prérequis ; par défaut dérivé de `type`. */
  importance?: Importance;
}

/**
 * Une matière fondamentale ou une compétence attendue par une formation.
 * Unité de base comparée au profil étudiant par le moteur de matching
 * (voir lib/matching/engine.ts) — le pendant "formation" d'une matière ou
 * compétence de `StudentProfile`.
 */
export interface AcademicItem {
  id: string;
  /** Intitulé de référence, ex: "Machine Learning". */
  name: string;
  /** Formulations équivalentes, ex: ["Apprentissage automatique", "ML"]. */
  aliases?: string[];
  importance: Importance;
  category: "matiere" | "competence";
}

/** Une formation FICTIVE de démonstration (voir data/formations.ts). */
export interface Formation {
  id: string;
  name: string;
  institution: string;
  city: string;
  level: AcademicLevel;
  /** Domaine d'études, ex: "Informatique", "Data Science & IA". */
  field: string;
  description: string;
  /** Prérequis d'admission. */
  prerequisites: Requirement[];
  /** Matières fondamentales enseignées dans la formation. */
  coreCourses: AcademicItem[];
  /** Compétences attendues des candidats. */
  skills: AcademicItem[];
  /** Niveau minimum requis pour candidater (le diplôme d'entrée). */
  requiredLevel: AcademicLevel;
  /** Langue principale d'enseignement, ex: "Français", "Anglais". */
  language: string;
  /**
   * URL source — TOUJOURS fictive pour ce prototype.
   * Ne jamais afficher comme une source officielle dans l'UI.
   */
  source: string;
  /** Toujours `true` : marque explicitement une donnée de démonstration (voir DemoDataBadge). */
  demo: true;
}

/** Décomposition du score de compatibilité par critère. */
export interface CompatibilityBreakdown {
  /** Adéquation des prérequis d'admission (%). */
  prerequisites: number;
  /** Recouvrement du contenu académique (%). */
  academicContent: number;
  /** Recouvrement des compétences (%). */
  skills: number;
  /** Adéquation du niveau / diplôme actuel (%). */
  levelDegree: number;
}

/** Une ligne du tableau de correspondance matière/compétence. */
export interface SubjectMatch {
  studentItem: string;
  formationRequirement: string;
  strength: MatchStrength;
}

/** Résultat complet de l'analyse de compatibilité, produit par le moteur de matching. */
export interface CompatibilityResult {
  formationId: string;
  /** Score global sur 100. Une simulation de compatibilité académique — pas une probabilité d'admission. */
  overallScore: number;
  breakdown: CompatibilityBreakdown;
  strengths: string[];
  gaps: string[];
  matches: SubjectMatch[];
}
