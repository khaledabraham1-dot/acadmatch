import { FORMATIONS } from "@/data/formations";
import { EXAMPLE_STUDENT_PROFILE } from "@/data/example-profile";
import { computeCompatibility } from "@/lib/matching/engine";
import type { CompatibilityResult, StudyProgram } from "@/types";

/**
 * Le meilleur résultat réel du moteur pour le profil exemple, parmi les
 * formations qui correspondent à son objectif. La page d'accueil montre ce
 * calcul-là, jamais des chiffres inventés : si le catalogue ou le moteur
 * change, l'exemple change avec eux.
 */
export function bestExampleResult(): { formation: StudyProgram; result: CompatibilityResult } {
  const candidates = FORMATIONS.filter((f) => !f.demo && f.goal === EXAMPLE_STUDENT_PROFILE.goal)
    .map((formation) => ({ formation, result: computeCompatibility(EXAMPLE_STUDENT_PROFILE, formation) }))
    .sort((a, b) => b.result.overallScore - a.result.overallScore || a.formation.id.localeCompare(b.formation.id));
  if (candidates.length === 0) throw new Error("Aucune formation ne correspond à l'objectif du profil exemple.");
  return candidates[0];
}
