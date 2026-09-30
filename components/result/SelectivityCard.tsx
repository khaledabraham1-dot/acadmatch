import { Gauge } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { selectivityOf, summarizeSelectivity, TIER_LABEL, type SelectivityTier } from "@/lib/selectivity";

const TIER_TONE: Record<SelectivityTier, "danger" | "warning" | "success"> = {
  "très sélective": "danger",
  sélective: "warning",
  accessible: "success",
};

export function SelectivityBadge({ formationId }: { formationId: string }) {
  const summary = summarizeSelectivity(selectivityOf(formationId));
  if (!summary?.tier) return null;
  return <Badge tone={TIER_TONE[summary.tier]}>{TIER_LABEL[summary.tier]}</Badge>;
}

/**
 * Sélectivité officielle de la formation (lib/selectivity.ts) : chiffres
 * publiés, année, source et limites. N'affiche jamais de chiffre estimé.
 */
export function SelectivityCard({ formationId }: { formationId: string }) {
  const summary = summarizeSelectivity(selectivityOf(formationId));
  if (!summary) return null;

  return (
    <Card>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <Gauge className="size-4 text-slate-500" aria-hidden />
          Sélectivité
        </h2>
        {summary.tier && <SelectivityBadge formationId={formationId} />}
      </div>
      <p className="text-sm font-semibold text-slate-800">{summary.headline}</p>
      <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
        {summary.details.map((detail) => (
          <li key={detail}>{detail}</li>
        ))}
      </ul>
      {summary.sourceUrl && (
        <a
          href={summary.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-xs font-bold text-blue-700 hover:text-blue-800"
        >
          Source : {summary.sourceLabel} ↗
        </a>
      )}
    </Card>
  );
}
