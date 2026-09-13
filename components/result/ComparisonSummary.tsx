import Link from "next/link";
import type { Formation, StudentProfile } from "@/types";
import { Card } from "@/components/ui/Card";

interface ComparisonSummaryProps {
  profile: StudentProfile;
  formation: Formation;
}

/** Rappel des deux termes de la comparaison, avec un lien pour les modifier. */
export function ComparisonSummary({ profile, formation }: ComparisonSummaryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Votre parcours
          </p>
          <p className="font-semibold text-slate-900">{profile.currentDegree}</p>
          <p className="text-sm text-slate-500">
            {profile.currentLevel} · {profile.fieldOfStudy}
          </p>
        </div>
        <Link href="/profil" className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700">
          Modifier
        </Link>
      </Card>

      <Card className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Formation ciblée
          </p>
          <p className="font-semibold text-slate-900">{formation.name}</p>
          <p className="text-sm text-slate-500">
            {formation.institution} · {formation.city}
          </p>
        </div>
        <Link href="/recherche" className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700">
          Modifier
        </Link>
      </Card>
    </div>
  );
}
