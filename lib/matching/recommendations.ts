import type { CompatibilityResult, StudentProfile, StudyProgram } from "@/types";
import { computeCompatibility } from "@/lib/matching/engine";
import { buildDecisionAid } from "@/lib/matching/explanation";
import { compareFormationsByGoalThenScore } from "@/lib/matching/ranking";

/** Nombre de recommandations affichées par défaut (Phase 9 — "top picks", pas un second catalogue). */
export const DEFAULT_RECOMMENDATIONS_LIMIT = 3;

export interface Recommendation {
  formation: StudyProgram;
  result: CompatibilityResult;
  /** Résumé d'une phrase du "pourquoi" — première ligne de l'aide à la décision déjà utilisée sur /resultat. */
  reason: string;
}

/**
 * Sélectionne les meilleures formations du catalogue pour un profil (Phase 9).
 *
 * Réutilise intégralement le moteur existant, volontairement aucun second
 * scoring : même calcul de compatibilité (`computeCompatibility`), même tri
 * objectif-puis-score que /recherche (`compareFormationsByGoalThenScore`,
 * lib/matching/ranking.ts) et même génération de "raison" que /resultat
 * (`buildDecisionAid`, lib/matching/explanation.ts). Ne fait que composer ces
 * trois fonctions déjà testées et prendre les `limit` premières.
 */
export function getRecommendations(
  profile: StudentProfile,
  formations: StudyProgram[],
  limit: number = DEFAULT_RECOMMENDATIONS_LIMIT,
): Recommendation[] {
  const results = new Map(formations.map((formation) => [formation.id, computeCompatibility(profile, formation)]));

  const sorted = [...formations].sort((a, b) =>
    compareFormationsByGoalThenScore(a, b, profile, (f) => results.get(f.id)?.overallScore ?? -1),
  );

  return sorted.slice(0, Math.max(0, limit)).map((formation) => {
    const result = results.get(formation.id)!;
    const aid = buildDecisionAid(profile, formation, result);
    return { formation, result, reason: aid.paragraphs[0] };
  });
}
