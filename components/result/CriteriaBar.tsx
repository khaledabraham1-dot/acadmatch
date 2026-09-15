const TONE_BAR: Record<string, string> = {
  success: "bg-emerald-500",
  info: "bg-blue-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
};

function toneForScore(score: number): string {
  if (score >= 85) return "success";
  if (score >= 65) return "info";
  if (score >= 45) return "warning";
  return "danger";
}

interface CriteriaBarProps {
  label: string;
  score: number;
  icon?: React.ReactNode;
}

/** Une ligne de la décomposition du score : libellé, barre de progression, valeur. */
export function CriteriaBar({ label, score, icon }: CriteriaBarProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
        {/*
          min-w-0 + truncate : sans ça, un span flex garde par défaut la
          largeur intrinsèque (non wrappée) de son texte — le libellé le plus
          long ("Contenu académique") forçait toute la ligne (et la grille
          parente) à déborder horizontalement autour de 768-900px.
        */}
        <span className="flex min-w-0 items-center gap-2 text-slate-600">
          {icon}
          <span className="truncate" title={label}>
            {label}
          </span>
        </span>
        <span className="shrink-0 font-semibold text-slate-900">{score}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${TONE_BAR[toneForScore(score)]} transition-[width] duration-700 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
