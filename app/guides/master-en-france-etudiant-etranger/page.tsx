import type { Metadata } from "next";
import Link from "next/link";
import { GuideShell, guideMetadata } from "@/components/seo/GuideShell";
import { Section } from "@/components/seo/PageParts";
import { FORMATIONS } from "@/data/formations";
import { OFFICIAL_CAMPAIGNS } from "@/data/campaigns";
import { COUNTRY_BUDGET_RULES, FRENCH_EXEMPTION_CAP_NOTE, FRENCH_NATIONAL_FEES } from "@/data/budget";
import { nationalPlatformOf } from "@/lib/campaigns";
import { formatCalendarDate } from "@/lib/calendar";
import { domainPath } from "@/lib/seo/domains";
import { guideBySlug, guidePath } from "@/lib/seo/guides";
import { eurosAndCfa } from "@/lib/seo/money";
import { formationPath, publicFormations } from "@/lib/site";

const guide = guideBySlug("master-en-france-etudiant-etranger")!;

export const metadata: Metadata = guideMetadata(guide);

const masters = publicFormations(FORMATIONS).filter((f) => f.goal === "Master" && f.institution.country === "France");
const viaMonMaster = masters.filter((f) => nationalPlatformOf(f) === "monmaster");
const ownPlatform = masters.filter((f) => nationalPlatformOf(f) !== "monmaster");
const monMaster = OFFICIAL_CAMPAIGNS.monmaster;
const fee = FRENCH_NATIONAL_FEES.master;
const france = COUNTRY_BUDGET_RULES.France;
const masterDomains = [...new Set(masters.map((f) => f.field))].sort((a, b) => a.localeCompare(b, "fr"));

function FormationLinks({ list }: { list: typeof masters }) {
  return (
    <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
      {list.map((f) => (
        <li key={f.id}>
          <Link href={formationPath(f)} className="font-semibold text-blue-700 hover:text-blue-800">
            {f.name}
          </Link>{" "}
          <span className="text-slate-600">({f.institution.city})</span>
        </li>
      ))}
    </ul>
  );
}

export default function MasterGuide() {
  return (
    <GuideShell
      guide={guide}
      intro={
        <p>
          Pour entrer en master en France avec un diplôme étranger, il faut d&apos;abord savoir <strong>par où passe la
          candidature</strong> : la plateforme nationale Mon Master, la procédure Études en France de Campus France, ou la
          plateforme propre de l&apos;école. Le bon circuit dépend de la formation et de votre pays de résidence. Ce guide
          détaille les trois voies, le calendrier, ce que regardent les jurys et le coût réel en 2026-2027.
        </p>
      }
      faq={[
        {
          question: "Un étudiant étranger peut-il candidater sur Mon Master ?",
          answer:
            "Oui pour les masters nationaux, sauf s'il réside hors de l'Union européenne dans un pays « Études en France » : il dépose alors ses candidatures sur la plateforme Études en France, avec le calendrier de Campus France de son pays. Les écoles (MSc, mastères spécialisés) ont leur propre plateforme.",
        },
        {
          question: "Combien coûte un master en France pour un étudiant étranger ?",
          answer: `Dans une université publique, les droits d'inscription 2026-2027 sont de ${eurosAndCfa(fee.eu.cents)} par an pour un étudiant de l'Union européenne et de ${eurosAndCfa(fee.nonEu!.cents)} pour un étudiant hors UE non exonéré, plus la CVEC (${eurosAndCfa(france.mandatoryFees[0].amount.cents)}). ${FRENCH_EXEMPTION_CAP_NOTE} Les écoles fixent leurs propres tarifs, souvent bien plus élevés.`,
        },
        {
          question: "Quel diplôme faut-il pour entrer en master 1 ?",
          answer:
            "En général une licence (bac+3) ou un diplôme étranger jugé équivalent, dans un domaine cohérent avec le master. Chaque formation publie ses « attendus » : matières où vos notes comptent, compétences, niveau de langue. Un bachelor de 3 ou 4 ans permet souvent de candidater en M1.",
        },
        {
          question: "Quand ouvrent les candidatures en master pour la rentrée suivante ?",
          answer: `Sur Mon Master, le dépôt des candidatures pour la rentrée ${monMaster.intake} s'est déroulé ${formatCalendarDate(monMaster.phases[0].start!)} – ${formatCalendarDate(monMaster.phases[0].end)} (arrêté au Journal officiel). Le calendrier de la campagne suivante est publié par arrêté, en général en début d'année. Les procédures Études en France et les écoles ferment souvent plus tôt.`,
        },
      ]}
      sources={[
        { label: `Mon Master — ${monMaster.sourceLabel}`, url: monMaster.source },
        { label: "Service-Public — droits d'inscription", url: fee.eu.source },
        { label: "Service-Public — droits différenciés (hors UE)", url: fee.nonEu!.source },
        { label: "Service-Public — visa étudiant et ressources", url: france.visaMonthlyMinimum!.source },
        { label: "Campus France — procédure Études en France", url: "https://www.campusfrance.org/fr/candidature-procedure-etudes-en-france" },
      ]}
    >
      <Section id="voies" title="Trois voies de candidature">
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            <strong>Mon Master</strong>, la plateforme nationale des masters (diplôme national de master des universités).
            Vous y déposez vos candidatures pendant une fenêtre unique au printemps, puis les universités répondent en
            juin.
          </li>
          <li>
            <strong>Études en France</strong>, si vous résidez hors UE dans l&apos;un des pays de la procédure : vos
            candidatures aux masters nationaux passent par Campus France, avec des dates limites plus précoces.{" "}
            <Link href={guidePath("etudes-en-france")} className="font-semibold text-blue-700 hover:text-blue-800">
              Voir le guide Études en France
            </Link>
            .
          </li>
          <li>
            <strong>La plateforme de l&apos;établissement</strong> pour les écoles d&apos;ingénieurs, les MSc et certains
            masters internationaux : calendrier par vagues, frais de dossier possibles, souvent dès l&apos;automne.
          </li>
        </ol>
      </Section>

      <Section id="calendrier" title="Le calendrier Mon Master">
        <p>
          Dates de la campagne {monMaster.intake}, fixées par arrêté. Le calendrier {monMaster.intake + 1} n&apos;étant
          pas encore publié, elles donnent l&apos;ordre de grandeur :
        </p>
        <ul className="space-y-1.5">
          {monMaster.phases.map((phase) => (
            <li key={phase.label}>
              <strong>{phase.label}</strong> :{" "}
              {phase.start ? `du ${formatCalendarDate(phase.start)} au ${formatCalendarDate(phase.end)}` : formatCalendarDate(phase.end)}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="jury" title="Ce que regardent les jurys">
        <p>
          Les masters publient sur Mon Master leurs « attendus » et leurs critères d&apos;examen. On y retrouve presque
          toujours : les <strong>notes dans les matières fondamentales</strong> du domaine sur toute la licence, la
          cohérence entre votre formation antérieure et le master, la lettre de motivation et, pour les formations en
          anglais, un niveau certifié. AcadMatch a relevé ces attendus formation par formation : par domaine,{" "}
          {masterDomains.map((domain, index) => (
            <span key={domain}>
              <Link href={domainPath(domain)} className="font-semibold text-blue-700 hover:text-blue-800">
                {domain.toLocaleLowerCase("fr")}
              </Link>
              {index < masterDomains.length - 1 ? ", " : "."}
            </span>
          ))}
        </p>
      </Section>

      <Section id="cout" title="Le coût en 2026-2027">
        <ul className="space-y-1.5">
          <li>
            Droits d&apos;inscription en master (université publique) : <strong>{eurosAndCfa(fee.eu.cents)}</strong> par an
            pour un étudiant de l&apos;UE, <strong>{eurosAndCfa(fee.nonEu!.cents)}</strong> hors UE non exonéré.
          </li>
          <li>{FRENCH_EXEMPTION_CAP_NOTE}</li>
          <li>
            CVEC : <strong>{eurosAndCfa(france.mandatoryFees[0].amount.cents)}</strong> par an.
          </li>
          <li>
            Ressources exigées pour le visa : au moins <strong>{eurosAndCfa(france.visaMonthlyMinimum!.cents)}</strong> par
            mois. {france.visaMonthlyMinimum!.note}
          </li>
        </ul>
        <p>
          Détail et comparaison dans le guide{" "}
          <Link href={guidePath("cout-des-etudes-en-france")} className="font-semibold text-blue-700 hover:text-blue-800">
            coût des études en France
          </Link>
          , et votre budget personnel dans le{" "}
          <Link href="/budget" className="font-semibold text-blue-700 hover:text-blue-800">
            calculateur
          </Link>
          .
        </p>
      </Section>

      <Section id="catalogue" title="Les masters vérifiés par AcadMatch">
        <p>Via Mon Master (ou Études en France selon votre pays) :</p>
        <FormationLinks list={viaMonMaster} />
        <p>Via la plateforme de l&apos;établissement :</p>
        <FormationLinks list={ownPlatform} />
      </Section>
    </GuideShell>
  );
}
