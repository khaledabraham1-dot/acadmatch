import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail, EditorName, ExternalLink, LegalPage, Section } from "@/components/legal/LegalPage";
import { AUTHORITIES, LOCAL_STORAGE_ITEMS, SUBPROCESSORS } from "@/data/legal";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  alternates: { canonical: "/confidentialite" },
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

      <Section title="2. Sans compte : votre projet reste sur votre appareil">
        <p>
          Ce que vous saisissez est enregistré dans le stockage local de votre navigateur (localStorage), sur
          votre appareil uniquement. Nous n&apos;y avons pas accès. Effacer les données du site dans votre
          navigateur supprime tout.
        </p>
        {/* tabIndex : une zone qui défile doit être atteignable au clavier (WCAG, axe scrollable-region-focusable). */}
        <div className="overflow-x-auto rounded-xl border border-slate-200" tabIndex={0} role="region" aria-label="Données gardées dans votre navigateur">
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

      <Section title="3. Mesure d'audience, sans cookie">
        <p>
          Pour savoir quelles pages sont utiles et où les étudiants décrochent, nous comptons les visites avec
          Vercel Web Analytics. Aucun cookie n&apos;est déposé et aucun identifiant ne vous suit d&apos;un jour à
          l&apos;autre : chaque visite est rattachée à une empreinte calculée à partir de la requête, remise à
          zéro chaque jour. Nous ne voyons que des chiffres agrégés (pages vues, pays, type d&apos;appareil,
          site d&apos;origine), jamais qui vous êtes ni le contenu de votre profil.
        </p>
      </Section>

      <Section title="4. Vos avis et vos demandes de formation">
        <p>
          Si vous répondez à la question « Votre avis » sous un résultat, votre réponse est envoyée de façon{" "}
          <strong>anonyme</strong> : ni nom, ni e-mail, ni compte. Elle est accompagnée seulement de la formation,
          du score affiché, du domaine et du niveau de votre profil, et de l&apos;indication que le score était une
          estimation ou s&apos;appuyait sur votre relevé. Elle sert uniquement à rendre les scores plus justes.
          N&apos;écrivez pas d&apos;information personnelle dans le commentaire : un avis anonyme ne peut pas être
          retrouvé ensuite pour être modifié ou supprimé.
        </p>
        <p>
          De même, si vous signalez une <strong>formation manquante</strong>, votre demande (la formation, et si vous
          les indiquez l&apos;établissement et le pays) est envoyée de façon anonyme, accompagnée seulement de votre
          recherche en cours et du domaine, du niveau et du diplôme visé de votre profil. Elle sert uniquement à
          choisir les prochaines formations ajoutées au catalogue.
        </p>
      </Section>

      <Section title="5. Avec un compte (optionnel)">
        <ul>
          <li>
            <strong>Votre adresse e-mail</strong>, pour vous envoyer un lien de connexion. Aucun mot de passe
            n&apos;est créé ni stocké.
          </li>
          <li>
            <strong>Votre projet</strong> : profil académique, candidatures (avec vos brouillons de lettre et vos
            préparations d&apos;entretien), budgets, réponses au parcours visa et formations sauvegardées. Il est
            synchronisé automatiquement pour que vous le retrouviez sur tous vos appareils. À la déconnexion, vous
            pouvez l&apos;effacer de l&apos;appareil (recommandé sur un ordinateur partagé).
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

      <Section title="6. Fonctionnalités d'intelligence artificielle">
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
            ni en base, ni dans les journaux. Seules la liste de matières que vous validez et la moyenne lue sur le relevé (utilisée pour évaluer vos résultats) rejoignent votre profil.
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

      <Section title="7. Pourquoi nous avons le droit de traiter ces données">
        <ul>
          <li>
            <strong>Exécution du service que vous demandez</strong> : compte, sauvegarde du profil, fonctionnalités
            d&apos;IA.
          </li>
          <li>
            <strong>Intérêt légitime</strong> : sécurité du site, limites d&apos;usage, prévention des abus, mesure
            d&apos;audience anonyme, amélioration des scores et du catalogue grâce aux avis et demandes anonymes.
          </li>
          <li>
            <strong>Votre consentement</strong> : transmission d&apos;un document à l&apos;IA, que vous donnez en
            cochant la case prévue avant chaque import et que vous pouvez refuser en saisissant vos matières
            à la main.
          </li>
        </ul>
      </Section>

      <Section title="8. Prestataires et transferts hors de l'Union européenne">
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

      <Section title="9. Durée de conservation">
        <ul>
          <li>Documents importés : non conservés par AcadMatch (30 jours au plus chez Anthropic, voir ci-dessus).</li>
          <li>Compte, projet synchronisé et compteur d&apos;usage : jusqu&apos;à la suppression de votre compte.</li>
          <li>Avis et demandes de formation anonymes : conservés tant qu&apos;ils servent à améliorer les scores et le catalogue ; ils ne sont rattachés à personne.</li>
          <li>Données locales : jusqu&apos;à ce que vous les effaciez de votre navigateur.</li>
          <li>Journaux techniques de l&apos;hébergeur (adresse IP, page demandée) : durée courte fixée par Vercel, pour la sécurité.</li>
        </ul>
      </Section>

      <Section title="10. Vos droits">
        <p>
          Vous pouvez accéder à vos données, les corriger, les supprimer, en obtenir une copie, vous opposer à un
          traitement ou en demander la limitation. Deux droits sont disponibles directement dans{" "}
          <Link href="/compte" className={linkClass}>Mon compte</Link>, sans rien nous demander :
        </p>
        <ul>
          <li>
            <strong>Exporter toutes mes données (JSON)</strong> : une copie de tout votre projet.
          </li>
          <li>
            <strong>Supprimer mon compte</strong> : efface immédiatement votre compte, votre projet synchronisé et
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

      <Section title="11. Mineurs">
        <p>
          AcadMatch s&apos;adresse aux lycéens et étudiants. Si vous avez moins de 15 ans, demandez l&apos;accord
          d&apos;un parent avant de créer un compte ou d&apos;importer un document.
        </p>
      </Section>

      <Section title="12. Sécurité">
        <p>
          Connexions chiffrées (HTTPS), accès à la base limité à votre propre ligne par des règles appliquées
          côté serveur, clés secrètes jamais exposées au navigateur, et en-têtes de sécurité empêchant le site
          de communiquer avec d&apos;autres serveurs que les nôtres. Aucun système n&apos;est infaillible : en
          cas de violation de données, nous informerons les personnes concernées et l&apos;autorité compétente.
        </p>
      </Section>

      <Section title="13. Modifications">
        <p>
          Cette politique suit le fonctionnement réel du site : elle est mise à jour dès qu&apos;une
          fonctionnalité change la manière dont vos données sont utilisées. La date en haut de page indique la
          dernière version.
        </p>
      </Section>
    </LegalPage>
  );
}
