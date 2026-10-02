import Link from "next/link";
import type { CompatibilityResult, StudentProfile, StudyProgram } from "@/types";
import { Card } from "@/components/ui/Card";
import { ScoreHeadline } from "@/components/result/ScoreHeadline";
import { SelectivityBadge } from "@/components/result/SelectivityCard";

interface VerdictCardProps {
  profile: StudentProfile;
  formation: StudyProgram;
  result: CompatibilityResult;
  verdict: string;
}

/**
 * Premier écran de la page résultat : quelle formation, quel score, et une
 * phrase qui dit où en est l'étudiant. Le détail du calcul est plus bas, replié.
 */
export function VerdictCard({ profile, formation, result, verdict }: VerdictCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold leading-snug text-slate-900">{formation.name}</h2>
          <p className="mt-0.5 text-sm text-slate-600">
            {formation.institution.name} · {formation.institution.city}
          </p>
        </div>
        <Link href="/recherche" className="shrink-0 text-sm font-bold text-blue-700 hover:text-blue-800">
          Changer
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <ScoreHeadline
          score={result.overallScore}
          note={
            result.noContentMatch
              ? "profil non évaluable pour cette formation"
              : result.evidenceCapped
                ? "estimation, profil incomplet"
                : undefined
          }
        />
        <SelectivityBadge formationId={formation.id} />
      </div>

      <p className="mt-5 text-base font-semibold leading-relaxed text-slate-900">{verdict}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
        <p className="min-w-0">
          Votre parcours : {profile.currentDegree} ·{" "}
          <Link href="/profil" className="font-bold text-blue-700 hover:text-blue-800">
            Modifier
          </Link>
        </p>
        <Link href="/methode" className="font-bold text-blue-700 underline underline-offset-2">
          Comment ce score est-il calculé ?
        </Link>
      </div>
    </Card>
  );
}
