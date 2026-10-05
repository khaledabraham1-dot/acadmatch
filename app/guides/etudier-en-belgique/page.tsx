import type { Metadata } from "next";
import Link from "next/link";
import { GuideShell, guideMetadata } from "@/components/seo/GuideShell";
import { Section } from "@/components/seo/PageParts";
import { FORMATIONS } from "@/data/formations";
import { BELGIAN_UNIVERSITY_FEES, COUNTRY_BUDGET_RULES } from "@/data/budget";
import { BELGIUM_VISA_GUIDE } from "@/data/visa";
import { guideBySlug, guidePath } from "@/lib/seo/guides";
import { eurosAndCfa } from "@/lib/seo/money";
import { formationPath, publicFormations } from "@/lib/site";

const guide = guideBySlug("etudier-en-belgique")!;

export const metadata: Metadata = guideMetadata(guide);

const belgian = publicFormations(FORMATIONS).filter((f) => f.institution.country === "Belgique");
const bacheliers = belgian.filter((f) => f.requiredLevel === "Baccalauréat");
const masters = belgian.filter((f) => f.requiredLevel !== "Baccalauréat");
const resources = COUNTRY_BUDGET_RULES.Belgique.visaMonthlyMinimum!;
const ulb = BELGIAN_UNIVERSITY_FEES.ULB;
const unamur = BELGIAN_UNIVERSITY_FEES.UNamur;
const uliege = BELGIAN_UNIVERSITY_FEES.ULiège;
const uclouvain = BELGIAN_UNIVERSITY_FEES.UCLouvain;
const byId = (id: string) => belgian.find((f) => f.id === id);
const ulbDroit = byId("f-bachelier-droit-ulb");
const unamurMaths = byId("f-bachelier-maths-unamur");
const uliegeIngenieur = byId("f-bachelier-ingenieur-civil-uliege");

export default function BelgiqueGuide() {
  return (
    <GuideShell
      guide={guide}
      intro={
        <p>
          En Belgique francophone, il n&apos;y a ni Parcoursup ni Mon Master : on candidate <strong>directement auprès de
          l&apos;université</strong>. Pour un diplôme obtenu hors Union européenne, trois choses décident de tout :
          l&apos;équivalence du diplôme, des conditions de notes souvent plus strictes, et des dates limites dès le
          printemps pour qui a besoin d&apos;un visa. Ce guide s&apos;appuie sur les conditions publiées par l&apos;ULB,
          l&apos;UCLouvain, l&apos;ULiège et l&apos;UNamur pour 2026-2027.
        </p>
      }
      faq={[
        {
          question: "Faut-il une équivalence de diplôme pour étudier en Belgique ?",
          answer:
            "Pour entrer en bachelier (1re année) avec un diplôme secondaire étranger, oui : les universités demandent la preuve de la demande d'équivalence auprès de la Fédération Wallonie-Bruxelles. Pour un master, la faculté analyse elle-même votre diplôme et peut vous admettre directement, avec des crédits complémentaires (jusqu'à 60) ou vous refuser.",
        },
        {
          question: "Combien coûtent les études en Belgique pour un étudiant hors UE ?",
          answer: `Les droits complets 2026-2027 sont de ${eurosAndCfa(ulb.eu.cents)} par an. Les étudiants hors UE non exemptés paient en plus une contribution : ${eurosAndCfa(ulb.nonEu!.cents)} au total à l'ULB, à l'ULiège et à l'UNamur. Les ressortissants de certains pays (liste de l'ARES) en sont exemptés. Les dossiers de candidature hors UE sont souvent facturés 200 € (ULB, UNamur).`,
        },
        {
          question: "Quelle moyenne faut-il pour être admis en Belgique ?",
          answer:
            "Pour les candidats hors UE non assimilés, l'ULB et l'UNamur demandent au moins 13/20 de moyenne au diplôme secondaire (et 12/20 dans les matières liées à l'ULB). En master, l'UCLouvain demande en général 13/20 sur l'ensemble des années pour les diplômés d'universités hors Europe.",
        },
        {
          question: "Quelles ressources faut-il pour le visa étudiant belge ?",
          answer: `L'Office des étrangers fixe chaque année un montant mensuel minimum : ${eurosAndCfa(resources.cents)} par mois pour 2026-2027, à prouver par un compte bloqué, une bourse ou un garant. La demande de visa D se dépose auprès de l'ambassade ou du consulat de Belgique de votre pays de résidence.`,
        },
      ]}
      sources={[
        ...(ulbDroit ? [{ label: "ULB : bachelier en droit (conditions d'admission)", url: ulbDroit.source }] : []),
        ...(unamurMaths ? [{ label: "UNamur : bachelier en mathématiques (conditions)", url: unamurMaths.source }] : []),
        ...(uliegeIngenieur ? [{ label: "ULiège : examen d'admission ingénieur civil", url: uliegeIngenieur.source }] : []),
        { label: "ULB : droits d'inscription 2026-2027", url: ulb.eu.source },
        { label: "UNamur : droits d'inscription 2026-2027", url: unamur.eu.source },
        { label: "ULiège : droits d'inscription et moyens de subsistance", url: uliege.eu.source },
        { label: "Office des étrangers : études", url: BELGIUM_VISA_GUIDE.source },
      ]}
    >
      <Section id="etapes" title="Les étapes">
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            <strong>Demander l&apos;équivalence</strong> de votre diplôme secondaire auprès de la Fédération
            Wallonie-Bruxelles (bachelier) : les universités exigent la preuve de la demande dans le dossier.
          </li>
          <li>
            <strong>Candidater auprès de l&apos;université</strong>, en ligne, avec 200 € de frais de dossier non
            remboursables hors UE (ULB, UNamur). Dates : en général de mi-février au 31 mars de l&apos;année de la
            rentrée à l&apos;ULB ; dossier complet avant le 31 mars à l&apos;UNamur si un visa est nécessaire. L&apos;UNamur précise qu&apos;une seule candidature est autorisée dans l&apos;ensemble des
            établissements de la Fédération Wallonie-Bruxelles.
          </li>
          {BELGIUM_VISA_GUIDE.steps
            .filter((step) => step.id !== "be-admission")
            .map((step) => (
              <li key={step.id}>
                <strong>{step.title}.</strong> {step.description}
              </li>
            ))}
        </ol>
      </Section>

      <Section id="conditions" title="Les conditions qui changent tout hors UE">
        <ul className="space-y-2">
          <li>
            <strong>Une moyenne minimale</strong> : 13/20 au diplôme secondaire à l&apos;ULB et à l&apos;UNamur, plus 12/20
            dans les matières liées à l&apos;ULB ; un diplôme secondaire obtenu il y a 3 ans au plus à l&apos;UNamur.
          </li>
          <li>
            <strong>Le français</strong> : niveau B2 certifié (TCF, DELF ou DALF) quand le français n&apos;était pas la
            langue de vos études, par exemple pour le droit à l&apos;ULB ou la chimie à l&apos;UNamur.
          </li>
          <li>
            <strong>Un examen d&apos;entrée pour les ingénieurs civils</strong> (ULiège) : quatre épreuves écrites de
            mathématiques, deux sessions par an. Ce n&apos;est pas un concours.
          </li>
          <li>
            <strong>En master</strong>, l&apos;analyse du dossier par la faculté peut ajouter jusqu&apos;à 60 crédits de
            compléments (UCLouvain).
          </li>
        </ul>
      </Section>

      <Section id="cout" title="Le coût en 2026-2027">
        <ul className="space-y-1.5">
          <li>
            Droits d&apos;inscription complets : <strong>{eurosAndCfa(ulb.eu.cents)}</strong> par an (ULB, ULiège, UNamur,
            UCLouvain).
          </li>
          <li>
            Hors UE non exemptés : <strong>{eurosAndCfa(ulb.nonEu!.cents)}</strong> par an à l&apos;ULB, à l&apos;ULiège et
            à l&apos;UNamur. {unamur.nonEuNote}
          </li>
          <li>UCLouvain : {uclouvain.nonEuNote}</li>
          <li>
            Moyens de subsistance pour le visa : <strong>{eurosAndCfa(resources.cents)}</strong> par mois.
          </li>
        </ul>
        <p>
          Comparer avec la France :{" "}
          <Link href={guidePath("cout-des-etudes-en-france")} className="font-semibold text-blue-700 hover:text-blue-800">
            coût des études en France
          </Link>
          .
        </p>
      </Section>

      <Section id="catalogue" title="Les formations belges vérifiées par AcadMatch">
        <p>Bacheliers (1re année) :</p>
        <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
          {bacheliers.map((f) => (
            <li key={f.id}>
              <Link href={formationPath(f)} className="font-semibold text-blue-700 hover:text-blue-800">
                {f.name}
              </Link>{" "}
              <span className="text-slate-600">({f.institution.city})</span>
            </li>
          ))}
        </ul>
        <p>Masters :</p>
        <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
          {masters.map((f) => (
            <li key={f.id}>
              <Link href={formationPath(f)} className="font-semibold text-blue-700 hover:text-blue-800">
                {f.name}
              </Link>{" "}
              <span className="text-slate-600">({f.institution.city})</span>
            </li>
          ))}
        </ul>
      </Section>
    </GuideShell>
  );
}
