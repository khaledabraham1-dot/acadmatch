/**
 * Démarches de visa étudiant par pays de destination (Phase 20).
 *
 * Version volontairement "légère" : AcadMatch oriente et personnalise
 * (besoin ou non d'un visa, bon parcours selon le pays de résidence, lien
 * avec le budget), puis renvoie vers la source officielle de chaque étape.
 * Ce fichier ne recopie donc JAMAIS :
 * - la liste des pièces à fournir (elle varie selon le consulat) ;
 * - les délais ni les frais (ils changent souvent — lors de la vérification
 *   du 2026-09-27, deux sources officielles/semi-officielles donnaient deux
 *   montants différents pour la taxe de validation du VLS-TS).
 *
 * Aucune étape n'est une garantie : la décision appartient au consulat.
 * Clé par `Institution.country`, comme data/eligibility.ts, pour qu'un pays
 * s'ajoute sans redesign.
 */

export const VISA_VERIFIED_AT = "2026-09-27";

export interface VisaStep {
  id: string;
  title: string;
  description: string;
  link: { label: string; url: string };
  /** Étape à faire avant le départ ou après l'arrivée. */
  timing: "avant le départ" | "après l'arrivée";
  /**
   * Parcours concerné : "etudes-en-france" (résidents d'un pays de la
   * procédure Études en France), "direct" (les autres) ou "tous".
   */
  appliesTo: "etudes-en-france" | "direct" | "tous";
  /** Étape qui dépend du seuil de ressources (liée au budget). */
  resources?: boolean;
}

export interface VisaGuide {
  country: string;
  /** Nom officiel du titre visé. */
  visaName: string;
  /** Lien de la procédure centralisée par pays de résidence, s'il en existe une. */
  residenceProcedure?: {
    name: string;
    countries: readonly string[];
    source: string;
    sourceUpdatedAt: string;
    /** Exception officielle, affichée telle quelle. */
    exception: string;
  };
  steps: VisaStep[];
  /** Source officielle de synthèse pour l'ensemble du guide. */
  source: string;
}

/**
 * Pays relevant de la procédure « Études en France », copiés tels quels de
 * la page officielle de Campus France (version française, mise à jour le
 * 20/11/2025 ; la version anglaise de la même page omettait le Pakistan).
 * La procédure dépend du pays de RÉSIDENCE, pas de la nationalité.
 */
export const ETUDES_EN_FRANCE_COUNTRIES = [
  "Afrique du Sud",
  "Angola",
  "Arménie",
  "Azerbaïdjan",
  "Algérie",
  "Arabie Saoudite",
  "Argentine",
  "Bahreïn",
  "Bénin",
  "Birmanie",
  "Bolivie",
  "Brésil",
  "Burkina Faso",
  "Burundi",
  "Cambodge",
  "Cameroun",
  "Canada",
  "Chili",
  "Chine",
  "Colombie",
  "Comores",
  "Congo",
  "Corée du Sud",
  "Côte d'Ivoire",
  "Djibouti",
  "Émirats arabes unis",
  "Égypte",
  "Equateur",
  "États-Unis",
  "Ethiopie",
  "Gabon",
  "Géorgie",
  "Ghana",
  "Guinée",
  "Haïti",
  "Hong Kong",
  "Inde",
  "Indonésie",
  "Iran",
  "Israël",
  "Japon",
  "Jordanie",
  "Kenya",
  "Koweït",
  "Liban",
  "Madagascar",
  "Malaisie",
  "Mali",
  "Maroc",
  "Maurice",
  "Mauritanie",
  "Mexique",
  "Népal",
  "Nigeria",
  "Pakistan",
  "Pérou",
  "Qatar",
  "République Centrafricaine",
  "République démocratique du Congo",
  "République dominicaine",
  "Royaume-Uni",
  "Russie",
  "Rwanda",
  "Sénégal",
  "Singapour",
  "Taïwan",
  "Tchad",
  "Thaïlande",
  "Togo",
  "Tunisie",
  "Turquie",
  "Ukraine",
  "Vietnam",
] as const;

const CAMPUS_FRANCE_EEF = "https://www.campusfrance.org/fr/candidature-procedure-etudes-en-france";
const FRANCE_VISAS = "https://france-visas.gouv.fr/";
const SERVICE_PUBLIC_STUDENT_VISA = "https://www.service-public.gouv.fr/particuliers/vosdroits/F2231";
const SERVICE_PUBLIC_VLS_TS = "https://www.service-public.gouv.fr/particuliers/vosdroits/R52684";

export const FRANCE_VISA_GUIDE: VisaGuide = {
  country: "France",
  visaName: "Visa de long séjour « étudiant » valant titre de séjour (VLS-TS)",
  residenceProcedure: {
    name: "Études en France",
    countries: ETUDES_EN_FRANCE_COUNTRIES,
    source: CAMPUS_FRANCE_EEF,
    sourceUpdatedAt: "2025-11-20",
    exception: "Les candidats à un doctorat ne relèvent pas de la procédure « Études en France ».",
  },
  steps: [
    {
      id: "fr-eef",
      title: "Constituer votre dossier « Études en France »",
      description:
        "Dans les pays concernés, la plateforme Études en France gère vos candidatures aux formations jusqu'à la demande de visa. Suivez les étapes indiquées par l'Espace Campus France de votre pays.",
      link: { label: "Procédure Études en France (Campus France)", url: CAMPUS_FRANCE_EEF },
      timing: "avant le départ",
      appliesTo: "etudes-en-france",
    },
    {
      id: "fr-admission",
      title: "Obtenir votre inscription ou préinscription",
      description:
        "La demande de visa étudiant suppose d'être inscrit ou préinscrit dans un établissement d'enseignement supérieur : gardez l'attestation d'admission.",
      link: { label: "Conditions du visa étudiant (Service-Public)", url: SERVICE_PUBLIC_STUDENT_VISA },
      timing: "avant le départ",
      appliesTo: "direct",
    },
    {
      id: "fr-resources",
      title: "Justifier de vos ressources",
      description:
        "Le visa étudiant exige de justifier de ressources au moins égales à un minimum mensuel fixé par l'État, apprécié selon votre situation.",
      link: { label: "Montant en vigueur (Service-Public)", url: SERVICE_PUBLIC_STUDENT_VISA },
      timing: "avant le départ",
      appliesTo: "tous",
      resources: true,
    },
    {
      id: "fr-france-visas",
      title: "Faire la demande de visa sur France-Visas",
      description:
        "Formulaire en ligne sur le site officiel France-Visas, qui indique ensuite les pièces à fournir et où déposer le dossier (consulat ou prestataire), avec la prise des données biométriques.",
      link: { label: "France-Visas", url: FRANCE_VISAS },
      timing: "avant le départ",
      appliesTo: "tous",
    },
    {
      id: "fr-vls-ts",
      title: "Valider votre visa dans les 3 mois après l'arrivée",
      description:
        "Le VLS-TS doit être validé en ligne dans les 3 mois suivant votre arrivée en France, avec paiement d'une taxe : c'est ce qui rend votre séjour régulier et vous permet de ressortir puis de revenir dans l'espace Schengen. Ne laissez pas passer ce délai.",
      link: { label: "Valider son VLS-TS (Service-Public)", url: SERVICE_PUBLIC_VLS_TS },
      timing: "après l'arrivée",
      appliesTo: "tous",
    },
  ],
  source: SERVICE_PUBLIC_STUDENT_VISA,
};

const ULIEGE_MEANS = "https://www.enseignement.uliege.be/cms/c_18155259/fr/compte-depot";
const DOFI_STUDENTS =
  "https://dofi.ibz.be/en/themes/third-country-nationals/study/higher-education/recognised-higher-education-public/initial";

export const BELGIUM_VISA_GUIDE: VisaGuide = {
  country: "Belgique",
  visaName: "Visa D (long séjour) pour études",
  steps: [
    {
      id: "be-admission",
      title: "Obtenir votre inscription",
      description:
        "La demande de visa pour études suppose d'être inscrit (ou admis) dans un établissement d'enseignement supérieur, pour des études à temps plein.",
      link: { label: "Office des étrangers : études", url: DOFI_STUDENTS },
      timing: "avant le départ",
      appliesTo: "tous",
    },
    {
      id: "be-resources",
      title: "Justifier de vos moyens de subsistance",
      description:
        "Montant mensuel minimum fixé chaque année par l'Office des étrangers : compte bloqué, bourse ou prise en charge par un garant.",
      link: { label: "Montant et modalités (ULiège)", url: ULIEGE_MEANS },
      timing: "avant le départ",
      appliesTo: "tous",
      resources: true,
    },
    {
      id: "be-visa-d",
      title: "Demander le visa D au poste diplomatique belge",
      description:
        "La demande se dépose auprès de l'ambassade ou du consulat de Belgique compétent pour votre pays de résidence, qui indique les pièces à fournir.",
      link: { label: "Office des étrangers : études", url: DOFI_STUDENTS },
      timing: "avant le départ",
      appliesTo: "tous",
    },
  ],
  source: DOFI_STUDENTS,
};

/** Pays couverts — un pays absent n'affiche aucun guide (jamais de contenu inventé). */
export const VISA_GUIDES_BY_COUNTRY: Record<string, VisaGuide> = {
  France: FRANCE_VISA_GUIDE,
  Belgique: BELGIUM_VISA_GUIDE,
};
