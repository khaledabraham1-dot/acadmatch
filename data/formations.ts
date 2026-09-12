import type { Formation } from "@/types";

/**
 * Formations françaises FICTIVES pour le prototype AcadMatch.
 *
 * ⚠️ Ces établissements, programmes et URLs sont inventés à des fins de
 * démonstration. Ils ne représentent aucune institution réelle et ne
 * doivent jamais être présentés comme une source officielle dans l'UI
 * (voir le composant DemoDataBadge, affiché partout où ces données
 * apparaissent).
 */
export const FORMATIONS: Formation[] = [
  {
    id: "f-data-science-cambrelle",
    name: "Master 1 Data Science & Intelligence Artificielle",
    institution: "Institut Polytechnique de Cambrelle",
    level: "Master 1",
    domain: "Data Science & IA",
    location: "Grenoble",
    description:
      "Formation orientée science des données et IA, avec un fort volume horaire en mathématiques appliquées et en programmation.",
    requiredLevel: "Licence 3",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence validée (L3) ou équivalent" },
      { id: "r2", type: "domaine", value: "Informatique", label: "Licence en Informatique, Mathématiques ou Data Science" },
      { id: "r3", type: "matiere", value: "Algorithmique", label: "Bases solides en algorithmique" },
      { id: "r4", type: "competence", value: "Python", label: "Maîtrise de Python" },
    ],
    keySubjects: [
      "Machine Learning",
      "Statistiques",
      "Bases de données",
      "Algorithmique avancée",
      "Big Data",
      "Mathématiques appliquées",
    ],
    requiredSkills: ["Python", "SQL", "Statistiques", "Machine Learning", "Anglais courant"],
    sourceUrl: "https://demo.acadmatch.fr/formations/master-data-science-cambrelle",
  },
  {
    id: "f-ia-valcourt",
    name: "Master 1 Intelligence Artificielle",
    institution: "Université de Valcourt",
    level: "Master 1",
    domain: "Data Science & IA",
    location: "Lyon",
    description:
      "Master centré sur l'apprentissage automatique, les réseaux de neurones et le traitement du langage naturel.",
    requiredLevel: "Licence 3",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence validée (L3) ou équivalent" },
      { id: "r2", type: "domaine", value: "Informatique", label: "Licence en Informatique ou Mathématiques" },
      { id: "r3", type: "competence", value: "Python", label: "Programmation Python exigée" },
    ],
    keySubjects: [
      "Apprentissage automatique",
      "Réseaux de neurones",
      "Traitement du langage naturel",
      "Mathématiques appliquées",
      "Programmation Python",
    ],
    requiredSkills: ["Python", "Machine Learning", "Algèbre linéaire", "Statistiques"],
    sourceUrl: "https://demo.acadmatch.fr/formations/master-ia-valcourt",
  },
  {
    id: "f-licence-info-toulouse",
    name: "Licence 3 Informatique",
    institution: "École Supérieure du Numérique de Toulouse",
    level: "Licence 3",
    domain: "Informatique",
    location: "Toulouse",
    description:
      "Dernière année de licence généraliste en informatique : développement logiciel, bases de données et réseaux.",
    requiredLevel: "Licence 2",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 2", label: "Licence 2 validée ou équivalent" },
      { id: "r2", type: "domaine", value: "Informatique", label: "Parcours en Informatique" },
    ],
    keySubjects: [
      "Programmation orientée objet",
      "Structures de données",
      "Bases de données",
      "Réseaux informatiques",
      "Systèmes d'exploitation",
    ],
    requiredSkills: ["Java", "SQL", "Algorithmique", "Travail en équipe"],
    sourceUrl: "https://demo.acadmatch.fr/formations/licence-info-toulouse",
  },
  {
    id: "f-eco-internationale-nantes",
    name: "Master 1 Économie Internationale",
    institution: "École de Commerce Atlantique",
    level: "Master 1",
    domain: "Économie & Gestion",
    location: "Nantes",
    description:
      "Formation axée sur le commerce international, la macroéconomie et la finance d'entreprise.",
    requiredLevel: "Licence 3",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence validée (L3) ou équivalent" },
      { id: "r2", type: "domaine", value: "Économie & Gestion", label: "Licence en Économie ou Gestion" },
      { id: "r3", type: "competence", value: "Anglais courant", label: "Anglais courant exigé" },
    ],
    keySubjects: [
      "Macroéconomie",
      "Microéconomie",
      "Commerce international",
      "Statistiques économiques",
      "Finance d'entreprise",
    ],
    requiredSkills: ["Anglais courant", "Excel", "Analyse de données", "Économétrie"],
    sourceUrl: "https://demo.acadmatch.fr/formations/master-eco-internationale-nantes",
  },
  {
    id: "f-droit-affaires-clairval",
    name: "Master 1 Droit des Affaires",
    institution: "Institut Supérieur de Droit de Clairval",
    level: "Master 1",
    domain: "Droit",
    location: "Bordeaux",
    description:
      "Spécialisation en droit des sociétés, droit des contrats et droit fiscal appliqué aux entreprises.",
    requiredLevel: "Licence 3",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence validée (L3) ou équivalent" },
      { id: "r2", type: "domaine", value: "Droit", label: "Licence en Droit" },
    ],
    keySubjects: ["Droit des sociétés", "Droit des contrats", "Droit fiscal", "Droit international privé"],
    requiredSkills: ["Rédaction juridique", "Anglais juridique", "Argumentation"],
    sourceUrl: "https://demo.acadmatch.fr/formations/master-droit-affaires-clairval",
  },
  {
    id: "f-genie-logiciel-fontenay",
    name: "Master 1 Génie Logiciel",
    institution: "École d'Ingénieurs de Fontenay",
    level: "Master 1",
    domain: "Informatique",
    location: "Lille",
    description:
      "Formation orientée conception logicielle à grande échelle, DevOps et qualité logicielle.",
    requiredLevel: "Licence 3",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence validée (L3) ou équivalent" },
      { id: "r2", type: "domaine", value: "Informatique", label: "Licence en Informatique ou diplôme d'ingénieur" },
      { id: "r3", type: "matiere", value: "Programmation orientée objet", label: "Bases en programmation orientée objet" },
    ],
    keySubjects: [
      "Architecture logicielle",
      "Programmation orientée objet",
      "DevOps",
      "Tests logiciels",
      "Bases de données",
    ],
    requiredSkills: ["Java", "Git", "Programmation orientée objet", "Anglais courant"],
    sourceUrl: "https://demo.acadmatch.fr/formations/master-genie-logiciel-fontenay",
  },
  {
    id: "f-data-sante-montoire",
    name: "Master 1 Data Science pour la Santé",
    institution: "Université des Sciences de Montoire",
    level: "Master 1",
    domain: "Data Science & IA",
    location: "Marseille",
    description:
      "Applique les méthodes de data science aux données médicales : biostatistiques, ML et éthique des données.",
    requiredLevel: "Licence 3",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence validée (L3) ou équivalent" },
      { id: "r2", type: "domaine", value: "Biologie & Santé", label: "Licence en Biologie, Santé, Mathématiques ou Informatique" },
    ],
    keySubjects: [
      "Biostatistiques",
      "Machine Learning",
      "Bases de données médicales",
      "Programmation R",
      "Statistiques",
    ],
    requiredSkills: ["R", "Statistiques", "Python", "Rigueur scientifique"],
    sourceUrl: "https://demo.acadmatch.fr/formations/master-data-sante-montoire",
  },
  {
    id: "f-sciences-po-vergnac",
    name: "Master 1 Sciences Politiques",
    institution: "Institut de Sciences Politiques de Vergnac",
    level: "Master 1",
    domain: "Sciences politiques",
    location: "Paris",
    description:
      "Formation généraliste en relations internationales, institutions politiques et méthodologie de recherche.",
    requiredLevel: "Licence 3",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence validée (L3) ou équivalent" },
      { id: "r2", type: "domaine", value: "Sciences politiques", label: "Licence en Sciences politiques, Droit ou Histoire" },
    ],
    keySubjects: [
      "Relations internationales",
      "Institutions politiques",
      "Méthodologie de recherche",
      "Histoire des idées politiques",
    ],
    requiredSkills: ["Argumentation", "Anglais courant", "Rédaction académique"],
    sourceUrl: "https://demo.acadmatch.fr/formations/master-sciences-po-vergnac",
  },
  {
    id: "f-maths-appliquees-aubine",
    name: "Licence 3 Mathématiques Appliquées",
    institution: "Université Sainte-Aubine",
    level: "Licence 3",
    domain: "Mathématiques",
    location: "Strasbourg",
    description:
      "Dernière année de licence en mathématiques appliquées, avec une ouverture vers la programmation scientifique.",
    requiredLevel: "Licence 2",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 2", label: "Licence 2 validée ou équivalent" },
      { id: "r2", type: "domaine", value: "Mathématiques", label: "Parcours en Mathématiques" },
    ],
    keySubjects: ["Analyse", "Algèbre linéaire", "Probabilités", "Statistiques", "Programmation scientifique"],
    requiredSkills: ["Python", "Rigueur mathématique", "Algèbre"],
    sourceUrl: "https://demo.acadmatch.fr/formations/licence-maths-appliquees-aubine",
  },
  {
    id: "f-management-numerique-nantes",
    name: "Master 1 Management de Projets Numériques",
    institution: "École de Commerce Atlantique",
    level: "Master 1",
    domain: "Économie & Gestion",
    location: "Nantes",
    description:
      "Formation à la croisée du management et du numérique : conduite de projet, transformation digitale, SI.",
    requiredLevel: "Licence 3",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence validée (L3) ou équivalent" },
      { id: "r2", type: "domaine", value: "Économie & Gestion", label: "Licence en Gestion, Économie ou Informatique" },
    ],
    keySubjects: [
      "Gestion de projet",
      "Transformation digitale",
      "Systèmes d'information",
      "Marketing digital",
      "Analyse de données",
    ],
    requiredSkills: ["Gestion de projet", "Excel", "Communication", "Analyse de données"],
    sourceUrl: "https://demo.acadmatch.fr/formations/master-management-numerique-nantes",
  },
];

export function getFormationById(id: string): Formation | undefined {
  return FORMATIONS.find((formation) => formation.id === id);
}
