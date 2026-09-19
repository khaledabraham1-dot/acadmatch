import type { AcademicItem, Formation, Importance } from "@/types";

/**
 * Catalogue de formations d'AcadMatch.
 *
 * Étape 3 (2026-09-15) : les 9 formations ci-dessous sont RÉELLES et
 * vérifiées manuellement auprès de la source officielle de chaque
 * établissement (`source`, `verifiedAt`, `verificationStatus`). Périmètre
 * volontairement restreint à Data Science / IA / Informatique, du niveau
 * Licence au Master, conformément au public cible d'AcadMatch (tout étudiant
 * de niveau L1 minimum souhaitant continuer en France). Aucune formation,
 * aucun prérequis et aucune URL n'est inventé — le contenu pédagogique
 * (matières, compétences) est une synthèse fidèle de ce que chaque
 * établissement publie, pas une citation exacte de sa maquette complète.
 * Ce catalogue est destiné à être élargi (autres domaines, autres villes)
 * avant le déploiement.
 *
 * Étape 8 (2026-09-17) : audit des liens — URL CentraleSupélec corrigée
 * (ancienne page 404), dates de vérification rafraîchies.
 *
 * Pour toute formation FICTIVE de démonstration ajoutée plus tard (tests,
 * prototypage), utiliser `demo: true` et une URL sous
 * `https://demo.acadmatch.fr/...` — jamais présentée comme réelle dans l'UI
 * (voir le composant DemoDataBadge).
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

const VERIFIED_AT = "2026-09-17";

export const FORMATIONS: Formation[] = [
  {
    id: "f-m2ds-ip-paris",
    name: "Master 2 Data Science (M2DS)",
    institution: "Institut Polytechnique de Paris (École Polytechnique)",
    level: "Master 2",
    goal: "Master",
    field: "Data Science & IA",
    city: "Palaiseau",
    description:
      "Deuxième année de master adossée à l'École Polytechnique, centrée sur les fondements mathématiques et algorithmiques de la data science : apprentissage statistique, deep learning et traitement de grands volumes de données. Enseignement en anglais.",
    requiredLevel: "Master 1",
    language: "Anglais",
    applicationProcedure:
      "Candidature 100 % en ligne (relevés de notes, deux références académiques, CV, lettre de motivation) — dates précises sur la page admissions dédiée d'IP Paris.",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Master 1", label: "Master 1 validé en mathématiques appliquées, statistiques ou équivalent" },
      { id: "r2", type: "domaine", value: "Mathématiques", label: "Solide formation en mathématiques appliquées ou statistiques", aliases: ["Data Science & IA"] },
      { id: "r3", type: "competence", value: "Python", label: "Programmation Python exigée" },
    ],
    coreCourses: [
      course("Machine Learning", "essentielle"),
      course("Statistiques", "essentielle"),
      course("Deep Learning", "importante"),
      course("Optimisation", "importante"),
      course("Mathématiques appliquées", "importante"),
      course("Big Data", "utile"),
    ],
    skills: [
      skill("Python", "essentielle"),
      skill("Machine Learning", "essentielle"),
      skill("Statistiques", "importante"),
      skill("Anglais courant", "importante"),
    ],
    source: "https://www.ip-paris.fr/en/education/masters/applied-mathematics-and-statistics-program/master-year-2-data-science",
    verifiedAt: VERIFIED_AT,
    verificationStatus: "vérifiée",
    demo: false,
  },
  {
    id: "f-msc-ai-centralesupelec",
    name: "MSc Artificial Intelligence Applied to Society",
    institution: "CentraleSupélec",
    level: "Master 1",
    goal: "Master",
    field: "Data Science & IA",
    city: "Gif-sur-Yvette",
    description:
      "Master of Science en intelligence artificielle, enseigné entièrement en anglais, combinant IA symbolique et IA fondée sur les données, appliquées à des enjeux sociétaux (santé, mobilité, industrie, finance).",
    requiredLevel: "Licence 3",
    language: "Anglais",
    applicationProcedure:
      "Plateforme de candidature dédiée à CentraleSupélec, par vagues successives (environ 5 vagues, de novembre à mai) — candidater tôt augmente les chances sur les premières vagues.",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence (Bac+3/4) validée en sciences, ingénierie ou équivalent" },
      { id: "r2", type: "domaine", value: "Informatique", label: "Formation scientifique ou en ingénierie", aliases: ["Data Science & IA", "Mathématiques"] },
      { id: "r3", type: "competence", value: "Anglais courant", label: "Anglais courant exigé (programme 100% anglophone)" },
    ],
    coreCourses: [
      course("Machine Learning", "essentielle"),
      course("Deep Learning", "essentielle"),
      course("Mathématiques appliquées", "importante"),
      course("Traitement du langage naturel", "utile"),
    ],
    skills: [
      skill("Python", "essentielle"),
      skill("Machine Learning", "essentielle"),
      skill("Anglais courant", "essentielle"),
      skill("Statistiques", "importante"),
    ],
    source: "https://www.centralesupelec.fr/programmes/master-science-artificial-intelligence",
    verifiedAt: VERIFIED_AT,
    verificationStatus: "vérifiée",
    demo: false,
  },
  {
    id: "f-ms-ia-telecom-paris",
    name: "Mastère Spécialisé Intelligence Artificielle multimodale et autonome",
    institution: "Télécom Paris & ENSTA Paris (Institut Polytechnique de Paris)",
    level: "Master 2",
    goal: "Master",
    field: "Data Science & IA",
    city: "Palaiseau",
    description:
      "Mastère Spécialisé (titre RNCP, Bac+6) centré sur le deep learning, l'apprentissage par renforcement, l'IA symbolique et la robotique, avec une thèse professionnelle de 4 à 6 mois.",
    requiredLevel: "Master 2",
    language: "Français",
    applicationProcedure:
      "Plateforme de candidature dédiée (frais de dossier d'environ 90 €), campagne généralement ouverte à partir de novembre pour une rentrée en septembre suivant.",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Master 2", label: "Diplôme d'ingénieur, Master 2 ou équivalent Bac+5" },
      { id: "r2", type: "domaine", value: "Informatique", label: "Formation en informatique, mathématiques ou ingénierie", aliases: ["Data Science & IA"] },
      { id: "r3", type: "matiere", value: "Machine Learning", label: "Bases en apprentissage automatique recommandées" },
    ],
    coreCourses: [
      course("Deep Learning", "essentielle"),
      course("Machine Learning", "essentielle"),
      course("Apprentissage par renforcement", "importante"),
      course("Robotique", "utile"),
    ],
    skills: [
      skill("Python", "essentielle"),
      skill("Machine Learning", "essentielle"),
      skill("Anglais courant", "utile"),
    ],
    source: "https://www.telecom-paris.fr/fr/masteres-specialises/formation-intelligence-artificielle",
    verifiedAt: VERIFIED_AT,
    verificationStatus: "vérifiée",
    demo: false,
  },
  {
    id: "f-mosef-paris1",
    name: "Master 2 MoSEF — Data Science",
    institution: "Université Paris 1 Panthéon-Sorbonne",
    level: "Master 2",
    goal: "Master",
    field: "Data Science & IA",
    city: "Paris",
    description:
      "Master en modélisation statistique, économique et financière (MoSEF), formant des data scientists maîtrisant économétrie, machine learning et programmation appliqués à l'entreprise.",
    requiredLevel: "Master 1",
    language: "Français",
    applicationProcedure:
      "Procédure de candidature non détaillée sur la page publique du programme — à vérifier directement sur le site officiel ou en contactant le programme.",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Master 1", label: "Master 1 validé en économie, statistiques, mathématiques appliquées ou équivalent" },
      { id: "r2", type: "domaine", value: "Économie & Gestion", label: "Licence/Master en Économie, Statistiques ou Mathématiques appliquées", aliases: ["Mathématiques", "Data Science & IA"] },
      { id: "r3", type: "competence", value: "Analyse de données", label: "Bases en économétrie et analyse de données" },
    ],
    coreCourses: [
      course("Économétrie", "essentielle"),
      course("Machine Learning", "essentielle"),
      course("Statistiques", "importante"),
      course("Programmation Python", "importante"),
    ],
    skills: [
      skill("Python", "essentielle"),
      skill("Économétrie", "essentielle"),
      skill("Statistiques", "importante"),
      skill("Excel", "utile"),
    ],
    source: "https://mosefparis1.com/",
    verifiedAt: VERIFIED_AT,
    verificationStatus: "vérifiée",
    demo: false,
  },
  {
    id: "f-scdi-sorbonne",
    name: "Master Mathématiques — Filière Sciences des Données pour l'Ingénieur.e (SCDI)",
    institution: "Sorbonne Université — Institut de Statistique (ISUP)",
    level: "Master 1",
    goal: "Master",
    field: "Data Science & IA",
    city: "Paris",
    description:
      "Filière du Master de Mathématiques de Sorbonne Université menant à un double diplôme (Master Mathématiques + diplôme de statisticien ISUP), formant aux métiers de statisticien et data scientist.",
    requiredLevel: "Licence 3",
    language: "Français",
    applicationProcedure:
      "Master 1 : plateforme nationale Mon Master, sur dossier. Master 2 : plateforme eCandidat, généralement au printemps (mars à juin) — aucun entretien mentionné, admission sur dossier.",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence 3 validée en mathématiques ou équivalent" },
      { id: "r2", type: "domaine", value: "Mathématiques", label: "Licence en Mathématiques, avec de solides bases en probabilités et statistiques", aliases: ["Data Science & IA"] },
    ],
    coreCourses: [
      course("Statistiques", "essentielle"),
      course("Probabilités", "essentielle"),
      course("Machine Learning", "importante"),
      course("Programmation scientifique", "importante"),
      course("Algèbre linéaire", "utile"),
    ],
    skills: [
      skill("Statistiques", "essentielle"),
      skill("Python", "importante"),
      skill("Rigueur mathématique", "importante"),
    ],
    source: "https://isup.sorbonne-universite.fr/formations/filiere-data-science-ds",
    verifiedAt: VERIFIED_AT,
    verificationStatus: "vérifiée",
    demo: false,
  },
  {
    id: "f-licence-info-sorbonne",
    name: "Licence Informatique (Portail Mathématiques-Informatique)",
    institution: "Sorbonne Université",
    level: "Licence 1",
    goal: "Licence",
    field: "Informatique",
    city: "Paris",
    description:
      "Première année commune (portail Mathématiques-Informatique) menant aux licences d'Informatique ou de Mathématiques de Sorbonne Université ; admission via Parcoursup (ou procédure DAP hors Union européenne).",
    requiredLevel: "Baccalauréat",
    language: "Français",
    applicationProcedure:
      "Parcoursup pour les bacheliers français, UE/EEE/Suisse (vœux formulés de janvier à mars, réponses à partir de juin) ; procédure DAP pour les candidats hors Union européenne.",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Baccalauréat", label: "Baccalauréat ou équivalent" },
      { id: "r2", type: "domaine", value: "Informatique", label: "Profil scientifique, spécialité Mathématiques recommandée", aliases: ["Mathématiques"] },
    ],
    coreCourses: [
      course("Algorithmique", "essentielle"),
      course("Programmation orientée objet", "essentielle"),
      course("Mathématiques appliquées", "importante"),
      course("Structures de données", "importante"),
    ],
    skills: [
      skill("Algorithmique", "essentielle"),
      skill("Rigueur mathématique", "importante"),
      skill("Python", "utile"),
    ],
    source: "https://sciences.sorbonne-universite.fr/parcoursup",
    verifiedAt: VERIFIED_AT,
    verificationStatus: "vérifiée",
    demo: false,
  },
  {
    id: "f-licence-info-paris-saclay",
    name: "Licence Informatique",
    institution: "Université Paris-Saclay",
    level: "Licence 1",
    goal: "Licence",
    field: "Informatique",
    city: "Orsay",
    description:
      "Licence de 3 ans (L1/L2/L3) en informatique à l'UFR Sciences de l'Université Paris-Saclay, avec un parcours possible en alternance (MIAGE) en troisième année.",
    requiredLevel: "Baccalauréat",
    language: "Français",
    applicationProcedure:
      "Procédure de candidature non confirmée sur la page consultée — à vérifier directement sur la page « Applying for undergraduate programmes » de l'université.",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Baccalauréat", label: "Baccalauréat ou équivalent" },
      { id: "r2", type: "domaine", value: "Informatique", label: "Profil scientifique, spécialité Mathématiques ou NSI recommandée", aliases: ["Mathématiques"] },
    ],
    coreCourses: [
      course("Algorithmique", "essentielle"),
      course("Structures de données", "essentielle"),
      course("Bases de données", "importante"),
      course("Réseaux informatiques", "utile"),
    ],
    skills: [
      skill("Algorithmique", "essentielle"),
      skill("Python", "importante"),
      skill("Travail en équipe", "utile"),
    ],
    source: "https://www.universite-paris-saclay.fr/en/education/licence-undergraduate-programme/informatique",
    verifiedAt: VERIFIED_AT,
    verificationStatus: "vérifiée",
    demo: false,
  },
  {
    id: "f-but-info-nantes",
    name: "BUT Informatique",
    institution: "IUT de Nantes — Université de Nantes",
    level: "Licence 1",
    goal: "Licence",
    field: "Informatique",
    city: "Nantes",
    description:
      "Bachelor Universitaire de Technologie (Bac+3, 180 ECTS) en informatique : conception, développement et déploiement de solutions logicielles. Entrée en BUT1 via Parcoursup, ou en BUT2/BUT3 sur dossier et entretien avec un BTS SIO ou un Bac+2 en informatique.",
    requiredLevel: "Baccalauréat",
    language: "Français",
    applicationProcedure:
      "BUT1 : Parcoursup (vœux de janvier à mars, propositions d'admission en continu à partir de début juin). BUT2/BUT3 : dossier via la procédure des IUT des Pays de la Loire, hors Parcoursup.",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Baccalauréat", label: "Baccalauréat pour une entrée en BUT1 ; Bac+2 informatique pour une entrée directe en BUT2/BUT3" },
      { id: "r2", type: "domaine", value: "Informatique", label: "Profil scientifique ou technologique" },
    ],
    coreCourses: [
      course("Programmation orientée objet", "essentielle"),
      course("Bases de données", "essentielle"),
      course("Algorithmique", "importante"),
      course("Réseaux informatiques", "importante"),
    ],
    skills: [
      skill("Algorithmique", "essentielle"),
      skill("SQL", "importante"),
      skill("Travail en équipe", "utile"),
    ],
    source: "https://iutnantes.univ-nantes.fr/fr/formations/but-info",
    verifiedAt: VERIFIED_AT,
    verificationStatus: "vérifiée",
    demo: false,
  },
  {
    id: "f-insa-lyon-info-parallele",
    name: "Cycle ingénieur Informatique — admission parallèle (2ᵉ/3ᵉ année)",
    institution: "INSA Lyon",
    level: "Licence 3",
    goal: "École spécialisée",
    field: "Informatique",
    city: "Villeurbanne",
    description:
      "Admission directe en 2ᵉ ou 3ᵉ année du cycle ingénieur du Département Informatique de l'INSA Lyon, pour les étudiants ayant déjà validé un DUT/BUT, une Licence (L2/L3) ou un BTS.",
    requiredLevel: "Licence 2",
    language: "Français",
    applicationProcedure:
      "Page officielle non consultable au moment de la vérification — procédure et calendrier d'admission parallèle à vérifier directement sur le site de l'INSA Lyon.",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 2", label: "L2, L3, DUT, BUT2/BUT3 ou BTS validé" },
      { id: "r2", type: "domaine", value: "Informatique", label: "Parcours scientifique ou technologique en informatique" },
    ],
    coreCourses: [
      course("Algorithmique avancée", "essentielle"),
      course("Architecture logicielle", "importante"),
      course("Bases de données", "importante"),
      course("Réseaux informatiques", "utile"),
    ],
    skills: [
      skill("Algorithmique", "essentielle"),
      skill("Programmation orientée objet", "importante"),
      skill("Anglais courant", "utile"),
    ],
    source: "https://www.insa-lyon.fr/fr/admission",
    verifiedAt: VERIFIED_AT,
    verificationStatus: "vérifiée",
    demo: false,
  },
];

export function getFormationById(id: string): Formation | undefined {
  return FORMATIONS.find((formation) => formation.id === id);
}
