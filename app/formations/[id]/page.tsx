import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, FileUp, GraduationCap, Languages, MapPin } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { EligibilitySection } from "@/components/result/EligibilitySection";
import { OfficialSourceCard } from "@/components/result/OfficialSourceCard";
import { SelectivityCard } from "@/components/result/SelectivityCard";
import { FORMATIONS } from "@/data/formations";
import { TUITION_FEES, type OfficialAmount } from "@/data/budget";
import { formatEuros } from "@/lib/budget";
import { formationDescription, formationPath, formationTitle, publicFormations, siteUrl } from "@/lib/site";
import { breadcrumbJsonLd, formationJsonLd, serializeJsonLd } from "@/lib/structuredData";
import type { StudyProgram } from "@/types";

// Une page par formation vérifiée, générée au build ; tout autre id → 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return publicFormations(FORMATIONS).map((formation) => ({ id: formation.id }));
}

function findFormation(id: string): StudyProgram | undefined {
  return publicFormations(FORMATIONS).find((formation) => formation.id === id);
}

export async function generateMetadata({ params }: PageProps<"/formations/[id]">): Promise<Metadata> {
  const formation = findFormation((await params).id);
  if (!formation) return {};
  const title = formationTitle(formation);
  const description = formationDescription(formation);
  return {
    title,
    description,
    alternates: { canonical: formationPath(formation) },
    openGraph: { type: "website", locale: "fr_FR", siteName: "AcadMatch", title, description, url: formationPath(formation) },
  };
}

function relatedFormations(formation: StudyProgram): StudyProgram[] {
  return publicFormations(FORMATIONS)
    .filter((other) => other.id !== formation.id && other.field === formation.field)
    .sort((a, b) => Number(b.goal === formation.goal) - Number(a.goal === formation.goal))
    .slice(0, 4);
}

function FeeLine({ label, amount }: { label: string; amount: OfficialAmount }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-slate-100 py-2 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-900">
        {formatEuros(amount.cents)}
        <span className="ml-1.5 text-xs font-normal text-slate-500">
          {amount.academicYear}
          {amount.indicative ? " · indicatif" : ""} ·{" "}
          <a href={amount.source} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
            source ↗
          </a>
        </span>
      </span>
    </div>
  );
}

function ItemList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 text-sm text-slate-700">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-300" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function FormationPage({ params }: PageProps<"/formations/[id]">) {
  const formation = findFormation((await params).id);
  if (!formation) notFound();

  const baseUrl = siteUrl();
  const fee = TUITION_FEES[formation.id];
  const related = relatedFormations(formation);
  const jsonLd = [
    formationJsonLd(formation, baseUrl, fee),
    breadcrumbJsonLd(
      [
        { name: "Accueil", path: "/" },
        { name: "Formations", path: "/formations" },
        { name: formation.name, path: formationPath(formation) },
      ],
      baseUrl,
    ),
  ];

  return (
    <AppShell
      title={formation.name}
      description={`${formation.institution.name} · ${formation.institution.city}, ${formation.institution.country}`}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <nav aria-label="Fil d'Ariane" className="-mt-4 mb-6 flex flex-wrap items-center gap-1 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-800">Accueil</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link href="/formations" className="hover:text-slate-800">Formations</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="text-slate-700" aria-current="page">{formation.name}</span>
      </nav>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="info">{formation.goal}</Badge>
          <Badge tone="neutral">Entrée en {formation.level}</Badge>
          <Badge tone="neutral">{formation.field}</Badge>
          <span className="inline-flex items-center gap-1 text-sm text-slate-500">
            <Languages className="size-4" aria-hidden /> Enseigné en {formation.language.toLowerCase()}
          </span>
        </div>

        <p className="max-w-3xl text-base leading-relaxed text-slate-700">{formation.description}</p>

        <Card className="border-blue-200 bg-blue-50/70">
          <h2 className="text-base font-semibold text-slate-900">Votre parcours correspond-il à cette formation ?</h2>
          <p className="mt-1 text-sm text-slate-600">
            AcadMatch compare vos matières et compétences aux prérequis ci-dessous, comme un jury, et vous montre
            vos points forts et les lacunes à combler avant de candidater. Gratuit, sans compte.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <LinkButton href={`/resultat?formationId=${formation.id}`}>
              Calculer ma compatibilité
              <ArrowRight className="size-4" aria-hidden />
            </LinkButton>
            <LinkButton href="/profil" variant="outline">
              <FileUp className="size-4" aria-hidden />
              Importer mon relevé de notes
            </LinkButton>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="mb-1 text-base font-semibold text-slate-900">Qui peut candidater</h2>
            <p className="mb-3 text-sm text-slate-500">Diplôme d&apos;entrée attendu : {formation.requiredLevel} validé.</p>
            <ItemList items={formation.prerequisites.map((requirement) => requirement.label)} />
          </Card>
          <Card>
            <h2 className="mb-1 text-base font-semibold text-slate-900">Compétences attendues à l&apos;entrée</h2>
            <p className="mb-3 text-sm text-slate-500">Ce que le jury s&apos;attend à trouver dans votre dossier.</p>
            <ItemList items={formation.skills.map((skill) => skill.name)} />
          </Card>
          <Card className="lg:col-span-2">
            <h2 className="mb-3 text-base font-semibold text-slate-900">Matières enseignées</h2>
            <ItemList items={formation.coreCourses.map((course) => course.name)} />
          </Card>
        </div>

        {fee && (
          <Card>
            <h2 className="mb-1 text-base font-semibold text-slate-900">
              Frais d&apos;inscription {fee.scope === "annuel" ? "(par an)" : "(coût total du programme)"}
            </h2>
            <p className="mb-2 text-sm text-slate-500">Montants datés et sourcés ; le logement et la vie courante s&apos;y ajoutent.</p>
            <FeeLine label="Étudiants UE / EEE / Suisse" amount={fee.eu} />
            {fee.nonEu ? (
              <FeeLine label="Étudiants hors UE" amount={fee.nonEu} />
            ) : (
              <p className="py-2 text-sm text-slate-600">Étudiants hors UE : montant non publié par l&apos;établissement.</p>
            )}
            {fee.nonEuNote && <p className="mt-2 text-xs leading-relaxed text-slate-500">{fee.nonEuNote}</p>}
            {fee.note && <p className="mt-1 text-xs leading-relaxed text-slate-500">{fee.note}</p>}
            <Link href="/budget" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700">
              Estimer mon budget complet (logement, visa…) →
            </Link>
          </Card>
        )}

        <SelectivityCard formationId={formation.id} />
        <EligibilitySection formation={formation} standalone />
        <OfficialSourceCard formation={formation} />

        {related.length > 0 && (
          <section aria-labelledby="formations-proches">
            <h2 id="formations-proches" className="mb-3 text-base font-semibold text-slate-900">
              Autres formations en {formation.field}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {related.map((other) => (
                <li key={other.id}>
                  <Link
                    href={formationPath(other)}
                    className="block rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-300"
                  >
                    <span className="block text-sm font-semibold text-slate-900">{other.name}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                      <GraduationCap className="size-3.5" aria-hidden /> {other.institution.name}
                      <MapPin className="ml-1 size-3.5" aria-hidden /> {other.institution.city}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}
