import type { Metadata } from "next";
import Link from "next/link";
import { GuideShell, guideMetadata } from "@/components/seo/GuideShell";
import { Section } from "@/components/seo/PageParts";
import { FORMATIONS } from "@/data/formations";
import {
  BUDGET_HINTS,
  COUNTRY_BUDGET_RULES,
  FIXED_EURO_PARITIES,
  FRENCH_EXEMPTION_CAP_NOTE,
  FRENCH_NATIONAL_FEES,
  TUITION_FEES,
} from "@/data/budget";
import { guideBySlug, guidePath } from "@/lib/seo/guides";
import { eurosAndCfa } from "@/lib/seo/money";
import { formationPath, publicFormations } from "@/lib/site";

const guide = guideBySlug("cout-des-etudes-en-france")!;

export const metadata: Metadata = guideMetadata(guide);

const france = COUNTRY_BUDGET_RULES.France;
const cvec = france.mandatoryFees[0];
const visa = france.visaMonthlyMinimum!;
const rows = [
  { label: "Licence (université publique)", fee: FRENCH_NATIONAL_FEES.licence },
  { label: "Master (université publique)", fee: FRENCH_NATIONAL_FEES.master },
  { label: "Diplôme d'ingénieur (écoles publiques)", fee: FRENCH_NATIONAL_FEES.ingenieur },
];

/** Formations du catalogue dont le tarif hors UE dépasse les droits nationaux : les écoles fixent leurs prix. */
const highFees = publicFormations(FORMATIONS)
  .filter((f) => f.institution.country === "France")
  .map((f) => ({ formation: f, fee: TUITION_FEES[f.id] }))
  .filter(({ fee }) => fee?.nonEu && fee.nonEu.cents > FRENCH_NATIONAL_FEES.master.nonEu!.cents)
  .sort((a, b) => b.fee!.nonEu!.cents - a.fee!.nonEu!.cents);

export default function CoutGuide() {
  return (
    <GuideShell
      guide={guide}
      intro={
        <p>
          Le coût d&apos;études en France se résume à trois postes : les <strong>droits d&apos;inscription</strong>, très
          différents entre étudiants européens et non européens, la <strong>CVEC</strong>, et les{" "}
          <strong>ressources mensuelles</strong> exigées pour obtenir le visa. Tous les montants ci-dessous sont les
          montants officiels 2026-2027, convertis en francs CFA à la parité fixe (1 € ={" "}
          {FIXED_EURO_PARITIES.XOF.rate.toLocaleString("fr-FR")} FCFA).
        </p>
      }
      faq={[
        {
          question: "Combien coûte une année d'université en France pour un étudiant africain ?",
          answer: `Pour un étudiant hors UE non exonéré, les droits d'inscription 2026-2027 sont de ${eurosAndCfa(FRENCH_NATIONAL_FEES.licence.nonEu!.cents)} en licence et de ${eurosAndCfa(FRENCH_NATIONAL_FEES.master.nonEu!.cents)} en master, plus la CVEC (${eurosAndCfa(cvec.amount.cents)}). Il faut en outre justifier d'au moins ${eurosAndCfa(visa.cents)} de ressources par mois pour le visa.`,
        },
        {
          question: "Peut-on être exonéré des droits différenciés ?",
          answer: `C'est possible mais jamais garanti : chaque établissement décide. ${FRENCH_EXEMPTION_CAP_NOTE}`,
        },
        {
          question: "Quel montant faut-il sur son compte pour le visa étudiant ?",
          answer: `${eurosAndCfa(visa.cents)} par mois au minimum, soit ${eurosAndCfa(visa.cents * 12)} pour douze mois. ${visa.note}`,
        },
        {
          question: "Les écoles coûtent-elles plus cher que les universités ?",
          answer:
            "Souvent, pour les étudiants hors UE : les écoles d'ingénieurs et de commerce, les MSc et les mastères spécialisés fixent leurs propres tarifs, parfois plus de 10 000 € par an. Chaque fiche AcadMatch indique le tarif publié par l'établissement.",
        },
      ]}
      sources={[
        { label: "Service-Public : droits d'inscription et CVEC", url: FRENCH_NATIONAL_FEES.licence.eu.source },
        { label: "Service-Public : droits différenciés (hors UE)", url: FRENCH_NATIONAL_FEES.licence.nonEu!.source },
        { label: "Service-Public : visa étudiant (ressources)", url: visa.source },
        { label: "Direction générale du Trésor : parité du franc CFA", url: FIXED_EURO_PARITIES.XOF.source },
        { label: "Crous : repas à 1 €", url: BUDGET_HINTS.food.source },
      ]}
    >
      <Section id="droits" title="Les droits d'inscription 2026-2027">
        {/* Mobile : une carte par diplôme, pour que la colonne « hors UE » ne soit jamais cachée hors écran. */}
        <ul className="space-y-2 sm:hidden">
          {rows.map((row) => (
            <li key={row.label} className="rounded-[14px] bg-white p-4 text-sm ring-1 ring-slate-200">
              <p className="font-semibold text-slate-900">{row.label}</p>
              <p className="mt-1 text-slate-700">Étudiant UE / EEE : {eurosAndCfa(row.fee.eu.cents)}</p>
              <p className="text-slate-700">Étudiant hors UE : {eurosAndCfa(row.fee.nonEu!.cents)}</p>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto rounded-[14px] ring-1 ring-slate-200 sm:block" tabIndex={0} role="region" aria-label="Droits d'inscription 2026-2027">
          <table className="w-full min-w-[520px] bg-white text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Diplôme</th>
                <th className="px-4 py-2.5 font-semibold">Étudiant UE / EEE</th>
                <th className="px-4 py-2.5 font-semibold">Étudiant hors UE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="px-4 py-2.5 font-medium text-slate-900">
                    {row.label}
                  </th>
                  <td className="px-4 py-2.5 text-slate-700">{eurosAndCfa(row.fee.eu.cents)}</td>
                  <td className="px-4 py-2.5 text-slate-700">{eurosAndCfa(row.fee.nonEu!.cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>{FRENCH_EXEMPTION_CAP_NOTE}</p>
      </Section>

      <Section id="cvec" title="La CVEC">
        <p>
          {cvec.label} : <strong>{eurosAndCfa(cvec.amount.cents)}</strong> par an. {cvec.note}
        </p>
      </Section>

      <Section id="visa" title="Les ressources exigées pour le visa">
        <p>
          Au moins <strong>{eurosAndCfa(visa.cents)}</strong> par mois, soit {eurosAndCfa(visa.cents * 12)} pour douze
          mois. {visa.note}
        </p>
        <p>
          Côté dépenses, deux repères officiels : {BUDGET_HINTS.food.text}{" "}
          <a href={BUDGET_HINTS.housing.source} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:text-blue-800">
            {BUDGET_HINTS.housing.text}
          </a>
        </p>
      </Section>

      {highFees.length > 0 && (
        <Section id="ecoles" title="Écoles et programmes internationaux : des tarifs propres">
          <ul className="space-y-1.5 text-sm">
            {highFees.map(({ formation, fee }) => (
              <li key={formation.id}>
                <Link href={formationPath(formation)} className="font-semibold text-blue-700 hover:text-blue-800">
                  {formation.name}
                </Link>{" "}
                ({formation.institution.city}) : {eurosAndCfa(fee!.nonEu!.cents)} hors UE
                {fee!.scope === "programme" ? " pour tout le programme" : " par an"}
                {fee!.nonEu!.indicative ? ", indicatif" : ""}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section id="budget" title="Calculer votre budget">
        <p>
          Le{" "}
          <Link href="/budget" className="font-semibold text-blue-700 hover:text-blue-800">
            calculateur de budget AcadMatch
          </Link>{" "}
          additionne les frais de la formation choisie, la CVEC et vos dépenses, et vérifie le seuil du visa, en euros et
          dans votre devise. Pour la Belgique, voir{" "}
          <Link href={guidePath("etudier-en-belgique")} className="font-semibold text-blue-700 hover:text-blue-800">
            étudier en Belgique
          </Link>
          .
        </p>
      </Section>
    </GuideShell>
  );
}
