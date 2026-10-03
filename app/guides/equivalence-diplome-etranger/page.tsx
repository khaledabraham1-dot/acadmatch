import type { Metadata } from "next";
import Link from "next/link";
import { GuideShell, guideMetadata } from "@/components/seo/GuideShell";
import { Section } from "@/components/seo/PageParts";
import { ENIC_NARIC_URL, estimateAcademicLevel, VALIDATED_YEARS_OPTIONS } from "@/lib/profile/degreeEquivalence";
import { guideBySlug, guidePath } from "@/lib/seo/guides";

const guide = guideBySlug("equivalence-diplome-etranger")!;

export const metadata: Metadata = guideMetadata(guide);

/** Service-Public, fiche F463 (vérifiée par Service-Public le 17 avril 2025, relue le 2026-10-03). */
const SERVICE_PUBLIC_RECOGNITION = "https://www.service-public.gouv.fr/particuliers/vosdroits/F463";
const ATTESTATION = { costEuros: 120, maxDelayMonths: 4 };
const CAMPUS_FRANCE_LMD = "https://www.campusfrance.org/en/French-degrees-LMD-equivalences";

export default function EquivalenceGuide() {
  return (
    <GuideShell
      guide={guide}
      intro={
        <p>
          Les universités françaises raisonnent en <strong>années d&apos;études après le baccalauréat</strong> : licence
          = bac+3, master = bac+5. Situer votre diplôme dans cette échelle est la première chose à faire avant de choisir
          entre une 1re année, une 3e année de licence ou un master. Ce guide donne la méthode, ses limites, et la seule
          démarche officielle : l&apos;attestation de comparabilité du centre ENIC-NARIC France.
        </p>
      }
      faq={[
        {
          question: "Une équivalence est-elle obligatoire pour candidater en France ?",
          answer:
            "Non. L'attestation de comparabilité délivrée par le centre ENIC-NARIC n'a pas de valeur juridique et n'est pas obligatoire : l'université décide elle-même si votre diplôme permet l'accès à la formation. Elle peut toutefois vous la demander.",
        },
        {
          question: "Combien coûte une attestation de comparabilité ENIC-NARIC ?",
          answer: `${ATTESTATION.costEuros} €, payés en ligne au moment de la demande, selon Service-Public. Le centre doit répondre dans un délai maximum de ${ATTESTATION.maxDelayMonths} mois après le paiement : demandez-la tôt si une université l'exige.`,
        },
        {
          question: "Un bachelor de 3 ans équivaut-il à une licence ?",
          answer:
            "En nombre d'années, un bachelor de 3 ans se situe au niveau d'une licence (bac+3) et permet en général de candidater en master 1. Chaque master vérifie ensuite le contenu : matières suivies, notes, cohérence avec la formation visée.",
        },
        {
          question: "Et pour étudier en Belgique ?",
          answer:
            "Pour entrer en bachelier avec un diplôme secondaire étranger, les universités belges demandent la preuve d'une demande d'équivalence auprès de la Fédération Wallonie-Bruxelles. En master, c'est la faculté qui analyse votre diplôme et peut ajouter des crédits complémentaires.",
        },
      ]}
      sources={[
        { label: "Service-Public — faire reconnaître un diplôme obtenu à l'étranger", url: SERVICE_PUBLIC_RECOGNITION },
        { label: "Centre ENIC-NARIC France (France Éducation international)", url: ENIC_NARIC_URL },
        { label: "Campus France — diplômes français et système LMD", url: CAMPUS_FRANCE_LMD },
      ]}
    >
      <Section id="methode" title="La méthode : compter les années validées après le secondaire">
        <p>
          Point de départ indicatif, utilisé par l&apos;outil d&apos;AcadMatch : le nombre d&apos;années d&apos;études
          supérieures validées place votre parcours au niveau français correspondant.
        </p>
        <div className="overflow-x-auto rounded-[14px] ring-1 ring-slate-200" tabIndex={0} role="region" aria-label="Années validées et niveau français">
          <table className="w-full bg-white text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Années validées après le secondaire</th>
                <th className="px-4 py-2.5 font-semibold">Niveau français indicatif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {VALIDATED_YEARS_OPTIONS.map((option) => (
                <tr key={option.years}>
                  <td className="px-4 py-2.5 text-slate-700">{option.label}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{estimateAcademicLevel(option.years)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          C&apos;est une première estimation, pas une équivalence : un jury regarde aussi le contenu des cours, le volume
          horaire et les notes. Dans votre{" "}
          <Link href="/profil" className="font-semibold text-blue-700 hover:text-blue-800">
            profil AcadMatch
          </Link>
          , l&apos;assistant « Diplôme obtenu hors de France ? » applique cette méthode pour vous.
        </p>
      </Section>

      <Section id="attestation" title="L'attestation de comparabilité (ENIC-NARIC)">
        <ul className="space-y-1.5">
          <li>Délivrée par le centre ENIC-NARIC France quand le diplôme peut être comparé à un niveau français.</li>
          <li>Sans valeur juridique et non obligatoire : la décision finale revient à l&apos;établissement.</li>
          <li>
            Demande en ligne, {ATTESTATION.costEuros} € payés à la demande, réponse en {ATTESTATION.maxDelayMonths} mois
            maximum.
          </li>
        </ul>
      </Section>

      <Section id="ensuite" title="Ensuite : choisir le bon niveau d'entrée">
        <p>
          Bac+3 validé ou en cours : visez un master 1 —{" "}
          <Link href={guidePath("master-en-france-etudiant-etranger")} className="font-semibold text-blue-700 hover:text-blue-800">
            faire un master en France
          </Link>
          . Diplôme de fin d&apos;études secondaires : une 1re année de licence —{" "}
          <Link href={guidePath("licence-en-france-apres-un-bac-etranger")} className="font-semibold text-blue-700 hover:text-blue-800">
            entrer en licence après un bac étranger
          </Link>
          . Belgique :{" "}
          <Link href={guidePath("etudier-en-belgique")} className="font-semibold text-blue-700 hover:text-blue-800">
            équivalence de la Fédération Wallonie-Bruxelles
          </Link>
          .
        </p>
      </Section>
    </GuideShell>
  );
}
