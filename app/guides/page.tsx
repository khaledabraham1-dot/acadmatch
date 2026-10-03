import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Breadcrumbs } from "@/components/seo/PageParts";
import { FORMATIONS } from "@/data/formations";
import { OFFICIAL_CAMPAIGNS } from "@/data/campaigns";
import { domainPath } from "@/lib/seo/domains";
import { eefCountryPages, eefCountryPath, GUIDES, guidePath } from "@/lib/seo/guides";
import { publicFormations, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Guides pour étudier en France et en Belgique",
  description:
    "Études en France, master ou licence en France pour étudiant étranger, Belgique, coût des études, équivalence de diplôme : des guides sourcés et mis à jour.",
  alternates: { canonical: "/guides" },
};

const domains = [...new Set(publicFormations(FORMATIONS).map((f) => f.field))].sort((a, b) => a.localeCompare(b, "fr"));

export default function GuidesIndex() {
  return (
    <AppShell
      title="Guides pour étudier en France et en Belgique"
      description="Procédures, calendriers, coûts et équivalences, construits sur les sources officielles."
    >
      <Breadcrumbs
        baseUrl={siteUrl()}
        items={[
          { name: "Accueil", path: "/" },
          { name: "Guides", path: "/guides" },
        ]}
      />
      <div className="space-y-10">
        <ul className="grid gap-4 sm:grid-cols-2">
          {GUIDES.map((guide) => (
            <li key={guide.slug}>
              <Link
                href={guidePath(guide.slug)}
                className="group flex h-full flex-col rounded-[18px] border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300"
              >
                <h2 className="font-bold text-slate-900 group-hover:text-blue-700">{guide.heading}</h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">{guide.description}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-blue-700">
                  Lire le guide
                  <ArrowRight className="size-3.5" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {eefCountryPages().length > 0 && (
          <section aria-labelledby="pays-title" className="space-y-3">
            <h2 id="pays-title" className="text-lg font-bold text-slate-900">
              Calendriers Campus France par pays
            </h2>
            <ul className="space-y-1.5 text-sm">
              {eefCountryPages().map((page) => (
                <li key={page.slug}>
                  <Link href={eefCountryPath(page.country)} className="font-semibold text-blue-700 hover:text-blue-800">
                    Campus France {page.country} : calendrier de la rentrée {OFFICIAL_CAMPAIGNS[page.campaignId].intake}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="domaines-title" className="space-y-3">
          <h2 id="domaines-title" className="text-lg font-bold text-slate-900">
            Licences et masters par domaine
          </h2>
          <ul className="flex flex-wrap gap-2">
            {domains.map((domain) => (
              <li key={domain}>
                <Link
                  href={domainPath(domain)}
                  className="inline-flex rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-800 hover:border-slate-300"
                >
                  {domain}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
