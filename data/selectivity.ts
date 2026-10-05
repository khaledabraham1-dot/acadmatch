/**
 * Sélectivité des formations (2026-09-30) — données officielles uniquement.
 *
 * - Masters français : Mon Master, jeu de données ouvert du ministère
 *   (fr-esr-mon_master, session 2025) : capacité, candidatures confirmées en
 *   phase principale, propositions reçues. Une fiche qui couvre toute une
 *   mention additionne ses parcours (recordIds). « fromAbroad » = candidats
 *   qui n'étaient pas inscrits dans le supérieur français l'année précédente
 *   (le plus souvent des candidats venant de l'étranger).
 * - Licences françaises : Parcoursup, jeu fr-esr-parcoursup (session 2025),
 *   taux d'accès officiel de la ligne principale de la formation.
 * - Belgique : accès ouvert (pas de sélection par quota), avec les
 *   exceptions déjà sourcées sur chaque fiche (examen d'entrée, dossier).
 * - Sinon « non publié » : aucune plateforme officielle ne publie ce taux.
 *   Jamais de chiffre estimé ou reconstitué.
 *
 * Généré depuis l'API data.enseignementsup-recherche.gouv.fr (aucune
 * recopie à la main). À régénérer chaque été, avec les frais (docs/data-sourcing.md).
 */

export const SELECTIVITY_SOURCES = {
  monMaster: "https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-mon_master/",
  parcoursup: "https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-parcoursup/",
} as const;

export type SelectivityData =
  | {
      kind: "mon-master";
      session: string;
      recordIds: string[];
      capacity: number;
      candidates: number;
      offers: number;
      fromAbroadCandidates: number;
      fromAbroadOffers: number;
    }
  | {
      kind: "parcoursup";
      session: string;
      recordId: string;
      /** « formation sélective » au sens de Parcoursup (sinon : non sélective, classement limité par la capacité). */
      selective: boolean;
      capacity: number;
      applications: number;
      /** Taux d'accès officiel publié par Parcoursup, en %. */
      accessRate: number;
      platformUrl: string;
    }
  | { kind: "entrance-exam"; note: string }
  | { kind: "open-access"; note: string }
  | { kind: "on-file"; note: string }
  | { kind: "not-published"; note: string };

const NOT_ON_PLATFORMS = "Recrutement hors Mon Master et Parcoursup : l'établissement ne publie pas de taux d'admission officiel.";

export const SELECTIVITY: Record<string, SelectivityData> = {
  "f-master-droit-public-paris8": { kind: "mon-master", session: "2025", recordIds: ["1501643W54PM"], capacity: 20, candidates: 329, offers: 127, fromAbroadCandidates: 35, fromAbroadOffers: 4 },
  "f-master-droit-developpement-paris-cite": { kind: "mon-master", session: "2025", recordIds: ["1900232C4THI"], capacity: 15, candidates: 597, offers: 60, fromAbroadCandidates: 92, fromAbroadOffers: 2 },
  "f-master-droit-affaires-lorraine": { kind: "mon-master", session: "2025", recordIds: ["1800137ZXEIA"], capacity: 83, candidates: 854, offers: 205, fromAbroadCandidates: 80, fromAbroadOffers: 11 },
  "f-master-plantes-tropicales-montpellier": { kind: "mon-master", session: "2025", recordIds: ["1501396CJQK5"], capacity: 9, candidates: 162, offers: 20, fromAbroadCandidates: 26, fromAbroadOffers: 1 },
  "f-licence-aes-lille": { kind: "parcoursup", session: "2025", recordId: "20946", selective: false, capacity: 390, applications: 2875, accessRate: 95, platformUrl: "https://dossierappel.parcoursup.fr/Candidats/public/fiches/afficherFicheFormation?g_ta_cod=20946&typeBac=0&originePc=0" },
  "f-licence-gestion-iaelyon": { kind: "parcoursup", session: "2025", recordId: "39677", selective: false, capacity: 710, applications: 6523, accessRate: 41, platformUrl: "https://dossierappel.parcoursup.fr/Candidats/public/fiches/afficherFicheFormation?g_ta_cod=39677&typeBac=0&originePc=0" },
  "f-master-economie-developpement-uca": { kind: "mon-master", session: "2025", recordIds: ["1702186C6ZN4", "1702186C871J", "1702186CFN6R", "1702186CGLJN", "1702186CMT16", "1702186CUGVW"], capacity: 109, candidates: 628, offers: 276, fromAbroadCandidates: 89, fromAbroadOffers: 8 },
  "f-master-mbfa-risques-financiers-rouen": { kind: "mon-master", session: "2025", recordIds: ["1701081BFJK7"], capacity: 70, candidates: 849, offers: 143, fromAbroadCandidates: 120, fromAbroadOffers: 6 },
  "f-master-mae-double-competence-tours": { kind: "mon-master", session: "2025", recordIds: ["1801077WXH4R"], capacity: 20, candidates: 137, offers: 31, fromAbroadCandidates: 25, fromAbroadOffers: 9 },
  "f-master-sante-publique-bordeaux": { kind: "mon-master", session: "2025", recordIds: ["1602011SNX7E"], capacity: 50, candidates: 970, offers: 196, fromAbroadCandidates: 224, fromAbroadOffers: 35 },
  "f-m1-genie-civil-grenoble": { kind: "mon-master", session: "2025", recordIds: ["1603437S284P"], capacity: 44, candidates: 652, offers: 74, fromAbroadCandidates: 121, fromAbroadOffers: 3 },
  "f-master-securite-informatique-amu": { kind: "mon-master", session: "2025", recordIds: ["1800865R846R"], capacity: 22, candidates: 572, offers: 69, fromAbroadCandidates: 96, fromAbroadOffers: 3 },
  "f-llm-international-economic-law-toulouse": { kind: "mon-master", session: "2025", recordIds: ["1801140QA24D"], capacity: 15, candidates: 220, offers: 55, fromAbroadCandidates: 36, fromAbroadOffers: 10 },
  "f-m1-applied-maths-grenoble": { kind: "mon-master", session: "2025", recordIds: ["1602282LGJWS", "1602282LT1W7"], capacity: 35, candidates: 198, offers: 47, fromAbroadCandidates: 27, fromAbroadOffers: 4 },
  "f-m1-maths-fondamentales-paris-saclay": { kind: "mon-master", session: "2025", recordIds: ["1501354GA2P8"], capacity: 35, candidates: 504, offers: 68, fromAbroadCandidates: 43, fromAbroadOffers: 3 },
  "f-master-ase-lille": { kind: "mon-master", session: "2025", recordIds: ["1504658PD4AX"], capacity: 71, candidates: 944, offers: 182, fromAbroadCandidates: 109, fromAbroadOffers: 7 },
  "f-master-bioinformatique-bordeaux": { kind: "mon-master", session: "2025", recordIds: ["1603185TNZ76", "1603185TQNBY"], capacity: 24, candidates: 294, offers: 122, fromAbroadCandidates: 41, fromAbroadOffers: 13 },
  "f-master-bmc-sorbonne": { kind: "mon-master", session: "2025", recordIds: ["1900268S1YZT", "1900268SCIQA", "1900268SD8XV", "1900268SG4NT", "1900268SRQPA", "1900268SWTGX"], capacity: 187, candidates: 4436, offers: 569, fromAbroadCandidates: 668, fromAbroadOffers: 41 },
  "f-master-chimie-strasbourg": { kind: "mon-master", session: "2025", recordIds: ["1800640WCWSX"], capacity: 18, candidates: 194, offers: 55, fromAbroadCandidates: 6, fromAbroadOffers: 0 },
  "f-master-droit-affaires-amu": { kind: "mon-master", session: "2025", recordIds: ["1800873Z1QCE"], capacity: 255, candidates: 3384, offers: 563, fromAbroadCandidates: 224, fromAbroadOffers: 17 },
  "f-master-droit-europeen-strasbourg": { kind: "mon-master", session: "2025", recordIds: ["1800678N7GYR", "1800678NJBN3", "1800678NLYT5", "1800678NRIDK", "1800678NX7CA"], capacity: 67, candidates: 2250, offers: 303, fromAbroadCandidates: 179, fromAbroadOffers: 31 },
  "f-master-mecanique-sorbonne": { kind: "mon-master", session: "2025", recordIds: ["1900308K5YF1", "1900308KD6YA", "1900308KE8MI", "1900308KICBS", "1900308KJFYC", "1900308KN8R5", "1900308KYR18", "1900308KZ3BK"], capacity: 161, candidates: 2435, offers: 490, fromAbroadCandidates: 213, fromAbroadOffers: 10 },
  "f-master-physique-lyon1": { kind: "mon-master", session: "2025", recordIds: ["2200135X3SDH", "2200135X6QJM", "2200135X8YJI"], capacity: 92, candidates: 863, offers: 457, fromAbroadCandidates: 51, fromAbroadOffers: 15 },
  "f-master-science-politique-paris1": { kind: "mon-master", session: "2025", recordIds: ["1604337Q5MY8", "1604337Q8AT1", "1604337QE2R5", "1604337QG64S", "1604337QG7CW", "1604337QSRXB", "1604337QT4IF", "1604337QUV61", "1604337QWYTK"], capacity: 164, candidates: 9998, offers: 344, fromAbroadCandidates: 1661, fromAbroadOffers: 36 },
  "f-mosig-grenoble-inp": { kind: "mon-master", session: "2025", recordIds: ["1602521W4U67", "1602521WTX5W"], capacity: 30, candidates: 622, offers: 74, fromAbroadCandidates: 90, fromAbroadOffers: 6 },
  "f-scdi-sorbonne": { kind: "mon-master", session: "2025", recordIds: ["1900282G8KFQ"], capacity: 25, candidates: 465, offers: 87, fromAbroadCandidates: 31, fromAbroadOffers: 2 },
  "f-but-info-nantes": { kind: "parcoursup", session: "2025", recordId: "5482", selective: true, capacity: 78, applications: 2397, accessRate: 30, platformUrl: "https://dossierappel.parcoursup.fr/Candidats/public/fiches/afficherFicheFormation?g_ta_cod=5482&typeBac=0&originePc=0" },
  "f-licence-droit-bordeaux": { kind: "parcoursup", session: "2025", recordId: "26330", selective: false, capacity: 1285, applications: 10913, accessRate: 42, platformUrl: "https://dossierappel.parcoursup.fr/Candidats/public/fiches/afficherFicheFormation?g_ta_cod=26330&typeBac=0&originePc=0" },
  "f-licence-eco-gestion-amu": { kind: "parcoursup", session: "2025", recordId: "12528", selective: false, capacity: 459, applications: 4671, accessRate: 81, platformUrl: "https://dossierappel.parcoursup.fr/Candidats/public/fiches/afficherFicheFormation?g_ta_cod=12528&typeBac=0&originePc=0" },
  "f-licence-eco-gestion-tse": { kind: "parcoursup", session: "2025", recordId: "4138", selective: false, capacity: 350, applications: 4122, accessRate: 41, platformUrl: "https://dossierappel.parcoursup.fr/Candidats/public/fiches/afficherFicheFormation?g_ta_cod=4138&typeBac=0&originePc=0" },
  "f-licence-info-paris-saclay": { kind: "parcoursup", session: "2025", recordId: "27930", selective: false, capacity: 75, applications: 3591, accessRate: 28, platformUrl: "https://dossierappel.parcoursup.fr/Candidats/public/fiches/afficherFicheFormation?g_ta_cod=27930&typeBac=0&originePc=0" },
  "f-licence-info-sorbonne": { kind: "parcoursup", session: "2025", recordId: "47331", selective: false, capacity: 200, applications: 8360, accessRate: 18, platformUrl: "https://dossierappel.parcoursup.fr/Candidats/public/fiches/afficherFicheFormation?g_ta_cod=47331&typeBac=0&originePc=0" },
  "f-licence-info-toulouse": { kind: "parcoursup", session: "2025", recordId: "4188", selective: false, capacity: 294, applications: 3054, accessRate: 45, platformUrl: "https://dossierappel.parcoursup.fr/Candidats/public/fiches/afficherFicheFormation?g_ta_cod=4188&typeBac=0&originePc=0" },
  "f-licence-maths-rennes": { kind: "parcoursup", session: "2025", recordId: "19305", selective: false, capacity: 175, applications: 2050, accessRate: 98, platformUrl: "https://dossierappel.parcoursup.fr/Candidats/public/fiches/afficherFicheFormation?g_ta_cod=19305&typeBac=0&originePc=0" },
  "f-licence-physique-montpellier": { kind: "parcoursup", session: "2025", recordId: "31260", selective: false, capacity: 290, applications: 3188, accessRate: 82, platformUrl: "https://dossierappel.parcoursup.fr/Candidats/public/fiches/afficherFicheFormation?g_ta_cod=31260&typeBac=0&originePc=0" },
  "f-licence-science-politique-lille": { kind: "parcoursup", session: "2025", recordId: "20949", selective: false, capacity: 350, applications: 6609, accessRate: 29, platformUrl: "https://dossierappel.parcoursup.fr/Candidats/public/fiches/afficherFicheFormation?g_ta_cod=20949&typeBac=0&originePc=0" },
  "f-licence-sciences-vie-lorraine": { kind: "parcoursup", session: "2025", recordId: "42987", selective: false, capacity: 290, applications: 2496, accessRate: 85, platformUrl: "https://dossierappel.parcoursup.fr/Candidats/public/fiches/afficherFicheFormation?g_ta_cod=42987&typeBac=0&originePc=0" },
  "f-licence-spi-strasbourg": { kind: "parcoursup", session: "2025", recordId: "8059", selective: false, capacity: 227, applications: 1593, accessRate: 100, platformUrl: "https://dossierappel.parcoursup.fr/Candidats/public/fiches/afficherFicheFormation?g_ta_cod=8059&typeBac=0&originePc=0" },
  "f-bachelier-ingenieur-civil-uliege": {
    kind: "entrance-exam",
    note: "Examen d'entrée obligatoire en mathématiques ; ce n'est pas un concours : environ 80 % des candidats le réussissent (page officielle de l'ULiège).",
  },
  "f-bachelier-biologie-ulb": { kind: "open-access", note: "Accès ouvert en Belgique, sans quota ; conditions propres aux diplômes hors UE (voir la procédure)." },
  "f-bachelier-chimie-unamur": { kind: "open-access", note: "Accès ouvert en Belgique, sans quota ; équivalence du diplôme secondaire exigée." },
  "f-bachelier-droit-ulb": { kind: "open-access", note: "Accès ouvert en Belgique, sans quota ; conditions propres aux diplômes hors UE (voir la procédure)." },
  "f-bachelier-maths-unamur": { kind: "open-access", note: "Accès ouvert en Belgique, sans quota ; équivalence du diplôme secondaire exigée." },
  "f-bachelier-sciences-politiques-uliege": { kind: "open-access", note: "Accès ouvert en Belgique, sans quota ; équivalence du diplôme secondaire exigée." },
  "f-date-uclouvain": { kind: "on-file", note: "Diplôme étranger : admission sur dossier (directe, avec compléments ou refus). Aucun taux publié." },
  "f-master-gestion-uclouvain": { kind: "on-file", note: "Diplôme étranger : admission sur dossier (directe, avec compléments ou refus). Aucun taux publié." },
  "f-master-relations-internationales-uclouvain": { kind: "on-file", note: "Diplôme étranger : admission sur dossier ; hors Europe, moyenne d'au moins 13/20 exigée. Aucun taux publié." },
  "f-m1-economics-tse": { kind: "not-published", note: "Parcours international en anglais : pas de ligne correspondante identifiable sur Mon Master." },
  "f-master-icfp-psl": { kind: "not-published", note: NOT_ON_PLATFORMS },
  "f-master-finance-ift-lyon3": { kind: "not-published", note: "Mon Master affiche 0 proposition pour 767 candidatures en 2025 : donnée inexploitable, non reprise." },
  "f-master-maths-appliquees-stats-lille": { kind: "not-published", note: "Pas de ligne Mon Master correspondant sans ambiguïté à cette mention." },
  "f-mph-ehesp": { kind: "not-published", note: "Le Master of Public Health recrute sur la plateforme de l'EHESP, hors Mon Master." },
  "f-m2ds-ip-paris": { kind: "not-published", note: "Entrée directe en M2, hors Mon Master : pas de taux publié." },
  "f-mosef-paris1": { kind: "not-published", note: "Entrée directe en M2, hors Mon Master : pas de taux publié." },
  "f-ms-ia-telecom-paris": { kind: "not-published", note: NOT_ON_PLATFORMS },
  "f-msc-ai-centralesupelec": { kind: "not-published", note: NOT_ON_PLATFORMS },
  "f-msc-advanced-manufacturing-centrale-nantes": { kind: "not-published", note: NOT_ON_PLATFORMS },
  "f-master-international-security-sciences-po": { kind: "not-published", note: NOT_ON_PLATFORMS },
  "f-insa-lyon-info-parallele": { kind: "not-published", note: NOT_ON_PLATFORMS },
  "f-ing-info-enseirb-matmeca": { kind: "not-published", note: NOT_ON_PLATFORMS },
};
