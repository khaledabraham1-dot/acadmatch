import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Breadcrumbs, Faq, JsonLd, Sources, type Crumb, type FaqItem, type SourceLink } from "@/components/seo/PageParts";
import { GUIDES, guidePath, type Guide } from "@/lib/seo/guides";
import { siteUrl } from "@/lib/site";
import { articleJsonLd } from "@/lib/structuredData";
import { formatCalendarDate } from "@/lib/calendar";

/**
 * Ossature commune des guides : fil d'Ariane, date de mise à jour visible,
 * données structurées « Article », FAQ, sources officielles, appel à l'outil
 * et liens vers les autres guides (maillage interne).
 */
export function GuideShell({
  guide,
  path = guidePath(guide.slug),
  heading = guide.heading,
  title = guide.title,
  description = guide.description,
  extraCrumbs = [],
  intro,
  faq,
  sources,
  children,
}: {
  guide: Guide;
  path?: string;
  heading?: string;
  title?: string;
  description?: string;
  extraCrumbs?: Crumb[];
  intro: React.ReactNode;
  faq: FaqItem[];
  sources: SourceLink[];
  children: React.ReactNode;
}) {
  const baseUrl = siteUrl();
  const others = GUIDES.filter((other) => other.slug !== guide.slug);

  return (
    <AppShell title={heading} description={`Mis à jour le ${formatCalendarDate(guide.updatedAt)} · sources officielles`}>
      <Breadcrumbs
        baseUrl={baseUrl}
        items={[
          { name: "Accueil", path: "/" },
          { name: "Guides", path: "/guides" },
          ...(extraCrumbs.length > 0 ? [{ name: guide.label, path: guidePath(guide.slug) }, ...extraCrumbs] : [{ name: guide.label, path }]),
        ]}
      />
      <JsonLd data={articleJsonLd({ title, description, path, updatedAt: guide.updatedAt }, baseUrl)} />

      <article className="max-w-3xl space-y-8">
        <div className="text-base leading-relaxed text-slate-700">{intro}</div>
        {children}

        <Card className="border-blue-200 bg-blue-50/70">
          <h2 className="text-base font-semibold text-slate-900">Votre parcours correspond-il aux formations visées ?</h2>
          <p className="mt-1 text-sm text-slate-600">
            AcadMatch compare votre relevé de notes aux prérequis réels des licences et masters en France et en Belgique,
            et vous dit quoi renforcer avant de candidater. Gratuit, sans compte.
          </p>
          <LinkButton href="/profil" className="mt-4">
            Analyser mon parcours
            <ArrowRight className="size-4" aria-hidden />
          </LinkButton>
        </Card>

        <Faq items={faq} />
        <Sources sources={sources} updatedAt={guide.updatedAt} />

        <nav aria-labelledby="other-guides" className="space-y-3">
          <h2 id="other-guides" className="text-lg font-bold text-slate-900">
            Les autres guides
          </h2>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {others.map((other) => (
              <li key={other.slug}>
                <Link href={guidePath(other.slug)} className="font-semibold text-blue-700 hover:text-blue-800">
                  {other.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </article>
    </AppShell>
  );
}

/** Métadonnées d'un guide (titre, description, canonique, aperçu de partage). */
export function guideMetadata(guide: Guide, path = guidePath(guide.slug), title = guide.title, description = guide.description) {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "article" as const, locale: "fr_FR", siteName: "AcadMatch", title, description, url: path },
  };
}
