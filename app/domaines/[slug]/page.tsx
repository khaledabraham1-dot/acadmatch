import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Languages, MapPin } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { SelectivityBadge } from "@/components/result/SelectivityCard";
import { Breadcrumbs, Faq, JsonLd, type FaqItem } from "@/components/seo/PageParts";
import { FORMATIONS } from "@/data/formations";
import { domainDescription, domainFromSlug, domainPath, domainPhrase, domainSlug, domainTitle, summarizeDomain, type DomainSummary } from "@/lib/seo/domains";
import { guidePath } from "@/lib/seo/guides";
import { formatList } from "@/lib/search/filters";
import { formationPath, publicFormations, siteUrl } from "@/lib/site";
import { itemListJsonLd } from "@/lib/structuredData";
import type { StudyProgram } from "@/types";

const formations = publicFormations(FORMATIONS);

// Une page par domaine du catalogue, générée au build ; tout autre slug → 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return [...new Set(formations.map((f) => f.field))].map((domain) => ({ slug: domainSlug(domain) }));
}

function load(slug: string): DomainSummary | undefined {
  const domain = domainFromSlug(slug, formations);
  return domain ? summarizeDomain(domain, formations) : undefined;
}

export async function generateMetadata({ params }: PageProps<"/domaines/[slug]">): Promise<Metadata> {
  const summary = load((await params).slug);
  if (!summary) return {};
  const title = domainTitle(summary);
  const description = domainDescription(summary);
  return {
    title,
    description,
    alternates: { canonical: domainPath(summary.domain) },
    // Trop peu de fiches : utile à l'étudiant, trop mince pour un moteur de recherche.
    robots: summary.indexable ? undefined : { index: false, follow: true },
    openGraph: { type: "website", locale: "fr_FR", siteName: "AcadMatch", title, description, url: domainPath(summary.domain) },
  };
}

function levelCount(list: StudyProgram[], level: string): number {
  return list.filter((f) => f.requiredLevel === level).length;
}

/** Questions fréquentes calculées depuis le catalogue : aucune réponse ne peut contredire les fiches. */
function buildFaq(summary: DomainSummary): FaqItem[] {
  const phrase = domainPhrase(summary.domain);
  const faq: FaqItem[] = [];
  if (summary.masters.length > 0) {
    const total = summary.masters.length;
    const fromL3 = levelCount(summary.masters, "Licence 3");
    const later = total - fromL3;
    const head =
      total === 1
        ? `Le master ${phrase} du catalogue recrute ${fromL3 === 1 ? "après une licence (bac+3)" : "après un bac+4 ou en 2e année"}.`
        : `Sur les ${total} masters ${phrase} du catalogue, ${fromL3} recrute${fromL3 > 1 ? "nt" : ""} après une licence (bac+3)` +
          (later > 0 ? ` et ${later} après un bac+4 ou directement en 2e année.` : ".");
    faq.push({
      question: `Quel diplôme faut-il pour entrer en master ${phrase} ?`,
      answer:
        `${head} Chaque fiche précise le diplôme attendu, les compétences demandées par le jury et la procédure ` +
        `(Mon Master, Études en France ou plateforme de l'établissement).`,
    });
  }
  if (summary.topEntrySkills.length > 0) {
    faq.push({
      question: `Quelles compétences les jurys attendent-ils à l'entrée ${phrase} ?`,
      answer:
        `Les plus souvent demandées dans ce domaine : ${formatList(summary.topEntrySkills.slice(0, 4).map((s) => s.name.toLocaleLowerCase("fr")))}. ` +
        `Elles viennent des prérequis publiés par chaque formation (page officielle, Mon Master ou Parcoursup), pas du programme enseigné.`,
    });
  }
  faq.push({
    question: `Peut-on suivre une formation ${phrase} en anglais ?`,
    answer:
      summary.englishTaught > 0
        ? `Oui : ${summary.englishTaught} des ${summary.formations.length} formations du catalogue dans ce domaine sont enseignées en anglais. Un niveau d'anglais certifié (souvent B2 ou C1) est alors généralement demandé : voir chaque fiche.`
        : `Pas dans le catalogue actuel : les ${summary.formations.length} formations de ce domaine sont enseignées en français.`,
  });
  faq.push({
    question: "Mon parcours est-il compatible avec ces formations ?",
    answer:
      "AcadMatch compare vos matières, vos compétences et vos notes aux prérequis de chaque formation, comme un jury, et explique le score : points forts, lacunes et actions à mener avant de candidater. C'est gratuit et sans compte. Le score n'est pas une probabilité d'admission.",
  });
  return faq;
}

function FormationRow({ formation }: { formation: StudyProgram }) {
  return (
    <li>
      <Link
        href={formationPath(formation)}
        className="group flex flex-col gap-2 rounded-[18px] border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 sm:flex-row sm:items-center sm:justify-between sm:p-5"
      >
        <span className="min-w-0">
          <span className="block font-semibold text-slate-900 group-hover:text-blue-700">{formation.name}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              {formation.institution.name} · {formation.institution.city}
            </span>
            <span className="inline-flex items-center gap-1">
              <Languages className="size-3.5" aria-hidden />
              {formation.language}
            </span>
          </span>
          <span className="mt-1 block text-sm text-slate-700">
            Entrée après : {formation.requiredLevel} · {formation.prerequisites[0]?.label}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <SelectivityBadge formationId={formation.id} />
          <ArrowRight className="size-4 text-slate-400 group-hover:text-blue-700" aria-hidden />
        </span>
      </Link>
    </li>
  );
}

export default async function DomainPage({ params }: PageProps<"/domaines/[slug]">) {
  const summary = load((await params).slug);
  if (!summary) notFound();

  const baseUrl = siteUrl();
  const phrase = domainPhrase(summary.domain);
  const path = domainPath(summary.domain);
  const groups = [
    { title: `Licences ${phrase}`, list: summary.licences },
    { title: `Masters ${phrase}`, list: summary.masters },
    { title: `Écoles et autres formations ${phrase}`, list: summary.others },
  ].filter((group) => group.list.length > 0);
  const hasFrance = summary.countries.includes("France");
  const hasBelgium = summary.countries.includes("Belgique");

  return (
    <AppShell
      title={`Licences et masters ${phrase} en France et en Belgique`}
      description={`${summary.formations.length} formations vérifiées sur leurs sources officielles, avec les prérequis réels d'entrée.`}
    >
      <Breadcrumbs
        baseUrl={baseUrl}
        items={[
          { name: "Accueil", path: "/" },
          { name: "Formations", path: "/formations" },
          { name: summary.domain, path },
        ]}
      />
      <JsonLd
        data={itemListJsonLd(
          `Formations ${phrase}`,
          summary.formations.map((f) => ({ name: f.name, path: formationPath(f) })),
          baseUrl,
        )}
      />

      <div className="space-y-8">
        <p className="max-w-3xl text-base leading-relaxed text-slate-700">
          AcadMatch recense {summary.formations.length} formations {phrase} vérifiées
          {summary.licences.length > 0 && <> : {summary.licences.length} licence{summary.licences.length > 1 ? "s" : ""}</>}
          {summary.masters.length > 0 && <>, {summary.masters.length} master{summary.masters.length > 1 ? "s" : ""}</>}
          {summary.others.length > 0 && <>, {summary.others.length} autre{summary.others.length > 1 ? "s" : ""}</>}, à{" "}
          {formatList(summary.cities)}
          {summary.englishTaught > 0 && <> — dont {summary.englishTaught} enseignée{summary.englishTaught > 1 ? "s" : ""} en anglais</>}.
          Pour chacune : le diplôme d&apos;entrée, ce que le jury attend vraiment et la procédure, relevés sur les sources
          officielles.
        </p>

        <Card className="border-blue-200 bg-blue-50/70">
          <h2 className="text-base font-semibold text-slate-900">Laquelle correspond à votre parcours ?</h2>
          <p className="mt-1 text-sm text-slate-600">
            Importez votre relevé de notes ou décrivez vos matières : AcadMatch les compare aux prérequis de chaque
            formation et explique le score. Gratuit, sans compte.
          </p>
          <LinkButton href="/profil" className="mt-4">
            Analyser mon parcours
            <ArrowRight className="size-4" aria-hidden />
          </LinkButton>
        </Card>

        {summary.topEntrySkills.length > 0 && (
          <section aria-labelledby="attendus-title" className="space-y-3">
            <h2 id="attendus-title" className="text-lg font-bold text-slate-900">
              Ce que les jurys attendent à l&apos;entrée
            </h2>
            <p className="text-sm text-slate-600">
              Compétences les plus demandées par les formations {phrase} du catalogue, d&apos;après leurs prérequis officiels.
            </p>
            <ul className="flex flex-wrap gap-2">
              {summary.topEntrySkills.map((skill) => (
                <li key={skill.name}>
                  <Badge tone="neutral">
                    {skill.name} · {skill.count} formation{skill.count > 1 ? "s" : ""}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        )}

        {groups.map((group) => (
          <section key={group.title} aria-labelledby={`g-${domainSlug(group.title)}`} className="space-y-3">
            <h2 id={`g-${domainSlug(group.title)}`} className="text-lg font-bold text-slate-900">
              {group.title}
            </h2>
            <ul className="space-y-3">
              {group.list.map((formation) => (
                <FormationRow key={formation.id} formation={formation} />
              ))}
            </ul>
          </section>
        ))}

        <Faq items={buildFaq(summary)} />

        <section aria-labelledby="guides-title" className="space-y-3">
          <h2 id="guides-title" className="text-lg font-bold text-slate-900">
            Pour préparer votre candidature
          </h2>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {summary.masters.length > 0 && hasFrance && (
              <li>
                <Link href={guidePath("master-en-france-etudiant-etranger")} className="font-semibold text-blue-700 hover:text-blue-800">
                  Faire un master en France quand on est étudiant étranger
                </Link>
              </li>
            )}
            {summary.licences.length > 0 && hasFrance && (
              <li>
                <Link href={guidePath("licence-en-france-apres-un-bac-etranger")} className="font-semibold text-blue-700 hover:text-blue-800">
                  Entrer en licence en France après un bac étranger
                </Link>
              </li>
            )}
            {hasBelgium && (
              <li>
                <Link href={guidePath("etudier-en-belgique")} className="font-semibold text-blue-700 hover:text-blue-800">
                  Étudier en Belgique : équivalence, inscription, visa
                </Link>
              </li>
            )}
            <li>
              <Link href={guidePath("etudes-en-france")} className="font-semibold text-blue-700 hover:text-blue-800">
                La procédure Études en France (Campus France)
              </Link>
            </li>
            <li>
              <Link href={guidePath("cout-des-etudes-en-france")} className="font-semibold text-blue-700 hover:text-blue-800">
                Combien coûtent des études en France
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
