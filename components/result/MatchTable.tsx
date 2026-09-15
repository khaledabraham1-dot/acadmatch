import type { SubjectMatch } from "@/types";
import { Badge } from "@/components/ui/Badge";

const STRENGTH_CONFIG: Record<SubjectMatch["strength"], { label: string; tone: "success" | "warning" | "danger" }> = {
  forte: { label: "Forte correspondance", tone: "success" },
  partielle: { label: "Correspondance partielle", tone: "warning" },
  manquant: { label: "Manquant", tone: "danger" },
};

/** Tableau "Correspondance des matières" : matière étudiant vs exigence de la formation. */
export function MatchTable({ matches }: { matches: SubjectMatch[] }) {
  if (matches.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        Aucune matière ou compétence à comparer. Complétez votre profil pour obtenir une analyse détaillée.
      </p>
    );
  }

  return (
    <>
      {/* Cartes empilées sur mobile : un tableau à 3 colonnes déborderait sur un petit écran. */}
      <div className="space-y-3 sm:hidden">
        {matches.map((match, index) => {
          const config = STRENGTH_CONFIG[match.strength];
          return (
            <div
              key={`${match.formationRequirement}-${index}`}
              className="rounded-xl border border-slate-100 p-3.5"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <p className="font-medium text-slate-900">{match.formationRequirement}</p>
                <Badge tone={config.tone} className="shrink-0">
                  {config.label}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">
                {match.strength === "manquant" ? (
                  <span className="text-slate-400">Aucune correspondance dans votre profil</span>
                ) : (
                  <>Votre profil : {match.studentItem}</>
                )}
              </p>
            </div>
          );
        })}
      </div>

      {/*
        overflow-x-auto : un intitulé de matière/formation long peut pousser
        le tableau au-delà de sa colonne (constaté autour de 768-900px) — il
        scrolle alors horizontalement dans son propre cadre plutôt que de
        faire déborder toute la page.
      */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
              <th className="py-2.5 pr-4 font-medium">Votre matière / compétence</th>
              <th className="py-2.5 pr-4 font-medium">Exigence de la formation</th>
              <th className="py-2.5 font-medium">Correspondance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {matches.map((match, index) => {
              const config = STRENGTH_CONFIG[match.strength];
              return (
                <tr key={`${match.formationRequirement}-${index}`}>
                  <td className="py-3 pr-4 text-slate-700">
                    {match.strength === "manquant" ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      match.studentItem
                    )}
                  </td>
                  <td className="py-3 pr-4 font-medium text-slate-900">{match.formationRequirement}</td>
                  <td className="py-3">
                    <Badge tone={config.tone}>{config.label}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
