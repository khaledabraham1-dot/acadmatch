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

/**
 * Auto-évaluation des résultats académiques du parcours actuel — volontairement
 * indépendante d'un système de notation précis (mention française, GPA, etc.),
 * puisque le public cible inclut des étudiants formés hors de France et
 * qu'AcadMatch ne convertit pas encore les diplômes étrangers (voir roadmap).
 * Utilisée par le moteur comme signal de dossier, en plus du niveau (voir
 * `CompatibilityBreakdown.levelDegree` et `computeLevelDegreeScore`).
 */
export type AcademicStanding =
  | "Résultats modestes"
  | "Résultats dans la moyenne"
  | "Bons résultats"
  | "Excellents résultats";

/** Valeur neutre (aucun ajustement de score) — profil qui n'a pas renseigné ce champ. */
export const NEUTRAL_ACADEMIC_STANDING: AcademicStanding = "Résultats dans la moyenne";

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
  /** Objectif de formation visé. */
  goal: StudyGoal;
  /** Langues dans lesquelles l'étudiant est à l'aise pour suivre des cours, ex: ["Français", "Anglais"]. */
  languages: string[];
  /**
   * Auto-évaluation des résultats académiques (optionnelle). Optionnelle
   * (contrairement à `languages`) car elle a une valeur neutre sûre par
   * défaut (`NEUTRAL_ACADEMIC_STANDING`) qui ne pénalise ni n'avantage un
   * profil qui ne l'a pas renseignée — un profil enregistré avant l'ajout de
   * ce champ reste donc valide sans migration de `lib/storage.ts`.
   */
  academicStanding?: AcademicStanding;
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

/** Statut de vérification d'une fiche formation par rapport à sa source officielle. */
export type VerificationStatus = "vérifiée" | "à revérifier";

/**
 * Établissement proposant une formation. `country` est volontairement une
 * chaîne normalisée (ex: "France", "Belgique") plutôt qu'un enum de codes
 * pays — même choix que le reste du fichier — car il n'existe qu'un seul
 * pays au catalogue pour l'instant (voir roadmap : architecture
 * internationale, 2e pays prévu ensuite). Ce champ est ce qui manquait pour
 * distinguer un établissement français d'un établissement étranger : avant
 * son introduction, le pays était implicite (toujours la France).
 */
export interface Institution {
  name: string;
  city: string;
  country: string;
}

interface StudyProgramBase {
  id: string;
  name: string;
  institution: Institution;
  /**
   * Niveau affiché (badge UI uniquement — voir components/search/FormationCard.tsx) :
   * l'année d'études qu'un candidat rejoindrait, pas le diplôme final obtenu.
   * Le moteur de matching (lib/matching/engine.ts) ne lit jamais ce champ,
   * seulement `requiredLevel` (le diplôme d'entrée) et `goal`. Utile pour les
   * masters étrangers en 2 ans non scindés en M1/M2 (ex: UCLouvain, entré
   * directement après une Licence) : `level` reflète l'année d'entrée
   * ("Master 1"), pas les 2 années du programme.
   */
  level: AcademicLevel;
  /**
   * Objectif de formation représenté par cette fiche (utilisé pour comparer
   * à `StudentProfile.goal`). Indépendant de `level` : une école d'ingénieurs
   * en admission parallèle (ex: INSA) a un `level` d'entrée type "Licence 3"
   * mais un `goal` "École spécialisée", pas "Licence".
   */
  goal: StudyGoal;
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
   * Procédure de candidature en clair (plateforme, dossier, entretien,
   * période habituelle). Texte descriptif volontairement dépourvu de dates
   * exactes (jour/année) : une date de campagne se périme en quelques mois,
   * contrairement à une plateforme ou un type de procédure qui change
   * rarement — pour la date limite exacte, `source` fait toujours foi.
   * Quand la page officielle ne détaille pas la procédure au moment de la
   * vérification, ce champ le dit explicitement au lieu d'improviser
   * (ex: "à vérifier directement sur le site officiel").
   */
  applicationProcedure: string;
}

/** Formation fictive de démonstration : URL non fonctionnelle, jamais affichée comme un lien cliquable. */
interface DemoStudyProgram extends StudyProgramBase {
  demo: true;
  source: string;
  verifiedAt?: undefined;
  verificationStatus?: undefined;
}

/** Formation réelle : source officielle, datée et vérifiée — obligatoires par construction du type. */
interface VerifiedStudyProgram extends StudyProgramBase {
  demo: false;
  /** URL officielle de l'établissement pour cette formation. */
  source: string;
  /** Date (YYYY-MM-DD) à laquelle cette fiche a été vérifiée par rapport à `source`. */
  verifiedAt: string;
  verificationStatus: VerificationStatus;
}

/**
 * Une formation (au sens générique : "study program"), réelle et vérifiée
 * ou fictive de démonstration — `demo` discrimine les deux et impose (au
 * niveau des types) que toute formation réelle porte sa source, sa date de
 * vérification et son statut (voir data/formations.ts, et DemoDataBadge
 * côté UI). Nommé `StudyProgram` (et non `Formation`) car ce type n'est plus
 * spécifique à la France : `institution.country` porte le pays (voir
 * `Institution`) et les règles d'éligibilité/procédure propres à un pays
 * restent un texte descriptif sur la fiche (`applicationProcedure`), jamais
 * mêlées au calcul de score du moteur de matching (lib/matching/engine.ts).
 */
export type StudyProgram = DemoStudyProgram | VerifiedStudyProgram;

/** Décomposition du score de compatibilité par critère. */
export interface CompatibilityBreakdown {
  /** Adéquation des prérequis d'admission (%). */
  prerequisites: number;
  /** Recouvrement du contenu académique (%). */
  academicContent: number;
  /** Recouvrement des compétences (%). */
  skills: number;
  /** Adéquation du niveau / diplôme actuel, incluant l'auto-évaluation du dossier (%). */
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

/**
 * Statut d'avancement d'une candidature (Phase 13), volontairement simple
 * et linéaire : pas de sous-statuts (entretien, liste d'attente...) pour ce
 * MVP du suivi — à enrichir plus tard si des cas réels le justifient.
 */
export type ApplicationStatus = "à préparer" | "prête" | "envoyée" | "en attente" | "réponse reçue";

/** Ordre d'avancement affiché dans les sélecteurs. */
export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "à préparer",
  "prête",
  "envoyée",
  "en attente",
  "réponse reçue",
];

/**
 * Élément coché/décoché d'une checklist libre (document à réunir, action à
 * faire). Volontairement non structuré (pas de `source`/`obligatoire` par
 * élément) : la checklist documentaire sourcée et normée par formation est
 * une phase ultérieure (Phase 15) — ceci est la liste personnelle et libre
 * de l'étudiant, qu'il remplit lui-même.
 *
 * `dueDate` (Phase 14) est optionnelle et, comme `Application.deadline`, un
 * rappel que l'étudiant se fixe lui-même — jamais une date officielle.
 */
export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  dueDate?: string;
}

/**
 * Suivi d'une candidature à une formation (Phase 13), stocké localement
 * (lib/storage.ts), une candidature par formation (`formationId` sert de
 * clé). Complètement indépendant du moteur de matching et de l'éligibilité
 * administrative (data/eligibility.ts) : ceci est un espace personnel de
 * suivi, pas une donnée sourcée/vérifiée par AcadMatch.
 */
export interface Application {
  formationId: string;
  status: ApplicationStatus;
  /**
   * Échéance personnelle fixée par l'étudiant, ex: "je veux avoir envoyé mon
   * dossier avant le 15 février" — un rappel qu'il se fixe, jamais une date
   * officielle affirmée par AcadMatch (voir `StudyProgram.applicationProcedure`,
   * qui documente volontairement la procédure sans jour/année exacts).
   */
  deadline?: string;
  documents: ChecklistItem[];
  nextActions: ChecklistItem[];
  notes: string;
}
