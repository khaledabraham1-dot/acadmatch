import type { DecisionAction } from "@/lib/matching/explanation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ListChecks } from "lucide-react";

interface ActionPlanProps {
  actions: DecisionAction[];
}

const IMPORTANCE_TONE = {
  essentielle: "danger",
  importante: "warning",
  utile: "neutral",
} as const;

/** Plan d'actions priorisées : ce que l'étudiant devrait renforcer avant de candidater. */
export function ActionPlan({ actions }: ActionPlanProps) {
  return (
    <Card>
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-900">
        <ListChecks className="size-4 text-slate-500" />
        Avant de candidater
      </h2>
      <p className="mb-5 text-sm text-slate-500">
        Points à renforcer en priorité, classés selon l&apos;importance pour cette formation.
      </p>

      {actions.length === 0 ? (
        <p className="text-sm text-slate-500">
          Aucune lacune majeure détectée sur les éléments comparés. Vérifiez tout de même la page
          officielle de la formation.
        </p>
      ) : (
        <ol className="space-y-4">
          {actions.map((action, index) => (
            <li key={action.label} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                {index + 1}
              </span>
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900">{action.label}</p>
                  <Badge tone={IMPORTANCE_TONE[action.importance]}>{action.importance}</Badge>
                  <Badge tone="neutral">
                    {action.status === "manquant" ? "absent du profil" : "partiellement couvert"}
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">{action.advice}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
