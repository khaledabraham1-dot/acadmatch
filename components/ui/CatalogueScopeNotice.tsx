import { FORMATIONS } from "@/data/formations";
import { isGoalCoveredByCatalogue } from "@/lib/search/filters";
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

  return (
    <aside
      role="note"
      className={
        className ??
        "rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-relaxed text-slate-600"
      }
    >
      <p className="font-medium text-slate-800">Périmètre actuel du catalogue</p>
      <p className="mt-1">
        AcadMatch couvre pour l&apos;instant un premier socle de formations, très majoritairement en
        France (et un premier établissement belge, à titre expérimental), en{" "}
        <strong className="font-semibold text-slate-800">Data Science, IA et Informatique</strong>,
        vérifiées auprès de sources officielles. Ce n&apos;est pas (encore) l&apos;ensemble des
        formations disponibles — l&apos;objectif est la fiabilité du matching, pas le volume.
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
