import { CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface StrengthsGapsProps {
  strengths: string[];
  gaps: string[];
}

/** Bloc "Points forts" / "Lacunes" affiché sous le score. */
export function StrengthsGaps({ strengths, gaps }: StrengthsGapsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="size-4" />
          Points forts
        </h3>
        {strengths.length > 0 ? (
          <ul className="space-y-2 text-sm text-slate-700">
            {strengths.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">
            Aucun point fort identifié pour l&apos;instant — complétez votre profil pour affiner l&apos;analyse.
          </p>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-rose-700">
          <AlertCircle className="size-4" />
          Lacunes
        </h3>
        {gaps.length > 0 ? (
          <ul className="space-y-2 text-sm text-slate-700">
            {gaps.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-rose-500" />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">Aucune lacune majeure détectée par rapport à cette formation.</p>
        )}
      </Card>
    </div>
  );
}
