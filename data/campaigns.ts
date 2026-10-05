/**
 * Calendriers officiels de candidature (2026-10-02).
 *
 * Seules des dates relevées sur un texte officiel : arrêté publié au Journal
 * officiel (Parcoursup, Mon Master) ou page de l'Espace Campus France du pays
 * (Études en France). Jamais de date d'un site tiers : le 2026-10-02, des
 * sites d'orientation publiaient déjà des dates « Études en France 2027 »
 * pour l'Algérie alors que la page officielle indiquait « information à
 * venir ».
 *
 * `intake` = rentrée à laquelle ces dates s'appliquent. Quand le calendrier
 * de la rentrée visée n'est pas encore publié, on montre celui de la
 * campagne précédente, toujours présenté comme INDICATIF (lib/campaigns.ts).
 *
 * À revérifier : Parcoursup et Mon Master dès la publication de leur arrêté
 * (habituellement décembre-février) ; Études en France chaque 1er octobre.
 *
 * « Avant le JJ » sur la source devient la veille ici (échéance incluse) :
 * mieux vaut un jour d'avance qu'un dossier refusé. « Jusqu'au JJ » reste JJ.
 *
 * Pays non relevés le 2026-10-05 faute de calendrier rentrée 2027 publié
 * en texte exploitable : Algérie et Tunisie (images seules), Guinée, Congo,
 * Tchad, Gabon, Burkina Faso, RDC, Mauritanie (campagne précédente
 * seulement), Côte d'Ivoire (calendrier 2025-2026 seulement).
 */

export type CampaignId = "parcoursup" | "monmaster" | "eef-benin" | "eef-senegal" | "eef-cameroun" | "eef-togo" | "eef-mali" | "eef-maroc";

export interface CampaignPhase {
  label: string;
  /** Début ISO (YYYY-MM-DD), absent pour une simple échéance. */
  start?: string;
  /** Fin ou échéance ISO (YYYY-MM-DD), incluse. */
  end: string;
  /** Date limite principale de dépôt du dossier (mise en avant dans les guides pays). */
  key?: true;
}

export interface OfficialCampaign {
  id: CampaignId;
  name: string;
  /** À qui s'applique ce calendrier, en clair. */
  audience: string;
  intake: number;
  phases: CampaignPhase[];
  source: string;
  sourceLabel: string;
  verifiedAt: string;
  /** Quand paraît d'habitude le calendrier suivant (affiché si ces dates sont indicatives). */
  nextCalendarNote: string;
}

export const OFFICIAL_CAMPAIGNS: Record<CampaignId, OfficialCampaign> = {
  parcoursup: {
    id: "parcoursup",
    name: "Parcoursup",
    audience: "Entrée en 1re année de licence ou de BUT en France",
    intake: 2026,
    phases: [
      { label: "Dépôt des vœux", start: "2026-01-19", end: "2026-03-12" },
      { label: "Confirmation des vœux", end: "2026-04-01" },
      { label: "Réponses des établissements et choix", start: "2026-06-02", end: "2026-07-10" },
    ],
    source: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053331736",
    sourceLabel: "Arrêté du 22 décembre 2025 (Journal officiel)",
    verifiedAt: "2026-10-02",
    nextCalendarNote: "Le calendrier de la session suivante est fixé par arrêté, en général publié en fin d'année.",
  },
  monmaster: {
    id: "monmaster",
    name: "Mon Master",
    audience: "Entrée en 1re année de master national en France",
    intake: 2026,
    phases: [
      { label: "Dépôt des candidatures", start: "2026-02-17", end: "2026-03-16" },
      { label: "Phase d'admission principale", start: "2026-06-03", end: "2026-06-16" },
      { label: "Phase complémentaire : nouvelles candidatures", start: "2026-06-19", end: "2026-06-25" },
    ],
    source: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053484100",
    sourceLabel: "Arrêté du 13 février 2026 (Journal officiel)",
    verifiedAt: "2026-10-02",
    nextCalendarNote: "Le calendrier de la campagne suivante est fixé par arrêté, en général publié en début d'année.",
  },
  "eef-benin": {
    id: "eef-benin",
    name: "Études en France (Bénin)",
    audience: "Candidats résidant au Bénin (procédure de candidature classique)",
    intake: 2027,
    phases: [
      { label: "Ouverture de la plateforme Études en France", end: "2026-10-01" },
      { label: "Paiement des frais de dossier", end: "2026-11-15" },
      { label: "Premier dépôt du dossier", end: "2026-11-20" },
      { label: "Dépôt définitif après corrections", end: "2026-12-15", key: true },
      { label: "Entretiens pédagogiques", end: "2027-03-15" },
      { label: "Clôture de la procédure", end: "2027-05-31" },
    ],
    source: "https://www.benin.campusfrance.org/calendrier-de-la-procedure-de-candidatures-classiques-2026-2027",
    sourceLabel: "Campus France Bénin",
    verifiedAt: "2026-10-02",
    nextCalendarNote: "Le calendrier suivant est publié par Campus France Bénin à l'ouverture de la campagne, le 1er octobre.",
  },
  "eef-senegal": {
    id: "eef-senegal",
    name: "Études en France (Sénégal)",
    audience: "Candidats résidant au Sénégal, formations « connectées » à la plateforme Études en France",
    intake: 2027,
    phases: [
      { label: "Soumission du dossier sur Études en France", start: "2026-10-01", end: "2026-12-15", key: true },
      { label: "Paiement des frais de dossier", end: "2026-12-19" },
      { label: "Confirmation du choix de la formation", end: "2027-05-31" },
      { label: "Compléments ou vérification des originaux (si demandés)", end: "2027-07-30" },
      { label: "Rendez-vous de demande de visa étudiant", start: "2027-05-15", end: "2027-08-27" },
    ],
    source: "https://www.senegal.campusfrance.org/calendrier-de-la-procedure-rentree-2027-2028",
    sourceLabel: "Campus France Sénégal",
    verifiedAt: "2026-10-05",
    nextCalendarNote: "Le calendrier suivant est publié par Campus France Sénégal à l'ouverture de la campagne, le 1er octobre.",
  },
  "eef-cameroun": {
    id: "eef-cameroun",
    name: "Études en France (Cameroun)",
    audience: "Candidats résidant au Cameroun (procédure Études en France)",
    intake: 2027,
    phases: [
      { label: "Ouverture de la plateforme Études en France", end: "2026-10-01" },
      { label: "Paiement des frais de procédure (TLS)", start: "2026-10-05", end: "2027-02-16" },
      { label: "Dépôt du dossier (1re année de licence, écoles d'architecture)", end: "2026-12-14" },
      { label: "Dépôt du dossier (L2, L3, BUT, licence pro, master, ingénieur)", end: "2027-01-31", key: true },
      { label: "Entretien pédagogique", start: "2026-10-12", end: "2027-03-01" },
      { label: "Réponses des établissements", end: "2027-04-30" },
      { label: "Choix définitif", end: "2027-05-30" },
    ],
    source: "https://www.cameroun.campusfrance.org/fr/calendriers-de-la-campagne-de-candidature-2027-2028",
    sourceLabel: "Campus France Cameroun",
    verifiedAt: "2026-10-05",
    nextCalendarNote: "Le calendrier suivant est publié par Campus France Cameroun à l'ouverture de la campagne, le 1er octobre.",
  },
  "eef-togo": {
    id: "eef-togo",
    name: "Études en France (Togo)",
    audience: "Candidats résidant au Togo, formations connectées (candidature classique « Je suis candidat »)",
    intake: 2027,
    phases: [
      { label: "Ouverture de la plateforme Études en France", end: "2026-10-01" },
      { label: "Dépôt du dossier et paiement (1re année de licence)", end: "2026-12-15" },
      { label: "Dépôt du dossier et paiement (autres formations)", end: "2026-12-31", key: true },
      { label: "Entretien pédagogique", end: "2027-03-15" },
      { label: "Réponses des établissements", end: "2027-04-30" },
      { label: "Choix définitif", end: "2027-05-31" },
    ],
    source: "https://www.togo.campusfrance.org/calendrier-de-la-procedure-2026-2027",
    sourceLabel: "Campus France Togo",
    verifiedAt: "2026-10-05",
    nextCalendarNote: "Le calendrier suivant est publié par Campus France Togo avant l'ouverture de la campagne, le 1er octobre.",
  },
  "eef-mali": {
    id: "eef-mali",
    name: "Études en France (Mali)",
    audience: "Candidats résidant au Mali, établissements publics (procédure « Je suis candidat »)",
    intake: 2027,
    phases: [
      { label: "Ouverture de la plateforme Études en France", end: "2026-10-01" },
      { label: "Dépôt du dossier et paiement (1re année de licence, architecture, PASS/LAS)", end: "2026-11-29" },
      { label: "Dépôt du dossier et paiement (L2, L3, master, BUT, écoles d'ingénieurs et de commerce)", end: "2027-01-30", key: true },
      { label: "Entretien pédagogique", end: "2027-03-14" },
      { label: "Réponses des établissements", end: "2027-04-29" },
    ],
    source: "https://www.mali.campusfrance.org/ouverture-de-la-campagne-2026-2027",
    sourceLabel: "Campus France Mali",
    verifiedAt: "2026-10-05",
    nextCalendarNote: "Le calendrier suivant est publié par Campus France Mali avant l'ouverture de la campagne, le 1er octobre.",
  },
  "eef-maroc": {
    id: "eef-maroc",
    name: "Études en France (Maroc)",
    audience: "Candidats résidant au Maroc, formations connectées à la plateforme Études en France",
    intake: 2027,
    phases: [
      { label: "Candidature sur Études en France (L1 à M2, toutes formations connectées)", start: "2026-10-01", end: "2026-11-15", key: true },
    ],
    source: "https://www.maroc.campusfrance.org/calendrier-de-la-procedure-de-candidature-20262027",
    sourceLabel: "Campus France Maroc",
    verifiedAt: "2026-10-05",
    nextCalendarNote: "Le calendrier suivant est publié par Campus France Maroc avant l'ouverture de la campagne, le 1er octobre.",
  },
};

/** Pays dont le calendrier « Études en France » est relevé ci-dessus. */
export const EEF_CAMPAIGN_BY_COUNTRY: Record<string, CampaignId> = {
  Bénin: "eef-benin",
  Cameroun: "eef-cameroun",
  Mali: "eef-mali",
  Maroc: "eef-maroc",
  Sénégal: "eef-senegal",
  Togo: "eef-togo",
};

/** Pays de la zone franc CFA (parité fixe avec l'euro) : les montants y sont aussi donnés en FCFA. */
export const CFA_COUNTRIES = new Set(["Bénin", "Burkina Faso", "Cameroun", "Centrafrique", "Congo", "Côte d'Ivoire", "Gabon", "Guinée équatoriale", "Guinée-Bissau", "Mali", "Niger", "Sénégal", "Tchad", "Togo"]);

/** Page officielle commune à tous les pays « Études en France ». */
export const EEF_GENERAL_SOURCE = "https://www.campusfrance.org/fr/candidature-procedure-etudes-en-france";
