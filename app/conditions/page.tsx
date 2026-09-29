import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, EditorName, LegalPage, Section } from "@/components/legal/LegalPage";
import { EDITOR } from "@/data/legal";
import { USER_DAILY_LIMITS } from "@/lib/ai/config";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  alternates: { canonical: "/conditions" },
  description: "Les règles d'utilisation d'AcadMatch, ce que le score signifie et ce qu'il ne garantit pas.",
};

const linkClass = "text-blue-700 underline underline-offset-2";

export default function ConditionsPage() {
  return (
    <LegalPage
      title="Conditions d'utilisation"
      current="/conditions"
      intro={
        <p>
          Ces conditions s&apos;appliquent à toute utilisation d&apos;AcadMatch. Créer un compte revient à les
          accepter. Elles sont écrites pour être comprises : si un point n&apos;est pas clair, écrivez à{" "}
          <ContactEmail />.
        </p>
      }
    >
      <Section title="1. Le service">
        <p>
          AcadMatch compare votre parcours académique aux exigences d&apos;entrée de formations en France et en
          Belgique, et vous aide à préparer vos candidatures (suivi, calendrier, budget, visa, lettre de
          motivation, entretiens). Le service est gratuit. Il est édité par <EditorName />.
        </p>
      </Section>

      <Section title="2. Ce que le score signifie — et ce qu'il ne garantit pas">
        <ul>
          <li>
            Le score de compatibilité est une <strong>aide à la décision</strong>, calculée à partir de ce que
            vous déclarez et des informations publiées par les établissements. Ce n&apos;est ni une promesse
            d&apos;admission, ni un avis de l&apos;établissement.
          </li>
          <li>
            Seul l&apos;établissement décide de votre admission, selon sa propre procédure. Les conditions,
            frais et dates peuvent changer : vérifiez toujours la source officielle citée sur chaque fiche avant
            de candidater. En cas de différence, elle fait foi.
          </li>
          <li>
            Les informations sur les visas et les budgets sont générales. Seuls le consulat, l&apos;ambassade ou
            Campus France peuvent confirmer ce qui s&apos;applique à votre situation.
          </li>
        </ul>
      </Section>

      <Section title="3. Votre compte">
        <ul>
          <li>Le compte est optionnel : tout le parcours principal fonctionne sans.</li>
          <li>
            Il est personnel. Vous êtes responsable de l&apos;accès à l&apos;adresse e-mail qui reçoit vos liens de
            connexion.
          </li>
          <li>Moins de 15 ans : demandez l&apos;accord d&apos;un parent avant de créer un compte.</li>
          <li>
            Vous pouvez le supprimer à tout moment depuis <Link href="/compte" className={linkClass}>Mon compte</Link>.
          </li>
        </ul>
      </Section>

      <Section title="4. Fonctionnalités d'intelligence artificielle">
        <ul>
          <li>
            Leur usage est limité chaque jour par personne ({USER_DAILY_LIMITS.import} imports de documents et{" "}
            {USER_DAILY_LIMITS.texte} générations de texte au plus), et par un budget global du site. Ces limites
            peuvent évoluer, et le service peut être suspendu temporairement si le budget est atteint.
          </li>
          <li>
            L&apos;IA peut se tromper. Vérifiez les matières importées avant de les enregistrer, et relisez tout
            texte généré.
          </li>
          <li>
            Une lettre de motivation générée est un <strong>brouillon</strong>. Elle ne s&apos;appuie que sur ce que
            vous avez déclaré, mais c&apos;est vous qui la signez : vous êtes responsable de son contenu et de son
            exactitude, et de respecter les règles de l&apos;établissement sur l&apos;usage de l&apos;IA.
          </li>
          <li>
            N&apos;importez que des documents qui vous concernent, ou que vous avez le droit d&apos;utiliser.
          </li>
        </ul>
      </Section>

      <Section title="5. Usages interdits">
        <p>Il est interdit :</p>
        <ul>
          <li>de contourner les limites d&apos;usage, notamment en créant plusieurs comptes ;</li>
          <li>d&apos;extraire le catalogue ou les contenus de façon automatisée et massive ;</li>
          <li>de tenter d&apos;accéder aux données d&apos;autres utilisateurs ou de perturber le service ;</li>
          <li>d&apos;utiliser AcadMatch pour produire de faux documents ou de fausses déclarations.</li>
        </ul>
        <p>Un compte qui enfreint ces règles peut être suspendu ou supprimé.</p>
      </Section>

      <Section title="6. Disponibilité et responsabilité">
        <p>
          AcadMatch est fourni gratuitement et « en l&apos;état ». Nous faisons de notre mieux pour qu&apos;il soit
          disponible et exact, sans pouvoir le garantir. Nous ne sommes pas responsables d&apos;une décision
          d&apos;admission, d&apos;un refus de visa, d&apos;une date manquée ou d&apos;une dépense prise sur la base
          du site sans vérification auprès de la source officielle. Rien dans ces conditions ne limite les
          droits que la loi de votre pays vous accorde.
        </p>
        <p>
          Vos données locales vivent dans votre navigateur : les effacer, ou changer d&apos;appareil sans compte,
          les fait disparaître. Exportez-les ou sauvegardez votre profil sur votre compte si vous y tenez.
        </p>
      </Section>

      <Section title="7. Données personnelles">
        <p>
          Leur traitement est décrit dans la{" "}
          <Link href="/confidentialite" className={linkClass}>politique de confidentialité</Link>.
        </p>
      </Section>

      <Section title="8. Modifications et droit applicable">
        <p>
          Nous pouvons faire évoluer ces conditions ; la date en haut de page indique la dernière version. Une
          modification importante sera signalée sur le site. Ces conditions sont régies par le droit du{" "}
          {EDITOR.country}, sans vous priver des protections impératives de la loi de votre pays de résidence. En
          cas de désaccord, écrivez-nous d&apos;abord à <ContactEmail /> : nous chercherons une solution amiable.
        </p>
      </Section>
    </LegalPage>
  );
}
