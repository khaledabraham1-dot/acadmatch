import Link from "next/link";
import type { StudentProfile, StudyProgram } from "@/types";
import { Card } from "@/components/ui/Card";

interface ComparisonSummaryProps {
  profile: StudentProfile;
  formation: StudyProgram;
}

/** Rappel des deux termes de la comparaison, avec un lien pour les modifier. */
export function ComparisonSummary({ profile, formation }: ComparisonSummaryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/*
        min-w-0 sur le bloc de texte : par défaut, un enfant flex refuse de
        rétrécir sous la largeur intrinsèque (non wrappée) de son contenu —
        un nom de formation ou d'établissement long forçait la carte (et la
        page) à déborder horizontalement plutôt que de passer à la ligne.
      */}
      <Card className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Votre parcours
          </p>
          <p className="font-semibold text-slate-900">{profile.currentDegree}</p>
          <p className="text-sm text-slate-500">
            {profile.currentLevel} · {profile.fieldOfStudy} · {profile.languages.join(", ")}
          </p>
        </div>
        <Link href="/profil" className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700">
          Modifier
        </Link>
      </Card>

      <Card className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Formation ciblée
          </p>
          <p className="font-semibold text-slate-900">{formation.name}</p>
          <p className="text-sm text-slate-500">
            {formation.institution.name} · {formation.institution.city}
          </p>
        </div>
        <Link href="/recherche" className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700">
          Modifier
        </Link>
      </Card>
    </div>
  );
}
