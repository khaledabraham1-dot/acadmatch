import { EEF_CAMPAIGN_BY_COUNTRY, OFFICIAL_CAMPAIGNS } from "@/data/campaigns";
import { normalize } from "@/lib/utils";

/**
 * Guides éditoriaux (2026-10-03) : un par grande question que tapent les
 * étudiants visés (recherche de mots-clés dans docs/seo.md). Chaque guide
 * est construit sur les données sourcées du site (frais, visa, calendriers,
 * catalogue) : un montant mis à jour dans data/ l'est aussi dans le guide.
 *
 * Registre unique : l'index /guides, le plan du site, les liens internes et
 * les tests d'unicité des titres lisent cette liste.
 */

export interface Guide {
  slug: string;
  /** Titre de la page (balise <title>, sans le suffixe « — AcadMatch »). */
  title: string;
  /** Titre affiché en tête de page (h1). */
  heading: string;
  description: string;
  /** Libellé court pour les listes de liens. */
  label: string;
  updatedAt: string;
}

export const GUIDES_UPDATED_AT = "2026-10-03";

export const GUIDES: Guide[] = [
  {
    slug: "etudes-en-france",
    title: "Études en France (Campus France) : procédure et calendrier",
    heading: "Études en France : la procédure Campus France, étape par étape",
    description:
      "Qui passe par Études en France, comment se déroule la procédure Campus France, quand déposer son dossier et pourquoi elle remplace Parcoursup et Mon Master.",
    label: "Études en France (Campus France)",
    updatedAt: GUIDES_UPDATED_AT,
  },
  {
    slug: "master-en-france-etudiant-etranger",
    title: "Master en France pour étudiant étranger : admission et coût",
    heading: "Faire un master en France quand on est étudiant étranger",
    description:
      "Mon Master, Études en France ou plateforme d'école : comment candidater en master en France depuis l'étranger, les prérequis et les frais 2026-2027.",
    label: "Master en France (étudiant étranger)",
    updatedAt: GUIDES_UPDATED_AT,
  },
  {
    slug: "licence-en-france-apres-un-bac-etranger",
    title: "Licence en France après un bac étranger : DAP ou Parcoursup",
    heading: "Entrer en licence en France après un bac étranger",
    description:
      "Parcoursup, DAP ou Études en France : quelle procédure pour entrer en 1re année de licence en France avec un bac étranger, calendrier et coût.",
    label: "Licence en France après un bac étranger",
    updatedAt: GUIDES_UPDATED_AT,
  },
  {
    slug: "etudier-en-belgique",
    title: "Étudier en Belgique : équivalence, inscription, frais, visa",
    heading: "Étudier en Belgique quand on vient d'un pays hors Union européenne",
    description:
      "Équivalence du diplôme, candidature à l'université, droits d'inscription 2026-2027, ressources et visa D : les étapes pour étudier en Belgique.",
    label: "Étudier en Belgique",
    updatedAt: GUIDES_UPDATED_AT,
  },
  {
    slug: "cout-des-etudes-en-france",
    title: "Coût des études en France 2026-2027 (euros et FCFA)",
    heading: "Combien coûtent des études en France pour un étudiant étranger ?",
    description:
      "Droits d'inscription en licence, master et école d'ingénieur, CVEC, ressources pour le visa : les montants officiels 2026-2027, en euros et en FCFA.",
    label: "Coût des études en France",
    updatedAt: GUIDES_UPDATED_AT,
  },
  {
    slug: "equivalence-diplome-etranger",
    title: "Équivalence d'un diplôme étranger : quel niveau en France ?",
    heading: "Équivalence de diplôme : à quel niveau français correspond votre parcours ?",
    description:
      "Licence, bachelor, master : situer un diplôme étranger dans le système français (bac+3, bac+5) et obtenir une attestation ENIC-NARIC.",
    label: "Équivalence de diplôme",
    updatedAt: GUIDES_UPDATED_AT,
  },
];

export function guidePath(slug: string): string {
  return `/guides/${slug}`;
}

export function guideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}

/** Pages pays « Études en France » : seulement les pays dont le calendrier officiel est relevé. */
export interface EefCountryPage {
  country: string;
  slug: string;
  campaignId: (typeof EEF_CAMPAIGN_BY_COUNTRY)[string];
}

export function countrySlug(country: string): string {
  return normalize(country).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function eefCountryPages(): EefCountryPage[] {
  return Object.entries(EEF_CAMPAIGN_BY_COUNTRY).map(([country, campaignId]) => ({
    country,
    slug: countrySlug(country),
    campaignId,
  }));
}

export function eefCountryPath(country: string): string {
  return `/guides/etudes-en-france/${countrySlug(country)}`;
}

export function eefCountryTitle(country: string): string {
  const campaign = OFFICIAL_CAMPAIGNS[EEF_CAMPAIGN_BY_COUNTRY[country]];
  return `Campus France ${country} : calendrier ${campaign.intake} et dates limites`;
}

/** « au Bénin », « en Côte d'Ivoire », « aux Comores » : préposition de lieu d'un nom de pays. */
export function inCountry(country: string): string {
  const plural = ["Comores", "Émirats arabes unis", "États-Unis", "Philippines"];
  if (plural.includes(country)) return `aux ${country}`;
  const masculineInE = ["Mexique", "Cambodge", "Mozambique", "Zimbabwe"];
  if (/^[AEIOUÉÈÂÎ]/i.test(country) || (country.endsWith("e") && !masculineInE.includes(country))) return `en ${country}`;
  return `au ${country}`;
}
