import type { Metadata } from "next";
import Link from "next/link";
import { GuideShell, guideMetadata } from "@/components/seo/GuideShell";
import { Section } from "@/components/seo/PageParts";
import { FORMATIONS } from "@/data/formations";
import { OFFICIAL_CAMPAIGNS } from "@/data/campaigns";
import { COUNTRY_BUDGET_RULES, FRENCH_EXEMPTION_CAP_NOTE, FRENCH_NATIONAL_FEES } from "@/data/budget";
import { formatCalendarDate } from "@/lib/calendar";
import { guideBySlug, guidePath } from "@/lib/seo/guides";
import { eurosAndCfa } from "@/lib/seo/money";
import { formationPath, publicFormations } from "@/lib/site";

const guide = guideBySlug("licence-en-france-apres-un-bac-etranger")!;

export const metadata: Metadata = guideMetadata(guide);

/**
 * DAP hors pays « Études en France » : page Campus France consultée le
 * 2026-10-03 (dossier blanc, rentrée 2027). Les dates relevées sont celles de
 * cette page ; à revérifier chaque 1er octobre avec data/campaigns.ts.
 */
const DAP_SOURCE = "https://www.campusfrance.org/en/application-non-EU-student-living-outside-EU-without-etudes-en-France-procedure";
const DAP_WHO_SOURCE = "https://www.ghana.campusfrance.org/demande-d-admission-prealable-dap-en-premiere-annee-de-licence";
const DAP_2027 = {
  intake: 2027,
  phases: [
    { label: "Dépôt du dossier DAP (dossier blanc)", text: "du 1er octobre au 15 décembre 2026" },
    { label: "Réponse des universités", text: "avant le 30 avril 2027" },
    { label: "Réponse du candidat", text: "avant le 31 mai 2027" },
  ],
};

const licences = publicFormations(FORMATIONS).filter((f) => f.requiredLevel === "Baccalauréat");
const frenchLicences = licences.filter((f) => f.institution.country === "France");
const belgianLicences = licences.filter((f) => f.institution.country === "Belgique");
const parcoursup = OFFICIAL_CAMPAIGNS.parcoursup;
const fee = FRENCH_NATIONAL_FEES.licence;
const france = COUNTRY_BUDGET_RULES.France;

export default function LicenceGuide() {
  return (
    <GuideShell
      guide={guide}
      intro={
        <p>
          Avec un baccalauréat ou un diplôme de fin d&apos;études secondaires obtenu hors de France, l&apos;entrée en
          1re année de licence ne passe pas toujours par Parcoursup. Selon votre nationalité et votre pays de résidence,
          c&apos;est la <strong>demande d&apos;admission préalable (DAP)</strong>, éventuellement déposée via Études en
          France, qui s&apos;applique, avec un calendrier qui commence dès octobre. Voici comment savoir lequel vous
          concerne.
        </p>
      }
      faq={[
        {
          question: "Qui doit faire une demande d'admission préalable (DAP) ?",
          answer:
            "Les candidats à une 1re année de licence qui résident hors de l'Espace économique européen et ne sont pas titulaires d'un baccalauréat français. Les ressortissants de l'UE, de l'EEE, de Suisse, de Monaco ou d'Andorre passent par Parcoursup.",
        },
        {
          question: "Un bachelier étranger peut-il passer par Parcoursup ?",
          answer:
            "Oui s'il est ressortissant de l'UE, de l'EEE, de Suisse, de Monaco ou d'Andorre, ou titulaire d'un baccalauréat français (y compris obtenu dans un lycée français à l'étranger). Les fiches Parcoursup le précisent : les candidats non ressortissants de ces pays, titulaires d'un diplôme équivalent au baccalauréat, ne passent pas par Parcoursup mais par la procédure DAP.",
        },
        {
          question: "Quand déposer son dossier DAP pour la rentrée 2027 ?",
          answer:
            "Hors pays Études en France, Campus France indique un dépôt du 1er octobre au 15 décembre 2026 auprès du service de coopération et d'action culturelle de l'ambassade de France du pays de résidence, une réponse des universités avant le 30 avril 2027 et une réponse du candidat avant le 31 mai 2027. Dans un pays Études en France, la DAP suit le calendrier de l'Espace Campus France du pays.",
        },
        {
          question: "Combien coûte une licence en France pour un étudiant étranger ?",
          answer: `Dans une université publique, ${eurosAndCfa(fee.eu.cents)} par an pour un étudiant de l'UE et ${eurosAndCfa(fee.nonEu!.cents)} pour un étudiant hors UE non exonéré (2026-2027), plus la CVEC (${eurosAndCfa(france.mandatoryFees[0].amount.cents)}).`,
        },
      ]}
      sources={[
        { label: "Campus France — candidater sans la procédure Études en France (DAP)", url: DAP_SOURCE },
        { label: "Campus France Ghana — qui est concerné par la DAP", url: DAP_WHO_SOURCE },
        { label: `Parcoursup — ${parcoursup.sourceLabel}`, url: parcoursup.source },
        { label: "Service-Public — droits d'inscription", url: fee.eu.source },
        { label: "Service-Public — droits différenciés (hors UE)", url: fee.nonEu!.source },
      ]}
    >
      <Section id="quelle-procedure" title="Parcoursup ou DAP : quelle procédure pour vous ?">
        <ul className="space-y-2">
          <li>
            <strong>Parcoursup</strong> : ressortissants de l&apos;Union européenne, de l&apos;EEE, de Suisse, de Monaco ou
            d&apos;Andorre, et titulaires d&apos;un baccalauréat français, y compris obtenu dans un lycée français à
            l&apos;étranger.
          </li>
          <li>
            <strong>DAP via Études en France</strong> : vous résidez hors de l&apos;UE dans l&apos;un des pays de la
            procédure (Bénin, Sénégal, Cameroun, Côte d&apos;Ivoire, Maroc…) — voir{" "}
            <Link href={guidePath("etudes-en-france")} className="font-semibold text-blue-700 hover:text-blue-800">
              le guide Études en France
            </Link>
            .
          </li>
          <li>
            <strong>DAP « dossier blanc »</strong> auprès de l&apos;ambassade de France : vous résidez hors de l&apos;EEE,
            dans un pays sans procédure Études en France.
          </li>
        </ul>
      </Section>

      <Section id="calendrier" title="Les calendriers">
        <p>
          <strong>DAP hors Études en France, rentrée {DAP_2027.intake}</strong> (Campus France) :
        </p>
        <ul className="space-y-1">
          {DAP_2027.phases.map((phase) => (
            <li key={phase.label}>
              {phase.label} : {phase.text}
            </li>
          ))}
        </ul>
        <p>
          <strong>Parcoursup</strong>, session {parcoursup.intake} (arrêté au Journal officiel ; celui de la session
          suivante paraît en général en fin d&apos;année) :
        </p>
        <ul className="space-y-1">
          {parcoursup.phases.map((phase) => (
            <li key={phase.label}>
              {phase.label} :{" "}
              {phase.start ? `du ${formatCalendarDate(phase.start)} au ${formatCalendarDate(phase.end)}` : `jusqu'au ${formatCalendarDate(phase.end)}`}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="jury" title="Ce que regardent les universités">
        <p>
          Pour une 1re année, les commissions lisent d&apos;abord vos <strong>notes de lycée</strong> dans les matières
          clés de la licence : les grilles d&apos;analyse publiées sur Parcoursup classent par exemple les mathématiques
          « essentielles » pour une licence d&apos;informatique, l&apos;histoire-géographie et les sciences économiques et
          sociales pour le droit. Chaque fiche AcadMatch reprend ces critères.
        </p>
      </Section>

      <Section id="cout" title="Le coût">
        <ul className="space-y-1.5">
          <li>
            Droits d&apos;inscription en licence : <strong>{eurosAndCfa(fee.eu.cents)}</strong> par an (UE),{" "}
            <strong>{eurosAndCfa(fee.nonEu!.cents)}</strong> hors UE non exonéré.
          </li>
          <li>{FRENCH_EXEMPTION_CAP_NOTE}</li>
          <li>
            Ressources pour le visa : au moins <strong>{eurosAndCfa(france.visaMonthlyMinimum!.cents)}</strong> par mois.
          </li>
        </ul>
      </Section>

      <Section id="catalogue" title="Les licences vérifiées par AcadMatch">
        <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
          {frenchLicences.map((f) => (
            <li key={f.id}>
              <Link href={formationPath(f)} className="font-semibold text-blue-700 hover:text-blue-800">
                {f.name}
              </Link>{" "}
              <span className="text-slate-600">({f.institution.city})</span>
            </li>
          ))}
        </ul>
        {belgianLicences.length > 0 && (
          <p>
            En Belgique, la 1re année s&apos;appelle « bachelier » : voir{" "}
            <Link href={guidePath("etudier-en-belgique")} className="font-semibold text-blue-700 hover:text-blue-800">
              étudier en Belgique
            </Link>{" "}
            ({belgianLicences.length} bacheliers vérifiés).
          </p>
        )}
      </Section>
    </GuideShell>
  );
}
