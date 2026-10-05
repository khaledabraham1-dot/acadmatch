/**
 * Partage d'une page publique (2026-10-05) — WhatsApp en priorité.
 *
 * Le lien porte `utm_source` (le canal) et `utm_medium=partage` : la mesure
 * d'audience sans cookie dit ainsi combien de visites viennent du
 * bouche-à-oreille, sans identifier personne. Les pages partagées ont une
 * URL canonique : ces paramètres ne créent pas de doublon pour Google.
 */

export function buildShareUrl(origin: string, path: string, channel: string): string {
  const params = new URLSearchParams({ utm_source: channel, utm_medium: "partage" });
  return `${origin.replace(/\/+$/, "")}${path}?${params.toString()}`;
}

/** Lien qui ouvre WhatsApp (application ou web) avec le message prêt à envoyer. */
export function whatsappShareHref(text: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
}

/** Message de partage d'un résultat : le score n'est partagé que si l'étudiant clique. */
export function resultShareText(score: number, formationName: string, institution: string): string {
  return `J'ai ${score}/100 de compatibilité avec « ${formationName} » (${institution}) sur AcadMatch. Vérifie si ton parcours correspond aux prérequis, c'est gratuit :`;
}

/** Message de partage d'une fiche formation. */
export function formationShareText(formationName: string, institution: string): string {
  return `Regarde cette formation : « ${formationName} » (${institution}). Prérequis vérifiés et score de compatibilité gratuit sur AcadMatch :`;
}
