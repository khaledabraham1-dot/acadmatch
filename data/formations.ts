import type { AcademicItem, Importance, StudyProgram } from "@/types";

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
 * Post-MVP, phase 3 (2026-09-21) : première formation hors France (UCLouvain,
 * Belgique) — voir docs/data-sourcing.md pour le processus de vérification
 * suivi, identique quel que soit le pays. Volontairement une seule fiche
 * pour l'instant : cette phase valide l'architecture internationale
 * (`StudyProgram`/`Institution`, phase 1) sur un vrai cas étranger avant
 * d'élargir le catalogue belge.
 *
 * Élargissement du catalogue (2026-09-27) : ouverture domaine par domaine,
 * 2 licences + 3 masters par domaine, plusieurs villes — Économie & Gestion
 * d'abord (TSE, Aix-Marseille, iaelyon, UCLouvain LSM), puis Sciences de
 * l'ingénieur (Strasbourg, ULiège, Sorbonne, Lille, Centrale Nantes), puis
 * Droit (Bordeaux, ULB, Strasbourg, Aix-Marseille, Toulouse). Chaque fiche ajoutée
 * a aussi ses frais sourcés dans data/budget.ts (un test l'impose).
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

export const FORMATIONS: StudyProgram[] = [
  {
    id: "f-m2ds-ip-paris",
    name: "Master 2 Data Science (M2DS)",
    institution: { name: "Institut Polytechnique de Paris (École Polytechnique)", city: "Palaiseau", country: "France" },
    level: "Master 2",
    goal: "Master",
    field: "Data Science & IA",
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
    institution: { name: "CentraleSupélec", city: "Gif-sur-Yvette", country: "France" },
    level: "Master 1",
    goal: "Master",
    field: "Data Science & IA",
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
    institution: {
      name: "Télécom Paris & ENSTA Paris (Institut Polytechnique de Paris)",
      city: "Palaiseau",
      country: "France",
    },
    level: "Master 2",
    goal: "Master",
    field: "Data Science & IA",
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
    institution: { name: "Université Paris 1 Panthéon-Sorbonne", city: "Paris", country: "France" },
    level: "Master 2",
    goal: "Master",
    field: "Data Science & IA",
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
    institution: { name: "Sorbonne Université — Institut de Statistique (ISUP)", city: "Paris", country: "France" },
    level: "Master 1",
    goal: "Master",
    field: "Data Science & IA",
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
    institution: { name: "Sorbonne Université", city: "Paris", country: "France" },
    level: "Licence 1",
    goal: "Licence",
    field: "Informatique",
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
    institution: { name: "Université Paris-Saclay", city: "Orsay", country: "France" },
    level: "Licence 1",
    goal: "Licence",
    field: "Informatique",
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
    institution: { name: "IUT de Nantes — Université de Nantes", city: "Nantes", country: "France" },
    level: "Licence 1",
    goal: "Licence",
    field: "Informatique",
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
    institution: { name: "INSA Lyon", city: "Villeurbanne", country: "France" },
    level: "Licence 3",
    goal: "École spécialisée",
    field: "Informatique",
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
  {
    id: "f-date-uclouvain",
    name: "Master en Data Science Engineering",
    institution: {
      name: "UCLouvain — Louvain School of Engineering (EPL)",
      city: "Louvain-la-Neuve",
      country: "Belgique",
    },
    level: "Master 1",
    goal: "Master",
    field: "Data Science & IA",
    description:
      "Master de 2 ans (120 crédits ECTS) combinant mathématiques, statistiques et informatique pour l'analyse et le traitement de données à grande échelle, avec un choix de spécialisation entre analyse de données et cybersécurité. Enseignement entièrement en anglais.",
    requiredLevel: "Licence 3",
    language: "Anglais",
    applicationProcedure:
      "Candidature en ligne via le portail d'inscription de l'UCLouvain. Selon le diplôme d'origine : accès direct, accès conditionnel (jusqu'à 60 crédits complémentaires) ou refus — aucune période de candidature précise n'est indiquée sur la page consultée. Certificat de langue anglaise exigé pour les diplômes non belges.",
    prerequisites: [
      {
        id: "r1",
        type: "niveau",
        value: "Licence 3",
        label: "Bachelier ou master validé, accès direct pour les bacheliers en sciences de l'ingénieur",
      },
      {
        id: "r2",
        type: "domaine",
        value: "Informatique",
        label: "Solides bases en mathématiques, statistiques et informatique",
        aliases: ["Data Science & IA", "Mathématiques"],
      },
      {
        id: "r3",
        type: "competence",
        value: "Anglais courant",
        label: "Programme entièrement en anglais ; certificat de langue exigé pour les diplômes non belges",
      },
    ],
    coreCourses: [
      course("Bases de données", "essentielle"),
      course("Machine Learning", "essentielle"),
      course("Statistiques", "essentielle"),
      course("Cybersécurité", "utile", ["Cryptographie", "Sécurité informatique"]),
    ],
    skills: [
      skill("Machine Learning", "essentielle"),
      skill("Statistiques", "essentielle"),
      skill("Anglais courant", "essentielle"),
    ],
    source: "https://uclouvain.be/en-prog-2026-date2m",
    verifiedAt: "2026-09-21",
    verificationStatus: "vérifiée",
    demo: false,
  },
  {
    id: "f-mosig-grenoble-inp",
    name: "Master of Science in Informatics at Grenoble (MoSIG)",
    institution: {
      name: "Grenoble INP — Ensimag, Université Grenoble Alpes",
      city: "Grenoble",
      country: "France",
    },
    level: "Master 1",
    goal: "Master",
    field: "Informatique",
    description:
      "Master of Science international de 2 ans (LMD), entièrement en anglais, à Grenoble INP — Ensimag, avec deux spécialisations possibles : Cloud Computing & Data Infrastructures, ou IA appliquée et systèmes interactifs.",
    requiredLevel: "Licence 3",
    language: "Anglais",
    applicationProcedure:
      "Candidature en ligne sur la plateforme dédiée de Grenoble INP (applicationform.grenoble-inp.fr), généralement ouverte de mi-janvier à fin avril pour une rentrée en septembre ; dossier à déposer avant fin mars en cas de procédure de visa Études en France.",
    prerequisites: [
      {
        id: "r1",
        type: "niveau",
        value: "Licence 3",
        label: "Licence (Bac+3) ou Bac+4 en sciences ou ingénierie, avec des cours d'informatique",
      },
      {
        id: "r2",
        type: "domaine",
        value: "Informatique",
        label: "Solide pratique de la programmation (C/C++/Java), algorithmique, systèmes d'exploitation et bases de données",
        aliases: ["Data Science & IA"],
      },
      {
        id: "r3",
        type: "competence",
        value: "Anglais courant",
        label: "Programme entièrement en anglais",
      },
    ],
    coreCourses: [
      course("Algorithmique", "essentielle"),
      course("Bases de données", "essentielle"),
      course("Systèmes d'exploitation", "importante"),
      course("Génie logiciel", "importante"),
      // Une des deux spécialisations de 3e semestre confirmées sur la page
      // officielle (l'autre, Cloud Computing & Data Infrastructures, est déjà
      // couverte par "Bases de données"/"Systèmes d'exploitation" ci-dessus).
      // Sans cet item, un profil orienté IA obtenait un score de contenu
      // artificiellement bas pour une formation qui propose pourtant cette
      // spécialisation (trouvé lors de l'audit Phase 7).
      course("Intelligence Artificielle", "utile", ["IA", "Machine Learning"]),
    ],
    skills: [
      skill("Programmation", "essentielle"),
      skill("Bases de données", "importante"),
      skill("Anglais courant", "essentielle"),
    ],
    source: "https://ensimag.grenoble-inp.fr/fr/formation/master-of-science-in-informatics-at-grenoble",
    verifiedAt: "2026-09-21",
    verificationStatus: "vérifiée",
    demo: false,
  },
  {
    id: "f-licence-info-toulouse",
    name: "Licence mention Informatique",
    institution: {
      name: "Université de Toulouse (ex-Université Toulouse III – Paul Sabatier)",
      city: "Toulouse",
      country: "France",
    },
    level: "Licence 1",
    goal: "Licence",
    field: "Informatique",
    description:
      "Licence de 3 ans combinant fondamentaux théoriques et applications pratiques en informatique, avec plusieurs parcours (généraliste, réseaux et télécoms, double licence mathématiques-informatique) ; environ 80 % des débouchés professionnels visent un niveau Bac+5.",
    requiredLevel: "Baccalauréat",
    language: "Français",
    applicationProcedure:
      "Parcoursup, vœux formulés de janvier à mars pour une entrée en L1 ; le parcours double licence mathématiques-informatique (MIDL) est sélectif, à capacité limitée.",
    prerequisites: [
      {
        id: "r1",
        type: "niveau",
        value: "Baccalauréat",
        label: "Baccalauréat général, technologique ou professionnel, ou équivalent",
      },
      {
        id: "r2",
        type: "domaine",
        value: "Informatique",
        label: "Profil scientifique ; spécialités Mathématiques ou NSI valorisées",
        aliases: ["Mathématiques"],
      },
    ],
    coreCourses: [
      course("Algorithmique", "essentielle"),
      course("Programmation", "essentielle"),
      course("Mathématiques appliquées", "importante"),
    ],
    skills: [skill("Algorithmique", "essentielle"), skill("Rigueur mathématique", "importante")],
    source: "https://www.utoulouse.fr/licence-mention-informatique",
    verifiedAt: "2026-09-21",
    verificationStatus: "vérifiée",
    demo: false,
  },
  {
    id: "f-ing-info-enseirb-matmeca",
    name: "Ingénieur spécialité Informatique — admission sur titre (BUT/Licence)",
    institution: { name: "ENSEIRB-MATMECA — Bordeaux INP", city: "Talence", country: "France" },
    level: "Licence 3",
    goal: "École spécialisée",
    field: "Informatique",
    description:
      "Diplôme d'ingénieur en informatique de Bordeaux INP (Bac+5, 3 ans), admission sur titre en 1ʳᵉ année pour les titulaires d'une Licence ou d'un BUT. Spécialisations en 3ᵉ année : calcul intensif et sciences de données, robotique et apprentissage, intelligence artificielle, ou génie logiciel et cybersécurité. Stages (12 mois cumulés) et mobilité internationale (minimum 17 semaines) obligatoires.",
    requiredLevel: "Licence 2",
    language: "Français",
    applicationProcedure:
      "Admission sur titre via la plateforme eCandidat de Bordeaux INP, généralement de mars à mai pour une entrée en septembre ; réservée aux titulaires d'une Licence, d'un BUT ou d'une ATS selon les filières.",
    prerequisites: [
      {
        id: "r1",
        type: "niveau",
        value: "Licence 2",
        label: "Licence, BUT ou ATS validé(e) (Bac+2 minimum)",
      },
      {
        id: "r2",
        type: "domaine",
        value: "Informatique",
        label: "Parcours scientifique ou technologique en informatique",
      },
    ],
    coreCourses: [
      course("Algorithmique", "essentielle"),
      course("Bases de données", "importante"),
      course("Systèmes d'exploitation", "importante"),
      course("Génie logiciel", "importante"),
    ],
    skills: [skill("Programmation orientée objet", "essentielle"), skill("Anglais courant", "utile")],
    source: "https://formation.bordeaux-inp.fr/fr/offre-de-formation/titre-d-ingenieur-DING/ingenieur-specialite-informatique-LUMF0005.html",
    verifiedAt: "2026-09-21",
    verificationStatus: "vérifiée",
    demo: false,
  },

  // -------------------------------------------------------------------------
  // Économie & Gestion — ajoutées et vérifiées le 2026-09-27 (élargissement du
  // catalogue : 2 licences + 3 masters par domaine, plusieurs villes).
  // -------------------------------------------------------------------------
  {
    id: "f-licence-eco-gestion-tse",
    name: "Licence Économie — parcours Économie et Gestion (L1-L2)",
    institution: { name: "Université Toulouse Capitole — Toulouse School of Economics (TSE)", city: "Toulouse", country: "France" },
    level: "Licence 1",
    goal: "Licence",
    field: "Économie & Gestion",
    description:
      "Cycle préparatoire de deux ans de Toulouse School of Economics, avec mathématiques renforcées : formation de base solide en sciences économiques et de gestion (microéconomie et macroéconomie, mathématiques, statistiques, économétrie, gestion), menant aux L3 puis aux masters de TSE et de Toulouse School of Management.",
    requiredLevel: "Baccalauréat",
    language: "Français",
    applicationProcedure:
      "L1 : Parcoursup pour les bacheliers (vœux de janvier à mars) ; procédure DAP pour les candidats hors Union européenne. Les titulaires d'un diplôme étranger peuvent aussi candidater directement en L2, sur dossier.",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Baccalauréat", label: "Baccalauréat ou équivalent" },
      {
        id: "r2",
        type: "domaine",
        value: "Économie & Gestion",
        label: "Mathématiques conservées en terminale recommandées (spécialité ou option)",
        aliases: ["Mathématiques"],
      },
    ],
    coreCourses: [
      course("Microéconomie", "essentielle"),
      course("Macroéconomie", "essentielle"),
      course("Mathématiques appliquées", "importante"),
      course("Statistiques", "importante"),
      course("Économétrie", "utile"),
    ],
    skills: [skill("Rigueur mathématique", "importante"), skill("Analyse de données", "utile")],
    source: "https://www.ut-capitole.fr/accueil/formations/nos-diplomes/licences/licence-l1-l2-mention-economie-parcours-type-economie-et-gestion",
    verifiedAt: "2026-09-27",
    verificationStatus: "vérifiée",
    demo: false,
  },
  {
    id: "f-licence-eco-gestion-amu",
    name: "Licence Économie et Gestion — L1 portail commun",
    institution: { name: "Aix-Marseille Université — Faculté d'Économie et de Gestion", city: "Aix-en-Provence", country: "France" },
    level: "Licence 1",
    goal: "Licence",
    field: "Économie & Gestion",
    description:
      "Première année commune (économie-gestion, gestion, AES) sur les sites d'Aix-en-Provence et de Marseille, puis spécialisation progressive dès le 2e semestre, avec un cursus international optionnel en anglais ; objectif principal : la poursuite en master d'économie ou de gestion.",
    requiredLevel: "Baccalauréat",
    language: "Français",
    applicationProcedure:
      "Parcoursup pour les bacheliers (vœux de janvier à mars) ; procédure DAP pour les candidats hors Union européenne.",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Baccalauréat", label: "Baccalauréat général ou équivalent" },
      {
        id: "r2",
        type: "domaine",
        value: "Économie & Gestion",
        label: "Intérêt marqué pour les questions économiques, sociales et managériales",
        aliases: ["Mathématiques", "Sciences politiques"],
      },
    ],
    coreCourses: [
      course("Microéconomie", "essentielle"),
      course("Mathématiques appliquées", "importante"),
      course("Macroéconomie", "importante"),
      course("Statistiques", "importante"),
      course("Comptabilité", "utile"),
      course("Marketing", "utile"),
    ],
    skills: [skill("Analyse de données", "utile"), skill("Rigueur mathématique", "utile")],
    source: "https://feg.univ-amu.fr/en/study-programs/bachelors/l1-economics-management-common-portal",
    verifiedAt: "2026-09-27",
    verificationStatus: "vérifiée",
    demo: false,
  },
  {
    id: "f-m1-economics-tse",
    name: "Master 1 Economics (parcours international)",
    institution: { name: "Université Toulouse Capitole — Toulouse School of Economics (TSE)", city: "Toulouse", country: "France" },
    level: "Master 1",
    goal: "Master",
    field: "Économie & Gestion",
    description:
      "Première année de master en économie de Toulouse School of Economics, entièrement en anglais : formation rigoureuse aux grands champs de l'économie (théorie des jeux, incitations, macroéconomie, économétrie appliquée, programmation R, économie publique, évaluation des politiques), ouvrant sur les M2 de TSE.",
    requiredLevel: "Licence 3",
    language: "Anglais",
    applicationProcedure:
      "Sélection sur dossier par le comité de TSE ; programme destiné notamment aux étudiants internationaux non francophones. Plateforme et calendrier de candidature à confirmer sur la page admissions de TSE (non précisés sur la page du programme).",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence (BA/BSc) en économie ou en mathématiques appliquées" },
      {
        id: "r2",
        type: "domaine",
        value: "Économie & Gestion",
        label: "Cursus en économie ou mathématiques appliquées jugé cohérent par le comité de sélection",
        aliases: ["Mathématiques"],
      },
      { id: "r3", type: "competence", value: "Anglais courant", label: "Programme 100 % en anglais" },
    ],
    coreCourses: [
      course("Théorie des jeux", "essentielle", ["Microéconomie"]),
      course("Macroéconomie", "essentielle"),
      course("Économétrie", "essentielle"),
      course("Programmation R", "importante"),
      course("Économie publique", "utile"),
    ],
    skills: [skill("Économétrie", "essentielle"), skill("Anglais courant", "essentielle"), skill("R", "importante")],
    source: "https://www.ut-capitole.fr/home/course-offer/english-taught-courses/masters-degree-1st-year-economics",
    verifiedAt: "2026-09-27",
    verificationStatus: "vérifiée",
    demo: false,
  },
  {
    id: "f-master-finance-ift-lyon3",
    name: "Master Finance — parcours Ingénierie financière et transaction (IFT)",
    institution: { name: "Université Jean Moulin Lyon 3 — iaelyon School of Management", city: "Lyon", country: "France" },
    level: "Master 1",
    goal: "Master",
    field: "Économie & Gestion",
    description:
      "Master de 2 ans formant aux métiers de l'ingénierie financière et du conseil en transaction (fusions-acquisitions, capital-investissement, banque d'investissement, due diligences) : analyse et évaluation financière, analyses comptables approfondies, finance d'entreprise, audit financier appliqué ; promotions de 24 étudiants maximum.",
    requiredLevel: "Licence 3",
    language: "Français",
    applicationProcedure:
      "Master 1 : plateforme nationale Mon Master, sur dossier — résultats académiques, test SIM Score IAE Message (TAGE MAGE ou GMAT tolérés pour les candidats internationaux), test d'anglais (TOEIC, TOEFL, IELTS…), CV et lettre de motivation. Master 2 : eCandidat (Université Lyon 3).",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence ou 180 crédits ECTS dans un diplôme équivalent" },
      {
        id: "r2",
        type: "domaine",
        value: "Économie & Gestion",
        label: "Cursus en sciences de gestion ou compatible (université ou école de management)",
      },
    ],
    coreCourses: [
      course("Analyse financière", "essentielle", ["Analyse et évaluation financière"]),
      course("Finance d'entreprise", "essentielle"),
      course("Comptabilité", "importante", ["Analyses comptables et financières"]),
      course("Audit financier", "importante"),
      course("Stratégie financière", "utile"),
    ],
    skills: [skill("Analyse financière", "essentielle"), skill("Anglais courant", "importante"), skill("Excel", "utile")],
    source: "https://iae.univ-lyon3.fr/master-ingenierie-financiere-et-transaction-ift",
    verifiedAt: "2026-09-27",
    verificationStatus: "vérifiée",
    demo: false,
  },
  {
    id: "f-master-gestion-uclouvain",
    name: "Master [120] en sciences de gestion (Master in Management)",
    institution: {
      name: "UCLouvain — Louvain School of Management (LSM)",
      city: "Louvain-la-Neuve",
      country: "Belgique",
    },
    level: "Master 1",
    goal: "Master",
    field: "Économie & Gestion",
    description:
      "Master de 2 ans (120 crédits ECTS) entièrement en anglais : tronc commun (transition écologique, transformation digitale, responsabilité sociétale), projet de conseil et stage obligatoire d'au moins 60 jours, majeure au choix (finance, marketing, ressources humaines…) et échange possible dans plus de 130 universités partenaires.",
    requiredLevel: "Licence 3",
    language: "Anglais",
    applicationProcedure:
      "Candidature en ligne à l'UCLouvain. Pour un diplôme non belge, analyse du dossier par la faculté : admission directe, admission avec compléments (jusqu'à 60 crédits) ou refus. Dates limites différentes selon la nationalité et le besoin de visa.",
    prerequisites: [
      {
        id: "r1",
        type: "niveau",
        value: "Licence 3",
        label: "Bachelier en économie et gestion (diplômes non belges reconnus acceptés, sur analyse du dossier)",
      },
      {
        id: "r2",
        type: "domaine",
        value: "Économie & Gestion",
        label: "Formation en gestion, économie et méthodes quantitatives, ou sciences sociales avec mineure en gestion",
        aliases: ["Sciences politiques", "Droit"],
      },
      { id: "r3", type: "competence", value: "Anglais courant", label: "Programme entièrement en anglais" },
    ],
    coreCourses: [
      course("Transformation digitale", "importante"),
      course("Responsabilité sociétale des entreprises", "importante", ["RSE"]),
      course("Finance d'entreprise", "utile"),
      course("Marketing", "utile"),
      course("Gestion des ressources humaines", "utile"),
    ],
    skills: [skill("Anglais courant", "essentielle"), skill("Gestion de projet", "importante")],
    source: "https://uclouvain.be/prog-2026-gest2m",
    verifiedAt: "2026-09-27",
    verificationStatus: "vérifiée",
    demo: false,
  },

  // -------------------------------------------------------------------------
  // Sciences de l'ingénieur — ajoutées et vérifiées le 2026-09-27 (même règle :
  // 2 licences + 3 masters, plusieurs villes).
  // -------------------------------------------------------------------------
  {
    id: "f-licence-spi-strasbourg",
    name: "Licence Sciences pour l'ingénieur (SPI)",
    institution: { name: "Université de Strasbourg — Faculté de physique et ingénierie", city: "Strasbourg", country: "France" },
    level: "Licence 1",
    goal: "Licence",
    field: "Sciences de l'ingénieur",
    description:
      "Licence de 3 ans (180 crédits ECTS) : une L1 d'orientation en physique, mathématiques, chimie et informatique, une L2 élargie (mécanique du solide, électromagnétisme, thermodynamique, matériaux, électrotechnique) puis une L3 au choix parmi quatre parcours — systèmes électroniques, mécanique et génie industriel, mécatronique, sciences pour l'ingénieur et santé.",
    requiredLevel: "Baccalauréat",
    language: "Français",
    applicationProcedure:
      "L1 : Parcoursup pour les bacheliers (vœux de janvier à mars) ; procédure DAP pour les candidats hors Union européenne.",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Baccalauréat", label: "Baccalauréat ou équivalent" },
      {
        id: "r2",
        type: "domaine",
        value: "Sciences de l'ingénieur",
        label: "Bases en mathématiques et en physique attendues (la L1 les consolide)",
        aliases: ["Sciences fondamentales", "Mathématiques"],
      },
    ],
    coreCourses: [
      course("Mécanique", "essentielle", ["Mécanique du solide"]),
      course("Électronique", "importante", ["Systèmes électroniques"]),
      course("Mathématiques appliquées", "importante"),
      course("Thermodynamique", "utile"),
      course("Électrotechnique", "utile"),
    ],
    skills: [skill("Rigueur scientifique", "importante"), skill("Gestion de projet", "utile")],
    source: "https://physique-ingenierie.unistra.fr/formations/licences/licence-sciences-pour-lingenieur/",
    verifiedAt: "2026-09-27",
    verificationStatus: "vérifiée",
    demo: false,
  },
  {
    id: "f-bachelier-ingenieur-civil-uliege",
    name: "Bachelier en sciences de l'ingénieur, orientation ingénieur civil",
    institution: { name: "Université de Liège (ULiège) — Faculté des Sciences appliquées", city: "Liège", country: "Belgique" },
    level: "Licence 1",
    goal: "Licence",
    field: "Sciences de l'ingénieur",
    description:
      "Bachelier de 3 ans (180 crédits ECTS), première étape des 5 ans d'études d'ingénieur civil : sciences fondamentales et appliquées (mathématiques, physique, chimie, informatique), sciences de l'ingénieur, sciences sociales (droit, économie) et anglais, avant le master d'ingénieur civil.",
    requiredLevel: "Baccalauréat",
    language: "Français",
    applicationProcedure:
      "Réussite obligatoire de l'examen spécial d'admission (« examen d'entrée ») avant l'inscription : quatre épreuves écrites de mathématiques sur deux jours (trigonométrie et calcul numérique, géométrie, algèbre, analyse), deux sessions par an (début juillet et début septembre). Ce n'est pas un concours : environ 80 % des candidats le réussissent. Conditions propres aux diplômes étrangers à confirmer auprès de la faculté.",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Baccalauréat", label: "Diplôme de fin d'études secondaires, puis réussite de l'examen d'entrée" },
      {
        id: "r2",
        type: "domaine",
        value: "Sciences de l'ingénieur",
        label: "Mathématiques de niveau renforcé (programme à 6 h/semaine des trois dernières années du secondaire)",
        aliases: ["Mathématiques", "Sciences fondamentales"],
      },
      { id: "r3", type: "matiere", value: "Analyse", label: "Analyse, algèbre, géométrie et trigonométrie : matières de l'examen d'entrée" },
    ],
    coreCourses: [
      course("Analyse", "essentielle"),
      course("Algèbre linéaire", "essentielle", ["Algèbre"]),
      course("Physique générale", "importante"),
      course("Mécanique", "importante"),
      course("Programmation", "utile", ["Informatique"]),
    ],
    skills: [skill("Rigueur mathématique", "essentielle"), skill("Rigueur scientifique", "importante")],
    source: "https://www.programmes.uliege.be/cocoon/20262027/formations/condacp/A1ICIV01.html",
    verifiedAt: "2026-09-27",
    verificationStatus: "vérifiée",
    demo: false,
  },
  {
    id: "f-master-mecanique-sorbonne",
    name: "Master Mécanique",
    institution: { name: "Sorbonne Université — Faculté des Sciences et Ingénierie", city: "Paris", country: "France" },
    level: "Master 1",
    goal: "Master",
    field: "Sciences de l'ingénieur",
    description:
      "Master de 2 ans formant des spécialistes des phénomènes, procédés et systèmes mécaniques, avec un fort accent sur la modélisation analytique, la simulation numérique et l'expérimentation : M1 en tronc commun, puis parcours en M2 (acoustique, solides et structures, mécanique numérique, fluides, énergétique). Plus d'un diplômé sur cinq poursuit en thèse.",
    requiredLevel: "Licence 3",
    language: "Français",
    applicationProcedure:
      "Master 1 : plateforme nationale Mon Master, sur dossier et entretien. Certains parcours sont proposés en anglais.",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence générale (bac+3) ou équivalent" },
      {
        id: "r2",
        type: "domaine",
        value: "Sciences de l'ingénieur",
        label: "Solide formation en mécanique, physique ou mathématiques",
        aliases: ["Sciences fondamentales", "Mathématiques"],
      },
      { id: "r3", type: "matiere", value: "Mécanique", label: "Bases solides en mécanique" },
    ],
    coreCourses: [
      course("Mécanique des milieux continus", "essentielle", ["Mécanique"]),
      course("Mécanique des fluides", "essentielle"),
      course("Méthodes numériques", "importante", ["Simulation numérique"]),
      course("Thermodynamique", "utile", ["Énergétique"]),
      course("Acoustique", "utile"),
    ],
    skills: [skill("Modélisation numérique", "importante", ["Simulation numérique"]), skill("Python", "utile")],
    source: "https://masters-sdi.sorbonne-universite.fr/la-mention-mecanique",
    verifiedAt: "2026-09-27",
    verificationStatus: "vérifiée",
    demo: false,
  },
  {
    id: "f-master-ase-lille",
    name: "Master Automatique et systèmes électriques (ASE)",
    institution: { name: "Université de Lille — Faculté des sciences et technologies", city: "Villeneuve-d'Ascq", country: "France" },
    level: "Master 1",
    goal: "Master",
    field: "Sciences de l'ingénieur",
    description:
      "Master de 2 ans en génie électrique et automatique : M1 commun au 1er semestre (modélisation, conception de systèmes de conversion d'énergie, méthodes et outils de l'automatique), puis orientation systèmes électriques ou automatique ; en M2, parcours réseaux d'énergie électrique, véhicules intelligents électriques, systèmes et machines autonomes, ou génie électrique pour le développement durable.",
    requiredLevel: "Licence 3",
    language: "Français",
    applicationProcedure:
      "Master 1 : plateforme nationale Mon Master, sur dossier ; les candidats résidant dans un pays à procédure « Études en France » passent par cette procédure.",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence EEA (électronique, énergie électrique, automatique) ou équivalent" },
      {
        id: "r2",
        type: "domaine",
        value: "Sciences de l'ingénieur",
        label: "Formation en électronique, génie électrique ou automatique",
        aliases: ["Sciences fondamentales"],
      },
    ],
    coreCourses: [
      course("Automatique", "essentielle"),
      course("Électrotechnique", "essentielle", ["Conversion d'énergie", "Génie électrique"]),
      course("Électronique", "importante", ["Électronique de puissance"]),
      course("Modélisation des systèmes", "importante"),
      course("Anglais", "utile"),
    ],
    skills: [skill("Systèmes embarqués", "utile"), skill("Gestion de projet", "utile")],
    source: "https://formation.univ-lille.fr/fr/offre-de-formation/master-lmd-XB/master-automatique-et-systemes-electriques-MG001978.html",
    verifiedAt: "2026-09-27",
    verificationStatus: "vérifiée",
    demo: false,
  },
  {
    id: "f-msc-advanced-manufacturing-centrale-nantes",
    name: "MSc Mechanical Engineering — Advanced Manufacturing (M-ENG AM)",
    institution: { name: "Centrale Nantes", city: "Nantes", country: "France" },
    level: "Master 1",
    goal: "Master",
    field: "Sciences de l'ingénieur",
    description:
      "Master of Science de 2 ans entièrement en anglais, accrédité par le ministère de l'Enseignement supérieur : mécanique des milieux continus et des fluides, méthodes numériques, CAO, matériaux et conception mécanique en M1, puis fabrication additive, CAO/FAO/commande numérique et optimisation des procédés en M2, qui se termine par un stage ou mémoire de 6 mois rémunéré.",
    requiredLevel: "Licence 3",
    language: "Anglais",
    applicationProcedure:
      "Candidature en ligne sur eCandidat (Centrale Nantes), ouverte le 28 octobre 2026 pour la rentrée 2027 ; trois vagues d'admission en M1, de mi-décembre 2026 à fin avril 2027. Dossier : relevés de notes et diplôme, CV et lettre, deux lettres de recommandation académiques, test d'anglais (IELTS 6.5, TOEFL iBT 80, TOEIC 800 ou équivalent) et passeport.",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Bachelor (ingénierie, sciences ou technologie) ou équivalent" },
      {
        id: "r2",
        type: "domaine",
        value: "Sciences de l'ingénieur",
        label: "Cursus scientifique ou technologique avec un bon niveau en mathématiques",
        aliases: ["Sciences fondamentales", "Mathématiques"],
      },
      { id: "r3", type: "competence", value: "Anglais courant", label: "Programme 100 % en anglais ; certificat exigé (ex. IELTS 6.5)" },
    ],
    coreCourses: [
      course("Mécanique des milieux continus", "essentielle", ["Mécanique"]),
      course("Conception mécanique", "essentielle", ["CAO"]),
      course("Méthodes numériques", "importante"),
      course("Mécanique des fluides", "importante"),
      course("Science des matériaux", "utile", ["Matériaux"]),
    ],
    skills: [skill("CAO", "essentielle"), skill("Anglais courant", "essentielle"), skill("Modélisation numérique", "utile")],
    source: "https://www.ec-nantes.fr/study/masters/advanced-manufacturing",
    verifiedAt: "2026-09-27",
    verificationStatus: "vérifiée",
    demo: false,
  },

  // -------------------------------------------------------------------------
  // Droit — ajoutées et vérifiées le 2026-09-27. Discipline la plus liée à un
  // pays : on privilégie les licences généralistes et, en master, le droit
  // européen/international (transposable) plus un LL.M. en anglais.
  // -------------------------------------------------------------------------
  {
    id: "f-licence-droit-bordeaux",
    name: "Licence en droit",
    institution: { name: "Université de Bordeaux — Faculté de droit et science politique", city: "Pessac", country: "France" },
    level: "Licence 1",
    goal: "Licence",
    field: "Droit",
    description:
      "Licence de 3 ans donnant une culture juridique générale — droit privé, droit public, droit de l'Union européenne, droit international, histoire du droit et des institutions — puis une spécialisation en L3 (droit privé, droit public, droit de l'entreprise, droit international et européen, droit judiciaire, administration publique, science politique). Ouvre sur les masters de droit et la préparation au CRFPA (avocat).",
    requiredLevel: "Baccalauréat",
    language: "Français",
    applicationProcedure:
      "L1 : Parcoursup pour les bacheliers ; étudiants internationaux : candidature individuelle ou programme d'échange (procédure selon le pays, détaillée sur la page de la faculté). La maîtrise du français écrit et oral est explicitement attendue.",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Baccalauréat", label: "Baccalauréat ou équivalent" },
      {
        id: "r2",
        type: "domaine",
        value: "Droit",
        label: "Très bonne expression écrite et orale en français, goût pour l'argumentation",
        aliases: ["Sciences politiques", "Économie & Gestion"],
      },
    ],
    coreCourses: [
      course("Droit civil", "essentielle", ["Droit privé"]),
      course("Droit constitutionnel", "essentielle", ["Droit public"]),
      course("Histoire du droit et des institutions", "importante"),
      course("Droit de l'Union européenne", "utile", ["Droit européen"]),
      course("Droit international", "utile"),
    ],
    skills: [skill("Rédaction juridique", "importante"), skill("Argumentation", "importante")],
    source: "https://droit.u-bordeaux.fr/formations/offre-de-formation/licences/licence-en-droit",
    verifiedAt: "2026-09-27",
    verificationStatus: "vérifiée",
    demo: false,
  },
  {
    id: "f-bachelier-droit-ulb",
    name: "Bachelier en droit",
    institution: { name: "Université libre de Bruxelles (ULB) — Faculté de Droit et de Criminologie", city: "Bruxelles", country: "Belgique" },
    level: "Licence 1",
    goal: "Licence",
    field: "Droit",
    description:
      "Bachelier de 3 ans en français (campus du Solbosch, aussi organisé à Mons avec l'UMONS) : méthodologie juridique et critique des sources, cours d'introduction au droit et une large ouverture aux sciences humaines (philosophie, sociologie, économie politique, histoire, psychologie), avec néerlandais et anglais ; mène au master en droit.",
    requiredLevel: "Baccalauréat",
    language: "Français",
    applicationProcedure:
      "Candidature en ligne à l'ULB, avec preuve de la demande d'équivalence du diplôme secondaire auprès de la Fédération Wallonie-Bruxelles. Candidats hors UE non assimilés : moyenne d'au moins 13/20 au diplôme secondaire et 12/20 dans les matières liées (langues pour le droit), niveau B2 en français si le français n'était pas au programme, frais de dossier de 200 € non remboursables ; dossier à déposer généralement entre mi-février et le 31 mars de l'année de la rentrée.",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Baccalauréat", label: "Diplôme secondaire reconnu équivalent au CESS belge" },
      {
        id: "r2",
        type: "domaine",
        value: "Droit",
        label: "Bons résultats en langues (première et deuxième langue) ; français B2 minimum",
        aliases: ["Sciences politiques", "Économie & Gestion"],
      },
    ],
    coreCourses: [
      course("Méthodologie juridique", "essentielle", ["Méthodologie"]),
      course("Introduction au droit", "essentielle", ["Droit civil", "Droit constitutionnel"]),
      course("Économie politique", "utile", ["Macroéconomie"]),
      course("Philosophie", "utile"),
      course("Sociologie", "utile"),
    ],
    skills: [skill("Argumentation", "importante"), skill("Rédaction juridique", "utile")],
    source: "https://www.ulb.be/fr/programme/ba-droi",
    verifiedAt: "2026-09-27",
    verificationStatus: "vérifiée",
    demo: false,
  },
  {
    id: "f-master-droit-europeen-strasbourg",
    name: "Master Droit européen",
    institution: { name: "Université de Strasbourg — Faculté de droit, de sciences politiques et de gestion", city: "Strasbourg", country: "France" },
    level: "Master 1",
    goal: "Master",
    field: "Droit",
    description:
      "Master de 2 ans (120 crédits ECTS) au cœur de la capitale européenne : M1 centré sur le droit du marché intérieur, le contentieux de l'Union européenne ou le contentieux administratif et le droit public des affaires, puis cinq parcours en M2 — droit et politiques de l'UE, droit de l'économie et de la régulation, produits de santé, droit international et européen des affaires, espace de liberté, de sécurité et de justice.",
    requiredLevel: "Licence 3",
    language: "Français",
    applicationProcedure:
      "Sélection sur dossier en M1. Plateforme et calendrier de candidature à confirmer sur les pages admissions de l'Université de Strasbourg (non précisés sur la page du programme).",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence de droit, diplôme d'IEP ou licence AES parcours droit" },
      {
        id: "r2",
        type: "domaine",
        value: "Droit",
        label: "Très bon niveau en droit de l'Union européenne, bon niveau en droit public (constitutionnel, administratif, international)",
        aliases: ["Sciences politiques"],
      },
      { id: "r3", type: "competence", value: "Anglais courant", label: "Très bonne maîtrise de l'anglais, prérequis du recrutement" },
    ],
    coreCourses: [
      course("Droit du marché intérieur", "essentielle", ["Droit de l'Union européenne", "Droit européen"]),
      course("Contentieux de l'Union européenne", "importante", ["Droit de l'Union européenne"]),
      course("Droit public des affaires", "importante", ["Droit administratif"]),
      course("Droit de la concurrence", "utile"),
      course("Droit international", "utile"),
    ],
    skills: [skill("Anglais courant", "essentielle"), skill("Rédaction juridique", "importante")],
    source: "https://formations.unistra.fr/fr/formations/master-MAS/master-droit-europeen-ME76.html",
    verifiedAt: "2026-09-27",
    verificationStatus: "vérifiée",
    demo: false,
  },
  {
    id: "f-master-droit-affaires-amu",
    name: "Master Droit des affaires",
    institution: { name: "Aix-Marseille Université — Faculté de droit et de science politique", city: "Aix-en-Provence", country: "France" },
    level: "Master 1",
    goal: "Master",
    field: "Droit",
    description:
      "Master de 2 ans, sélectif dès le M1, avec un tronc commun en droit spécial des sociétés, restructurations d'entreprises, droit de la concurrence et droit de la consommation, puis 17 parcours en M2 (droit des affaires internationales, compliance, droit du sport, droit chinois des affaires, droit maritime…) à Aix-en-Provence, Marseille ou à distance.",
    requiredLevel: "Licence 3",
    language: "Français",
    applicationProcedure:
      "Sélection sur dossier dès le M1 : résultats d'ensemble et dans les matières fondamentales de droit privé et public, projet professionnel, stages et niveau d'anglais. Plateforme et calendrier à confirmer sur la page admissions de la faculté.",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence en droit ou équivalent" },
      {
        id: "r2",
        type: "domaine",
        value: "Droit",
        label: "Solides résultats en droit privé et en droit public",
      },
      { id: "r3", type: "matiere", value: "Droit des contrats", label: "Bases en droit des contrats et des sociétés" },
    ],
    coreCourses: [
      course("Droit des sociétés", "essentielle", ["Droit spécial des sociétés"]),
      course("Droit de la concurrence", "essentielle"),
      course("Droit des contrats", "importante", ["Droit civil"]),
      course("Droit de la consommation", "importante"),
      course("Droit des entreprises en difficulté", "utile", ["Restructurations d'entreprises"]),
    ],
    skills: [skill("Rédaction juridique", "essentielle"), skill("Anglais juridique", "utile")],
    source: "https://formations.univ-amu.fr/fr/master/5DAF",
    verifiedAt: "2026-09-27",
    verificationStatus: "vérifiée",
    demo: false,
  },
  {
    id: "f-llm-international-economic-law-toulouse",
    name: "Master/LL.M. International Economic Law",
    institution: { name: "Université Toulouse Capitole — European School of Law", city: "Toulouse", country: "France" },
    level: "Master 1",
    goal: "Master",
    field: "Droit",
    description:
      "Master de 2 ans (120 crédits ECTS) entièrement en anglais : droit de l'Union européenne, droits fondamentaux, droit international public et privé en M1, puis marché intérieur, concurrence, droit pénal international, droit international des sociétés, droit financier, de l'investissement et du commerce, et économie numérique ; stage ou mémoire en fin de M2. 28 places en M1.",
    requiredLevel: "Licence 3",
    language: "Anglais",
    applicationProcedure:
      "Candidature sur la plateforme de la European School of Law (Toulouse Capitole) ; campagne pour les étudiants internationaux ouverte jusqu'au 26 avril (date de la dernière campagne publiée). Sélection sur dossier : résultats, niveau d'anglais, expériences et motivation.",
    prerequisites: [
      { id: "r1", type: "niveau", value: "Licence 3", label: "Licence de droit française ou diplôme juridique étranger équivalent à 180 ECTS" },
      {
        id: "r2",
        type: "domaine",
        value: "Droit",
        label: "Formation juridique (licence en droit ou équivalent)",
      },
      { id: "r3", type: "competence", value: "Anglais courant", label: "Anglais B2 minimum (C1 pour la mobilité à Stetson University)" },
    ],
    coreCourses: [
      course("Droit de l'Union européenne", "essentielle", ["Droit européen"]),
      course("Droit international public", "essentielle", ["Droit international"]),
      course("Droit international privé", "importante", ["Droit international"]),
      course("Droit de la concurrence", "importante"),
      course("Droit du commerce international", "utile"),
    ],
    skills: [skill("Anglais juridique", "essentielle", ["Anglais courant"]), skill("Rédaction juridique", "importante")],
    source: "https://www.ut-capitole.fr/home/course-offer/english-taught-courses/master-ll-m-international-economic-law",
    verifiedAt: "2026-09-27",
    verificationStatus: "vérifiée",
    demo: false,
  },
];

export function getFormationById(id: string): StudyProgram | undefined {
  return FORMATIONS.find((formation) => formation.id === id);
}
