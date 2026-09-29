import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, EditorName, ExternalLink, LegalPage, Section } from "@/components/legal/LegalPage";
import { EDITOR, HOST } from "@/data/legal";

export const metadata: Metadata = {
  title: "Mentions légales",
  alternates: { canonical: "/mentions-legales" },
  description: "Éditeur, hébergeur et contact du site AcadMatch.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalPage
      title="Mentions légales"
      current="/mentions-legales"
      intro={<p>Qui édite AcadMatch, qui l&apos;héberge et comment nous joindre.</p>}
    >
      <Section title="Éditeur">
        <ul>
          <li>
            <EditorName />, {EDITOR.status.charAt(0).toLowerCase() + EDITOR.status.slice(1)}, résidant au {EDITOR.country}.
          </li>
          <li>
            Directeur de la publication : <EditorName />.
          </li>
          <li>
            Contact : <ContactEmail />
          </li>
        </ul>
      </Section>

      <Section title="Hébergement">
        <p>
          {HOST.name}, {HOST.address} — <ExternalLink href={HOST.website}>{HOST.website.replace("https://", "")}</ExternalLink>.
        </p>
        <p>
          Les comptes et profils sauvegardés sont stockés chez Supabase, dans l&apos;Union européenne. Le détail des
          prestataires figure dans la <Link href="/confidentialite" className="text-blue-700 underline underline-offset-2">politique de confidentialité</Link>.
        </p>
      </Section>

      <Section title="Ce qu'est AcadMatch — et ce qu'il n'est pas">
        <p>
          AcadMatch est un outil gratuit d&apos;aide à la décision pour les étudiants qui envisagent des études
          en France ou en Belgique. Il n&apos;est affilié ni à Campus France, ni à Parcoursup, ni à Mon Master, ni
          à aucun établissement, ministère ou ambassade. Il ne délivre aucune admission, aucun visa et aucune
          équivalence de diplôme.
        </p>
        <p>
          Les informations sur les formations sont reprises de leurs pages officielles, citées sur chaque fiche
          avec leur date de vérification. En cas de différence, la source officielle fait foi.
        </p>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>
          Le code, les textes et la présentation d&apos;AcadMatch appartiennent à son éditeur. Les noms, logos et
          contenus des établissements restent la propriété de leurs titulaires ; ils sont cités pour informer,
          avec un lien vers la source.
        </p>
      </Section>

      <Section title="Signaler une erreur ou un contenu">
        <p>
          Une information inexacte sur une formation, un problème de sécurité ou un contenu à retirer : écrivez
          à <ContactEmail />. Nous répondons dans les meilleurs délais.
        </p>
      </Section>
    </LegalPage>
  );
}
