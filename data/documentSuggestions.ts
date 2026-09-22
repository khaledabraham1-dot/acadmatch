/**
 * Suggestions officielles de documents (Phase 15).
 *
 * Contrainte explicite de la phase : "ne déclare jamais un document
 * obligatoire sans source". Deux plateformes de candidature majeures du
 * catalogue (Parcoursup pour les Licences, Mon Master pour les Masters 1)
 * ont été vérifiées avant d'écrire ce fichier — voir docs/data-sourcing.md
 * pour la discipline suivie :
 *
 * - Parcoursup n'a AUCUNE liste de pièces générique et universelle : les
 *   pièces demandées varient par vœu/formation ("les pièces à fournir sont
 *   indiquées dans ton dossier" — impossible de joindre autre chose que ce
 *   qui est explicitement demandé). Affirmer une liste "obligatoire"
 *   générique pour Parcoursup serait donc inventé — aucune suggestion
 *   n'est proposée pour ce cas.
 * - Mon Master a un vrai "dossier commun" transmis à TOUTES les
 *   candidatures Master avant les pièces spécifiques à chaque formation :
 *   c'est la seule liste suffisamment universelle et sourcée pour être
 *   proposée ici, en suggestion, jamais comme la liste complète et
 *   définitive d'une formation précise.
 */

export interface DocumentSuggestion {
  label: string;
  required: boolean;
}

export interface DocumentSuggestionSet {
  title: string;
  /** Rappelle explicitement les limites de la suggestion — jamais présentée comme exhaustive par formation. */
  description: string;
  items: DocumentSuggestion[];
  source: string;
  verifiedAt: string;
}

/**
 * Dossier commun Mon Master — vérifié le 2026-09-22 (recoupé via une source
 * secondaire, la page officielle information.monmaster.gouv.fr renvoyant
 * une erreur d'accès automatisé au moment de la vérification — même
 * discipline que pour l'équivalence de diplômes, Phase post-MVP
 * "International degree equivalence").
 */
export const MON_MASTER_COMMON_DOCUMENTS: DocumentSuggestionSet = {
  title: "Dossier commun Mon Master",
  description:
    "Base commune transmise à toutes vos candidatures sur Mon Master (Master 1, France) — les pièces spécifiques demandées par chaque formation s'y ajoutent et varient. Consultez toujours la fiche de la formation visée sur monmaster.gouv.fr pour la liste complète.",
  items: [
    { label: "État civil (pièce d'identité)", required: true },
    { label: "Cursus post-bac (parcours suivi)", required: true },
    { label: "Relevés de notes de tout le cursus post-bac", required: true },
    { label: "CV", required: true },
  ],
  source: "https://information.monmaster.gouv.fr/faq/candidater/",
  verifiedAt: "2026-09-22",
};

/**
 * Une suggestion n'est proposée que si la procédure DÉJÀ vérifiée de la
 * formation (`StudyProgram.applicationProcedure`) mentionne explicitement
 * la plateforme concernée — jamais déduite de `goal`/`level`/`country`.
 * Un "Master 1" ne suffit pas : plusieurs masters du catalogue ont un
 * `level` "Master 1" mais utilisent leur propre plateforme d'établissement
 * (ex: MSc AI de CentraleSupélec), pas Mon Master. Ancrer la suggestion au
 * texte déjà sourcé évite ce faux positif.
 */
export function documentSuggestionFor(applicationProcedure: string): DocumentSuggestionSet | null {
  if (applicationProcedure.includes("Mon Master")) return MON_MASTER_COMMON_DOCUMENTS;
  return null;
}
