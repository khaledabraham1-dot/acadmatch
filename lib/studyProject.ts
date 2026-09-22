import type { Application, StudyProgram } from "@/types";

/**
 * Synthèse "projet d'études" (Phase 16) — logique pure, testable
 * indépendamment de l'UI.
 *
 * Choix d'architecture assumé : la phase demande "une vue synthétique avec
 * formations ciblées, pays, objectifs, calendrier, candidatures et
 * documents". Calendrier et candidatures ont déjà leur propre page
 * complète (Phases 13/14) et leur propre résumé sur /espace — les
 * dupliquer ici serait exactement la "duplication" que la phase demande
 * d'éviter. Ce module ne couvre donc que ce qui manque réellement :
 * l'agrégat formations ciblées / pays / objectifs / avancement documentaire,
 * affiché comme une section supplémentaire sur /espace (pas une nouvelle
 * page à part), à côté des sections calendrier/candidatures déjà existantes.
 */

export interface TargetedFormation {
  formation: StudyProgram;
  /** Dans les formations sauvegardées (Phase 12). */
  saved: boolean;
  /** Candidature suivie pour cette formation, si elle existe (Phase 13). */
  application?: Application;
}

/** Union des formations sauvegardées et suivies en candidature — une formation "ciblée" au sens large. */
export function buildTargetedFormations(
  savedFormationIds: string[],
  applications: Application[],
  formations: StudyProgram[],
): TargetedFormation[] {
  const ids = new Set([...savedFormationIds, ...applications.map((a) => a.formationId)]);
  const byId = new Map(formations.map((f) => [f.id, f]));

  return [...ids]
    .map((id) => byId.get(id))
    .filter((formation): formation is StudyProgram => Boolean(formation))
    .map((formation) => ({
      formation,
      saved: savedFormationIds.includes(formation.id),
      application: applications.find((a) => a.formationId === formation.id),
    }));
}

export interface StudyProjectSummary {
  totalFormations: number;
  /** Nombre de formations par pays, ex: { France: 2, Belgique: 1 }. */
  countryCounts: Record<string, number>;
  /** Nombre de formations par objectif, ex: { Master: 2, Licence: 1 }. */
  goalCounts: Record<string, number>;
  documentsTotal: number;
  documentsDone: number;
  /** Documents obligatoires (au sens de la Phase 15) et pas encore cochés — le vrai signal d'urgence. */
  requiredDocumentsPending: number;
}

function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const k = key(item);
    counts[k] = (counts[k] ?? 0) + 1;
  }
  return counts;
}

/** Agrège le projet d'études — jamais de duplication du détail déjà affiché ailleurs (calendrier, candidatures). */
export function summarizeStudyProject(targeted: TargetedFormation[]): StudyProjectSummary {
  const allDocuments = targeted.flatMap((t) => t.application?.documents ?? []);

  return {
    totalFormations: targeted.length,
    countryCounts: countBy(targeted, (t) => t.formation.institution.country),
    goalCounts: countBy(targeted, (t) => t.formation.goal),
    documentsTotal: allDocuments.length,
    documentsDone: allDocuments.filter((d) => d.done).length,
    requiredDocumentsPending: allDocuments.filter((d) => d.required && !d.done).length,
  };
}
