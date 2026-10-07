"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Graphiques de l'espace admin (2026-10-07), en SVG fait main : aucune
 * bibliothèque à charger, et un rendu qui suit les règles de lisibilité
 * (traits de 2 px, barres fines arrondies côté valeur, grille discrète,
 * survol avec info-bulle, légende toujours présente dès deux séries).
 */

/** Couleurs des séries, dans un ordre fixe validé pour le daltonisme. */
export const SERIES = ["#2a78d6", "#eb6834", "#1baf7a"] as const;
/** Rampe ordinale bleue (étapes de l'entonnoir), du plus foncé au plus clair. */
export const ORDINAL = ["#184f95", "#256abf", "#3987e5", "#6da7ec"] as const;
export const STATUS = { good: "#0ca30c", warning: "#fab219", critical: "#d03b3b" } as const;
const GRID = "#e1e0d9";
const AXIS = "#c3c2b7";
const MUTED = "#898781";

const nf = new Intl.NumberFormat("fr-FR");
export const formatInt = (v: number) => nf.format(Math.round(v));
export const formatUsd = (v: number) => `${v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: v < 1 ? 4 : 2 })} $`;
export const shortDay = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

/** Largeur réelle du conteneur : le SVG est dessiné à sa taille, sans texte déformé. */
function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

/** Vrai juste après le premier affichage : les barres partent de zéro puis glissent jusqu'à leur valeur. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return mounted;
}

/** Nombre qui défile jusqu'à sa nouvelle valeur (et depuis zéro à l'ouverture). */
export function AnimatedNumber({ value, format = formatInt, duration = 900 }: { value: number; format?: (v: number) => string; duration?: number }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (t: number) => {
      const p = reduce ? 1 : Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = origin + (value - origin) * eased;
      setShown(current);
      from.current = current;
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return <>{format(shown)}</>;
}

/** Plafond « rond » de l'axe, divisible en 4 graduations rondes : 7 → 8, 43 → 60, 0 → 4. */
export function niceMax(max: number, ticks = 4): number {
  if (max <= 0) return ticks;
  const raw = max / ticks;
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 5, 10].map((s) => s * power).find((s) => s >= raw)!;
  return Math.round(step * ticks * 1e6) / 1e6;
}

/** Petite courbe de tendance pour les tuiles, sans axe ni survol (le chiffre est à côté). */
export function Sparkline({ values, color = SERIES[0], height = 36 }: { values: number[]; color?: string; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const max = Math.max(...values, 0);
  const points = values.map((v, i) => [values.length < 2 ? width / 2 : (i / (values.length - 1)) * (width - 6) + 3, height - 4 - (max ? (v / max) * (height - 10) : 0)]);
  const d = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
  const last = points.at(-1);
  return (
    <div ref={ref} className="h-9 w-full" aria-hidden>
      {width > 0 && values.length > 0 && (
        <svg width={width} height={height}>
          <path d={`${d}L${points.at(-1)![0]},${height}L${points[0][0]},${height}Z`} fill={color} fillOpacity={0.1} className="admin-fade" />
          <path key={values.join(",")} d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" pathLength={1} className="admin-draw" />
          {last && <circle cx={last[0]} cy={last[1]} r={3.5} fill={color} stroke="#fff" strokeWidth={2} />}
        </svg>
      )}
    </div>
  );
}

interface Series { label: string; color: string; values: number[] }

/**
 * Courbes par jour (une ou plusieurs séries, même unité, un seul axe).
 * Survol : ligne verticale + info-bulle avec la valeur de chaque série.
 */
export function LineChart({ days, series, height = 240, format = formatInt }: { days: string[]; series: Series[]; height?: number; format?: (v: number) => string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { top: 12, right: 12, bottom: 26, left: 40 };
  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
  const x = (i: number) => pad.left + (days.length < 2 ? innerW / 2 : (i / (days.length - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const labelEvery = Math.max(1, Math.ceil(days.length / Math.max(2, Math.floor(innerW / 64))));
  const path = (values: number[]) => values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");

  function onMove(event: React.PointerEvent<SVGRectElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / box.width;
    setHover(Math.max(0, Math.min(days.length - 1, Math.round(ratio * (days.length - 1)))));
  }

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={`Évolution par jour : ${series.map((s) => s.label).join(", ")}`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? AXIS : GRID} strokeWidth={1} />
              <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={MUTED} style={{ fontVariantNumeric: "tabular-nums" }}>
                {format(t)}
              </text>
            </g>
          ))}
          {days.map((d, i) =>
            i % labelEvery === 0 || i === days.length - 1 ? (
              <text key={d} x={x(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === days.length - 1 ? "end" : "middle"} fontSize={11} fill={MUTED}>
                {shortDay(d)}
              </text>
            ) : null,
          )}
          {series[0] && <path key={`area-${days[0]}-${days.length}`} d={`${path(series[0].values)}L${x(days.length - 1)},${y(0)}L${x(0)},${y(0)}Z`} fill={series[0].color} fillOpacity={0.1} className="admin-fade" />}
          {series.map((s) => (
            <path key={`${s.label}-${days[0]}-${days.length}`} d={path(s.values)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" pathLength={1} className="admin-draw" />
          ))}
          {hover !== null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + innerH} stroke={AXIS} strokeWidth={1} />
              {series.map((s) => (
                <circle key={s.label} cx={x(hover)} cy={y(s.values[hover] ?? 0)} r={4.5} fill={s.color} stroke="#fff" strokeWidth={2} />
              ))}
            </g>
          )}
          <rect x={pad.left} y={pad.top} width={innerW} height={innerH} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
        </svg>
      )}
      {hover !== null && width > 0 && (
        <Tooltip x={x(hover)} width={width}>
          <p className="font-semibold text-slate-900">{shortDay(days[hover])}</p>
          {series.map((s) => (
            <p key={s.label} className="flex items-center gap-2 text-slate-700">
              <span className="size-2 rounded-full" style={{ background: s.color }} />
              {s.label} : <strong className="text-slate-900">{format(s.values[hover] ?? 0)}</strong>
            </p>
          ))}
        </Tooltip>
      )}
    </div>
  );
}

/** Barres par jour, avec une ligne de repère facultative (le budget quotidien de l'IA). */
export function DailyBars({ days, values, color = SERIES[0], height = 200, format = formatInt, reference }: { days: string[]; values: number[]; color?: string; height?: number; format?: (v: number) => string; reference?: { value: number; label: string } }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { top: 16, right: 12, bottom: 26, left: 48 };
  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;
  const top = Math.max(0, ...values);
  // Un repère bien plus haut que les barres les écraserait : il est alors indiqué en texte.
  const showReference = !!reference && (top === 0 || reference.value <= top * 4);
  const max = niceMax(Math.max(top, showReference ? reference!.value : 0));
  const band = days.length ? innerW / days.length : 0;
  const barW = Math.max(2, Math.min(24, band - 2));
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;
  const labelEvery = Math.max(1, Math.ceil(days.length / Math.max(2, Math.floor(innerW / 64))));
  const bar = (i: number, v: number) => {
    const x0 = pad.left + i * band + (band - barW) / 2;
    const top = y(v);
    const h = pad.top + innerH - top;
    const r = Math.min(4, barW / 2, h);
    return `M${x0},${pad.top + innerH}V${top + r}Q${x0},${top} ${x0 + r},${top}H${x0 + barW - r}Q${x0 + barW},${top} ${x0 + barW},${top + r}V${pad.top + innerH}Z`;
  };

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="Valeur par jour">
          {[0, 0.5, 1].map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={width - pad.right} y1={y(t * max)} y2={y(t * max)} stroke={t === 0 ? AXIS : GRID} strokeWidth={1} />
              <text x={pad.left - 8} y={y(t * max) + 4} textAnchor="end" fontSize={11} fill={MUTED}>
                {format(t * max)}
              </text>
            </g>
          ))}
          {values.map((v, i) =>
            v > 0 ? (
              <path key={`${days[i]}-${days.length}`} d={bar(i, v)} fill={color} opacity={hover === null || hover === i ? 1 : 0.45} className="admin-grow-y" style={{ animationDelay: `${Math.min(i * 12, 400)}ms` }} />
            ) : null,
          )}
          {reference && showReference && (
            <g>
              <line x1={pad.left} x2={width - pad.right} y1={y(reference.value)} y2={y(reference.value)} stroke={STATUS.critical} strokeWidth={1} />
              <text x={width - pad.right} y={y(reference.value) - 5} textAnchor="end" fontSize={11} fill="#52514e">
                {reference.label}
              </text>
            </g>
          )}
          {days.map((d, i) =>
            i % labelEvery === 0 || i === days.length - 1 ? (
              <text key={d} x={pad.left + i * band + band / 2} y={height - 6} textAnchor={i === 0 ? "start" : i === days.length - 1 ? "end" : "middle"} fontSize={11} fill={MUTED}>
                {shortDay(d)}
              </text>
            ) : null,
          )}
          {days.map((d, i) => (
            <rect key={`hit-${d}`} x={pad.left + i * band} y={pad.top} width={band} height={innerH} fill="transparent" onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} />
          ))}
        </svg>
      )}
      {reference && !showReference && width > 0 && (
        <p className="absolute right-3 top-0 text-xs text-slate-600">{reference.label} : bien au-dessus des dépenses</p>
      )}
      {hover !== null && width > 0 && (
        <Tooltip x={pad.left + hover * band + band / 2} width={width}>
          <p className="font-semibold text-slate-900">{shortDay(days[hover])}</p>
          <p className="text-slate-700">
            <strong className="text-slate-900">{format(values[hover] ?? 0)}</strong>
          </p>
        </Tooltip>
      )}
    </div>
  );
}

function Tooltip({ x, width, children }: { x: number; width: number; children: ReactNode }) {
  const left = Math.max(8, Math.min(width - 188, x + 12));
  return (
    <div className="pointer-events-none absolute top-2 z-10 w-44 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur" style={{ left }}>
      {children}
    </div>
  );
}

/** Barre horizontale qui glisse jusqu'à sa valeur (0-100 %). */
export function GrowBar({ percent, color, height = 10, label }: { percent: number; color: string; height?: number; label?: string }) {
  const mounted = useMounted();
  return (
    <div className="w-full overflow-hidden rounded-full bg-slate-100" style={{ height }} role={label ? "img" : undefined} aria-label={label}>
      <div className="h-full rounded-full" style={{ width: mounted ? `${Math.max(0, Math.min(100, percent))}%` : "0%", background: color, transition: "width 900ms cubic-bezier(0.2, 0.8, 0.2, 1)" }} />
    </div>
  );
}

/** Répartition en segments (100 %), séparés par un fin espace, avec légende chiffrée. */
export function StackedBar({ parts, height = 14 }: { parts: { label: string; value: number; color: string }[]; height?: number }) {
  const mounted = useMounted();
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <div className="space-y-2">
      <div className="flex w-full gap-[2px] overflow-hidden rounded-full bg-slate-100" style={{ height }} role="img" aria-label={parts.map((p) => `${p.label} : ${p.value}`).join(", ")}>
        {total > 0 &&
          parts
            .filter((p) => p.value > 0)
            .map((p) => (
              <div key={p.label} className="h-full" style={{ width: mounted ? `${(p.value / total) * 100}%` : "0%", background: p.color, transition: "width 900ms cubic-bezier(0.2, 0.8, 0.2, 1)" }} />
            ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-700">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: p.color }} aria-hidden />
            {p.label} <strong className="text-slate-900">{formatInt(p.value)}</strong>
            {total > 0 && <span className="text-slate-500">({Math.round((p.value / total) * 100)} %)</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
