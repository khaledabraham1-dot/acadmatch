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
 */

export type CampaignId = "parcoursup" | "monmaster" | "eef-benin";

export interface CampaignPhase {
  label: string;
  /** Début ISO (YYYY-MM-DD), absent pour une simple échéance. */
  start?: string;
  /** Fin ou échéance ISO (YYYY-MM-DD), incluse. */
  end: string;
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
    name: "Études en France — Bénin",
    audience: "Candidats résidant au Bénin (procédure de candidature classique)",
    intake: 2027,
    phases: [
      { label: "Ouverture de la plateforme Études en France", end: "2026-10-01" },
      { label: "Paiement des frais de dossier", end: "2026-11-15" },
      { label: "Premier dépôt du dossier", end: "2026-11-20" },
      { label: "Dépôt définitif après corrections", end: "2026-12-15" },
      { label: "Entretiens pédagogiques", end: "2027-03-15" },
      { label: "Clôture de la procédure", end: "2027-05-31" },
    ],
    source: "https://www.benin.campusfrance.org/calendrier-de-la-procedure-de-candidatures-classiques-2026-2027",
    sourceLabel: "Campus France Bénin",
    verifiedAt: "2026-10-02",
    nextCalendarNote: "Le calendrier suivant est publié par Campus France Bénin à l'ouverture de la campagne, le 1er octobre.",
  },
};

/** Pays dont le calendrier « Études en France » est relevé ci-dessus. */
export const EEF_CAMPAIGN_BY_COUNTRY: Record<string, CampaignId> = {
  Bénin: "eef-benin",
};

/** Page officielle commune à tous les pays « Études en France ». */
export const EEF_GENERAL_SOURCE = "https://www.campusfrance.org/fr/candidature-procedure-etudes-en-france";
