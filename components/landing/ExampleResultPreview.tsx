import { Card } from "@/components/ui/Card";
import { ScoreCircle } from "@/components/result/ScoreCircle";
import { CriteriaBar } from "@/components/result/CriteriaBar";
import { TryExampleButton } from "@/components/landing/TryExampleButton";
import { CheckCircle2, AlertCircle } from "lucide-react";

/** Exemple illustratif statique — reproduit la mise en page réelle de la page Résultat. */
export function ExampleResultPreview() {
  return (
    <section id="exemple" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Un résultat clair et explicable
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-500">
          Exemple illustratif du type d&apos;analyse que vous obtiendrez — puis testez avec un
          vrai parcours exemple en un clic.
        </p>
      </div>

      <Card className="mx-auto max-w-4xl">
        <div className="grid gap-8 sm:grid-cols-[auto_minmax(0,1fr)]">
          <div className="flex flex-col items-center justify-center sm:border-r sm:border-slate-100 sm:pr-8">
            <ScoreCircle score={82} size={140} />
            <p className="mt-1 text-xs text-slate-400">Compatibilité académique</p>
          </div>

          <div className="space-y-3">
            <CriteriaBar label="Prérequis" score={90} />
            <CriteriaBar label="Contenu académique" score={84} />
            <CriteriaBar label="Compétences" score={78} />
            <CriteriaBar label="Niveau / diplôme" score={100} />
          </div>
        </div>

        <div className="mt-8 grid gap-6 border-t border-slate-100 pt-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="size-4" aria-hidden />
              Points forts
            </h3>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li>Statistiques</li>
              <li>Python</li>
              <li>Bases de données</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-700">
              <AlertCircle className="size-4" aria-hidden />
              Lacunes
            </h3>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li>Machine Learning avancé</li>
              <li>Optimisation</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex justify-center border-t border-slate-100 pt-6">
          <TryExampleButton label="Tester avec un profil exemple" />
        </div>
      </Card>
    </section>
  );
}
