/**
 * Bandeau de transparence sur le périmètre du catalogue (Étape 8).
 * Mieux vaut un catalogue étroit assumé qu'un faux air d'annuaire national.
 */
export function CatalogueScopeNotice({ className }: { className?: string }) {
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
        AcadMatch couvre pour l&apos;instant un premier socle de formations françaises{" "}
        <strong className="font-semibold text-slate-800">Data Science, IA et Informatique</strong>,
        vérifiées auprès de sources officielles. Ce n&apos;est pas (encore) l&apos;ensemble des
        formations Campus France — l&apos;objectif est la fiabilité du matching, pas le volume.
      </p>
    </aside>
  );
}
