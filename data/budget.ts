/**
 * Coûts officiels sourcés pour le calculateur de budget (Phase 19).
 *
 * Discipline (voir docs/data-sourcing.md) : chaque montant ci-dessous a été
 * lu sur une source officielle (établissement, Service-Public, Campus
 * France, Office des étrangers via une université belge, Direction
 * générale du Trésor) le 2026-09-27, avec son année académique. Aucun
 * montant n'est déduit d'un site secondaire : quand les sites secondaires
 * divergeaient de la source officielle (ex: master à 254 € au lieu de
 * 255 €), la source officielle a été retenue ; quand aucune source
 * officielle ne publie le montant (contribution supplémentaire hors UE à
 * UCLouvain), il est déclaré "non publié" plutôt qu'estimé.
 *
 * Tous les montants sont en centimes d'euro (entiers : aucun arrondi
 * flottant dans les calculs).
 */

export const BUDGET_VERIFIED_AT = "2026-09-27";

/** Montant officiel daté et sourcé. */
export interface OfficialAmount {
  cents: number;
  academicYear: string;
  source: string;
  /**
   * Montant publié "à titre indicatif" par l'établissement lui-même (ex: IP
   * Paris) : toujours présenté comme une estimation, jamais comme officiel.
   */
  indicative?: boolean;
}

export interface TuitionFee {
  /** Tarif UE/EEE/Suisse (ou assimilé). */
  eu: OfficialAmount;
  /** Tarif hors UE non exonéré ; null quand l'établissement ne le publie pas. */
  nonEu: OfficialAmount | null;
  /** Précision affichée sur le tarif hors UE (exonérations, montant non publié…). */
  nonEuNote?: string;
  /** "annuel" (par année d'études) ou "programme" (coût total du programme, payé une fois). */
  scope: "annuel" | "programme";
  note?: string;
}

const SERVICE_PUBLIC_DROITS = "https://www.service-public.gouv.fr/particuliers/vosdroits/F36520/2";
const SERVICE_PUBLIC_DIFFERENCIES = "https://www.service-public.gouv.fr/particuliers/actualites/A18927";
const ROUEN_DIFFERENCIES_2026 =
  "https://mesdemarches.univ-rouen.fr/wp-content/uploads/sites/5/2026/07/Montants-Droits-dinscription-Differencies-2026-2027.pdf";

const FRENCH_EXEMPTION_NOTE =
  "Exonération possible selon l'établissement, jamais garantie : plafonnée à 30 % des étudiants hors UE en 2026-2027, puis 25 % en 2027-2028 (décret n° 2026-385 du 19 mai 2026).";

function frenchPublicFee(
  euCents: number,
  nonEuCents: number,
  nonEuSource: string,
  note: string,
): TuitionFee {
  return {
    eu: { cents: euCents, academicYear: "2026-2027", source: SERVICE_PUBLIC_DROITS },
    nonEu: { cents: nonEuCents, academicYear: "2026-2027", source: nonEuSource },
    nonEuNote: FRENCH_EXEMPTION_NOTE,
    scope: "annuel",
    note,
  };
}

/** Droits nationaux (arrêté du 19 avril 2019, indexés chaque année). */
const FRENCH_LICENCE = frenchPublicFee(17_800, 290_200, SERVICE_PUBLIC_DIFFERENCIES, "Droits nationaux de licence (diplôme national).");
const FRENCH_MASTER = frenchPublicFee(25_500, 395_000, SERVICE_PUBLIC_DIFFERENCIES, "Droits nationaux de master (diplôme national).");
const FRENCH_ENGINEER = frenchPublicFee(
  63_000,
  395_000,
  ROUEN_DIFFERENCIES_2026,
  "Droits nationaux du diplôme d'ingénieur des écoles relevant du ministère de l'Enseignement supérieur.",
);

export const TUITION_FEES: Record<string, TuitionFee> = {
  "f-m2ds-ip-paris": {
    eu: {
      cents: 485_900,
      academicYear: "2026-2027",
      source: "https://www.ip-paris.fr/sites/default/files/pages/documents/Masters/master-phd-track-registration-fees-FR-26-27%20(2).pdf",
      indicative: true,
    },
    nonEu: {
      cents: 714_800,
      academicYear: "2026-2027",
      source: "https://www.ip-paris.fr/sites/default/files/pages/documents/Masters/master-phd-track-registration-fees-FR-26-27%20(2).pdf",
      indicative: true,
    },
    nonEuNote: "Réduction ou exonération possible avec une bourse d'ambassade de France ou une bourse CROUS (selon IP Paris).",
    scope: "annuel",
    note: "« Master parcours international » d'IP Paris : tarif propre à l'établissement, bien au-delà des droits nationaux de master.",
  },
  "f-msc-ai-centralesupelec": {
    eu: { cents: 1_500_000, academicYear: "2027-2028", source: "https://www.centralesupelec.fr/programmes/master-science-artificial-intelligence" },
    nonEu: { cents: 1_500_000, academicYear: "2027-2028", source: "https://www.centralesupelec.fr/programmes/master-science-artificial-intelligence" },
    scope: "annuel",
    note: "Frais de 1re année (M1), acompte de 1 500 € inclus ; la 2e année (M2) coûte 20 000 €. Même tarif quelle que soit la nationalité. Bourses possibles selon l'excellence et les ressources.",
  },
  "f-ms-ia-telecom-paris": {
    eu: { cents: 2_110_000, academicYear: "2026-2027", source: "https://www.telecom-paris.fr/fr/masteres-specialises/formation-intelligence-artificielle" },
    nonEu: { cents: 2_110_000, academicYear: "2026-2027", source: "https://www.telecom-paris.fr/fr/masteres-specialises/formation-intelligence-artificielle" },
    scope: "programme",
    note: "Coût total du programme (10 mois de cours + thèse professionnelle), acompte de 30 % non remboursable sauf refus de visa, plus 90 € de frais de candidature.",
  },
  "f-mosef-paris1": FRENCH_MASTER,
  "f-scdi-sorbonne": FRENCH_MASTER,
  "f-mosig-grenoble-inp": FRENCH_MASTER,
  "f-licence-info-sorbonne": FRENCH_LICENCE,
  "f-licence-info-paris-saclay": FRENCH_LICENCE,
  "f-licence-info-toulouse": FRENCH_LICENCE,
  "f-but-info-nantes": { ...FRENCH_LICENCE, note: "Le BUT relève des droits nationaux de licence." },
  "f-insa-lyon-info-parallele": FRENCH_ENGINEER,
  "f-ing-info-enseirb-matmeca": FRENCH_ENGINEER,
  "f-date-uclouvain": {
    eu: {
      cents: 119_400,
      academicYear: "2026-2027",
      source:
        "https://uclouvain.be/en/system/files?file=uclouvain_assetmanager%2Fgroups%2Fcms-editors-sic%2FSIC-D10%2FLes+droits+d%27inscription+%C3%A0+l%27UCLouvain%2FGrille+tarifaire+2026-2027.pdf",
    },
    nonEu: null,
    nonEuNote:
      "Une contribution supplémentaire peut s'ajouter pour les étudiants hors UE non assimilés : elle dépend de la nationalité et du programme, et UCLouvain ne la communique qu'au cours de l'inscription. Montant non publié — à demander au Service des inscriptions.",
    scope: "annuel",
    note: "Droits d'inscription complets 2026-2027 (grille validée le 10/06/2026). Tarifs réduits selon les revenus : 835 € (condition intermédiaire), 374 € (condition modeste), 0 € (boursiers).",
  },
};

export interface CountryBudgetRules {
  /** Frais obligatoires pour tout étudiant (hors exonérations signalées). */
  mandatoryFees: { label: string; amount: OfficialAmount; note?: string }[];
  /** Ressources mensuelles minimales exigées pour un visa/titre de séjour étudiant. */
  visaMonthlyMinimum?: OfficialAmount & { note: string };
}

export const COUNTRY_BUDGET_RULES: Record<string, CountryBudgetRules> = {
  France: {
    mandatoryFees: [
      {
        label: "CVEC (contribution de vie étudiante et de campus)",
        amount: { cents: 10_500, academicYear: "2026-2027", source: SERVICE_PUBLIC_DROITS },
        note: "Payée une fois par an sur cvec.etudiant.gouv.fr ; exonération pour les boursiers et certains étudiants en mobilité.",
      },
    ],
    visaMonthlyMinimum: {
      cents: 87_750,
      academicYear: "2026-2027",
      // Service-Public (vérifié le 01/08/2026), recoupé avec l'annonce de Campus France du 24/07/2026.
      source: "https://www.service-public.gouv.fr/particuliers/vosdroits/F2231",
      note: "Minimum exigé pour les demandes de visa étudiant déposées depuis le 1er août 2026 (615 €/mois auparavant). Montant revu à chaque revalorisation du SMIC.",
    },
  },
  Belgique: {
    mandatoryFees: [],
    visaMonthlyMinimum: {
      cents: 106_200,
      academicYear: "2026-2027",
      source: "https://www.enseignement.uliege.be/cms/c_18155259/fr/compte-depot",
      note: "Montant net mensuel fixé chaque année par l'Office des étrangers pour couvrir logement et subsistance.",
    },
  },
};

/** Devises dont la parité avec l'euro est fixe et officielle (Direction générale du Trésor). */
export const FIXED_EURO_PARITIES: Record<string, { rate: number; label: string; source: string }> = {
  XOF: {
    rate: 655.957,
    label: "Franc CFA (UEMOA)",
    source: "https://www.tresor.economie.gouv.fr/tresor-international/la-zone-franc/les-principes-et-modalites-de-fonctionnement-de-la-cooperation-monetaire",
  },
  XAF: {
    rate: 655.957,
    label: "Franc CFA (CEMAC)",
    source: "https://www.tresor.economie.gouv.fr/tresor-international/la-zone-franc/les-principes-et-modalites-de-fonctionnement-de-la-cooperation-monetaire",
  },
  KMF: {
    rate: 491.968,
    label: "Franc comorien",
    source: "https://www.tresor.economie.gouv.fr/tresor-international/la-zone-franc/les-principes-et-modalites-de-fonctionnement-de-la-cooperation-monetaire",
  },
};

/** Devises à taux flottant : le taux est toujours une hypothèse saisie par l'étudiant. */
export const FLOATING_CURRENCIES: Record<string, string> = {
  MAD: "Dirham marocain",
  DZD: "Dinar algérien",
  TND: "Dinar tunisien",
  USD: "Dollar américain",
  CAD: "Dollar canadien",
  GBP: "Livre sterling",
  CHF: "Franc suisse",
};

/** Repères sourcés affichés à côté des hypothèses (jamais pré-remplis). */
export const BUDGET_HINTS = {
  housing: {
    text: "Résidences Crous : demande et loyers par résidence sur le site officiel.",
    source: "https://trouverunlogement.lescrous.fr/",
  },
  food: {
    text: "Repas à 1 € dans les restaurants Crous pour tous les étudiants depuis le 4 mai 2026.",
    source: "https://www.lescrous.fr/2026/04/le-repas-a-1-euro-pour-tous-les-etudiants-deploye-a-partir-du-4-mai-2026/",
  },
} as const;
