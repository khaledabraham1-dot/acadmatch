import { getCompatibilityLabel } from "@/lib/matching/labels";
import { cn } from "@/lib/utils";

const TONE_STROKE: Record<string, string> = {
  success: "#059669",
  info: "#2563eb",
  warning: "#d97706",
  danger: "#e11d48",
};

interface ScoreCircleProps {
  score: number;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

/** Cercle de progression SVG affichant le score global sur 100 (léger, sans librairie de graphes). */
export function ScoreCircle({ score, size = 168, showLabel = true, className }: ScoreCircleProps) {
  const { label, tone } = getCompatibilityLabel(score);
  const stroke = TONE_STROKE[tone];
  const strokeWidth = size * 0.09;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold tracking-tight text-slate-900">{score}%</span>
        </div>
      </div>
      {showLabel && (
        <p className="mt-3 text-sm font-medium" style={{ color: stroke }}>
          {label}
        </p>
      )}
    </div>
  );
}
