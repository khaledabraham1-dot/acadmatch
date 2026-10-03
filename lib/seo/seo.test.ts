import { describe, expect, it } from "vitest";
import { FORMATIONS } from "@/data/formations";
import sitemap from "@/app/sitemap";
import { domainDescription, domainPath, domainPhrase, domainSlug, domainTitle, summarizeDomain } from "@/lib/seo/domains";
import { eefCountryPages, eefCountryPath, eefCountryTitle, GUIDES, guidePath, inCountry } from "@/lib/seo/guides";
import { eurosAndCfa } from "@/lib/seo/money";
import { formationDescription, formationTitle, MAX_TITLE_LENGTH, publicFormations } from "@/lib/site";

const formations = publicFormations(FORMATIONS);
const domains = [...new Set(formations.map((f) => f.field))];
const summaries = domains.map((domain) => summarizeDomain(domain, formations));

/** Toutes les pages éditoriales indexables, avec leur titre et leur description. */
const pages = [
  ...formations.map((f) => ({ path: `/formations/${f.id}`, title: formationTitle(f), description: formationDescription(f) })),
  ...summaries.filter((s) => s.indexable).map((s) => ({ path: domainPath(s.domain), title: domainTitle(s), description: domainDescription(s) })),
  ...GUIDES.map((g) => ({ path: guidePath(g.slug), title: g.title, description: g.description })),
  ...eefCountryPages().map((p) => ({ path: eefCountryPath(p.country), title: eefCountryTitle(p.country), description: "" })),
];

describe("SEO : titres et descriptions", () => {
  it("chaque page indexable a un titre unique, assez court pour ne pas être coupé par Google", () => {
    const titles = pages.map((p) => p.title);
    expect(new Set(titles).size).toBe(titles.length);
    for (const page of pages) expect(page.title.length, page.path).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
  });

  it("chaque description tient dans un extrait de résultat (≤ 160 caractères) et est unique", () => {
    const descriptions = pages.map((p) => p.description).filter(Boolean);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    for (const page of pages.filter((p) => p.description)) {
      expect(page.description.length, page.path).toBeLessThanOrEqual(160);
      expect(page.description.length, page.path).toBeGreaterThanOrEqual(70);
    }
  });
});

describe("SEO : pages domaine", () => {
  it("slugs stables, uniques et lisibles", () => {
    expect(domainSlug("Data Science & IA")).toBe("data-science-ia");
    expect(domainSlug("Économie & Gestion")).toBe("economie-gestion");
    expect(domainSlug("Sciences de l'ingénieur")).toBe("sciences-de-l-ingenieur");
    const slugs = domains.map(domainSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("formulation naturelle du domaine", () => {
    expect(domainPhrase("Informatique")).toBe("en informatique");
    expect(domainPhrase("Data Science & IA")).toBe("en data science et IA");
    expect(domainPhrase("Économie & Gestion")).toBe("en économie et gestion");
  });

  it("un domaine trop mince reste hors index", () => {
    for (const summary of summaries) expect(summary.indexable).toBe(summary.formations.length >= 3);
  });

  it("les compétences d'entrée du domaine ne comptent pas les langues", () => {
    for (const summary of summaries) {
      for (const skill of summary.topEntrySkills) expect(skill.name).not.toMatch(/^(Anglais|Français)/);
    }
  });
});

describe("SEO : plan du site", () => {
  const urls = sitemap().map((entry) => new URL(entry.url).pathname);

  it("contient guides, pages pays, domaines indexables et fiches, sans doublon", () => {
    expect(new Set(urls).size).toBe(urls.length);
    for (const guide of GUIDES) expect(urls).toContain(guidePath(guide.slug));
    for (const page of eefCountryPages()) expect(urls).toContain(eefCountryPath(page.country));
    for (const summary of summaries) expect(urls.includes(domainPath(summary.domain))).toBe(summary.indexable);
    for (const formation of formations) expect(urls).toContain(`/formations/${formation.id}`);
  });

  it("n'expose aucune page personnelle", () => {
    for (const path of ["/espace", "/candidatures", "/resultat", "/compte", "/calendrier", "/lettre-motivation", "/entretiens"]) {
      expect(urls).not.toContain(path);
    }
  });
});

describe("SEO : contenus des guides", () => {
  it("prépositions de pays correctes", () => {
    expect(inCountry("Bénin")).toBe("au Bénin");
    expect(inCountry("Côte d'Ivoire")).toBe("en Côte d'Ivoire");
    expect(inCountry("Algérie")).toBe("en Algérie");
    expect(inCountry("Comores")).toBe("aux Comores");
    expect(inCountry("Cameroun")).toBe("au Cameroun");
  });

  it("conversion en francs CFA à la parité fixe, arrondie au franc", () => {
    expect(eurosAndCfa(87_750)).toMatch(/^877,50\s€ \(575\s602\sF\sCFA\)$/);
  });
});
