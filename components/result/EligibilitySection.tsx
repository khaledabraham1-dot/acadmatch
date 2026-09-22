import { Landmark } from "lucide-react";
import type { StudyProgram } from "@/types";
import { ELIGIBILITY_GUIDES_BY_COUNTRY } from "@/data/eligibility";
import { Card } from "@/components/ui/Card";

interface EligibilitySectionProps {
  formation: StudyProgram;
}

/**
 * Éligibilité administrative (Phase 11) — distincte du score de
 * compatibilité académique juste au-dessus sur la page et de la procédure
 * de candidature juste en dessous (OfficialSourceCard). N'affiche rien pour
 * un pays non encore couvert par `data/eligibility.ts`, plutôt que
 * d'inventer un contenu générique.
 */
export function EligibilitySection({ formation }: EligibilitySectionProps) {
  const guide = ELIGIBILITY_GUIDES_BY_COUNTRY[formation.institution.country];
  if (!guide) return null;

  return (
    <Card>
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-900">
        <Landmark className="size-4 text-slate-500" />
        Éligibilité administrative — {guide.country}
      </h2>
      <p className="mb-4 text-sm text-slate-500">
        Ces parcours déterminent qui peut candidater par quelle voie (nationalité, pays de résidence) —
        indépendamment de la compatibilité académique évaluée ci-dessus. Vérifiez toujours votre cas précis sur
        la source officielle.
      </p>
      <ul className="space-y-2.5 text-sm text-slate-700">
        {guide.pathways.map((pathway) => (
          <li key={pathway.audience} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-300" aria-hidden />
            <span>
              <span className="font-medium text-slate-900">{pathway.audience}</span> — {pathway.summary}
            </span>
          </li>
        ))}
      </ul>
      <a
        href={guide.source}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block text-xs font-medium text-blue-600 hover:text-blue-700"
      >
        Source officielle · vérifiée le {guide.verifiedAt} ↗
      </a>
    </Card>
  );
}
