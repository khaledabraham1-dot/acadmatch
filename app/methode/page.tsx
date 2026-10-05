import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { FORMATIONS } from "@/data/formations";
import { SELECTIVITY_SOURCES } from "@/data/selectivity";
import {
  ACADEMIC_STANDING_ADJUSTMENT,
  computeCompatibility,
  DOMAIN_MISMATCH_BASE_CAP,
  ENGINE_WEIGHTS,
  EVIDENCE_FULL_ITEMS,
  NO_CONTENT_MATCH_CEILING,
  SELECTIVITY_STANDING_ADJUSTMENT,
  STRENGTH_POINTS,
} from "@/lib/matching/engine";
import { bestExampleResult } from "@/lib/landing/exampleResult";
import { catalogueFacts, compatibilityLabelThresholds, evidenceCapTable, mentionThresholds } from "@/lib/method";
import { SELECTIVE_BELOW, TIER_LABEL, VERY_SELECTIVE_BELOW, type SelectivityTier } from "@/lib/selectivity";
import { ACADEMIC_STANDINGS } from "@/data/subjects";
import type { StudentProfile } from "@/types";

export const metadata: Metadata = {
  title: "Comment est calculé le score de compatibilité",
  description:
    "La méthode complète d'AcadMatch : les quatre critères et leurs poids, les garde-fous, la sélectivité officielle, vos notes, les sources, et ce que le score n'est pas.",
  alternates: { canonical: "/methode" },
};

const pct = (value: number) => `${Math.round(value * 100)} %`;
const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

const CRITERIA: { key: keyof typeof ENGINE_WEIGHTS; name: string; measures: string }[] = [
  { key: "prerequisites", name: "Prérequis d'admission", measures: "Les conditions publiées par la formation : diplôme d'entrée, domaine d'études, matières ou compétences exigées, et la langue d'enseignement." },
  { key: "academicContent", name: "Contenu académique", measures: "Vos matières face aux matières fondamentales du programme, pondérées selon leur importance (essentielle, importante, utile)." },
  { key: "skills", name: "Compétences", measures: "Les compétences que la formation attend à l'entrée, citées depuis sa page officielle quand elle les publie." },
  { key: "levelDegree", name: "Niveau et dossier", measures: "Votre niveau face au diplôme exigé, et le type de diplôme que vous visez (licence, master…)." },
];

const TIERS: SelectivityTier[] = ["très sélective", "sélective", "accessible"];

/** Démonstration en direct : des mots au hasard ne produisent pas de score crédible. */
function absurdProfileDemo() {
  const profile: StudentProfile = {
    currentLevel: "Licence 2",
    fieldOfStudy: "Sciences politiques",
    currentDegree: "Licence Science politique",
    courses: ["Chat", "Chien", "Lion"].map((name, i) => ({ id: String(i), name })),
    skills: ["Girafe", "Zèbre"],
    goal: "Licence",
    languages: ["Français"],
    academicStanding: "Bons résultats",
  };
  return Math.max(...FORMATIONS.filter((f) => !f.demo).map((f) => computeCompatibility(profile, f).overallScore));
}

function Table({ label, head, rows }: { label: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto rounded-[14px] border border-slate-200" tabIndex={0} role="region" aria-label={label}>
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-2.5 font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={`px-4 py-2.5 ${j === 0 ? "font-bold text-slate-900" : "text-slate-700"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <section aria-labelledby={id} className="grid gap-3 text-[15px] leading-relaxed text-slate-700">
        <h2 id={id} className="text-lg font-bold text-slate-900">
          {title}
        </h2>
        {children}
      </section>
    </Card>
  );
}

export default function MethodePage() {
  const example = bestExampleResult();
  const absurdScore = absurdProfileDemo();
  const facts = catalogueFacts();

  return (
    <AppShell
      title="Comment est calculé le score"
      description="La méthode complète, sans zone d'ombre : ce qui compte, combien, d'où viennent les données, et ce que le score ne dit pas."
    >
      <div className="grid gap-6">
        <Card className="border-blue-200 bg-blue-50/60">
          <p className="text-base leading-relaxed text-slate-800">
            AcadMatch compare <strong>ce que vous avez réellement étudié</strong> aux <strong>exigences d&apos;entrée publiées</strong> par
            chaque formation, comme le ferait un jury qui lit votre dossier. Le score est calculé par des règles fixes et
            publiques, détaillées ci-dessous : <strong>aucune intelligence artificielle ne décide de votre score</strong>, et le même
            profil obtient toujours le même résultat. Ce n&apos;est <strong>pas une probabilité d&apos;admission</strong> : seul le jury de
            l&apos;établissement décide.
          </p>
        </Card>

        <Section id="criteres" title="1. Quatre critères, des poids fixes">
          <Table
            label="Critères et poids du score"
            head={["Critère", "Poids", "Ce qui est mesuré"]}
            rows={CRITERIA.map((c) => [c.name, pct(ENGINE_WEIGHTS[c.key]), c.measures])}
          />
          <p>
            Chaque critère est noté sur 100, puis combiné selon ces poids. Une correspondance forte avec une exigence vaut{" "}
            {STRENGTH_POINTS.forte} points, une correspondance partielle (matière proche) {STRENGTH_POINTS.partielle}, une absence{" "}
            {STRENGTH_POINTS.manquant}.
          </p>
          <p>
            Exemple réel, recalculé à chaque mise à jour : le profil exemple (Licence 3 Informatique) obtient{" "}
            <strong>{example.result.overallScore}/100</strong> pour le {example.formation.name} — prérequis{" "}
            {example.result.breakdown.prerequisites}, contenu {example.result.breakdown.academicContent}, compétences{" "}
            {example.result.breakdown.skills}, niveau {example.result.breakdown.levelDegree}.
          </p>
        </Section>

        <Section id="matieres" title="2. Comment vos matières sont reconnues">
          <p>
            Un même cours porte des noms différents selon l&apos;université et le pays. Avant de comparer, AcadMatch ramène chaque
            intitulé à une forme commune : la numérotation est retirée (« Analyse II », « Algo S3 »), les abréviations sont
            développées (« BDD » = bases de données), les intitulés anglais usuels sont traduits (« Operating Systems »), et
            les synonymes reconnus (« Apprentissage automatique » = « Machine Learning »).
          </p>
          <p>
            Une matière ne compte que si elle correspond à une vraie matière connue. Un mot quelconque est signalé dès la
            saisie et ne compte pas. L&apos;intitulé que vous avez écrit reste toujours affiché tel quel.
          </p>
        </Section>

        <Section id="garde-fous" title="3. Les garde-fous : pas de score gonflé">
          <p>
            <strong>Profil trop mince.</strong> Tant que votre profil compte moins de {EVIDENCE_FULL_ITEMS} matières et compétences
            reconnues, le score est plafonné et marqué « estimation » : un jury ne juge pas un dossier sur deux lignes. Les
            langues ne comptent pas comme preuves.
          </p>
          <Table
            label="Plafond selon le nombre de preuves"
            head={["Preuves reconnues", "Plafond du score"]}
            rows={[...evidenceCapTable().map((r) => [String(r.evidence), `${r.cap}/100`]), [`${EVIDENCE_FULL_ITEMS} ou plus`, "aucun plafond"]]}
          />
          <p>
            <strong>Aucune correspondance.</strong> Si aucune de vos matières ni compétences ne correspond au programme, le score
            ne dépasse pas {NO_CONTENT_MATCH_CEILING}/100 (« profil non évaluable pour cette formation »). Démonstration en
            direct : un profil rempli de noms d&apos;animaux obtient au mieux <strong>{absurdScore}/100</strong> sur tout le catalogue.
          </p>
          <p>
            <strong>Hors de votre domaine.</strong> Si la formation exige un domaine d&apos;études que vous n&apos;avez pas, le score
            part d&apos;un plafond de {DOMAIN_MISMATCH_BASE_CAP} et ne remonte qu&apos;à mesure que votre profil prouve les matières de
            base de cette formation : une vraie réorientation reste possible, un simple changement de case non.
          </p>
          <p>
            <strong>Domaine exclu.</strong> Quelques formations n&apos;admettent pas un domaine précis (par exemple un master de
            management « double compétence », réservé aux diplômés hors gestion). Pour ces étudiants, le score part du plafond de{" "}
            {DOMAIN_MISMATCH_BASE_CAP} sans aucun crédit pour les matières communes : c&apos;est justement leur formation qui les exclut.
          </p>
          <p className="text-sm text-slate-600">
            Au-dessus d&apos;un plafond, l&apos;écart n&apos;est pas effacé mais fortement réduit : l&apos;ordre entre les formations reste
            juste.
          </p>
        </Section>

        <Section id="resultats" title="4. Vos résultats et la sélectivité de la formation">
          <p>
            Des résultats modestes ne ferment pas une formation accessible, mais pèsent lourd face à une formation qui ne
            retient qu&apos;une candidature sur huit. Quand la sélectivité est publiée officiellement, vos résultats ajoutent ou
            retirent des points au score :
          </p>
          <Table
            label="Ajustement selon les résultats et la sélectivité"
            head={["Sélectivité", ...ACADEMIC_STANDINGS]}
            rows={TIERS.map((tier) => [
              `${TIER_LABEL[tier]} (${tier === "très sélective" ? `moins de ${pct(VERY_SELECTIVE_BELOW)}` : tier === "sélective" ? `${pct(VERY_SELECTIVE_BELOW)} à ${pct(SELECTIVE_BELOW)}` : `${pct(SELECTIVE_BELOW)} ou plus`})`,
              ...ACADEMIC_STANDINGS.map((s) => signed(SELECTIVITY_STANDING_ADJUSTMENT[tier][s])),
            ])}
          />
          <p>
            La sélectivité vient uniquement de données officielles : pour les masters français, la part des candidatures qui
            reçoivent une proposition sur{" "}
            <a href={SELECTIVITY_SOURCES.monMaster} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-700 underline underline-offset-2">
              Mon Master
            </a>
            ; pour les licences, le taux d&apos;accès{" "}
            <a href={SELECTIVITY_SOURCES.parcoursup} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-700 underline underline-offset-2">
              Parcoursup
            </a>
            ; en Belgique, l&apos;accès ouvert et ses exceptions officielles. Quand aucun taux n&apos;est publié, AcadMatch l&apos;écrit et
            n&apos;ajuste que très peu (de {signed(ACADEMIC_STANDING_ADJUSTMENT["Résultats modestes"])} à{" "}
            {signed(ACADEMIC_STANDING_ADJUSTMENT["Excellents résultats"])} sur le critère « niveau et dossier ») : on n&apos;invente
            pas une barre qu&apos;on ne connaît pas.
          </p>
          <p>
            <strong>Vos vraies notes l&apos;emportent.</strong> Si vous importez votre relevé, votre moyenne réelle remplace votre
            auto-évaluation, selon les mentions officielles :{" "}
            {mentionThresholds()
              .filter((m) => m.min >= 10)
              .map((m) => `${m.mention} à partir de ${String(m.min).replace(".", ",")}/20`)
              .join(", ")}
            . Seuls les barèmes fiables sont utilisés (sur 20, sur 100, en %) : un GPA ou des notes en lettres ne sont jamais
            convertis au hasard.
          </p>
        </Section>

        <Section id="libelles" title="5. Ce que veulent dire les libellés">
          <Table
            label="Libellés du score"
            head={["Libellé", "Score"]}
            rows={compatibilityLabelThresholds().map((t, i, all) => [t.label, i === 0 ? `${t.min} et plus` : `${t.min} à ${all[i - 1].min - 1}`])}
          />
        </Section>

        <Section id="donnees" title="6. D'où viennent les données">
          <ul className="grid list-disc gap-1.5 pl-5">
            <li>
              {facts.formations} formations en {facts.countries.join(" et en ")}, chacune liée à sa page officielle et datée de sa
              dernière vérification.
            </li>
            <li>
              Sélectivité : taux officiel pour {facts.withOfficialRate} formations, accès ouvert ou examen d&apos;entrée pour{" "}
              {facts.openAccessOrExam}, « non publié » pour {facts.notPublished} (aucun chiffre inventé).
            </li>
            <li>Chiffres officiels régénérés chaque année depuis les données publiques du ministère.</li>
          </ul>
        </Section>

        <Section id="limites" title="7. Ce que le score ne mesure pas">
          <ul className="grid list-disc gap-1.5 pl-5">
            <li>Votre lettre de motivation, votre projet, vos stages ou votre entretien : ils comptent beaucoup pour un jury.</li>
            <li>Le nombre de places restantes cette année, ni le profil des autres candidats.</li>
            <li>Le contenu exact de vos cours quand seul leur intitulé est connu : importez votre programme pour aller plus loin.</li>
            <li>Les formations absentes du catalogue.</li>
          </ul>
          <p>
            En cas de doute, la page officielle de la formation fait toujours foi.
          </p>
        </Section>

        <Section id="verification" title="8. Comment nous vérifions le score">
          <p>
            Chaque modification du moteur passe par des tests automatiques : des profils réels de plusieurs domaines doivent
            rester reconnus et bien classés, et des profils absurdes (mots au hasard, langues seules, doublons) doivent rester
            sous {NO_CONTENT_MATCH_CEILING}/100. Sous chaque résultat, vous pouvez dire si le score vous paraît juste : ces avis
            anonymes servent directement à l&apos;améliorer.
          </p>
          <p>
            Une question sur la méthode ? Écrivez-nous (adresse dans les{" "}
            <Link href="/mentions-legales" className="font-bold text-blue-700 underline underline-offset-2">
              mentions légales
            </Link>
            ).
          </p>
        </Section>
      </div>
    </AppShell>
  );
}
