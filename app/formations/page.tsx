import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GraduationCap, MapPin } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { FORMATIONS } from "@/data/formations";
import { coveredDomains } from "@/lib/search/filters";
import { breadcrumbJsonLd, serializeJsonLd } from "@/lib/structuredData";
import { formationPath, publicFormations, siteUrl } from "@/lib/site";
import { domainPath, domainSlug } from "@/lib/seo/domains";

const formations = publicFormations(FORMATIONS);

export const metadata: Metadata = {
  title: `${formations.length} licences et masters en France et en Belgique : prérequis vérifiés`,
  description:
    "Toutes les formations du catalogue AcadMatch, par domaine : prérequis d'entrée, compétences attendues et procédure, vérifiés sur les pages officielles.",
  alternates: { canonical: "/formations" },
};

/**
 * Index public et crawlable du catalogue (liens simples, rendu serveur) :
 * /recherche reste l'outil interactif, cette page est la porte d'entrée
 * des moteurs de recherche vers chaque fiche.
 */
export default function FormationsPage() {
  const byDomain = coveredDomains(formations).map((domain) => ({
    domain,
    formations: formations
      .filter((formation) => formation.field === domain)
      .sort((a, b) => a.goal.localeCompare(b.goal) || a.name.localeCompare(b.name, "fr")),
  }));
  const jsonLd = breadcrumbJsonLd(
    [
      { name: "Accueil", path: "/" },
      { name: "Formations", path: "/formations" },
    ],
    siteUrl(),
  );

  return (
    <AppShell
      title="Formations"
      description={`${formations.length} formations vérifiées sur leurs pages officielles, en France et en Belgique.`}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-700">
          Filtrez par niveau, langue ou ville et voyez votre score de compatibilité pour chacune.
        </p>
        <LinkButton href="/recherche" size="sm" className="shrink-0">
          Rechercher avec mon profil
          <ArrowRight className="size-4" aria-hidden />
        </LinkButton>
      </div>

      <div className="space-y-10">
        {byDomain.map(({ domain, formations: list }) => (
          <section key={domain} aria-labelledby={`domaine-${domainSlug(domain)}`}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id={`domaine-${domainSlug(domain)}`} className="text-lg font-semibold text-slate-900">
                {domain} <span className="text-sm font-normal text-slate-500">· {list.length}</span>
              </h2>
              <Link href={domainPath(domain)} className="text-sm font-bold text-blue-700 hover:text-blue-800">
                Prérequis du domaine →
              </Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {list.map((formation) => (
                <li key={formation.id}>
                  <Link
                    href={formationPath(formation)}
                    className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-300"
                  >
                    <span className="mb-1.5 flex flex-wrap gap-1.5">
                      <Badge tone="info">{formation.goal}</Badge>
                      {formation.language !== "Français" && <Badge tone="neutral">{formation.language}</Badge>}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{formation.name}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                      <GraduationCap className="size-3.5" aria-hidden /> {formation.institution.name}
                      <MapPin className="ml-1 size-3.5" aria-hidden /> {formation.institution.city},{" "}
                      {formation.institution.country}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
