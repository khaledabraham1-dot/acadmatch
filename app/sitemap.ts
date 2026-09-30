import type { MetadataRoute } from "next";
import { FORMATIONS } from "@/data/formations";
import { LEGAL_UPDATED_AT } from "@/data/legal";
import { formationPath, publicFormations, siteUrl } from "@/lib/site";

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
