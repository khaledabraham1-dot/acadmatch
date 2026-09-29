import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Les pages outils personnelles sont exclues par leur balise noindex
    // (lib/site.ts, PRIVATE_PAGE_ROBOTS) : les bloquer ici empêcherait Google
    // de lire cette balise.
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/auth/"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
