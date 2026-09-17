import Link from "next/link";
import type { Formation, StudentProfile } from "@/types";
import { computeCompatibility } from "@/lib/matching/engine";
import { buildDecisionAid } from "@/lib/matching/explanation";
import { getCompatibilityLabel } from "@/lib/matching/labels";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";

interface FormationCompareTableProps {
  profile: StudentProfile;
  formations: Formation[];
}

/**
 * Comparaison côte-à-côte de 2–3 formations : scores, point faible, 1ère action,
 * objectif et langue. L'étudiant décide ; AcadMatch structure la décision.
 */
export function FormationCompareTable({ profile, formations }: FormationCompareTableProps) {
  const rows = formations.map((formation) => {
    const result = computeCompatibility(profile, formation);
    const aid = buildDecisionAid(profile, formation, result);
    const compat = getCompatibilityLabel(result.overallScore);
    return { formation, result, aid, compat };
  });

  return (
    <div className="space-y-4">
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-semibold">Critère</th>
              {rows.map(({ formation }) => (
                <th key={formation.id} className="px-4 py-3 font-semibold text-slate-700">
                  <Link
                    href={`/resultat?formationId=${encodeURIComponent(formation.id)}`}
                    className="hover:text-blue-700"
                  >
                    {formation.name}
                  </Link>
                  <p className="mt-0.5 text-[11px] font-normal normal-case tracking-normal text-slate-400">
                    {formation.institution}
                  </p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            <tr>
              <td className="px-4 py-3 font-medium text-slate-500">Score global</td>
              {rows.map(({ formation, result, compat }) => (
                <td key={formation.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold text-slate-900">{result.overallScore}%</span>
                    <Badge tone={compat.tone}>{compat.label}</Badge>
                  </div>
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-slate-500">Prérequis</td>
              {rows.map(({ formation, result }) => (
                <td key={formation.id} className="px-4 py-3">
                  {result.breakdown.prerequisites}/100
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-slate-500">Contenu</td>
              {rows.map(({ formation, result }) => (
                <td key={formation.id} className="px-4 py-3">
                  {result.breakdown.academicContent}/100
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-slate-500">Compétences</td>
              {rows.map(({ formation, result }) => (
                <td key={formation.id} className="px-4 py-3">
                  {result.breakdown.skills}/100
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-slate-500">Niveau / objectif</td>
              {rows.map(({ formation, result }) => (
                <td key={formation.id} className="px-4 py-3">
                  {result.breakdown.levelDegree}/100
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-slate-500">Point le plus fragile</td>
              {rows.map(({ formation, aid }) => (
                <td key={formation.id} className="px-4 py-3">
                  {aid.weakestCriterionLabel}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-slate-500">1ʳᵉ action prioritaire</td>
              {rows.map(({ formation, aid }) => (
                <td key={formation.id} className="px-4 py-3">
                  {aid.actions[0]?.label ?? "Aucune lacune majeure"}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-slate-500">Langue</td>
              {rows.map(({ formation }) => (
                <td key={formation.id} className="px-4 py-3">
                  {formation.language}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-slate-500">Détail</td>
              {rows.map(({ formation }) => (
                <td key={formation.id} className="px-4 py-3">
                  <LinkButton
                    href={`/resultat?formationId=${encodeURIComponent(formation.id)}`}
                    size="sm"
                    variant="outline"
                  >
                    Voir l&apos;analyse
                  </LinkButton>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </Card>
      <p className="text-xs leading-relaxed text-slate-500">
        Cette comparaison mesure une adéquation académique — pas une chance d&apos;admission. Ouvrez
        chaque analyse détaillée et la source officielle avant de décider.
      </p>
    </div>
  );
}
