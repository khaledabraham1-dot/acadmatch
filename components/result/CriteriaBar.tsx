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
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-slate-600">
          {icon}
          {label}
        </span>
        <span className="font-semibold text-slate-900">{score}%</span>
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
