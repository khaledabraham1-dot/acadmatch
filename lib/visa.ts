import type { VisaGuide, VisaStep } from "@/data/visa";

/**
 * Parcours visa personnalisé (Phase 20) — logique pure, testée.
 *
 * Deux questions suffisent à orienter : la nationalité (UE/EEE/Suisse ou
 * non — seuls les seconds ont besoin d'un visa étudiant) et le pays de
 * RÉSIDENCE (c'est lui, pas la nationalité, qui détermine si la procédure
 * « Études en France » s'applique).
 */

export type Citizenship = "ue" | "hors-ue";
export type VisaRoute = "etudes-en-france" | "direct";

export interface VisaAnswers {
  citizenship: Citizenship;
  /** Pays de résidence ; "" tant qu'il n'est pas renseigné. */
  residenceCountry: string;
}

export const OTHER_COUNTRY = "Autre pays";

export function needsStudentVisa(answers: VisaAnswers): boolean {
  return answers.citizenship === "hors-ue";
}

export function visaRoute(guide: VisaGuide, residenceCountry: string): VisaRoute {
  return guide.residenceProcedure?.countries.includes(residenceCountry) ? "etudes-en-france" : "direct";
}

/** Étapes qui concernent ce parcours, dans l'ordre du guide. */
export function stepsForRoute(guide: VisaGuide, route: VisaRoute): VisaStep[] {
  return guide.steps.filter((step) => step.appliesTo === "tous" || step.appliesTo === route);
}

/** Libellé d'action ajouté au suivi de candidature (repris dans le calendrier). */
export function visaActionLabel(step: VisaStep): string {
  return `Visa : ${step.title}`;
}
