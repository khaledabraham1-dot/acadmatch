import type { AcademicLevel, AcademicStanding, StudyGoal } from "@/types";

/** Référentiels utilisés dans les formulaires (profil, filtres de recherche). */

export const ACADEMIC_LEVELS: AcademicLevel[] = [
  "Baccalauréat",
  "Licence 1",
  "Licence 2",
  "Licence 3",
  "Master 1",
  "Master 2",
  "Doctorat",
];

export const STUDY_GOALS: StudyGoal[] = [
  "Licence",
  "Master",
  "Doctorat",
  "École spécialisée",
];

/** Ordre volontairement croissant : reflété tel quel dans le <select> du profil. */
export const ACADEMIC_STANDINGS: AcademicStanding[] = [
  "Résultats modestes",
  "Résultats dans la moyenne",
  "Bons résultats",
  "Excellents résultats",
];

/** Langues d'enseignement présentes dans le catalogue — proposées dans le profil étudiant. */
export const TEACHING_LANGUAGES = ["Français", "Anglais"] as const;

export const DOMAINS = [
  "Informatique",
  "Data Science & IA",
  "Économie & Gestion",
  "Droit",
  "Sciences de l'ingénieur",
  "Mathématiques",
  "Physique",
  "Chimie",
  "Biologie & Santé",
  "Sciences politiques",
] as const;

export type Domain = (typeof DOMAINS)[number];

/**
 * Anciens domaines encore présents dans des profils enregistrés (navigateur
 * ou compte), avec les domaines qui les remplacent. "Sciences fondamentales"
 * a été séparé en Physique et Chimie le 2026-09-27 : on ne choisit jamais à
 * la place de l'étudiant — le moteur traite l'ancien domaine comme les deux,
 * et le formulaire de profil lui demande de trancher.
 */
export const LEGACY_DOMAINS: Record<string, Domain[]> = {
  "Sciences fondamentales": ["Physique", "Chimie"],
};

/** Domaines à considérer pour un domaine d'études de profil (lui-même, ou ses remplaçants s'il est ancien). */
export function domainEquivalents(fieldOfStudy: string): string[] {
  return [fieldOfStudy, ...(LEGACY_DOMAINS[fieldOfStudy] ?? [])];
}

export function isCurrentDomain(value: string): value is Domain {
  return (DOMAINS as readonly string[]).includes(value);
}

/** Suggestions de matières par domaine, pour l'ajout rapide dans le profil. */
export const SUGGESTED_COURSES: Record<Domain, string[]> = {
  Informatique: [
    "Algorithmique",
    "Programmation orientée objet",
    "Bases de données",
    "Structures de données",
    "Réseaux informatiques",
    "Systèmes d'exploitation",
  ],
  "Data Science & IA": [
    "Machine Learning",
    "Statistiques",
    "Programmation Python",
    "Mathématiques appliquées",
    "Big Data",
    "Traitement du langage naturel",
  ],
  "Économie & Gestion": [
    "Microéconomie",
    "Macroéconomie",
    "Comptabilité",
    "Finance d'entreprise",
    "Marketing",
    "Économétrie",
  ],
  Droit: [
    "Droit civil",
    "Droit des contrats",
    "Droit des sociétés",
    "Droit constitutionnel",
    "Droit international",
  ],
  "Sciences de l'ingénieur": [
    "Mécanique",
    "Électronique",
    "Architecture logicielle",
    "Automatique",
    "Thermodynamique",
  ],
  Mathématiques: [
    "Analyse",
    "Algèbre linéaire",
    "Probabilités",
    "Statistiques",
    "Programmation scientifique",
  ],
  Physique: [
    "Physique générale",
    "Mécanique",
    "Physique quantique",
    "Physique statistique",
    "Optique",
    "Électromagnétisme",
  ],
  Chimie: [
    "Chimie générale",
    "Chimie organique",
    "Chimie inorganique",
    "Chimie physique",
    "Chimie analytique",
    "Spectroscopie",
  ],
  "Biologie & Santé": [
    "Biologie cellulaire",
    "Biostatistiques",
    "Génétique",
    "Physiologie",
  ],
  "Sciences politiques": [
    "Relations internationales",
    "Institutions politiques",
    "Histoire des idées politiques",
    "Méthodologie de recherche",
  ],
};

/** Suggestions de compétences par domaine. */
export const SUGGESTED_SKILLS: Record<Domain, string[]> = {
  Informatique: ["Java", "Python", "SQL", "Git", "Algorithmique"],
  "Data Science & IA": [
    "Python",
    "Machine Learning",
    "Statistiques",
    "SQL",
    "R",
  ],
  "Économie & Gestion": [
    "Excel",
    "Analyse de données",
    "Anglais courant",
    "Gestion de projet",
  ],
  Droit: ["Rédaction juridique", "Argumentation", "Anglais juridique"],
  "Sciences de l'ingénieur": ["CAO", "Python", "Gestion de projet"],
  Mathématiques: ["Python", "Rigueur mathématique", "Algèbre"],
  Physique: ["Rigueur scientifique", "Python", "Expérimentation"],
  Chimie: ["Expérimentation", "Rigueur scientifique", "Anglais courant"],
  "Biologie & Santé": ["R", "Rigueur scientifique", "Statistiques"],
  "Sciences politiques": ["Rédaction académique", "Anglais courant", "Argumentation"],
};

export const CURRENT_DEGREE_SUGGESTIONS = [
  "Baccalauréat scientifique",
  "Licence en Informatique",
  "Licence en Mathématiques",
  "Licence en Économie",
  "Licence en Droit",
  "Licence de Physique",
  "Licence de Chimie",
  "Diplôme d'ingénieur (3 ans)",
  "Master 1 en Data Science",
];
