import type { StudyProgram } from "@/types";
import type { TuitionFee } from "@/data/budget";
import { formationPath, SITE_NAME } from "@/lib/site";

/**
 * Données structurées schema.org (JSON-LD) : aident Google à comprendre
 * qu'une page décrit une formation précise, offerte par tel établissement,
 * et à afficher un fil d'Ariane dans les résultats. N'affirment que ce que
 * la fiche vérifiée contient — jamais de date de campagne ni de taux
 * d'admission.
 */

type JsonLd = Record<string, unknown>;

const CREDENTIAL_BY_GOAL: Record<string, string> = {
  Licence: "Licence",
  Master: "Master",
  Doctorat: "Doctorat",
  "École spécialisée": "Diplôme d'école",
};

/** Codes ISO 3166 attendus par schema.org ; le nom du pays sinon. */
const COUNTRY_CODES: Record<string, string> = { France: "FR", Belgique: "BE" };

export function formationJsonLd(formation: StudyProgram, baseUrl: string, fee?: TuitionFee): JsonLd {
  const url = `${baseUrl}${formationPath(formation)}`;
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalProgram",
    "@id": url,
    name: formation.name,
    description: formation.description,
    url,
    sameAs: formation.source,
    inLanguage: formation.language === "Anglais" ? "en" : formation.language === "Français" ? "fr" : undefined,
    educationalProgramMode: "full-time",
    educationalCredentialAwarded: CREDENTIAL_BY_GOAL[formation.goal] ?? formation.goal,
    programPrerequisites: formation.prerequisites.map((requirement) => requirement.label),
    provider: {
      "@type": "CollegeOrUniversity",
      name: formation.institution.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: formation.institution.city,
        addressCountry: COUNTRY_CODES[formation.institution.country] ?? formation.institution.country,
      },
    },
    ...(fee && !fee.eu.indicative
      ? {
          offers: {
            "@type": "Offer",
            category: fee.scope === "annuel" ? "Droits d'inscription annuels (UE/EEE)" : "Coût total du programme (UE/EEE)",
            price: (fee.eu.cents / 100).toFixed(2),
            priceCurrency: "EUR",
          },
        }
      : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[], baseUrl: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.path}`,
    })),
  };
}

export function websiteJsonLd(baseUrl: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: baseUrl,
    inLanguage: "fr",
    description:
      "Aide à la décision pour choisir une formation en France ou en Belgique : compatibilité académique explicable, sources officielles.",
  };
}

/**
 * Sérialise pour une balise <script type="application/ld+json"> : échappe
 * `<` pour qu'aucun texte du catalogue ne puisse fermer la balise.
 */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function organizationJsonLd(baseUrl: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description:
      "Aide à la décision indépendante pour les étudiants qui visent une licence ou un master en France ou en Belgique.",
  };
}

/** Liste ordonnée de formations (page domaine, catalogue) : aide Google à relier la page à chaque fiche. */
export function itemListJsonLd(name: string, items: { name: string; path: string }[], baseUrl: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: `${baseUrl}${item.path}`,
    })),
  };
}

/**
 * Questions fréquentes d'une page. Google n'affiche plus ce résultat enrichi
 * que pour quelques sites institutionnels, mais le balisage reste lu par les
 * moteurs et les assistants IA : chaque réponse doit être visible sur la page.
 */
export function faqJsonLd(faq: { question: string; answer: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

/** Guide éditorial : date de mise à jour visible et éditeur identifié (signaux de fiabilité). */
export function articleJsonLd(
  article: { title: string; description: string; path: string; updatedAt: string },
  baseUrl: string,
): JsonLd {
  const url = `${baseUrl}${article.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": url,
    headline: article.title,
    description: article.description,
    url,
    inLanguage: "fr",
    dateModified: article.updatedAt,
    author: { "@type": "Organization", name: SITE_NAME, url: baseUrl },
    publisher: { "@type": "Organization", name: SITE_NAME, url: baseUrl },
  };
}
