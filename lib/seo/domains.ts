import type { Importance, StudyProgram } from "@/types";
import { normalize } from "@/lib/utils";
import { formatList } from "@/lib/search/filters";
import { MAX_TITLE_LENGTH, truncateForMeta } from "@/lib/site";

/**
 * Pages « domaine » (/domaines/[slug], 2026-10-03) : la requête réelle d'un
 * étudiant est « master informatique France » ou « prérequis master droit »,
 * pas le nom d'une formation précise. Chaque page est entièrement dérivée du
 * catalogue vérifié (aucun texte rédigé à la main qui pourrait se périmer) :
 * elle se met à jour toute seule quand une fiche change.
 */

/** En dessous, la page existe (utile à l'étudiant) mais reste hors index : contenu trop mince pour Google. */
export const MIN_FORMATIONS_FOR_INDEXING = 3;

/** Slug stable d'un domaine du catalogue (« Data Science & IA » → « data-science-ia »). */
export function domainSlug(domain: string): string {
  return normalize(domain)
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function domainPath(domain: string): string {
  return `/domaines/${domainSlug(domain)}`;
}

export function domainFromSlug(slug: string, formations: StudyProgram[]): string | undefined {
  return [...new Set(formations.map((f) => f.field))].find((domain) => domainSlug(domain) === slug);
}

export interface DomainSummary {
  domain: string;
  formations: StudyProgram[];
  licences: StudyProgram[];
  masters: StudyProgram[];
  others: StudyProgram[];
  countries: string[];
  cities: string[];
  englishTaught: number;
  /** Compétences d'entrée les plus souvent demandées par les jurys du domaine (fiches sourcées). */
  topEntrySkills: { name: string; count: number }[];
  indexable: boolean;
}

const WEIGHT: Record<Importance, number> = { essentielle: 3, importante: 2, utile: 1 };

/** Langues : déjà déclarées par l'étudiant, elles ne sont pas une « compétence » à travailler. */
const LANGUAGE_SKILL = /^(anglais|français)/i;

export function summarizeDomain(domain: string, all: StudyProgram[]): DomainSummary {
  const formations = all
    .filter((f) => f.field === domain)
    .sort((a, b) => a.requiredLevel.localeCompare(b.requiredLevel) || a.name.localeCompare(b.name, "fr"));
  const tally = new Map<string, { count: number; weight: number }>();
  for (const formation of formations) {
    for (const skill of formation.skills) {
      if (LANGUAGE_SKILL.test(skill.name)) continue;
      const entry = tally.get(skill.name) ?? { count: 0, weight: 0 };
      tally.set(skill.name, { count: entry.count + 1, weight: entry.weight + WEIGHT[skill.importance] });
    }
  }
  const topEntrySkills = [...tally.entries()]
    .sort((a, b) => b[1].weight - a[1].weight || b[1].count - a[1].count || a[0].localeCompare(b[0], "fr"))
    .slice(0, 6)
    .map(([name, { count }]) => ({ name, count }));

  return {
    domain,
    formations,
    licences: formations.filter((f) => f.goal === "Licence"),
    masters: formations.filter((f) => f.goal === "Master"),
    others: formations.filter((f) => f.goal !== "Licence" && f.goal !== "Master"),
    countries: [...new Set(formations.map((f) => f.institution.country))].sort(),
    cities: [...new Set(formations.map((f) => f.institution.city))].sort((a, b) => a.localeCompare(b, "fr")),
    englishTaught: formations.filter((f) => f.language === "Anglais").length,
    topEntrySkills,
    indexable: formations.length >= MIN_FORMATIONS_FOR_INDEXING,
  };
}

/** « Informatique » → « en informatique » ; « Data Science & IA » → « en data science et IA ». */
export function domainPhrase(domain: string): string {
  const lowered = domain === "Data Science & IA" ? "data science et IA" : domain.replace(/ & /g, " et ").toLocaleLowerCase("fr");
  return `en ${lowered}`;
}

export function domainTitle(summary: DomainSummary): string {
  const phrase = domainPhrase(summary.domain);
  const kinds = [summary.licences.length > 0 && "licence", summary.masters.length > 0 && "master"].filter(Boolean).join(" et ") || "formations";
  const base = `${kinds.charAt(0).toUpperCase()}${kinds.slice(1)} ${phrase}`;
  return [`${base} : prérequis et admission`, `${base} : prérequis`, base].find((t) => t.length <= MAX_TITLE_LENGTH) ?? base;
}

export function domainDescription(summary: DomainSummary): string {
  const where = summary.countries.length > 1 ? "en France et en Belgique" : `en ${summary.countries[0]}`;
  return truncateForMeta(
    `${summary.formations.length} formations ${domainPhrase(summary.domain)} ${where} (${formatList(summary.cities)}) : ` +
      `prérequis d'entrée, compétences attendues par les jurys et procédure, vérifiés sur les sources officielles.`,
  );
}

