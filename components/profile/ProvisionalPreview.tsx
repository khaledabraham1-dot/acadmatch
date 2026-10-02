"use client";

import { useDeferredValue, useMemo } from "react";
import { Sparkles } from "lucide-react";
import type { StudentProfile } from "@/types";
import { FORMATIONS } from "@/data/formations";
import { getRecommendations } from "@/lib/matching/recommendations";
import { getCompatibilityLabel } from "@/lib/matching/labels";
import { Badge } from "@/components/ui/Badge";

/**
 * Premier résultat, pendant que l'étudiant remplit encore son profil : les
 * trois formations les mieux placées pour le brouillon actuel, avec le même
 * moteur et le même tri que /recherche (getRecommendations). Volontairement
 * sans lien : /resultat lit le profil enregistré, pas ce brouillon.
 */
export function ProvisionalPreview({ profile }: { profile: StudentProfile | null }) {
  // Recalcul différé : la saisie reste fluide même sur un téléphone modeste.
  const deferred = useDeferredValue(profile);
  const picks = useMemo(() => (deferred ? getRecommendations(deferred, FORMATIONS) : []), [deferred]);

  return (
    <section
      aria-labelledby="provisional-preview-title"
      aria-live="polite"
      className="rounded-[18px] border border-dashed border-blue-300 bg-blue-50/60 p-5"
    >
      <h2 id="provisional-preview-title" className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <Sparkles className="size-4 text-blue-600" aria-hidden />
        Aperçu provisoire de vos résultats
      </h2>
      {picks.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">
          Ajoutez une première matière ou compétence : vos trois formations les plus compatibles s&apos;afficheront ici.
        </p>
      ) : (
        <>
          <ol className="mt-3 space-y-2">
            {picks.map(({ formation, result }) => {
              const compat = getCompatibilityLabel(result.overallScore);
              return (
                <li key={formation.id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3.5 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900">{formation.name}</span>
                    <span className="block truncate text-xs text-slate-600">
                      {formation.institution.name} · {formation.institution.city}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {/* cn() ne fusionne pas les classes : on masque un parent plutôt que le badge. */}
                    <span className="hidden sm:block">
                      <Badge tone={compat.tone}>{compat.label}</Badge>
                    </span>
                    <span className="text-base font-bold text-slate-900">{result.overallScore}%</span>
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-2.5 text-xs text-slate-600">
            Provisoire : ces scores se précisent à chaque matière, compétence ou note ajoutée.
          </p>
        </>
      )}
    </section>
  );
}
