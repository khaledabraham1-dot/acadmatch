import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, EditorName, ExternalLink, LegalPage, Section } from "@/components/legal/LegalPage";
import { AUTHORITIES, LOCAL_STORAGE_ITEMS, SUBPROCESSORS } from "@/data/legal";

export const metadata: Metadata = {
  title: "Politique de confidentialité — AcadMatch",
  description:
    "Quelles données AcadMatch utilise, où elles sont stockées, combien de temps, et comment exercer vos droits.",
};

const linkClass = "text-blue-700 underline underline-offset-2";

export default function ConfidentialitePage() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      current="/confidentialite"
      intro={
        <div className="space-y-3">
          <p>
            AcadMatch est conçu pour fonctionner <strong>sans compte</strong> : par défaut, votre profil reste dans
            votre navigateur et n&apos;est envoyé à aucun serveur. Cette page décrit ce qui change quand vous
            créez un compte ou utilisez une fonctionnalité d&apos;intelligence artificielle.
          </p>
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            En bref : pas de publicité, pas de revente, pas de traceur tiers, pas de profilage. Vos documents
            importés ne sont jamais conservés. Vous pouvez exporter ou supprimer vos données à tout moment
            depuis <Link href="/compte" className={linkClass}>Mon compte</Link>.
          </p>
        </div>
      }
    >
      <Section title="1. Responsable du traitement">
        <p>
          <EditorName />, éditeur d&apos;AcadMatch (voir les{" "}
          <Link href="/mentions-legales" className={linkClass}>mentions légales</Link>). Contact pour toute question
          ou demande sur vos données : <ContactEmail />.
        </p>
      </Section>

      <Section title="2. Sans compte : tout reste sur votre appareil">
        <p>
          Ce que vous saisissez est enregistré dans le stockage local de votre navigateur (localStorage), sur
          votre appareil uniquement. Nous n&apos;y avons pas accès. Effacer les données du site dans votre
          navigateur supprime tout.
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">Donnée</th>
                <th scope="col" className="px-4 py-2 font-medium">Nom technique</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {LOCAL_STORAGE_ITEMS.map((item) => (
                <tr key={item.key}>
                  <td className="px-4 py-2">{item.content}</td>
                  <td className="px-4 py-2 font-mono text-xs text-slate-500">{item.key}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          AcadMatch ne vous demande ni votre nom, ni votre date de naissance, ni vos coordonnées pour
          construire votre profil.
        </p>
      </Section>

      <Section title="3. Avec un compte (optionnel)">
        <ul>
          <li>
            <strong>Votre adresse e-mail</strong>, pour vous envoyer un lien de connexion. Aucun mot de passe
            n&apos;est créé ni stocké.
          </li>
          <li>
            <strong>Votre profil académique</strong>, seulement si vous cliquez sur « Sauvegarder mon profil sur
            mon compte ». Vos candidatures, budgets et réponses visa restent sur votre appareil.
          </li>
          <li>
            <strong>Un compteur d&apos;usage de l&apos;IA</strong> : pour chaque appel, la date, la fonctionnalité
            utilisée et son coût. Il sert à appliquer la limite quotidienne par personne et à éviter les abus.
            Il ne contient ni vos documents ni les textes générés.
          </li>
          <li>
            <strong>Un cookie de session</strong>, qui vous garde connecté. C&apos;est le seul cookie du site ; il
            est indispensable au fonctionnement du compte et ne sert à aucun suivi.
          </li>
        </ul>
      </Section>

      <Section title="4. Fonctionnalités d'intelligence artificielle">
        <p>
          Ces fonctionnalités exigent un compte et utilisent Claude, le modèle d&apos;Anthropic. Voici exactement
          ce qui lui est transmis :
        </p>
        <ul>
          <li>
            <strong>Import du relevé de notes ou du programme de formation</strong> : le document que vous
            choisissez, après votre accord explicite. Un relevé contient souvent votre nom, votre date de
            naissance ou votre numéro étudiant : vous pouvez les masquer avant l&apos;import, ils ne sont pas
            nécessaires. Le document est lu en mémoire puis oublié : AcadMatch ne l&apos;écrit ni sur disque,
            ni en base, ni dans les journaux. Seule la liste de matières que vous validez rejoint votre profil.
          </li>
          <li>
            <strong>Lettre de motivation et préparation aux entretiens</strong> : votre profil académique (sans
            nom ni coordonnées) et la fiche de la formation visée. Pour la préparation aux entretiens, aussi les
            réponses que vous rédigez. Le texte produit vous est renvoyé et reste sur votre appareil.
          </li>
        </ul>
        <p>
          Anthropic traite ces données pour notre compte, n&apos;utilise pas les données transmises par son API
          pour entraîner ses modèles, et les supprime de ses serveurs sous 30 jours, sauf obligation légale ou
          lutte contre les abus (<ExternalLink href="https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data">politique d&apos;Anthropic</ExternalLink>).
        </p>
        <p>
          Les résultats de l&apos;IA sont des propositions : aucune décision n&apos;est prise automatiquement à
          votre sujet. Le score de compatibilité, lui, n&apos;utilise pas d&apos;IA : c&apos;est un calcul
          explicable, détaillé sur chaque résultat.
        </p>
      </Section>

      <Section title="5. Pourquoi nous avons le droit de traiter ces données">
        <ul>
          <li>
            <strong>Exécution du service que vous demandez</strong> : compte, sauvegarde du profil, fonctionnalités
            d&apos;IA.
          </li>
          <li>
            <strong>Intérêt légitime</strong> : sécurité du site, limites d&apos;usage, prévention des abus.
          </li>
          <li>
            <strong>Votre consentement</strong> : transmission d&apos;un document à l&apos;IA, que vous donnez en
            cochant la case prévue avant chaque import et que vous pouvez refuser en saisissant vos matières
            à la main.
          </li>
        </ul>
      </Section>

      <Section title="6. Prestataires et transferts hors de l'Union européenne">
        <p>Nous ne vendons ni ne partageons vos données. Seuls ces prestataires y accèdent, pour faire fonctionner le service :</p>
        <ul>
          {SUBPROCESSORS.map((processor) => (
            <li key={processor.name}>
              <strong>{processor.name}</strong> — {processor.role} ({processor.location}).{" "}
              <ExternalLink href={processor.privacyUrl}>Sa politique</ExternalLink>
            </li>
          ))}
        </ul>
        <p>
          Vercel et Anthropic sont établis aux États-Unis. Ces transferts sont encadrés par les clauses
          contractuelles types de la Commission européenne prévues dans leurs accords de traitement des données.
        </p>
      </Section>

      <Section title="7. Durée de conservation">
        <ul>
          <li>Documents importés : non conservés par AcadMatch (30 jours au plus chez Anthropic, voir ci-dessus).</li>
          <li>Compte, profil sauvegardé et compteur d&apos;usage : jusqu&apos;à la suppression de votre compte.</li>
          <li>Données locales : jusqu&apos;à ce que vous les effaciez de votre navigateur.</li>
          <li>Journaux techniques de l&apos;hébergeur (adresse IP, page demandée) : durée courte fixée par Vercel, pour la sécurité.</li>
        </ul>
      </Section>

      <Section title="8. Vos droits">
        <p>
          Vous pouvez accéder à vos données, les corriger, les supprimer, en obtenir une copie, vous opposer à un
          traitement ou en demander la limitation. Deux droits sont disponibles directement dans{" "}
          <Link href="/compte" className={linkClass}>Mon compte</Link>, sans rien nous demander :
        </p>
        <ul>
          <li>
            <strong>Exporter mes données (JSON)</strong> : une copie de votre profil sauvegardé.
          </li>
          <li>
            <strong>Supprimer mon compte</strong> : efface immédiatement votre compte, votre profil sauvegardé et
            votre compteur d&apos;usage.
          </li>
        </ul>
        <p>
          Pour toute autre demande, écrivez à <ContactEmail />. Nous répondons sous un mois. Si la réponse ne
          vous satisfait pas, vous pouvez saisir une autorité de protection des données :
        </p>
        <ul>
          {AUTHORITIES.map((authority) => (
            <li key={authority.url}>
              <ExternalLink href={authority.url}>{authority.name}</ExternalLink>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="9. Mineurs">
        <p>
          AcadMatch s&apos;adresse aux lycéens et étudiants. Si vous avez moins de 15 ans, demandez l&apos;accord
          d&apos;un parent avant de créer un compte ou d&apos;importer un document.
        </p>
      </Section>

      <Section title="10. Sécurité">
        <p>
          Connexions chiffrées (HTTPS), accès à la base limité à votre propre ligne par des règles appliquées
          côté serveur, clés secrètes jamais exposées au navigateur, et en-têtes de sécurité empêchant le site
          de communiquer avec d&apos;autres serveurs que les nôtres. Aucun système n&apos;est infaillible : en
          cas de violation de données, nous informerons les personnes concernées et l&apos;autorité compétente.
        </p>
      </Section>

      <Section title="11. Modifications">
        <p>
          Cette politique suit le fonctionnement réel du site : elle est mise à jour dès qu&apos;une
          fonctionnalité change la manière dont vos données sont utilisées. La date en haut de page indique la
          dernière version.
        </p>
      </Section>
    </LegalPage>
  );
}
