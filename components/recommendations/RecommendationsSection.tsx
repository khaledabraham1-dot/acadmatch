"use client";

import { ArrowRight, CheckCircle2, AlertCircle, Bookmark, BookmarkCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { getCompatibilityLabel } from "@/lib/matching/labels";
import { cn } from "@/lib/utils";
import type { Recommendation } from "@/lib/matching/recommendations";

interface RecommendationsSectionProps {
  recommendations: Recommendation[];
  savedIds?: string[];
  onToggleSave?: (formationId: string) => void;
}

/**
 * "Recommandé pour vous" (Phase 9) — sélection des meilleures formations du
 * catalogue entier pour le profil, indépendante des filtres appliqués
 * en dessous sur /recherche. Complète la liste filtrable (exploration
 * manuelle) sans la remplacer.
 */
export function RecommendationsSection({
  recommendations,
  savedIds = [],
  onToggleSave,
}: RecommendationsSectionProps) {
  if (recommendations.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="mb-3 text-base font-semibold text-slate-900">Recommandé pour vous</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {recommendations.map(({ formation, result, reason }) => {
          const compat = getCompatibilityLabel(result.overallScore);
          const saved = savedIds.includes(formation.id);
          return (
            <Card key={formation.id} className="relative flex flex-col">
              {onToggleSave && (
                <button
                  type="button"
                  onClick={() => onToggleSave(formation.id)}
                  aria-label={saved ? "Retirer des formations sauvegardées" : "Sauvegarder cette formation"}
                  aria-pressed={saved}
                  className={cn(
                    "absolute right-3 top-3 rounded-lg p-1 transition-colors",
                    saved ? "text-blue-600 hover:bg-blue-50" : "text-slate-300 hover:bg-slate-100 hover:text-slate-500",
                  )}
                >
                  {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                </button>
              )}
              <div className="mb-2 flex items-start justify-between gap-2 pr-6">
                <Badge tone="info">{formation.goal}</Badge>
                <div className="text-right">
                  <Badge tone={compat.tone}>{compat.label}</Badge>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{result.overallScore}%</p>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-slate-900">{formation.name}</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {formation.institution.name} · {formation.institution.city}
              </p>

              <p className="mt-3 text-sm leading-relaxed text-slate-600">{reason}</p>

              {result.strengths.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-slate-600">
                  {result.strengths.slice(0, 2).map((item) => (
                    <li key={item} className="flex items-start gap-1.5">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {result.gaps.length > 0 && (
                <ul className="mt-1 space-y-1 text-xs text-slate-600">
                  {result.gaps.slice(0, 1).map((item) => (
                    <li key={item} className="flex items-start gap-1.5">
                      <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-rose-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              <LinkButton
                href={`/resultat?formationId=${formation.id}`}
                size="sm"
                variant="outline"
                className="mt-4 self-start"
              >
                Voir l&apos;analyse complète
                <ArrowRight className="size-3.5" />
              </LinkButton>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
