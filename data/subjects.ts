import type { AcademicLevel, StudyGoal } from "@/types";

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

export const DOMAINS = [
  "Informatique",
  "Data Science & IA",
  "Économie & Gestion",
  "Droit",
  "Sciences de l'ingénieur",
  "Mathématiques",
  "Sciences fondamentales",
  "Biologie & Santé",
  "Sciences politiques",
] as const;

export type Domain = (typeof DOMAINS)[number];

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
  "Sciences fondamentales": [
    "Physique générale",
    "Chimie générale",
    "Mécanique",
    "Optique",
    "Méthodologie expérimentale",
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
  "Sciences fondamentales": ["Rigueur scientifique", "Python", "Expérimentation"],
  "Biologie & Santé": ["R", "Rigueur scientifique", "Statistiques"],
  "Sciences politiques": ["Rédaction académique", "Anglais courant", "Argumentation"],
};

export const CURRENT_DEGREE_SUGGESTIONS = [
  "Baccalauréat scientifique",
  "Licence en Informatique",
  "Licence en Mathématiques",
  "Licence en Économie",
  "Licence en Droit",
  "Diplôme d'ingénieur (3 ans)",
  "Master 1 en Data Science",
];
