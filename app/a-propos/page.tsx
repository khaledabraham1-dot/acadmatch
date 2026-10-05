import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Mail } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { ContactEmail, EditorName } from "@/components/legal/LegalPage";
import { EDITOR } from "@/data/legal";
import { catalogueFacts } from "@/lib/method";
import { breadcrumbJsonLd, serializeJsonLd } from "@/lib/structuredData";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "À propos d'AcadMatch et contact",
  description:
    "Pourquoi AcadMatch existe, ce qu'il fait et ne fait pas, comment les formations sont vérifiées, qui est derrière, et comment nous écrire.",
  alternates: { canonical: "/a-propos" },
};

const linkClass = "font-bold text-blue-700 underline underline-offset-2";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <Card>
      <section aria-labelledby={id} className="space-y-3 text-sm leading-relaxed text-slate-700">
        <h2 id={id} className="text-lg font-bold text-slate-900">
          {title}
        </h2>
        {children}
      </section>
    </Card>
  );
}

/**
 * Page « À propos / contact » : qui est derrière AcadMatch, ce que le
 * service promet (et ne promet pas), et comment écrire. Une plateforme
 * qui demande un relevé de notes doit dire clairement qui la fait et
 * qu'elle n'est ni une agence ni un intermédiaire payant.
 */
export default function AboutPage() {
  const facts = catalogueFacts();
  const jsonLd = breadcrumbJsonLd(
    [
      { name: "Accueil", path: "/" },
      { name: "À propos", path: "/a-propos" },
    ],
    siteUrl(),
  );

  return (
    <AppShell
      title="À propos d'AcadMatch"
      description="Un outil gratuit et indépendant pour savoir, avant de candidater, si un parcours correspond vraiment à une formation."
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <div className="space-y-5">
        <Section id="pourquoi" title="Pourquoi AcadMatch">
          <p>
            Candidater à une licence ou un master à l&apos;étranger coûte cher en temps, en frais de dossier et en espoir.
            Les prérequis sont dispersés sur des dizaines de sites, rédigés différemment d&apos;une université à
            l&apos;autre, et beaucoup d&apos;étudiants, en particulier en Afrique francophone, candidatent sans savoir si
            leur parcours correspond vraiment à ce que la formation attend.
          </p>
          <p>
            AcadMatch compare votre parcours (niveau, matières, compétences, notes) aux prérequis publiés par chaque
            formation, explique l&apos;écart point par point et vous aide ensuite à préparer la candidature : calendrier,
            documents, lettre de motivation, entretien, budget et visa.
          </p>
        </Section>

        <Section id="engagements" title="Ce que nous faisons, et ce que nous ne faisons pas">
          <ul className="grid list-disc gap-1.5 pl-5">
            <li>
              <strong>Gratuit.</strong> Aucun frais, ni pour l&apos;analyse, ni pour les outils de candidature.
            </li>
            <li>
              <strong>Indépendant.</strong> AcadMatch n&apos;est lié ni à Campus France, ni aux universités, ni à une
              agence. Aucun établissement ne paie pour apparaître ou pour être mieux classé.
            </li>
            <li>
              <strong>Pas une agence.</strong> Nous ne candidatons pas à votre place, ne vendons pas de place et ne
              demandons jamais d&apos;argent pour « faciliter » une admission ou un visa. Méfiez-vous de quiconque le
              propose en notre nom.
            </li>
            <li>
              <strong>Pas une promesse d&apos;admission.</strong> Le score est une aide à la décision : la décision
              revient toujours au jury de la formation.
            </li>
          </ul>
        </Section>

        <Section id="donnees" title="D'où viennent les informations">
          <p>
            Les {facts.formations} formations du catalogue, en {facts.countries.join(" et en ")}, sont vérifiées une à
            une sur leur page officielle : chaque fiche cite sa source et la date de sa dernière vérification. Les taux
            d&apos;admission viennent des données publiques du ministère (Mon Master, Parcoursup), jamais d&apos;une
            estimation inventée.
          </p>
          <p>
            Le calcul du score est entièrement public :{" "}
            <Link href="/methode" className={linkClass}>
              voir la méthode
            </Link>
            . Votre formation n&apos;est pas dans le catalogue ?{" "}
            <Link href="/formations" className={linkClass}>
              Signalez-la en bas du catalogue
            </Link>
            , les plus demandées sont ajoutées en priorité.
          </p>
        </Section>

        <Section id="qui" title="Qui est derrière AcadMatch">
          <p>
            AcadMatch est un projet indépendant édité par <EditorName />, depuis le {EDITOR.country}. Le détail est
            dans les{" "}
            <Link href="/mentions-legales" className={linkClass}>
              mentions légales
            </Link>
            , et l&apos;usage de vos données dans la{" "}
            <Link href="/confidentialite" className={linkClass}>
              politique de confidentialité
            </Link>
            .
          </p>
        </Section>

        <Section id="contact" title="Nous écrire">
          <p className="flex flex-wrap items-center gap-2">
            <Mail className="size-4 text-slate-500" aria-hidden />
            <ContactEmail />
          </p>
          <p>Écrivez-nous notamment pour :</p>
          <ul className="grid list-disc gap-1.5 pl-5">
            <li>signaler une erreur dans une fiche (indiquez la formation et, si possible, le lien officiel) ;</li>
            <li>une question sur votre score ou sur la méthode ;</li>
            <li>exercer vos droits sur vos données (accès, rectification, suppression) ;</li>
            <li>un établissement ou une association qui souhaite corriger ou compléter ses informations.</li>
          </ul>
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-slate-700">
            N&apos;envoyez jamais votre relevé de notes, votre passeport ni aucun document personnel par e-mail : nous
            n&apos;en avons pas besoin pour vous répondre.
          </p>
        </Section>
      </div>
    </AppShell>
  );
}
