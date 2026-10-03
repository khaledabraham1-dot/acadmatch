import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideShell, guideMetadata } from "@/components/seo/GuideShell";
import { Section } from "@/components/seo/PageParts";
import { OFFICIAL_CAMPAIGNS } from "@/data/campaigns";
import { COUNTRY_BUDGET_RULES, FRENCH_NATIONAL_FEES } from "@/data/budget";
import { formatCalendarDate } from "@/lib/calendar";
import { eefCountryPages, eefCountryPath, eefCountryTitle, guideBySlug, guidePath, inCountry } from "@/lib/seo/guides";
import { eurosAndCfa } from "@/lib/seo/money";
import { truncateForMeta } from "@/lib/site";

const guide = guideBySlug("etudes-en-france")!;

// Une page par pays dont le calendrier officiel est relevé (data/campaigns.ts) ; tout autre pays → 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return eefCountryPages().map((page) => ({ pays: page.slug }));
}

function load(slug: string) {
  const page = eefCountryPages().find((p) => p.slug === slug);
  return page ? { ...page, campaign: OFFICIAL_CAMPAIGNS[page.campaignId] } : undefined;
}

function describe(country: string, intake: number, deadline: string): string {
  return truncateForMeta(
    `Calendrier officiel Études en France ${country} pour la rentrée ${intake} : ouverture, paiement, dépôt du dossier (${deadline}), entretiens et clôture. Frais et ressources en FCFA.`,
  );
}

export async function generateMetadata({ params }: PageProps<"/guides/etudes-en-france/[pays]">): Promise<Metadata> {
  const data = load((await params).pays);
  if (!data) return {};
  const deadline = data.campaign.phases.find((p) => /définitif/i.test(p.label)) ?? data.campaign.phases.at(-1)!;
  return guideMetadata(
    guide,
    eefCountryPath(data.country),
    eefCountryTitle(data.country),
    describe(data.country, data.campaign.intake, formatCalendarDate(deadline.end)),
  );
}

export default async function EefCountryPage({ params }: PageProps<"/guides/etudes-en-france/[pays]">) {
  const data = load((await params).pays);
  if (!data) notFound();
  const { country, campaign } = data;
  const france = COUNTRY_BUDGET_RULES.France;
  const finalDeposit = campaign.phases.find((p) => /définitif/i.test(p.label));

  return (
    <GuideShell
      guide={{ ...guide, label: guide.label, updatedAt: campaign.verifiedAt }}
      path={eefCountryPath(country)}
      heading={`Campus France ${country} : le calendrier de la rentrée ${campaign.intake}`}
      title={eefCountryTitle(country)}
      description={describe(country, campaign.intake, finalDeposit ? formatCalendarDate(finalDeposit.end) : "")}
      extraCrumbs={[{ name: country, path: eefCountryPath(country) }]}
      intro={
        <p>
          Si vous résidez {inCountry(country)}, vos candidatures dans l&apos;enseignement supérieur français passent par la
          procédure <strong>Études en France</strong> de Campus France {country}. Voici son calendrier officiel pour la
          rentrée {campaign.intake} ({campaign.audience.toLocaleLowerCase("fr")}), relevé sur le site de Campus France{" "}
          {country}.
        </p>
      }
      faq={[
        ...(finalDeposit
          ? [
              {
                question: `Quelle est la date limite Campus France ${country} pour la rentrée ${campaign.intake} ?`,
                answer: `Le dépôt définitif du dossier, après corrections, est fixé au ${formatCalendarDate(finalDeposit.end)}. Le premier dépôt est attendu plus tôt : voir le calendrier complet ci-dessus.`,
              },
            ]
          : []),
        {
          question: `Faut-il passer par Parcoursup ou Mon Master quand on réside ${inCountry(country)} ?`,
          answer: `Non si vous êtes ressortissant d'un pays hors UE et résidez ${inCountry(country)} : vos candidatures aux formations françaises sont déposées sur la plateforme Études en France, avec ce calendrier.`,
        },
        {
          question: "Combien faut-il prévoir pour étudier en France ?",
          answer: `Hors UE, les droits d'inscription 2026-2027 sont de ${eurosAndCfa(FRENCH_NATIONAL_FEES.licence.nonEu!.cents)} en licence et ${eurosAndCfa(FRENCH_NATIONAL_FEES.master.nonEu!.cents)} en master à l'université (exonération possible, jamais garantie), et le visa exige au moins ${eurosAndCfa(france.visaMonthlyMinimum!.cents)} de ressources par mois.`,
        },
      ]}
      sources={[
        { label: `${campaign.sourceLabel} — calendrier des procédures`, url: campaign.source },
        { label: "Campus France — procédure Études en France", url: "https://www.campusfrance.org/fr/candidature-procedure-etudes-en-france" },
        { label: "Service-Public — droits différenciés et visa", url: france.visaMonthlyMinimum!.source },
      ]}
    >
      <Section id="calendrier" title={`Calendrier officiel, rentrée ${campaign.intake}`}>
        <ol className="divide-y divide-slate-100 rounded-[14px] bg-white ring-1 ring-slate-200">
          {campaign.phases.map((phase) => (
            <li key={phase.label} className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 px-4 py-2.5">
              <span className="text-slate-800">{phase.label}</span>
              <span className="font-semibold text-slate-900">
                {phase.start ? `du ${formatCalendarDate(phase.start)} au ${formatCalendarDate(phase.end)}` : formatCalendarDate(phase.end)}
              </span>
            </li>
          ))}
        </ol>
        <p>
          {campaign.nextCalendarNote} Ajoutez ces échéances à votre{" "}
          <Link href="/calendrier" className="font-semibold text-blue-700 hover:text-blue-800">
            calendrier AcadMatch
          </Link>{" "}
          pour chaque formation suivie.
        </p>
      </Section>

      <Section id="preparer" title="Préparer son dossier à temps">
        <p>
          Le dépôt se joue en fin d&apos;année civile, bien avant les plateformes françaises (Parcoursup et Mon Master
          ferment mi-mars). Choisissez vos formations dès l&apos;ouverture : AcadMatch compare votre relevé de notes aux
          prérequis de chaque formation et vous dit quoi renforcer. Le déroulé complet de la procédure est dans{" "}
          <Link href={guidePath("etudes-en-france")} className="font-semibold text-blue-700 hover:text-blue-800">
            le guide Études en France
          </Link>
          , et le budget en francs CFA dans{" "}
          <Link href={guidePath("cout-des-etudes-en-france")} className="font-semibold text-blue-700 hover:text-blue-800">
            coût des études en France
          </Link>
          .
        </p>
      </Section>
    </GuideShell>
  );
}
