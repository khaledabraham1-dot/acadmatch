import type { CompatibilityBreakdown } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Radar à quatre axes du score (identité « Radar ») : prérequis en haut,
 * contenu à droite, compétences en bas, niveau à gauche. Une seule échelle
 * (rayon = 100) pour les anneaux, le polygone et les points ; SVG pur, sans
 * librairie. `compact` retire les libellés (aperçu dans une carte).
 */
const CENTER = 100;
const RADIUS = 70;

const AXES: { key: keyof CompatibilityBreakdown; label: string }[] = [
  { key: "prerequisites", label: "Prérequis" },
  { key: "academicContent", label: "Contenu" },
  { key: "skills", label: "Compétences" },
  { key: "levelDegree", label: "Niveau" },
];

/** Point de l'axe `index` (0 = haut, sens horaire) à `ratio` du rayon. */
function point(index: number, ratio: number): [number, number] {
  const r = RADIUS * ratio;
  return [
    [CENTER, CENTER - r],
    [CENTER + r, CENTER],
    [CENTER, CENTER + r],
    [CENTER - r, CENTER],
  ][index] as [number, number];
}

const polygon = (ratios: number[]) => ratios.map((ratio, i) => point(i, ratio).join(",")).join(" ");

export function RadarChart({
  breakdown,
  compact = false,
  className,
}: {
  breakdown: CompatibilityBreakdown;
  compact?: boolean;
  className?: string;
}) {
  const values = AXES.map((axis) => Math.max(0, Math.min(100, breakdown[axis.key])));
  const description = AXES.map((axis, i) => `${axis.label} ${values[i]} sur 100`).join(", ");

  return (
    <svg
      viewBox={compact ? "20 20 160 160" : "-46 0 292 200"}
      role="img"
      aria-label={`Détail du score : ${description}`}
      className={cn("block h-auto w-full", className)}
    >
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <polygon key={ring} points={polygon([ring, ring, ring, ring])} fill="none" className="stroke-slate-200" strokeWidth={1} />
      ))}
      <line x1={CENTER} y1={CENTER - RADIUS} x2={CENTER} y2={CENTER + RADIUS} className="stroke-slate-200" strokeWidth={1} />
      <line x1={CENTER - RADIUS} y1={CENTER} x2={CENTER + RADIUS} y2={CENTER} className="stroke-slate-200" strokeWidth={1} />
      <polygon
        points={polygon(values.map((v) => v / 100))}
        className="fill-blue-600/20 stroke-blue-600"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {values.map((v, i) => {
        const [x, y] = point(i, v / 100);
        return <circle key={AXES[i].key} cx={x} cy={y} r={compact ? 4 : 3.5} className="fill-blue-600" />;
      })}
      {!compact && (
        <g className="fill-slate-500 text-[10px] font-semibold">
          <text x={CENTER} y={18} textAnchor="middle">
            {AXES[0].label} <tspan className="fill-slate-900 font-extrabold">{values[0]}</tspan>
          </text>
          <text x={CENTER + RADIUS + 10} y={CENTER + 4} textAnchor="start">
            {AXES[1].label} <tspan className="fill-slate-900 font-extrabold">{values[1]}</tspan>
          </text>
          <text x={CENTER} y={2 * CENTER - 6} textAnchor="middle">
            {AXES[2].label} <tspan className="fill-slate-900 font-extrabold">{values[2]}</tspan>
          </text>
          <text x={CENTER - RADIUS - 10} y={CENTER + 4} textAnchor="end">
            {AXES[3].label} <tspan className="fill-slate-900 font-extrabold">{values[3]}</tspan>
          </text>
        </g>
      )}
    </svg>
  );
}
