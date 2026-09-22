/**
 * Règles d'éligibilité administrative par pays (Phase 11).
 *
 * Distinct du moteur de matching : ces parcours déterminent QUI peut
 * candidater par quelle voie administrative (nationalité, pays de
 * résidence), jamais la compatibilité académique d'un profil avec le
 * contenu d'une formation (lib/matching/engine.ts n'importe jamais ce
 * fichier). Distinct aussi d'`applicationProcedure` (spécifique à chaque
 * formation, sur `data/formations.ts`) : ce fichier documente des règles
 * NATIONALES qui s'appliquent à toutes les formations d'un pays, sourcées
 * une seule fois plutôt que répétées (et donc invérifiées) sur chaque fiche.
 *
 * "Implémente d'abord les règles françaises" (consigne de la phase) : seule
 * la France est couverte pour l'instant. Clé par `Institution.country` pour
 * qu'un futur pays s'ajoute sans redesign — voir `ELIGIBILITY_GUIDES_BY_COUNTRY`.
 */

export interface EligibilityPathway {
  /** À qui s'applique ce parcours (nationalité / pays de résidence / niveau visé). */
  audience: string;
  /** Ce que ce parcours implique concrètement. */
  summary: string;
}

export interface CountryEligibilityGuide {
  country: string;
  pathways: EligibilityPathway[];
  /** Source officielle unique faisant foi pour l'ensemble du guide. */
  source: string;
  verifiedAt: string;
}

/**
 * France — vérifié le 2026-09-22 auprès de service-public.gouv.fr (synthèse
 * officielle), recoupé avec campusfrance.org (procédure "Études en France")
 * et parcoursup.gouv.fr (plateforme elle-même). Simplifié volontairement :
 * la source officielle détaille des cas particuliers (double diplôme
 * franco-étranger, CPGE déjà validée, etc.) non repris ici — le renvoi vers
 * la source reste explicite pour ces cas.
 */
export const FRANCE_ELIGIBILITY_GUIDE: CountryEligibilityGuide = {
  country: "France",
  pathways: [
    {
      audience: "Bacheliers français, ressortissants UE / EEE / Suisse",
      summary:
        "Parcoursup pour une 1ʳᵉ année de licence (vœux généralement formulés de janvier à mars).",
    },
    {
      audience: "Étudiants hors UE/EEE/Suisse, résidant en France ou hors des pays « Études en France »",
      summary:
        "Demande d'Admission Préalable (DAP) pour une 1ʳᵉ année de licence, généralement entre octobre et décembre.",
    },
    {
      audience: "Étudiants résidant dans l'un des 73 pays couverts par la procédure « Études en France »",
      summary:
        "DAP (ou Parcoursup si diplôme français/européen) combinée à la procédure « Études en France » (Campus France), qui gère aussi la demande de visa étudiant.",
    },
    {
      audience: "Candidats en Master (M1), toutes nationalités",
      summary: "Plateforme nationale Mon Master.",
    },
  ],
  source: "https://www.service-public.gouv.fr/particuliers/vosdroits/F36519/1",
  verifiedAt: "2026-09-22",
};

/** Pays couverts jusqu'ici — un pays absent de cette table n'affiche aucun guide (jamais de contenu inventé). */
export const ELIGIBILITY_GUIDES_BY_COUNTRY: Record<string, CountryEligibilityGuide> = {
  France: FRANCE_ELIGIBILITY_GUIDE,
};
