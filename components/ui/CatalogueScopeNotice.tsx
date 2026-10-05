import { FORMATIONS } from "@/data/formations";
import { coveredDomains, formatList, isGoalCoveredByCatalogue } from "@/lib/search/filters";
import type { StudyGoal } from "@/types";

/**
 * Bandeau de transparence sur le périmètre du catalogue (Étape 8).
 * Mieux vaut un catalogue étroit assumé qu'un faux air d'annuaire national.
 *
 * `goal` (Étape 10) : quand renseigné et qu'aucune formation du catalogue ne
 * vise cet objectif (ex: "Doctorat", absent du catalogue actuel bien que
 * proposé dans le formulaire de profil), un score de compatibilité élevé sur
 * une formation d'un tout autre type peut sembler pertinent alors qu'il ne
 * l'est pas — voir `isGoalCoveredByCatalogue`. On le signale explicitement
 * plutôt que de laisser le score seul parler.
 */
export function CatalogueScopeNotice({
  className,
  goal,
}: {
  className?: string;
  goal?: StudyGoal | null;
}) {
  const goalCovered = isGoalCoveredByCatalogue(FORMATIONS, goal);
  const domains = formatList(coveredDomains(FORMATIONS));

  return (
    <aside
      role="note"
      className={
        className ??
        "rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-relaxed text-slate-600"
      }
    >
      <p>
        <strong className="font-semibold text-slate-800">{FORMATIONS.length} formations vérifiées</strong> sur leurs pages
        officielles, surtout en France, quelques-unes en Belgique : {domains}. Le catalogue s&apos;agrandit d&apos;après
        les formations que vous signalez.
      </p>
      {!goalCovered && goal && (
        <p className="mt-2 font-medium text-amber-700">
          Aucune formation visant un objectif « {goal} » n&apos;est encore au catalogue : les
          résultats ci-dessous concernent d&apos;autres objectifs et ne doivent pas être lus comme
          une recommandation pour le vôtre.
        </p>
      )}
    </aside>
  );
}
