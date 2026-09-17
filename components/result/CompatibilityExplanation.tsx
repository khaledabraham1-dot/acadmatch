import type { DecisionAid } from "@/lib/matching/explanation";
import { Card } from "@/components/ui/Card";

interface CompatibilityExplanationProps {
  aid: DecisionAid;
}

/** Verdict en langage simple : pourquoi ce score, sans jargon moteur. */
export function CompatibilityExplanation({ aid }: CompatibilityExplanationProps) {
  return (
    <Card>
      <h2 className="mb-2 text-base font-semibold text-slate-900">Comprendre ce score</h2>
      <p className="mb-3 text-sm font-medium text-slate-800">{aid.headline}</p>
      <ul className="space-y-2 text-sm leading-relaxed text-slate-600">
        {aid.paragraphs.map((paragraph) => (
          <li key={paragraph} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-300" aria-hidden />
            <span>{paragraph}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
