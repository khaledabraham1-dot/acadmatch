import type { MetadataRoute } from "next";
import { FORMATIONS } from "@/data/formations";
import { LEGAL_UPDATED_AT } from "@/data/legal";
import { formationPath, publicFormations, siteUrl } from "@/lib/site";
import { domainPath, summarizeDomain } from "@/lib/seo/domains";
import { eefCountryPages, eefCountryPath, GUIDES, GUIDES_UPDATED_AT, guidePath } from "@/lib/seo/guides";
import { OFFICIAL_CAMPAIGNS } from "@/data/campaigns";

/** Pages publiques indexables uniquement ; les outils personnels sont en noindex. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const formations = publicFormations(FORMATIONS);
  const catalogueUpdatedAt = formations.map((formation) => formation.verifiedAt ?? "").sort().at(-1);

  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/formations`, lastModified: catalogueUpdatedAt, changeFrequency: "weekly", priority: 0.9 },
    ...formations.map((formation) => ({
      url: `${base}${formationPath(formation)}`,
      lastModified: formation.verifiedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    // Pages domaine : seulement celles assez fournies pour être indexées (lib/seo/domains.ts).
    ...[...new Set(formations.map((formation) => formation.field))]
      .map((domain) => summarizeDomain(domain, formations))
      .filter((summary) => summary.indexable)
      .map((summary) => ({
        url: `${base}${domainPath(summary.domain)}`,
        lastModified: summary.formations.map((formation) => formation.verifiedAt ?? "").sort().at(-1),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      })),
    { url: `${base}/guides`, lastModified: GUIDES_UPDATED_AT, changeFrequency: "monthly", priority: 0.8 },
    ...GUIDES.map((guide) => ({
      url: `${base}${guidePath(guide.slug)}`,
      lastModified: guide.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...eefCountryPages().map((page) => ({
      url: `${base}${eefCountryPath(page.country)}`,
      lastModified: OFFICIAL_CAMPAIGNS[page.campaignId].verifiedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${base}/recherche`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/profil`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/visa`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/methode`, changeFrequency: "monthly", priority: 0.6 },
    ...["/mentions-legales", "/confidentialite", "/conditions"].map((path) => ({
      url: `${base}${path}`,
      lastModified: LEGAL_UPDATED_AT,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];
}
