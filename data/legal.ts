/**
 * Faits juridiques d'AcadMatch — source unique pour les mentions légales,
 * la politique de confidentialité et les conditions d'utilisation.
 *
 * Règle : ces pages décrivent ce que le code fait RÉELLEMENT. Toute nouvelle
 * donnée collectée, clé localStorage, table Supabase ou service tiers doit
 * être ajouté ici dans le même commit (lib/legal.test.ts vérifie les clés
 * localStorage). Un service tiers ajouté doit aussi l'être à la CSP
 * (lib/securityHeaders.ts).
 */

/** Date de dernière mise à jour affichée en tête des trois pages (AAAA-MM-JJ). */
export const LEGAL_UPDATED_AT = "2026-10-05";

export const EDITOR = {
  /** Nom complet de l'éditeur, personne physique (obligatoire avant mise en ligne). */
  name: "SOULEYMANE Khaled",
  status: "Particulier (personne physique), éditeur non professionnel",
  country: "Bénin",
  email: "souleymanekhaled12@gmail.com",
};

export const HOST = {
  name: "Vercel Inc.",
  address: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
  website: "https://vercel.com",
};

/** Autorités de contrôle auprès desquelles un utilisateur peut déposer une réclamation. */
export const AUTHORITIES = [
  {
    name: "APDP — Autorité de Protection des Données à caractère Personnel (Bénin)",
    url: "https://apdp.bj",
  },
  { name: "CNIL (France)", url: "https://www.cnil.fr/fr/plaintes" },
  { name: "Autorité de protection des données (Belgique)", url: "https://www.autoriteprotectiondonnees.be" },
];

export interface Subprocessor {
  name: string;
  role: string;
  location: string;
  privacyUrl: string;
}

export const SUBPROCESSORS: Subprocessor[] = [
  {
    name: "Vercel",
    role: "Hébergement du site, exécution des fonctions serveur et mesure d'audience sans cookie",
    location: "États-Unis (réseau mondial)",
    privacyUrl: "https://vercel.com/legal/privacy-policy",
  },
  {
    name: "Supabase",
    role: "Comptes et envoi des liens de connexion, projets synchronisés, compteur d'usage de l'IA, avis et demandes de formation anonymes, comptage anonyme des étapes du parcours",
    location: "Union européenne",
    privacyUrl: "https://supabase.com/privacy",
  },
  {
    name: "Anthropic (Claude)",
    role: "Lecture des documents importés, lettre de motivation, préparation aux entretiens",
    location: "États-Unis",
    privacyUrl: "https://privacy.claude.com",
  },
];

/**
 * Tout ce qu'AcadMatch garde dans le navigateur (localStorage). Rien de tout
 * cela n'est envoyé à un serveur, sauf le profil quand l'étudiant choisit de
 * le sauvegarder sur son compte.
 */
export const LOCAL_STORAGE_ITEMS: { key: string; content: string }[] = [
  { key: "acadmatch:profile", content: "Votre profil académique (niveau, diplôme, matières, compétences, langues, expériences, et la moyenne lue sur votre relevé si vous l'importez)" },
  { key: "acadmatch:selectedFormationId", content: "La formation que vous consultez" },
  { key: "acadmatch:savedFormationIds", content: "Vos formations sauvegardées" },
  { key: "acadmatch:compareIds", content: "Les formations de votre comparateur" },
  { key: "acadmatch:applications", content: "Votre suivi de candidatures : notes, brouillons de lettre de motivation, préparations d'entretien" },
  { key: "acadmatch:budgets", content: "Vos budgets prévisionnels" },
  { key: "acadmatch:visa", content: "Vos réponses au parcours visa (nationalité, pays de résidence)" },
  { key: "acadmatch:feedback", content: "Vos avis sur les résultats en attente d'envoi (réseau coupé), effacés une fois envoyés" },
  { key: "acadmatch:formation-requests", content: "Vos demandes de formation manquante en attente d'envoi (réseau coupé), effacées une fois envoyées" },
  { key: "acadmatch:sync", content: "La date de vos dernières modifications et le compte auquel elles appartiennent, pour la synchronisation" },
];

/** Vrai quand toutes les informations obligatoires sont renseignées. */
export function isLegalInfoComplete(): boolean {
  return EDITOR.name.trim().length > 0 && EDITOR.email.trim().length > 0;
}
