import type { AcademicItem, Formation, Importance } from "@/types";

/**
 * Formations FICTIVES pour le prototype AcadMatch.
 *
 * ⚠️ Ces établissements, programmes, prérequis et URLs sont inventés à des
 * fins de démonstration. Ils ne représentent aucune institution réelle, ne
 * doivent jamais être présentés comme des informations officielles, et ne
 * doivent jamais être présentés comme une source officielle dans l'UI (voir
 * le composant DemoDataBadge, affiché partout où ces données apparaissent,
 * et le champ `demo: true` de chaque formation).
 */

let itemCounter = 0;

/** Construit une matière fondamentale ou une compétence. `aliases` = formulations équivalentes reconnues par le moteur. */
function item(
  name: string,
  importance: Importance,
  category: AcademicItem["category"],
  aliases?: string[],
): AcademicItem {
  itemCounter += 1;
  return { id: `item-${itemCounter}`, name, importance, category, ...(aliases ? { aliases } : {}) };
}

const course = (name: string, importance: Importance, aliases?: string[]) =>
  item(name, importance, "matiere", aliases);
const skill = (name: string, importance: Importance, aliases?: string[]) =>
  item(name, importance, "competence", aliases);

export const FORMATIONS: Formation[] = [
  {
    id: "f-data-science-cambrelle",
    name: "Master 1 Data Science & Intelligence Artificielle",
    institution: "Institut Polytechnique de Cambrelle",
    level: "Master 1",
    field: "Data Science & IA",
    city: "Grenoble",
    description:
      "Formation orientée science des données et IA, avec un fort volume horaire en mathématiques appliquées et en programmation.",
    requiredLevel: "Licence 3",
    language: "Français",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence validée (L3) ou équivalent" },
      { id: "r2", type: "domaine", value: "Informatique", label: "Licence en Informatique, Mathématiques ou Data Science" },
      { id: "r3", type: "matiere", value: "Algorithmique", label: "Bases solides en algorithmique" },
      { id: "r4", type: "competence", value: "Python", label: "Maîtrise de Python" },
    ],
    coreCourses: [
      course("Machine Learning", "essentielle"),
      course("Statistiques", "essentielle"),
      course("Bases de données", "importante"),
      course("Algorithmique avancée", "importante"),
      course("Big Data", "utile"),
      course("Mathématiques appliquées", "importante"),
    ],
    skills: [
      skill("Python", "essentielle"),
      skill("SQL", "importante"),
      skill("Statistiques", "essentielle"),
      skill("Machine Learning", "importante"),
      skill("Anglais courant", "utile"),
    ],
    source: "https://demo.acadmatch.fr/formations/master-data-science-cambrelle",
    demo: true,
  },
  {
    id: "f-ia-valcourt",
    name: "Master 1 Intelligence Artificielle",
    institution: "Université de Valcourt",
    level: "Master 1",
    field: "Data Science & IA",
    city: "Lyon",
    description:
      "Master centré sur l'apprentissage automatique, les réseaux de neurones et le traitement du langage naturel.",
    requiredLevel: "Licence 3",
    language: "Français",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence validée (L3) ou équivalent" },
      { id: "r2", type: "domaine", value: "Informatique", label: "Licence en Informatique ou Mathématiques" },
      { id: "r3", type: "competence", value: "Python", label: "Programmation Python exigée" },
    ],
    coreCourses: [
      course("Apprentissage automatique", "essentielle"),
      course("Réseaux de neurones", "essentielle"),
      course("Traitement du langage naturel", "importante"),
      course("Mathématiques appliquées", "importante"),
      course("Programmation Python", "essentielle"),
    ],
    skills: [
      skill("Python", "essentielle"),
      skill("Machine Learning", "essentielle"),
      skill("Algèbre linéaire", "importante"),
      skill("Statistiques", "importante"),
    ],
    source: "https://demo.acadmatch.fr/formations/master-ia-valcourt",
    demo: true,
  },
  {
    id: "f-licence-info-toulouse",
    name: "Licence 3 Informatique",
    institution: "École Supérieure du Numérique de Toulouse",
    level: "Licence 3",
    field: "Informatique",
    city: "Toulouse",
    description:
      "Dernière année de licence généraliste en informatique : développement logiciel, bases de données et réseaux.",
    requiredLevel: "Licence 2",
    language: "Français",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 2", label: "Licence 2 validée ou équivalent" },
      { id: "r2", type: "domaine", value: "Informatique", label: "Parcours en Informatique" },
    ],
    coreCourses: [
      course("Programmation orientée objet", "essentielle"),
      course("Structures de données", "essentielle"),
      course("Bases de données", "importante"),
      course("Réseaux informatiques", "importante"),
      course("Systèmes d'exploitation", "utile"),
    ],
    skills: [
      skill("Java", "essentielle"),
      skill("SQL", "importante"),
      skill("Algorithmique", "essentielle"),
      skill("Travail en équipe", "utile"),
    ],
    source: "https://demo.acadmatch.fr/formations/licence-info-toulouse",
    demo: true,
  },
  {
    id: "f-eco-internationale-nantes",
    name: "Master 1 Économie Internationale",
    institution: "École de Commerce Atlantique",
    level: "Master 1",
    field: "Économie & Gestion",
    city: "Nantes",
    description:
      "Formation axée sur le commerce international, la macroéconomie et la finance d'entreprise.",
    requiredLevel: "Licence 3",
    language: "Français",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence validée (L3) ou équivalent" },
      { id: "r2", type: "domaine", value: "Économie & Gestion", label: "Licence en Économie ou Gestion" },
      { id: "r3", type: "competence", value: "Anglais courant", label: "Anglais courant exigé" },
    ],
    coreCourses: [
      course("Macroéconomie", "essentielle"),
      course("Microéconomie", "essentielle"),
      course("Commerce international", "importante"),
      course("Statistiques économiques", "importante"),
      course("Finance d'entreprise", "utile"),
    ],
    skills: [
      skill("Anglais courant", "essentielle"),
      skill("Excel", "importante"),
      skill("Analyse de données", "importante"),
      skill("Économétrie", "utile"),
    ],
    source: "https://demo.acadmatch.fr/formations/master-eco-internationale-nantes",
    demo: true,
  },
  {
    id: "f-droit-affaires-clairval",
    name: "Master 1 Droit des Affaires",
    institution: "Institut Supérieur de Droit de Clairval",
    level: "Master 1",
    field: "Droit",
    city: "Bordeaux",
    description:
      "Spécialisation en droit des sociétés, droit des contrats et droit fiscal appliqué aux entreprises.",
    requiredLevel: "Licence 3",
    language: "Français",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence validée (L3) ou équivalent" },
      { id: "r2", type: "domaine", value: "Droit", label: "Licence en Droit" },
    ],
    coreCourses: [
      course("Droit des sociétés", "essentielle"),
      course("Droit des contrats", "essentielle"),
      course("Droit fiscal", "importante"),
      course("Droit international privé", "utile"),
    ],
    skills: [
      skill("Rédaction juridique", "essentielle"),
      skill("Anglais juridique", "importante"),
      skill("Argumentation", "importante"),
    ],
    source: "https://demo.acadmatch.fr/formations/master-droit-affaires-clairval",
    demo: true,
  },
  {
    id: "f-droit-public-aix",
    name: "Licence 3 Droit Public",
    institution: "Faculté de Droit d'Aix-Verrières",
    level: "Licence 3",
    field: "Droit",
    city: "Aix-en-Provence",
    description:
      "Dernière année de licence orientée droit public : institutions, contentieux administratif et libertés fondamentales.",
    requiredLevel: "Licence 2",
    language: "Français",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 2", label: "Licence 2 validée ou équivalent" },
      { id: "r2", type: "domaine", value: "Droit", label: "Parcours en Droit" },
    ],
    coreCourses: [
      course("Droit constitutionnel", "essentielle"),
      course("Droit administratif", "essentielle"),
      course("Libertés fondamentales", "importante"),
      course("Finances publiques", "utile"),
    ],
    skills: [
      skill("Rédaction juridique", "essentielle"),
      skill("Argumentation", "essentielle"),
      skill("Méthodologie de recherche", "utile"),
    ],
    source: "https://demo.acadmatch.fr/formations/licence-droit-public-aix",
    demo: true,
  },
  {
    id: "f-genie-logiciel-fontenay",
    name: "Master 1 Génie Logiciel",
    institution: "École d'Ingénieurs de Fontenay",
    level: "Master 1",
    field: "Informatique",
    city: "Lille",
    description:
      "Formation orientée conception logicielle à grande échelle, DevOps et qualité logicielle.",
    requiredLevel: "Licence 3",
    language: "Français",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence validée (L3) ou équivalent" },
      { id: "r2", type: "domaine", value: "Informatique", label: "Licence en Informatique ou diplôme d'ingénieur" },
      { id: "r3", type: "matiere", value: "Programmation orientée objet", label: "Bases en programmation orientée objet" },
    ],
    coreCourses: [
      course("Architecture logicielle", "essentielle"),
      course("Programmation orientée objet", "essentielle"),
      course("DevOps", "importante"),
      course("Tests logiciels", "importante"),
      course("Bases de données", "utile"),
    ],
    skills: [
      skill("Java", "essentielle"),
      skill("Git", "importante"),
      skill("Programmation orientée objet", "essentielle"),
      skill("Anglais courant", "utile"),
    ],
    source: "https://demo.acadmatch.fr/formations/master-genie-logiciel-fontenay",
    demo: true,
  },
  {
    id: "f-data-sante-montoire",
    name: "Master 1 Data Science pour la Santé",
    institution: "Université des Sciences de Montoire",
    level: "Master 1",
    field: "Data Science & IA",
    city: "Marseille",
    description:
      "Applique les méthodes de data science aux données médicales : biostatistiques, ML et éthique des données.",
    requiredLevel: "Licence 3",
    language: "Français",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence validée (L3) ou équivalent" },
      { id: "r2", type: "domaine", value: "Biologie & Santé", label: "Licence en Biologie, Santé, Mathématiques ou Informatique" },
    ],
    coreCourses: [
      course("Biostatistiques", "essentielle"),
      course("Machine Learning", "essentielle"),
      course("Bases de données médicales", "importante"),
      course("Programmation R", "importante"),
      course("Statistiques", "utile"),
    ],
    skills: [
      skill("R", "essentielle"),
      skill("Statistiques", "importante"),
      skill("Python", "importante"),
      skill("Rigueur scientifique", "utile"),
    ],
    source: "https://demo.acadmatch.fr/formations/master-data-sante-montoire",
    demo: true,
  },
  {
    id: "f-sciences-po-vergnac",
    name: "Master 1 Sciences Politiques",
    institution: "Institut de Sciences Politiques de Vergnac",
    level: "Master 1",
    field: "Sciences politiques",
    city: "Paris",
    description:
      "Formation généraliste en relations internationales, institutions politiques et méthodologie de recherche.",
    requiredLevel: "Licence 3",
    language: "Français",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence validée (L3) ou équivalent" },
      { id: "r2", type: "domaine", value: "Sciences politiques", label: "Licence en Sciences politiques, Droit ou Histoire" },
    ],
    coreCourses: [
      course("Relations internationales", "essentielle"),
      course("Institutions politiques", "essentielle"),
      course("Méthodologie de recherche", "importante"),
      course("Histoire des idées politiques", "utile"),
    ],
    skills: [
      skill("Argumentation", "essentielle"),
      skill("Anglais courant", "importante"),
      skill("Rédaction académique", "importante"),
    ],
    source: "https://demo.acadmatch.fr/formations/master-sciences-po-vergnac",
    demo: true,
  },
  {
    id: "f-maths-appliquees-aubine",
    name: "Licence 3 Mathématiques Appliquées",
    institution: "Université Sainte-Aubine",
    level: "Licence 3",
    field: "Mathématiques",
    city: "Strasbourg",
    description:
      "Dernière année de licence en mathématiques appliquées, avec une ouverture vers la programmation scientifique.",
    requiredLevel: "Licence 2",
    language: "Français",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 2", label: "Licence 2 validée ou équivalent" },
      { id: "r2", type: "domaine", value: "Mathématiques", label: "Parcours en Mathématiques" },
    ],
    coreCourses: [
      course("Analyse", "essentielle"),
      course("Algèbre linéaire", "essentielle"),
      course("Probabilités", "importante"),
      course("Statistiques", "importante"),
      course("Programmation scientifique", "utile"),
    ],
    skills: [
      skill("Python", "importante"),
      skill("Rigueur mathématique", "essentielle"),
      skill("Algèbre", "importante"),
    ],
    source: "https://demo.acadmatch.fr/formations/licence-maths-appliquees-aubine",
    demo: true,
  },
  {
    id: "f-maths-fondamentales-orvault",
    name: "Master 1 Mathématiques Fondamentales",
    institution: "Université d'Orvault",
    level: "Master 1",
    field: "Mathématiques",
    city: "Rennes",
    description:
      "Approfondissement théorique en analyse, algèbre et probabilités, en vue d'une poursuite en recherche ou agrégation.",
    requiredLevel: "Licence 3",
    language: "Français",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence validée (L3) ou équivalent" },
      { id: "r2", type: "domaine", value: "Mathématiques", label: "Licence en Mathématiques" },
      { id: "r3", type: "matiere", value: "Analyse", label: "Bases solides en analyse et algèbre" },
    ],
    coreCourses: [
      // Pas d'alias "Analyse" ici : ce terme seul est trop générique et
      // matcherait aussi "Analyse de données" ou "Analyse financière", qui
      // sont des matières sans rapport (voir lib/matching/engine.ts).
      course("Analyse fonctionnelle", "essentielle"),
      course("Algèbre linéaire", "essentielle"),
      course("Probabilités", "importante"),
      course("Topologie", "utile"),
    ],
    skills: [
      skill("Rigueur mathématique", "essentielle"),
      skill("Rédaction académique", "utile"),
    ],
    source: "https://demo.acadmatch.fr/formations/master-maths-fondamentales-orvault",
    demo: true,
  },
  {
    id: "f-management-numerique-nantes",
    name: "Master 1 Management de Projets Numériques",
    institution: "École de Commerce Atlantique",
    level: "Master 1",
    field: "Économie & Gestion",
    city: "Nantes",
    description:
      "Formation à la croisée du management et du numérique : conduite de projet, transformation digitale, SI.",
    requiredLevel: "Licence 3",
    language: "Français",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence validée (L3) ou équivalent" },
      { id: "r2", type: "domaine", value: "Économie & Gestion", label: "Licence en Gestion, Économie ou Informatique" },
    ],
    coreCourses: [
      course("Gestion de projet", "essentielle"),
      course("Transformation digitale", "importante"),
      course("Systèmes d'information", "importante"),
      course("Marketing digital", "utile"),
      course("Analyse de données", "utile"),
    ],
    skills: [
      skill("Gestion de projet", "essentielle"),
      skill("Excel", "importante"),
      skill("Communication", "importante"),
      skill("Analyse de données", "utile"),
    ],
    source: "https://demo.acadmatch.fr/formations/master-management-numerique-nantes",
    demo: true,
  },
  {
    id: "f-finance-entreprise-paris",
    name: "Master 1 Finance d'Entreprise",
    institution: "École Supérieure de Commerce de la Seine",
    level: "Master 1",
    field: "Économie & Gestion",
    city: "Paris",
    description:
      "Formation en finance d'entreprise : analyse financière, évaluation d'entreprise et marchés de capitaux.",
    requiredLevel: "Licence 3",
    language: "Français",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence validée (L3) ou équivalent" },
      { id: "r2", type: "domaine", value: "Économie & Gestion", label: "Licence en Économie, Gestion ou Finance" },
      { id: "r3", type: "competence", value: "Analyse de données", label: "Bases en analyse de données financières" },
    ],
    coreCourses: [
      course("Analyse financière", "essentielle"),
      course("Évaluation d'entreprise", "essentielle"),
      course("Marchés de capitaux", "importante"),
      course("Comptabilité", "importante"),
    ],
    skills: [
      skill("Excel", "essentielle"),
      skill("Analyse de données", "essentielle"),
      skill("Anglais courant", "importante"),
      skill("Économétrie", "utile"),
    ],
    source: "https://demo.acadmatch.fr/formations/master-finance-entreprise-paris",
    demo: true,
  },
  {
    id: "f-sciences-physiques-rennes",
    name: "Licence 3 Sciences Physiques",
    institution: "Faculté des Sciences de Rennes-Verrières",
    level: "Licence 3",
    field: "Sciences fondamentales",
    city: "Rennes",
    description:
      "Dernière année de licence généraliste en sciences physiques, avec travaux pratiques et initiation à la recherche.",
    requiredLevel: "Licence 2",
    language: "Français",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 2", label: "Licence 2 validée ou équivalent" },
      {
        id: "r2",
        type: "domaine",
        value: "Sciences fondamentales",
        label: "Parcours en Sciences (Physique, Chimie) ou Mathématiques",
      },
    ],
    coreCourses: [
      course("Physique générale", "essentielle"),
      course("Mécanique", "essentielle"),
      course("Chimie générale", "importante"),
      course("Optique", "utile"),
      course("Méthodologie expérimentale", "importante"),
    ],
    skills: [
      skill("Rigueur scientifique", "essentielle"),
      skill("Expérimentation", "importante"),
      skill("Python", "utile"),
    ],
    source: "https://demo.acadmatch.fr/formations/licence-sciences-physiques-rennes",
    demo: true,
  },
  {
    id: "f-data-engineering-lyon",
    name: "Master 1 Data Engineering",
    institution: "Lyon Institute of Technology",
    level: "Master 1",
    field: "Data Science & IA",
    city: "Lyon",
    description:
      "Programme enseigné en anglais, centré sur l'ingénierie des données : bases de données, statistiques appliquées et calcul distribué.",
    requiredLevel: "Licence 3",
    language: "Anglais",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence validée (L3) ou équivalent" },
      { id: "r2", type: "domaine", value: "Informatique", label: "Licence en Informatique, Mathématiques ou Data Science" },
      { id: "r3", type: "competence", value: "Python", label: "Programmation Python exigée" },
    ],
    // Intitulés volontairement en anglais, avec alias français explicites,
    // pour illustrer la reconnaissance de correspondances inter-langues
    // (voir la spécification : "Probabilités" ↔ "Probability", etc.).
    coreCourses: [
      course("Database Systems", "essentielle", ["Base de données", "Bases de données"]),
      course("Probability", "essentielle", ["Probabilités"]),
      course("Statistical Methods", "essentielle", ["Statistiques"]),
      course("Machine Learning", "importante", ["Apprentissage automatique"]),
      course("Distributed Computing", "utile"),
    ],
    skills: [
      skill("Python", "essentielle"),
      skill("SQL", "importante"),
      skill("Anglais courant", "essentielle"),
    ],
    source: "https://demo.acadmatch.fr/formations/master-data-engineering-lyon",
    demo: true,
  },
];

export function getFormationById(id: string): Formation | undefined {
  return FORMATIONS.find((formation) => formation.id === id);
}
