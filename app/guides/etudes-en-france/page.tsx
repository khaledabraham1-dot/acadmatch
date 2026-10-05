import type { Metadata } from "next";
import Link from "next/link";
import { GuideShell, guideMetadata } from "@/components/seo/GuideShell";
import { Section } from "@/components/seo/PageParts";
import { ETUDES_EN_FRANCE_COUNTRIES, FRANCE_VISA_GUIDE } from "@/data/visa";
import { OFFICIAL_CAMPAIGNS, EEF_GENERAL_SOURCE } from "@/data/campaigns";
import { eefCountryPages, eefCountryPath, guideBySlug, guidePath } from "@/lib/seo/guides";
import { formatCalendarDate } from "@/lib/calendar";

const guide = guideBySlug("etudes-en-france")!;

export const metadata: Metadata = guideMetadata(guide);

const residence = FRANCE_VISA_GUIDE.residenceProcedure!;
const countryPages = eefCountryPages();

export default function EtudesEnFranceGuide() {
  return (
    <GuideShell
      guide={guide}
      intro={
        <p>
          Si vous résidez dans l&apos;un des {ETUDES_EN_FRANCE_COUNTRIES.length} pays concernés, vos candidatures en
          licence, en master ou en école passent par la plateforme <strong>Études en France</strong>, gérée par Campus
          France. C&apos;est elle qui transmet votre dossier aux établissements, organise l&apos;entretien et prépare la
          demande de visa. Ce guide explique qui est concerné, comment se déroule la procédure et pourquoi ses dates
          limites tombent bien plus tôt que celles de Parcoursup ou de Mon Master.
        </p>
      }
      faq={[
        {
          question: "Qui doit passer par Études en France ?",
          answer: `Les candidats qui résident dans l'un des ${ETUDES_EN_FRANCE_COUNTRIES.length} pays de la procédure, pour des études supérieures en France. C'est le pays de résidence qui compte, pas la nationalité. ${residence.exception}`,
        },
        {
          question: "Études en France remplace-t-il Parcoursup et Mon Master ?",
          answer:
            "Pour un candidat hors Union européenne qui réside dans un pays Études en France, oui en pratique : ses candidatures aux formations françaises sont déposées et suivies sur la plateforme Études en France, avec le calendrier de l'Espace Campus France de son pays. Les fiches des formations le précisent souvent (« les candidats résidant dans un pays à procédure Études en France passent par cette procédure »).",
        },
        {
          question: "Quand faut-il déposer son dossier Études en France ?",
          answer:
            `Chaque Espace Campus France publie son propre calendrier. Au Bénin, pour la rentrée ${OFFICIAL_CAMPAIGNS["eef-benin"].intake}, le dépôt définitif du dossier est fixé au 15 décembre 2026, soit environ trois mois avant la fin du dépôt sur Parcoursup ou Mon Master (mi-mars). Vérifiez le calendrier de votre pays dès l'ouverture de la plateforme.`,
        },
        {
          question: "Le visa est-il automatique après Études en France ?",
          answer:
            "Non. Une fois accepté, vous faites la demande de visa étudiant sur France-Visas, avec les justificatifs demandés, dont des ressources mensuelles minimales. Le visa (VLS-TS) doit ensuite être validé en ligne dans les 3 mois suivant votre arrivée en France.",
        },
      ]}
      sources={[
        { label: "Campus France : procédure Études en France", url: residence.source },
        { label: "Service-Public : visa étudiant", url: FRANCE_VISA_GUIDE.source },
        { label: "France-Visas", url: "https://france-visas.gouv.fr/" },
        ...countryPages.map((page) => ({
          label: `${OFFICIAL_CAMPAIGNS[page.campaignId].sourceLabel} : calendrier`,
          url: OFFICIAL_CAMPAIGNS[page.campaignId].source,
        })),
      ]}
    >
      <Section id="qui" title="Qui est concerné ?">
        <p>
          La procédure s&apos;applique selon votre <strong>pays de résidence</strong>, pas votre nationalité.{" "}
          {residence.exception} Les {ETUDES_EN_FRANCE_COUNTRIES.length} pays concernés au{" "}
          {formatCalendarDate(residence.sourceUpdatedAt)} (liste Campus France) :
        </p>
        <p className="rounded-xl bg-white p-4 text-sm leading-relaxed text-slate-700 ring-1 ring-slate-200">
          {ETUDES_EN_FRANCE_COUNTRIES.join(", ")}.
        </p>
      </Section>

      <Section id="etapes" title="Les étapes, du dossier au visa">
        <ol className="list-decimal space-y-3 pl-5">
          {FRANCE_VISA_GUIDE.steps
            .filter((step) => step.appliesTo !== "direct")
            .map((step) => (
              <li key={step.id}>
                <strong>{step.title}.</strong> {step.description}
              </li>
            ))}
        </ol>
        <p>
          Le montant des ressources exigées et les frais d&apos;inscription sont détaillés dans le guide{" "}
          <Link href={guidePath("cout-des-etudes-en-france")} className="font-semibold text-blue-700 hover:text-blue-800">
            coût des études en France
          </Link>
          .
        </p>
      </Section>

      <Section id="calendrier" title="Le calendrier : bien plus tôt que Parcoursup et Mon Master">
        <p>
          Chaque Espace Campus France fixe ses propres dates. Au Bénin, pour la rentrée{" "}
          {OFFICIAL_CAMPAIGNS["eef-benin"].intake}, le dépôt définitif est fixé au 15 décembre 2026 : environ trois mois
          avant la fin du dépôt sur Parcoursup ou Mon Master (mi-mars). Un candidat qui se cale sur le calendrier des
          plateformes françaises risque donc de manquer la date limite de Campus France.
        </p>
        {countryPages.length > 0 && (
          <ul className="space-y-1">
            {countryPages.map((page) => (
              <li key={page.slug}>
                <Link href={eefCountryPath(page.country)} className="font-semibold text-blue-700 hover:text-blue-800">
                  Calendrier Campus France {page.country}, rentrée {OFFICIAL_CAMPAIGNS[page.campaignId].intake}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p>
          Pour les autres pays, consultez le site de votre Espace Campus France (
          <a href={EEF_GENERAL_SOURCE} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:text-blue-800">
            liste sur campusfrance.org
          </a>
          ), puis ajoutez les échéances à votre{" "}
          <Link href="/calendrier" className="font-semibold text-blue-700 hover:text-blue-800">
            calendrier AcadMatch
          </Link>
          .
        </p>
      </Section>

      <Section id="choisir" title="Bien choisir ses formations avant de déposer">
        <p>
          Le nombre de candidatures est limité et l&apos;entretien Campus France porte sur la cohérence de votre projet :
          viser des formations dont vous remplissez réellement les prérequis compte davantage que multiplier les vœux.
          AcadMatch compare votre relevé de notes aux attendus officiels de chaque formation et vous dit quoi renforcer.
          Pour un master, lisez aussi{" "}
          <Link href={guidePath("master-en-france-etudiant-etranger")} className="font-semibold text-blue-700 hover:text-blue-800">
            faire un master en France quand on est étudiant étranger
          </Link>
          ; pour une première année,{" "}
          <Link href={guidePath("licence-en-france-apres-un-bac-etranger")} className="font-semibold text-blue-700 hover:text-blue-800">
            entrer en licence après un bac étranger
          </Link>
          .
        </p>
      </Section>
    </GuideShell>
  );
}
