import Link from "next/link";
import { ArrowRight, ExternalLink, ListChecks } from "lucide-react";
import type { NextStep } from "@/lib/matching/nextSteps";
import { Card } from "@/components/ui/Card";

/** « Vos prochaines actions » : trois choses concrètes à faire, la plus utile d'abord. */
export function NextSteps({ steps }: { steps: NextStep[] }) {
  return (
    <Card>
      <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
        <ListChecks className="size-4 text-slate-500" aria-hidden />
        Vos prochaines actions
      </h2>
      <ol className="space-y-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">{step.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{step.detail}</p>
              {step.href &&
                (step.external ? (
                  <a
                    href={step.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:text-blue-800"
                  >
                    Ouvrir la page officielle
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                ) : (
                  <Link
                    href={step.href}
                    className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:text-blue-800"
                  >
                    Y aller
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                ))}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
