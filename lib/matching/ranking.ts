import type { Formation, StudentProfile } from "@/types";

/**
 * Compare deux formations pour le tri des résultats de recherche : d'abord
 * celles dont l'objectif (`goal`) correspond à celui du profil, puis par
 * score de compatibilité décroissant à l'intérieur de chaque groupe.
 *
 * Sans ce tri en deux temps, une formation que l'étudiant dépasse largement
 * (ex: une Licence L1 pour un étudiant en L3 visant un Master) peut obtenir
 * un score de compatibilité plus élevé qu'un vrai Master pertinent — les
 * prérequis/contenu/compétences sont alors « trop » satisfaits, ce qui
 * compense largement la pénalité d'objectif non correspondant à l'intérieur
 * du sous-score « Niveau / diplôme ». Ce n'est pourtant pas du tout le type
 * de formation recherché. Repéré en testant le moteur sur des profils
 * réalistes (Étape 4) — voir aussi lib/matching/engine.ts.
 */
export function compareFormationsByGoalThenScore(
  a: Formation,
  b: Formation,
  profile: StudentProfile | null,
  scoreOf: (formation: Formation) => number,
): number {
  if (profile) {
    const aMatchesGoal = a.goal === profile.goal;
    const bMatchesGoal = b.goal === profile.goal;
    if (aMatchesGoal !== bMatchesGoal) return aMatchesGoal ? -1 : 1;
  }
  return scoreOf(b) - scoreOf(a);
}
